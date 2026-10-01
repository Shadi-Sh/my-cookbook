import { extractRecipe } from './recipe-import.ts';
import type { Core } from './model.ts';

// Limit server-side fetching to established recipe publishers, including every
// redirect. This prevents user-supplied hosts from reaching private services.
export const recipeDomains = ['chefkoch.de', 'lecker.de', 'essen-und-trinken.de', 'eatsmarter.de', 'einfachbacken.de', 'einfachkochen.de', 'sallys-blog.de', 'springlane.de', 'bbcgoodfood.com', 'bbc.co.uk', 'allrecipes.com', 'simplyrecipes.com', 'seriouseats.com', 'foodnetwork.com', 'recipetineats.com', 'sallysbakingaddiction.com', 'kingarthurbaking.com', 'budgetbytes.com', 'loveandlemons.com', 'minimalistbaker.com'];
export function recipeURL(input: string): URL {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || input.length > 2000 || !recipeDomains.some(d => host === d || host === `www.${d}`)) {
    throw new Error('Diese Adresse wird noch nicht unterstützt. Nutze eine der angegebenen Rezeptseiten oder füge den Rezepttext ein. / Unsupported address. Use a listed recipe site or paste the recipe text.');
  }
  url.hash = '';
  return url;
}
function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, s => {
    const named: Record<string,string> = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
    if (named[s]) return named[s];
    const n = s.startsWith('&#x') ? parseInt(s.slice(3),16) : parseInt(s.slice(2),10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  }).replace(/\s+/g,' ').trim();
}
export function duration(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m = value.match(/^P(?:(\d+)D)?T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
  if (!m || !m.slice(1).some(Boolean)) return null;
  const n = Math.ceil(Number(m[1]??0)*1440 + Number(m[2]??0)*60 + Number(m[3]??0) + Number(m[4]??0)/60);
  return n <= 10080 ? n : null;
}
function strings(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).map(clean).filter(Boolean);
}
function steps(value: unknown, depth = 0): string[] {
  if (depth > 12) return [];
  if (Array.isArray(value)) return value.flatMap(v => steps(v, depth+1));
  if (typeof value === 'string') return value.split(/\r?\n/).map(clean).filter(Boolean);
  if (value && typeof value === 'object') {
    const v = value as Record<string,unknown>;
    if (v.itemListElement) return steps(v.itemListElement,depth+1);
    if (v.text) return steps(v.text,depth+1);
    if (v.item) return steps(v.item,depth+1);
  }
  return [];
}
export function recipesFromHTML(html: string, source: string, fallback: 'de'|'en') {
  if (html.length > 2_000_000) throw new Error('Seite zu groß / Page too large');
  const found: Record<string,unknown>[] = [];
  let visited = 0;
  function walk(v: unknown, depth = 0) {
    if (++visited > 20000 || depth > 20 || found.length >= 10) return;
    if (Array.isArray(v)) {v.forEach(x=>walk(x,depth+1)); return;}
    if (!v || typeof v !== 'object') return;
    const node = v as Record<string,unknown>;
    if (strings(node['@type']).some(t=>t === 'Recipe' || /[/#]Recipe$/.test(t))) found.push(node);
    else Object.values(node).forEach(x=>walk(x,depth+1));
  }
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
  for (const match of scripts) {
    if (!/\btype\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json(?:\s|$))/i.test(match[1])) continue;
    try {walk(JSON.parse(match[2]));} catch { /* Other blocks may contain valid recipes. */ }
  }
  return found.filter(r=>clean(r.name) && (strings(r.recipeIngredient).length || steps(r.recipeInstructions).length)).map(r=>{
    const sourceLanguage = clean(r.inLanguage).toLowerCase();
    const language: Core['language'] = sourceLanguage.startsWith('de') ? 'de' : sourceLanguage.startsWith('en') ? 'en' : sourceLanguage.startsWith('fa') ? 'fa' : fallback;
    const ingredients = strings(r.recipeIngredient);
    const method = steps(r.recipeInstructions);
    const sourceText = [clean(r.name), 'Ingredients', ...ingredients, 'Instructions', ...method].join('\n');
    const extracted = extractRecipe(sourceText,language);
    const fields: Partial<Core> = {...extracted.fields, title:clean(r.name).slice(0,180), description:clean(r.description).slice(0,10000), steps:method.map(s=>s.slice(0,4000)), source, originalImport:JSON.stringify(r).slice(0,100000), category:strings(r.recipeCategory).join(', ').slice(0,80), cuisine:strings(r.recipeCuisine).join(', ').slice(0,80), prep:duration(r.prepTime), cook:duration(r.cookTime), totalMinutes:duration(r.totalTime), aiMarks:{}};
    const warnings = ['Aus der Webseite übernommen, nicht von KI geschätzt. Bitte alle Angaben prüfen. / Imported from the website, not AI estimates. Review all fields.'];
    const rawYield = strings(r.recipeYield)[0] ?? (typeof r.recipeYield === 'number' ? String(r.recipeYield) : '');
    const y = rawYield.match(/^(\d+(?:[.,]\d+)?)\s*([^\d]*)$/);
    if (y && Number(y[1].replace(',','.')) > 0 && Number(y[1].replace(',','.')) <= 10000) {
      fields.yield = Number(y[1].replace(',','.')); fields.yieldUnit = y[2].trim() || (language === 'de' ? 'Portionen' : 'portions');
    } else warnings.push('Portionszahl unbekannt oder mehrdeutig: vorhandenen Wert prüfen. / Yield unknown or ambiguous: check the current value.');
    if (!fields.ingredients?.length) warnings.push('Zutaten fehlen / Ingredients missing');
    if (!fields.steps?.length) warnings.push('Zubereitung fehlt / Instructions missing');
    if (fields.prep === null || fields.cook === null) warnings.push('Fehlende Zeiten bleiben leer; keine KI-Schätzung. / Missing times stay empty; no AI estimates.');
    return {fields,warnings};
  });
}

export async function fetchRecipes(input: string, language: 'de'|'en', fetcher: typeof fetch = fetch) {
  let url = recipeURL(input);
  const signal = AbortSignal.timeout(15000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetcher(url, {redirect:'manual', signal, headers:{Accept:'text/html,application/xhtml+xml'}});
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel();
      const next = response.headers.get('location');
      if (!next || redirects === 3) throw new Error('Zu viele Weiterleitungen / Too many redirects');
      url = recipeURL(new URL(next,url).href); continue;
    }
    if (!response.ok) {await response.body?.cancel(); throw new Error('Die Webseite ist nicht erreichbar oder blockiert den Import. / Website unavailable or blocking import.');}
    if (!/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type')??'')) {await response.body?.cancel(); throw new Error('Keine HTML-Rezeptseite / Not an HTML recipe page');}
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Leere Seite / Empty page');
    const chunks: Uint8Array[]=[]; let size=0;
    try {
      while (true) {const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>2_000_000) throw new Error('Seite zu groß / Page too large'); chunks.push(value);}
    } catch(e) {await reader.cancel(); throw e;}
    const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const recipes=recipesFromHTML(new TextDecoder().decode(bytes),url.href,language);
    if (!recipes.length) throw new Error('Keine strukturierten Rezeptdaten gefunden. Bitte Rezepttext einfügen oder Fotos verwenden. / No structured recipe data found. Paste recipe text or use photos.');
    return recipes;
  }
  throw new Error('Import fehlgeschlagen / Import failed');
}
