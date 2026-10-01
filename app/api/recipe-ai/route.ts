import {env} from 'cloudflare:workers';
import {authorize,db,json,limitedBody} from '@/lib/server';
import {imageType} from '@/lib/model';
import {aiPrompt,parseAIResult} from '@/lib/recipe-ai';
import {z} from 'zod';
function config(){return env as unknown as {CF_AI_ACCOUNT_ID?:string;CF_AI_TOKEN?:string;CF_AI_FREE_ONLY_CONFIRMED?:string;CF_AI_LICENSE_CONFIRMED?:string};}
function ready(){const c=config();return /^[a-f0-9]{32}$/i.test(c.CF_AI_ACCOUNT_ID??'')&&!!c.CF_AI_TOKEN&&c.CF_AI_FREE_ONLY_CONFIRMED==='true'&&c.CF_AI_LICENSE_CONFIRMED==='true';}
export async function GET(req:Request){const auth=await authorize(req);if(auth.error)return auth.error;return json({available:ready(),dailyLimit:5});}
export async function POST(req:Request){
 const auth=await authorize(req,true);if(auth.error)return auth.error;
 if(!ready()) return json({error:'Cloudflare-Zugang noch nicht eingerichtet. / Cloudflare connection not configured.'},503);
 try{
  const input=z.object({text:z.string().max(18000),image:z.string().max(2_800_000).optional(),language:z.enum(['de','en']),estimate:z.boolean(),consent:z.literal(true)}).strict().parse(JSON.parse(new TextDecoder().decode(await limitedBody(req,3_000_000))));
  if(!input.text.trim()&&!input.image) return json({error:'Rezepttext oder Bilder fehlen / Recipe text or images missing'},400);
  let image:number[]|undefined;
  if(input.image){const bytes=Uint8Array.from(atob(input.image),c=>c.charCodeAt(0));if(bytes.length>2_000_000||imageType(bytes)!=='image/jpeg')return json({error:'Ungültiges Bild / Invalid image'},400);image=Array.from(bytes);}
  // Atomic shared daily cap, including failed calls. No retries or paid fallback.
  const reservation=await db().prepare('INSERT INTO ai_usage(day,requests) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests<5 RETURNING requests').bind(new Date().toISOString().slice(0,10)).first();
  if(!reservation)return json({error:'Tageslimit erreicht (5). Morgen erneut versuchen. / Daily limit reached (5). Try tomorrow.'},429);
  const c=config();
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.CF_AI_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,{method:'POST',headers:{Authorization:`Bearer ${c.CF_AI_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({prompt:aiPrompt(input.language,input.text,input.estimate),...(image?{image}:{}),max_tokens:3000,temperature:0.1}),signal:AbortSignal.timeout(45000)});
  if(!response.ok){await response.body?.cancel();return json({error:'Cloudflare lehnt die Anfrage ab oder das kostenlose Kontingent ist ausgeschöpft. / Cloudflare rejected the request or the free quota is exhausted.'},502);}
  const data=JSON.parse(new TextDecoder().decode(await limitedBody(new Request('https://response.invalid',{method:'POST',body:response.body,duplex:'half'} as RequestInit),120000))) as {success:boolean;result?:{response?:string}};
  if(!data.success||typeof data.result?.response!=='string')throw new Error('Invalid provider response');
  const fields=parseAIResult(data.result.response,input.language);
  if(!Object.keys(fields.aiMarks??{}).length)return json({error:'Kein lesbares Rezept erkannt / No readable recipe found'},422);
  return json({fields});
 }catch{return json({error:'KI-Auswertung fehlgeschlagen. Dein Entwurf bleibt erhalten. / AI extraction failed. Your draft is preserved.'},422);}
}
