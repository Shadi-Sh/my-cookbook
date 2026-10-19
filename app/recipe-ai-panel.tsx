'use client';
import {useEffect,useRef,useState} from 'react';
import type {Core} from '@/lib/model';
type QuotaView={available:boolean;remaining:number;used:number;dailyLimit:number;resetsAt:string};
import {mergeAIFields} from '@/lib/recipe-ai';
export default function RecipeAIPanel({draft,lang,onApply,onBusy}:{draft:Core;lang:'de'|'en';onApply:(fields:Partial<Core>)=>void;onBusy:(v:boolean)=>void}){
 const t=(de:string,en:string)=>lang==='de'?de:en;
 const [available,setAvailable]=useState(false);const [quota,setQuota]=useState<{remaining:number;used:number;dailyLimit:number;resetsAt:string}|null>(null);const [statusError,setStatusError]=useState(false);const [images,setImages]=useState<File[]>([]);const [text,setText]=useState('');const [consent,setConsent]=useState(false);const [estimate,setEstimate]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [result,setResult]=useState<Partial<Core>|null>(null);const file=useRef<HTMLInputElement>(null);
 async function refreshStatus(){
  try{const r=await fetch('/api/recipe-ai');if(!r.ok)throw Error('Status unavailable');const v=await r.json() as QuotaView;setAvailable(v.available===true);setQuota(v);setStatusError(false);}catch{setStatusError(true);}
 }
 useEffect(()=>{
  let alive=true;
  async function update(){try{const r=await fetch('/api/recipe-ai');if(!r.ok)throw Error('Status unavailable');const v=await r.json() as QuotaView;if(alive){setAvailable(v.available===true);setQuota(v);setStatusError(false);}}catch{if(alive)setStatusError(true);}}
  void update();const tick=setInterval(()=>{if(document.visibilityState==='visible')void update();},60000);
  const focus=()=>void update();window.addEventListener('focus',focus);
  return()=>{alive=false;clearInterval(tick);window.removeEventListener('focus',focus);};
 },[]);
 async function combine(){
  if(!images.length)return undefined;
  const bitmaps:ImageBitmap[]=[];
  try{
   for(const f of images){if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10_000_000)throw Error(t('JPEG, PNG oder WebP bis 10 MB je Bild verwenden.','Use JPEG, PNG or WebP up to 10 MB each.'));const b=await createImageBitmap(f);bitmaps.push(b);if(b.width*b.height>40_000_000)throw Error(t('Bild zu groß. Bitte zuschneiden.','Image too large. Please crop.'));}
   const dims=bitmaps.map(b=>({width:Math.min(1600,b.width),height:Math.round(b.height*Math.min(1,1600/b.width))}));
   const totalHeight=dims.reduce((n,d)=>n+d.height+20,0);if(totalHeight>8000)throw Error(t('Die Seiten sind zu lang. Bitte enger auf das Rezept zuschneiden.','Pages are too long. Crop more closely to the recipe.'));
   const canvas=document.createElement('canvas');canvas.width=Math.max(...dims.map(d=>d.width));canvas.height=totalHeight;const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);let y=0;bitmaps.forEach((b,i)=>{ctx.drawImage(b,0,y,dims[i].width,dims[i].height);y+=dims[i].height+20;});
   const data=canvas.toDataURL('image/jpeg',0.85).split(',')[1];if(data.length>2_650_000)throw Error(t('Bilder zusammen zu groß. Bitte kleinere Ausschnitte verwenden.','Combined images too large. Use smaller crops.'));return data;
  }finally{bitmaps.forEach(b=>b.close());}
 }
 async function run(missingOnly:boolean){
  setBusy(true);onBusy(true);setError('');setResult(null);
  try{
   const image=missingOnly?undefined:await combine();
   const response=await fetch('/api/recipe-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:missingOnly?JSON.stringify({title:draft.title,description:draft.description,ingredients:draft.ingredients,steps:draft.steps,prep:draft.prep,cook:draft.cook,rest:draft.rest,totalMinutes:draft.totalMinutes}):text,image,language:lang,estimate,consent})});
   const data=await response.json() as {error?:string;requestId?:string;fields:Partial<Core>};if(!response.ok)throw Error((data.error||t('KI-Auswertung fehlgeschlagen.','AI extraction failed.'))+(data.requestId?` (Ref: ${data.requestId})`:''));
   setResult(mergeAIFields(draft,data.fields,missingOnly));
  }catch(e){setError(e instanceof Error?e.message:t('KI-Auswertung fehlgeschlagen.','AI extraction failed.'));}finally{setBusy(false);onBusy(false);void refreshStatus();}
 }
 return <section className="recipe-importer"><h2>{t('Mit KI ausfüllen','Fill with AI')}</h2>
 {statusError&&<p role="status">{t('Das Tageslimit konnte nicht aktualisiert werden. Bitte die Seite neu laden.','Daily usage could not be refreshed. Reload the page.')}</p>}
 {quota&&available&&<p role="status">{t('Deine Versuche heute:','Your attempts today:')} <strong>{quota.remaining} / {quota.dailyLimit}</strong>. {t('Nächste Freischaltung:','Next reset:')} {new Date(quota.resetsAt).toLocaleString(lang==='de'?'de-DE':'en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'})}. {t('Auch fehlgeschlagene KI-Anfragen zählen.','Failed AI requests also count.')}</p>}
 {quota?.remaining===0&&available&&<p>{t(`Deine ${quota.dailyLimit} KI-Versuche für heute sind verbraucht. Neue Versuche ab 00:00 UTC. Manuelles Bearbeiten, Text- und Webseitenimport bleiben verfügbar.`,`Your ${quota.dailyLimit} AI attempts for today are used. New attempts at 00:00 UTC. Manual editing, text and website imports remain available.`)}</p>}
 {!available&&!statusError?<p role="status">{t('Cloudflare noch nicht verbunden. Manuelles Bearbeiten und die anderen Imports funktionieren weiter.','Cloudflare not connected yet. Manual editing and other imports remain available.')}</p>:<>
 <p className="small-text">{t(`Bis zu 4 Seiten eines Rezepts gemeinsam lesen. Ausgabe in der App-Sprache. ${quota?.dailyLimit??2} KI-Versuche für dein Konto pro UTC-Tag.`,`Read up to 4 recipe pages together. Output in the app language. ${quota?.dailyLimit??2} AI attempts for your account per UTC day.`)}</p>
 <button className="secondary" disabled={busy||images.length>=4} onClick={()=>file.current?.click()}>{t('Rezeptbilder hinzufügen','Add recipe images')}</button>
 <input ref={file} hidden type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>{const files=Array.from(e.target.files??[]);if(images.length+files.length>4)setError(t('Maximal 4 Bilder.','Maximum 4 images.'));else{setImages(v=>[...v,...files]);setResult(null);}e.target.value='';}}/>
 <ol>{images.map((f,i)=><li key={`${f.name}-${i}`}>{f.name} <button disabled={busy||i===0} onClick={()=>{setImages(v=>{const n=[...v];[n[i-1],n[i]]=[n[i],n[i-1]];return n;});setResult(null);}}>{t('Nach oben','Move up')}</button> <button disabled={busy} onClick={()=>{setImages(v=>v.filter((_,k)=>k!==i));setResult(null);}}>{t('Entfernen','Remove')}</button></li>)}</ol>
 <textarea aria-label={t('Rezepttext für KI','Recipe text for AI')} value={text} maxLength={18000} rows={4} disabled={busy} onChange={e=>{setText(e.target.value);setResult(null);}} placeholder={t('Oder Rezepttext einfügen …','Or paste recipe text …')}/>
 <label><input type="checkbox" checked={estimate} disabled={busy} onChange={e=>{setEstimate(e.target.checked);setResult(null);}}/>{t('Fehlende Zeiten als markierte KI-Schätzung ergänzen','Fill missing times as marked AI estimates')}</label>
 <label><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>{t('Für diese Auswertung Rezepttext bzw. ausgewählte Bilder an Cloudflare senden','Send recipe text or selected images to Cloudflare for this analysis')}</label>
 <div className="inline-form"><button className="secondary" disabled={busy||!consent||quota?.remaining===0||statusError||(!text.trim()&&!images.length)} onClick={()=>void run(false)}>{t('KI-Entwurf erstellen','Create AI draft')}</button><button className="secondary" disabled={busy||!consent||quota?.remaining===0||statusError||!draft.steps.length} onClick={()=>void run(true)}>{t('Leere Felder ergänzen','Fill empty fields')}</button></div>
 </>}
 {busy&&<p role="status">{t('KI wertet das Rezept aus …','AI is analyzing the recipe …')}</p>}
 {result&&<div className="warning-box"><strong>{t('Vorschläge bereit – noch nicht übernommen','Suggestions ready — not applied yet')}</strong><ul>{Object.entries(result.aiMarks??{}).filter(([key])=>key in result).map(([key,m])=><li key={key}>{key}: {m.origin==='estimated'?t('KI-Schätzung','AI estimate'):t('KI-Übernahme','AI extraction')} — {m.reason}</li>)}</ul><button className="secondary" onClick={()=>{onApply(result);setResult(null);}}>{t('In den Entwurf übernehmen und prüfen','Apply to draft and review')}</button><button className="text-button" onClick={()=>setResult(null)}>{t('Verwerfen','Discard')}</button></div>}
 {error&&<p role="alert">{error}</p>}</section>;
}
