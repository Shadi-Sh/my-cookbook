'use client';
import { useRef, useState } from 'react';
import { ImagePlus, WandSparkles } from 'lucide-react';
import { extractRecipe } from '@/lib/recipe-import';
import type { Core } from '@/lib/model';
import { Picker } from './widgets';
import { recipeDomains } from '@/lib/web-recipe';
export default function RecipeImporter({lang, hasContent, onApply, onBusy}: {lang: 'de'|'en'; hasContent: boolean; onApply: (fields: Partial<Core>, warnings: string[]) => void; onBusy: (busy: boolean) => void}) {
  const t = (de: string, en: string) => lang === 'de' ? de : en;
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Core['language']>(lang);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [replace, setReplace] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [url, setUrl] = useState('');
  const [webRecipes, setWebRecipes] = useState<{fields: Partial<Core>; warnings: string[]}[]>([]);
  async function readLink() {
    setBusy(true); onBusy(true); setError(''); setWebRecipes([]);
    try {
      const response = await fetch('/api/recipe-link', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url,language:lang})});
      const result = await response.json() as {error?: string; recipes: {fields: Partial<Core>; warnings: string[]}[]};
      if (!response.ok) throw new Error(result.error || t('Import fehlgeschlagen.', 'Import failed.'));
      setWebRecipes(result.recipes);
    } catch(e) {setError(e instanceof Error ? e.message : t('Import fehlgeschlagen.', 'Import failed.'));}
    finally {setBusy(false); onBusy(false);}
  }
  const file = useRef<HTMLInputElement>(null);
  async function readPhoto(photo: File) {
    setError(''); setBusy(true); onBusy(true); setProgress(0);
    let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined;
    let bitmap: ImageBitmap | undefined;
    try {
      if (!['image/jpeg','image/png','image/webp'].includes(photo.type) || photo.size > 10 * 1024 * 1024) throw new Error(t('Bitte JPEG, PNG oder WebP bis 10 MB auswählen.', 'Select JPEG, PNG or WebP up to 10 MB.'));
      bitmap = await createImageBitmap(photo);
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error(t('Bild zu groß. Bitte einen Ausschnitt verwenden.', 'Image too large. Please crop it first.'));
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 2500 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d')!;
      context.fillStyle = 'white'; context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close(); bitmap = undefined;
      const {createWorker} = await import('tesseract.js');
      worker = await createWorker(language === 'fa' ? 'fas' : language === 'de' ? 'deu' : 'eng', 1, {
        workerPath: '/ocr/worker.min.js', corePath: '/ocr/core', langPath: '/ocr/lang', workerBlobURL: false,
        logger: m => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)); },
      });
      const result = await worker.recognize(canvas);
      if (!result.data.text.trim()) throw new Error(t('Kein Text erkannt. Bitte ein schärferes Rezeptfoto verwenden.', 'No text found. Try a clearer photo of the written recipe.'));
      if (result.data.text.length > 30000) throw new Error(t('Zu viel Text. Bitte das Bild zuschneiden.', 'Too much text. Please crop the image.'));
      setText(result.data.text); setPhotoName(photo.name);
    } catch (e) { setError(e instanceof Error ? e.message : t('Erkennung fehlgeschlagen.', 'Recognition failed.')); }
    finally { bitmap?.close(); try { await worker?.terminate(); } finally {setBusy(false); onBusy(false);} }
  }
  function apply() {
    try {const {fields,warnings} = extractRecipe(text,language); onApply(fields,warnings); setError('');}
    catch(e) {setError((e as Error).message);}
  }
  return <section className="recipe-importer">
    <h2>{t('Von einer Rezeptseite übernehmen', 'Import from a recipe website')}</h2>
    <div className="inline-form">
      <input type="url" aria-label={t('Adresse der Rezeptseite', 'Recipe website address')} placeholder="https://…" maxLength={2000} value={url} disabled={busy} onChange={e=>{setUrl(e.target.value);setWebRecipes([]);}} />
      <button className="secondary" disabled={busy || !url.trim()} onClick={()=>void readLink()}>{t('Rezept laden', 'Load recipe')}</button>
    </div>
    <p className="small-text">{t('Öffentliche Rezeptdaten, ohne KI-Kosten. Die Originalsprache bleibt erhalten. Fehlende Angaben bleiben leer.', 'Public recipe data, without AI costs. Original language is preserved. Missing information stays empty.')}</p>
    <details><summary>{t('Unterstützte Rezeptseiten', 'Supported recipe websites')}</summary><p className="small-text">{recipeDomains.join(', ')}</p></details>
    {webRecipes.map((r,i)=><div key={i} className="warning-box"><strong>{r.fields.title}</strong><p>{r.fields.ingredients?.length ?? 0} {t('Zutaten', 'ingredients')} · {r.fields.steps?.length ?? 0} {t('Schritte', 'steps')}</p><button className="secondary" disabled={busy || (hasContent && !replace)} onClick={()=>{onApply(r.fields,r.warnings);setWebRecipes([]);}}>{t('In den Entwurf übernehmen', 'Use in draft')}</button></div>)}
    <h2>{t('Aus Foto oder Text übernehmen', 'Fill from photo or text')}</h2>
    <p className="small-text">{t('Ein Foto des geschriebenen Rezepts oder einen Rezepttext verwenden. Zutaten und Schritte werden erkannt; bitte das Ergebnis prüfen.', 'Use a photo of a written recipe or paste recipe text. Ingredients and steps are extracted; please review the result.')}</p>
    <div className="inline-form">
      <Picker label={t('Sprache des Originals', 'Source language')} value={language} onChange={v => setLanguage(v as Core['language'])} items={[{value:'de',label:'Deutsch'},{value:'en',label:'English'},{value:'fa',label:'فارسی'}]} />
      <button className="secondary" disabled={busy} onClick={() => file.current?.click()}><ImagePlus size={17}/>{t('Rezeptfoto lesen', 'Read recipe photo')}</button>
      <input hidden ref={file} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {const f=e.target.files?.[0]; if(f) void readPhoto(f); e.target.value='';}} />
    </div>
    {busy && <p role="status" aria-live="polite">{t('Import läuft …', 'Importing …')}</p>}
    {photoName && <p className="small-text">{photoName}</p>}
    <textarea dir="auto" aria-label={t('Rezepttext zum Ausfüllen', 'Recipe text to extract')} maxLength={30000} rows={7} value={text} disabled={busy} onChange={e=>setText(e.target.value)} placeholder={t('Titel\nZutaten\n120 g Mandeln\n2 Eier\nZubereitung\n1. Alles vermengen.', 'Title\nIngredients\n120 g almonds\n2 eggs\nInstructions\n1. Mix everything.')} />
    {hasContent && <label className="optional"><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>{t('Erkannte Felder im aktuellen Entwurf ersetzen', 'Replace extracted fields in the current draft')}</label>}
    <button className="primary" disabled={busy || !text.trim() || (hasContent && !replace)} onClick={apply}><WandSparkles size={17}/>{t('Rezeptfelder ausfüllen', 'Fill recipe fields')}</button>
    <p className="small-text">{t('Kostenlose Texterkennung auf deinem Gerät, ohne LLM. Das Foto wird dabei nicht gespeichert. Der Originaltext bleibt im Rezept erhalten.', 'Free text recognition on your device, without an LLM. The photo is not saved during recognition. Original text is kept in the recipe.')}</p>
    {error && <p role="alert" className="form-error">{error}</p>}
  </section>;
}
