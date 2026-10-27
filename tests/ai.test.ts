import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CoreSchema,StateSchema,newRecipe,emptyState,total} from '../lib/model.ts';
import {parseAIResult,mergeAIFields,aiPrompt} from '../lib/recipe-ai.ts';
import {providerRequest,providerText} from '../lib/cloudflare-ai.ts';
test('Gemma text and image requests use messages and validate provider envelopes',()=>{
 const request=providerRequest('Read recipe','abc');
 assert.deepEqual(request.messages[0].content,[{type:'text',text:'Read recipe'},{type:'image_url',image_url:{url:'data:image/jpeg;base64,abc'}}]);
 assert.equal(providerRequest('Read recipe').messages[0].content,'Read recipe');
 assert.equal(providerText({success:true,result:{choices:[{message:{content:'{}'}}]}}),'{}');
 for(const data of [{success:false},{success:true,result:{choices:[]}},{success:true,result:{choices:[{message:{content:null}}]}}])assert.throws(()=>providerText(data));
});
test('AI origins and independent review statuses survive recipe and backup parsing',()=>{
 const fields=parseAIResult(JSON.stringify({recipe:{title:'Soup',cook:20,ingredients:[{name:'salt',quantity:null,unit:'',note:'To taste'}]},estimates:[{field:'cook',reason:'Simmer 15–25 minutes based on the method'}]}),'en');
 assert.equal(fields.aiMarks?.cook.origin,'estimated');assert.equal(fields.aiMarks?.title.status,'unreviewed');
 const r=newRecipe(fields);r.aiMarks.cook.status='accepted';const s=emptyState();s.recipes.push(r);const restored=StateSchema.parse(JSON.parse(JSON.stringify(s)));assert.equal(restored.recipes[0].aiMarks.cook.status,'accepted');assert.equal(restored.recipes[0].ingredients[0].quantity,null);
 const old=CoreSchema.parse({title:'Old recipe'});assert.deepEqual(old.aiMarks,{});assert.equal(old.totalMinutes,null);
});
test('Missing-only merge preserves existing values and old verified origins',()=>{
 const current=CoreSchema.parse({title:'My soup',prep:10,aiMarks:{prep:{origin:'estimated',status:'verified',reason:'Checked',originalValue:'10'}}});
 const incoming=parseAIResult(JSON.stringify({recipe:{title:'Other soup',prep:30,cook:20},estimates:[{field:'cook',reason:'Estimate'}]}),'en');
 const merged=mergeAIFields(current,incoming,true);assert.equal(merged.title,undefined);assert.equal(merged.prep,undefined);assert.equal(merged.cook,20);assert.equal(merged.aiMarks?.prep.status,'verified');assert.equal(merged.aiMarks?.cook.status,'unreviewed');
});
test('Provider output cannot set identity, unknown fields, metadata, malformed or huge values',()=>{
 for(const recipe of [{id:'evil'},{aiMarks:{}},{cook:-1},{ingredients:[{name:'x',quantity:1e10,unit:'g'}]}])assert.throws(()=>parseAIResult(JSON.stringify({recipe,estimates:[]}),'de'));
 assert.throws(()=>parseAIResult('not json','en'));assert.throws(()=>parseAIResult('x'.repeat(60001),'en'));
 const p=aiPrompt('de','malicious source text',true);assert.match(p,/German/);assert.match(p,/Never estimate ingredient amounts/);
});
test('Known total time overrides unknown component times',()=>{assert.equal(total(CoreSchema.parse({title:'Soup',totalMinutes:30})),30);});
test('User language overrides provider language labels and every estimated time is marked',()=>{
 const f=parseAIResult(JSON.stringify({recipe:{title:'Pasta',language:'German',prep:5,cook:15,totalMinutes:20},estimates:[{field:'totalMinutes',reason:'Estimated 15–25 minutes'}]}),'de');
 assert.equal(f.language,'de');assert.equal(f.totalMinutes,20);assert.equal(f.aiMarks?.totalMinutes.origin,'estimated');assert.equal(f.aiMarks?.totalMinutes.status,'unreviewed');
});

test('Live Gemma unknown yield null becomes absent without losing the valid recipe or inventing servings',()=>{
 const fields=parseAIResult(JSON.stringify({recipe:{title:'Synthetic soup',yield:null,rest:null,ingredients:[{name:'potato',quantity:500,unit:'g'}],steps:['Cook.']},estimates:[]}), 'de');
 assert.equal(fields.yield,undefined);assert.equal(fields.aiMarks?.yield,undefined);
 assert.equal(fields.rest,null);assert.equal(fields.ingredients?.length,1);assert.equal(fields.steps?.length,1);
 assert.throws(()=>parseAIResult(JSON.stringify({recipe:{yield:0},estimates:[]}),'de'));
 assert.throws(()=>parseAIResult(JSON.stringify({recipe:{yield:-1},estimates:[]}),'de'));
 assert.throws(()=>parseAIResult(JSON.stringify({recipe:{yield:'four'},estimates:[]}),'de'));
});


test('Sparse AI drafts never acquire notebook defaults or replace absent facts',()=>{
 const fields=parseAIResult(JSON.stringify({recipe:{title:'Soup'},estimates:[]}), 'en');
 assert.deepEqual(Object.keys(fields).sort(),['aiMarks','language','title']);
 assert.deepEqual(Object.keys(fields.aiMarks??{}),['title']);
});
