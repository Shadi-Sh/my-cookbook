import {env} from 'cloudflare:workers';
import {authorize,db,json,limitedBody} from '@/lib/server';
import {imageType} from '@/lib/model';
import {aiPrompt,parseAIResult} from '@/lib/recipe-ai';
import {recipeModel,providerRequest,providerText} from '@/lib/cloudflare-ai';
import {z} from 'zod';
import {readAIQuota} from '@/lib/ai-quota';
function config(){return env as unknown as {CF_AI_ACCOUNT_ID?:string;CF_AI_TOKEN?:string;CF_AI_FREE_ONLY_CONFIRMED?:string};}
function ready(){const c=config();return /^[a-f0-9]{32}$/i.test(c.CF_AI_ACCOUNT_ID??'')&&!!c.CF_AI_TOKEN&&c.CF_AI_TOKEN!==c.CF_AI_ACCOUNT_ID&&c.CF_AI_FREE_ONLY_CONFIRMED==='true';}
export async function GET(req:Request){const auth=await authorize(req);if(auth.error)return auth.error;try{return json({available:ready(),...await readAIQuota(db())});}catch{return json({error:'Tageslimit kann gerade nicht geladen werden. / Daily usage unavailable.'},503);}}
export async function POST(req:Request){
 const auth=await authorize(req,true);if(auth.error)return auth.error;
 if(!ready()) return json({error:'Cloudflare-Zugang noch nicht eingerichtet. / Cloudflare connection not configured.'},503);
 try{
  const input=z.object({text:z.string().max(18000),image:z.string().max(2_800_000).optional(),language:z.enum(['de','en']),estimate:z.boolean(),consent:z.literal(true)}).strict().parse(JSON.parse(new TextDecoder().decode(await limitedBody(req,3_000_000))));
  if(!input.text.trim()&&!input.image) return json({error:'Rezepttext oder Bilder fehlen / Recipe text or images missing'},400);
  if(input.image){const bytes=Uint8Array.from(atob(input.image),c=>c.charCodeAt(0));if(bytes.length>2_000_000||imageType(bytes)!=='image/jpeg')return json({error:'Ungültiges Bild / Invalid image'},400);}
  // Atomic shared daily cap, including failed calls. No retries or paid fallback.
  const reservation=await db().prepare('INSERT INTO ai_usage(day,requests) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests<5 RETURNING requests').bind(new Date().toISOString().slice(0,10)).first();
  if(!reservation)return json({error:'Tageslimit erreicht (5). Morgen erneut versuchen. / Daily limit reached (5). Try tomorrow.'},429);
  const c=config();
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.CF_AI_ACCOUNT_ID}/ai/run/${recipeModel}`,{method:'POST',headers:{Authorization:`Bearer ${c.CF_AI_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(providerRequest(aiPrompt(input.language,input.text,input.estimate),input.image)),signal:AbortSignal.timeout(45000)});
  if(!response.ok){await response.body?.cancel();if(response.status===401||response.status===403)return json({error:'Cloudflare-Zugang abgelehnt. API-Token und Workers-AI-Berechtigungen prüfen. / Cloudflare access denied. Check the API token and Workers AI permissions.'},502);return json({error:'Cloudflare lehnt die Anfrage ab oder das kostenlose Kontingent ist ausgeschöpft. / Cloudflare rejected the request or the free quota is exhausted.'},502);}
  const data=JSON.parse(new TextDecoder().decode(await limitedBody(new Request('https://response.invalid',{method:'POST',body:response.body,duplex:'half'} as RequestInit),120000)));
  const fields=parseAIResult(providerText(data),input.language);
  if(!Object.keys(fields.aiMarks??{}).length)return json({error:'Kein lesbares Rezept erkannt / No readable recipe found'},422);
  return json({fields});
 }catch{return json({error:'KI-Auswertung fehlgeschlagen. Dein Entwurf bleibt erhalten. / AI extraction failed. Your draft is preserved.'},422);}
}
