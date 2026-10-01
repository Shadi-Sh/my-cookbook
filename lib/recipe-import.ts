import type { Core, Ingredient } from './model.ts';

const digit = (s: string) => s.replace(/[۰-۹٠-٩]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/٫/g, '.');
const quantityPattern = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?|[½¼¾⅓⅔])';
const unitPattern = '(?:قاشق\\s*(?:غذاخوری|چای[‌\\s]*خوری)|tablespoons?|teaspoons?|cups?|grams?|kilograms?|millilit(?:er|re)s?|lit(?:er|re)s?|tbsp|tsp|kg|ml|g|l|EL|TL|Stück|Stk\\.?|Prisen?|Tassen?|گرم|کیلوگرم|میلی[‌\\s]*لیتر|لیتر|پیمانه|لیوان|عدد|ق\\.?غ|ق\\.?چ)';
const ingredientHeading = /^(?:ingredients?|zutaten|مواد(?: لازم| مورد نیاز)?)(?:\s*[:：].*)?$/i;
const methodHeading = /^(?:method|directions?|instructions?|steps?|preparation|zubereitung|anleitung|طرز تهیه|مراحل(?: تهیه| پخت)?|دستور پخت)\s*[:：]?$/i;
const noteHeading = /^(?:notes?|tips?|notizen|hinweise|نکات|یادداشت)\s*[:：]?$/i;
function number(s: string): number | null {
  const fractions: Record<string, number> = {'½': .5, '¼': .25, '¾': .75, '⅓': 1/3, '⅔': 2/3};
  if (s in fractions) return fractions[s];
  if (s.includes('/')) {
    const m = s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
    if (!m || !Number(m[3])) return null;
    return Number(m[1] ?? 0) + Number(m[2])/Number(m[3]);
  }
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n <= 1e6 ? n : null;
}
function ingredient(line: string): Ingredient {
  const start = line.match(new RegExp('^(' + quantityPattern + ')\\s*(?:(' + unitPattern + ')(?=\\s|$))?(?:\\s+|(?=[^\\d\\s]))(.+)$', 'i'));
  const end = line.match(new RegExp('^(.+?)\\s*[:：]\\s*(' + quantityPattern + ')\\s*(' + unitPattern + ')?\\s*$', 'i'));
  let name = start?.[3] ?? end?.[1] ?? line;
  let amount = start?.[1] ?? end?.[2];
  let unit = start?.[2] ?? end?.[3] ?? '';
  let note = '';
  // Ranges are preserved verbatim rather than silently reduced to one amount.
  if (/\d\s*[-–]\s*\d/.test(line)) {name = line; amount = undefined; unit = ''; note = 'Mengenbereich prüfen / Check quantity range';}
  const split = name.match(/^(.+?)[,،]\s*(.+)$/);
  if (split) {name = split[1]; note = [note, split[2]].filter(Boolean).join('; ');}
  return {name: name.trim().slice(0,150), quantity: amount ? number(amount) : null, unit: unit.trim().slice(0,40), optional: /optional|اختیاری/i.test(line), note: note.slice(0,200)};
}
export function extractRecipe(sourceText: string, language: Core['language']): { fields: Partial<Core>; warnings: string[] } {
  if (!sourceText.trim()) throw new Error('Bitte Rezepttext eingeben / Enter recipe text');
  if (sourceText.length > 30000) throw new Error('Maximal 30.000 Zeichen / Maximum 30,000 characters');
  const lines = digit(sourceText).split(/\r?\n/).map(s => s.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean);
  const ingredients: Ingredient[] = []; const steps: string[] = []; const descriptions: string[] = []; const notes: string[] = [];
  let title = ''; let section = ''; let explicitIngredients = false; let explicitSteps = false;
  const fields: Partial<Core> = {language, sourceText, originalImport: sourceText, prep: null, cook: null, rest: null};
  for (const original of lines) {
    const line = original.replace(/^#{1,6}\s*/, '');
    if (ingredientHeading.test(line)) {section = 'ingredients'; explicitIngredients = true; continue;}
    if (methodHeading.test(line)) {section = 'steps'; explicitSteps = true; continue;}
    if (noteHeading.test(line)) {section = 'notes'; continue;}
    const yieldMatch = line.match(/^(?:für|serves?|servings?|yield|portionen|برای|تعداد)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*(.*)$/i);
    if (yieldMatch && Number(yieldMatch[1].replace(',','.')) > 0 && Number(yieldMatch[1].replace(',','.')) <= 10000) {
      fields.yield = Number(yieldMatch[1].replace(',','.')); fields.yieldUnit = yieldMatch[2] || (language === 'de' ? 'Portionen' : language === 'fa' ? 'نفر' : 'portions'); continue;
    }
    const timeMatch = line.match(/^(vorbereitung(?:szeit)?|prep(?: time)?|آماده[‌\s]*سازی|garzeit|kochzeit|backzeit|cook(?: time)?|زمان پخت|ruhe(?:zeit)?|rest(?: time)?)\s*[:：]?\s*(\d+)\s*(min(?:utes?|uten)?\.?|دقیقه|h(?:ours?)?|stunden?|ساعت)\s*$/i);
    if (timeMatch) {
      const key = /vorbereitung|prep|آماده/i.test(timeMatch[1]) ? 'prep' : /ruhe|rest/i.test(timeMatch[1]) ? 'rest' : 'cook';
      const mins = Number(timeMatch[2]) * (/^h|stunden|ساعت/i.test(timeMatch[3]) ? 60 : 1);
      if (mins <= 10080) fields[key] = mins;
      continue;
    }
    const numbered = /^\d+[.)]\s+/.test(line);
    if (section === 'notes') {notes.push(original); continue;}
    if (section === 'steps' || (numbered && section !== 'ingredients')) {section = 'steps'; steps.push(line.replace(/^\d+[.)]\s*/, '').slice(0,4000)); continue;}
    if (section === 'ingredients' || new RegExp('^' + quantityPattern + '\\s*').test(line) || new RegExp('[:：]\\s*' + quantityPattern).test(line)) {ingredients.push(ingredient(line)); continue;}
    if (!title) title = line.replace(/^(?:title|titel|عنوان)\s*[:：]\s*/i, '').slice(0,180);
    else descriptions.push(original);
  }
  if (ingredients.length > 100 || steps.length > 100) throw new Error('Maximal 100 Zutaten und Schritte / Maximum 100 ingredients and steps');
  const warnings = ['Bitte alle erkannten Angaben prüfen / Review every extracted field'];
  if (!fields.yield) warnings.push('Anzahl unbekannt: vorhandenen Wert prüfen / Yield unknown: check existing value');
  if (!ingredients.length) warnings.push('Keine Zutaten erkannt / No ingredients found');
  if (!steps.length) warnings.push('Keine Schritte erkannt: Überschrift Zubereitung verwenden / No steps found: add an Instructions heading');
  if (!explicitIngredients || !explicitSteps) warnings.push('Freier Text: Abschnittsgrenzen bitte prüfen / Free text: check section boundaries');
  if (title) fields.title = title;
  if (descriptions.length) fields.description = descriptions.join('\n').slice(0,10000);
  if (ingredients.length) fields.ingredients = ingredients;
  if (steps.length) fields.steps = steps;
  if (notes.length) fields.notes = notes.join('\n').slice(0,10000);
  return {fields, warnings};
}
