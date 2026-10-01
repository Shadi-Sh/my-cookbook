import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {CoreSchema,StateSchema,newRecipe,emptyState,total} from '../lib/model.ts';
import {parseAIResult,mergeAIFields,aiPrompt} from '../lib/recipe-ai.ts';
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
test('Atomic daily reservation never exceeds five calls, including failed calls',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ai_usage(day TEXT PRIMARY KEY, requests INTEGER NOT NULL)');const q=db.prepare('INSERT INTO ai_usage(day,requests) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests<5 RETURNING requests');
 for(let i=1;i<=5;i++)assert.equal(q.get('2026-10-01')?.requests,i);assert.equal(q.get('2026-10-01'),undefined);assert.equal(q.get('2026-10-02')?.requests,1);db.close();
});
