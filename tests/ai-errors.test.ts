import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractProviderRecipe,decodeProviderResponse} from '../lib/ai-extraction.ts';
import {AIError,aiFailure} from '../lib/ai-errors.ts';
import {errorDiagnostic} from '../lib/diagnostics.ts';
import {providerText} from '../lib/cloudflare-ai.ts';

const recipe=JSON.stringify({recipe:{title:'Synthetic soup',ingredients:[{name:'salt',quantity:null,unit:'',note:''}],steps:['Mix.']},estimates:[]});
const envelope=(content=recipe,finish_reason='stop')=>({success:true,result:{choices:[{finish_reason,message:{content}}]}});
const fake=(response:Response)=> (async()=>response) as typeof fetch;
const rejects=(code:string)=> (error:unknown)=>error instanceof AIError&&error.code===code;

test('Actual Gemma envelope shape accepts complete DE/EN text; empty/malformed/truncated content is classified',()=>{
 assert.equal(providerText(envelope()),recipe);
 assert.throws(()=>providerText(envelope(recipe,'length')),rejects('AI_OUTPUT_TRUNCATED'));
 for(const value of [null,{}, {success:true,result:{response:recipe}},envelope('')])assert.throws(()=>providerText(value),rejects('AI_PROVIDER_FORMAT_INVALID'));
 assert.throws(()=>providerText({success:false}),rejects('AI_PROVIDER_FAILURE'));
});
test('Bounded provider decoding preserves UTF-8 across chunks and rejects invalid encoding, JSON and oversized data',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify(envelope(JSON.stringify({recipe:{title:'سوپ شیر'},estimates:[]}))));
 const stream=new ReadableStream({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}});
 assert.deepEqual(await decodeProviderResponse(new Response(stream)),JSON.parse(new TextDecoder().decode(bytes)));
 await assert.rejects(decodeProviderResponse(new Response(new Uint8Array([0xc3,0x28]))),rejects('AI_PROVIDER_JSON_INVALID'));
 await assert.rejects(decodeProviderResponse(new Response('<html>private error</html>')),rejects('AI_PROVIDER_JSON_INVALID'));
 await assert.rejects(decodeProviderResponse(new Response('x'.repeat(11)),10),rejects('AI_PROVIDER_RESPONSE_TOO_LARGE'));
});
test('Production pipeline separates HTTP denial, provider overload and service failure without exposing response content',async()=>{
 for(const [status,code] of [[401,'AI_PROVIDER_ACCESS'],[403,'AI_PROVIDER_ACCESS'],[429,'AI_PROVIDER_RATE_LIMIT'],[500,'AI_PROVIDER_FAILURE']] as const){
  await assert.rejects(extractProviderRecipe('https://example.invalid',{},'de',fake(new Response('secret provider content',{status}))),rejects(code));
 }
});
test('Production pipeline distinguishes envelope JSON, format, generated JSON, schema and no-recipe errors',async()=>{
 const cases: [string,string][]=[
  ['not json','AI_PROVIDER_JSON_INVALID'],
  [JSON.stringify({success:true,result:{choices:[]}}),'AI_PROVIDER_FORMAT_INVALID'],
  [JSON.stringify(envelope('{"recipe":')),'AI_OUTPUT_JSON_INVALID'],
  [JSON.stringify(envelope(JSON.stringify({recipe:{title:'x',cook:-3},estimates:[]}))),'AI_OUTPUT_SCHEMA_INVALID'],
  [JSON.stringify(envelope(JSON.stringify({recipe:{},estimates:[]}))),'AI_NO_RECIPE'],
  [JSON.stringify(envelope(recipe,'length')),'AI_OUTPUT_TRUNCATED'],
 ];
 for(const [body,code] of cases) await assert.rejects(extractProviderRecipe('https://example.invalid',{},'de',fake(new Response(body))),rejects(code));
 const fields=await extractProviderRecipe('https://example.invalid',{},'de',fake(Response.json(envelope())));
 assert.equal(fields.title,'Synthetic soup');assert.equal(fields.aiMarks?.title.status,'unreviewed');
});
test('Timeout includes delayed response body; connection errors remain separate',async()=>{
 const fetcher=(async(_url,init)=>{
  // Model the cancellation applied by real fetch to its response stream.
  return new Response(new ReadableStream({start(c){const timer=setTimeout(()=>c.close(),100);init?.signal?.addEventListener('abort',()=>{clearTimeout(timer);c.error(new DOMException('private detail','AbortError'));},{once:true});}}));
 }) as typeof fetch;
 await assert.rejects(extractProviderRecipe('https://example.invalid',{},'de',fetcher,5),rejects('AI_PROVIDER_TIMEOUT'));
 const broken=(async()=>{throw new TypeError('secret token / recipe text');}) as typeof fetch;
 await assert.rejects(extractProviderRecipe('https://example.invalid',{},'de',broken),rejects('AI_PROVIDER_NETWORK'));
});
test('Error diagnostics log only fixed category, status and random ID, and messages are static',()=>{
 const entries:string[]=[];const info=errorDiagnostic(502,s=>entries.push(s),'AI_OUTPUT_SCHEMA_INVALID');
 assert.equal(info.code,'AI_OUTPUT_SCHEMA_INVALID');
 assert.deepEqual(Object.keys(JSON.parse(entries[0])).sort(),['code','event','requestId','status']);
 assert.equal(errorDiagnostic(502,()=>{},'secret recipe text' as never).code,'HTTP_502');
 assert.equal(aiFailure('AI_PROVIDER_TIMEOUT').status,504);
 assert.equal(aiFailure('AI_OUTPUT_SCHEMA_INVALID').status,502);
 assert.equal(aiFailure('AI_NO_RECIPE').status,422);
});
