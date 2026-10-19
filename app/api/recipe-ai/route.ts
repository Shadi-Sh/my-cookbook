import {AIError,aiFailure} from '@/lib/ai-errors';
import {extractProviderRecipe} from '@/lib/ai-extraction';
import {env} from 'cloudflare:workers';
import {authorize,db,json,limitedBody} from '@/lib/server';
import {imageType} from '@/lib/model';
import {aiPrompt} from '@/lib/recipe-ai';
import {recipeModel,providerRequest} from '@/lib/cloudflare-ai';
import {z} from 'zod';
import {readAIQuota,reserveAIQuota} from '@/lib/ai-quota';
function config(){return env as unknown as {CF_AI_ACCOUNT_ID?:string;CF_AI_TOKEN?:string;CF_AI_FREE_ONLY_CONFIRMED?:string};}
function ready(){const c=config();return /^[a-f0-9]{32}$/i.test(c.CF_AI_ACCOUNT_ID??'')&&!!c.CF_AI_TOKEN&&c.CF_AI_TOKEN!==c.CF_AI_ACCOUNT_ID&&c.CF_AI_FREE_ONLY_CONFIRMED==='true';}
export async function GET(req:Request){const auth=await authorize(req);if(auth.error)return auth.error;try{return json({available:ready(),...await readAIQuota(db(),auth.user)});}catch{return json({error:'Tageslimit kann gerade nicht geladen werden. / Daily usage unavailable.'},503);}}
export async function POST(req:Request){
 const auth=await authorize(req,true);if(auth.error)return auth.error;
 if(!ready()) return json({error:'Cloudflare-Zugang noch nicht eingerichtet. / Cloudflare connection not configured.'},503);
 let stage: 'input'|'quota'|'provider'='input';
 try{
  const input=z.object({text:z.string().max(18000),image:z.string().max(2_800_000).optional(),language:z.enum(['de','en']),estimate:z.boolean(),consent:z.literal(true)}).strict().parse(JSON.parse(new TextDecoder().decode(await limitedBody(req,3_000_000))));
  if(!input.text.trim()&&!input.image) return json({error:'Rezepttext oder Bilder fehlen / Recipe text or images missing'},400);
  if(input.image){const bytes=Uint8Array.from(atob(input.image),c=>c.charCodeAt(0));if(bytes.length>2_000_000||imageType(bytes)!=='image/jpeg')return json({error:'Ungültiges Bild / Invalid image'},400);}
  // Atomic personal daily cap. Provider failures consume the reserved attempt.
  stage='quota';
  const reservation=await reserveAIQuota(db(),auth.user);
  if(!reservation)return json({error:'Deine 2 KI-Versuche für heute sind verbraucht. Ab 00:00 UTC stehen dir wieder 2 Versuche zur Verfügung. Manuelle Bearbeitung und andere Imports bleiben verfügbar. / Your 2 AI attempts for today are used. Two new attempts become available at 00:00 UTC. Manual editing and other imports remain available.',reason:'USER_AI_DAILY_LIMIT'},429);
  const c=config();
  stage='provider';
  const fields=await extractProviderRecipe(`https://api.cloudflare.com/client/v4/accounts/${c.CF_AI_ACCOUNT_ID}/ai/run/${recipeModel}`,{method:'POST',headers:{Authorization:`Bearer ${c.CF_AI_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(providerRequest(aiPrompt(input.language,input.text,input.estimate),input.image))},input.language);
  return json({fields});
 }catch(error){
  const code=error instanceof AIError ? error.code : stage==='input' ? (error instanceof Error&&error.message==='Payload too large'?'AI_INPUT_TOO_LARGE':'AI_INPUT_INVALID') : stage==='quota' ? 'AI_STORAGE_UNAVAILABLE' : 'AI_INTERNAL';
  const failure=aiFailure(code);
  return json({error:failure.error},failure.status,code);
 }
}