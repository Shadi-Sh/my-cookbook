import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unitCatalog,canonicalUnit,parseAmount,amountText} from '../lib/units.ts';
import {parseIngredient} from '../lib/ingredients.ts';
import {extractRecipe} from '../lib/recipe-import.ts';
import {recipesFromHTML} from '../lib/web-recipe.ts';
import {CoreSchema,StateSchema,emptyState,newRecipe,shoppingFor,review} from '../lib/model.ts';
import {parseAIResult} from '../lib/recipe-ai.ts';
for(const [unit,aliases] of Object.entries(unitCatalog))test(`All aliases extract as ${unit}`,()=>{
 for(const alias of aliases){const i=parseIngredient(`2 ${alias} sugar`);assert.equal(i.quantity,2,alias);assert.equal(i.unit,unit,alias);assert.equal(i.name,'sugar',alias);assert.equal(canonicalUnit(alias.toUpperCase()),unit,alias);}
});
test('User examples separate quantities, units, names and preparation',()=>{
 const a=parseIngredient('8-10 basil leaves torn'),b=parseIngredient('2-3 thyme or oregano sprigs leaves picked');
 assert.deepEqual([a.quantityRange,a.unit,a.name,a.note],[{min:8,max:10},'Blätter','basil','torn']);
 assert.deepEqual([b.quantityRange,b.unit,b.name,b.note],[{min:2,max:3},'Zweige','thyme or oregano','leaves picked']);
 assert.equal(amountText(a,2),'16–20');
 assert.deepEqual(parseIngredient('8–10 Basilikumblätter').quantityRange,{min:8,max:10});
});
test('Fractions, mixed fractions, decimals, compact units and ranges',()=>{
 for(const [input,expected] of [['½',.5],['1 1/2',1.5],['1½',1.5],['1,25',1.25],['⅛',.125]] as const)assert.equal(parseAmount(input).quantity,expected);
 for(const input of ['1/2–3/4','½ bis ¾','0.5 to 0.75'])assert.deepEqual(parseAmount(input).quantityRange,{min:.5,max:.75});
 assert.equal(parseIngredient('250ml milk').unit,'ml');assert.equal(parseIngredient('2 garlic cloves').unit,'Zehen');assert.equal(parseIngredient('2 ginger roots').name,'ginger roots');
 for(const input of ['10–8','1/0','-3','abc'])assert.equal(parseAmount(input).quantity,null);
});
test('Text, JSON-LD, old imports and AI share structured range handling',()=>{
 const recipe='Herbs\nIngredients\n8-10 basil leaves torn\nInstructions\nAdd herbs.';
 assert.deepEqual(extractRecipe(recipe,'en').fields.ingredients?.[0].quantityRange,{min:8,max:10});
 const html=`<script type="application/ld+json">${JSON.stringify({'@type':'Recipe',name:'Herbs',recipeIngredient:['8-10 basil leaves torn'],recipeInstructions:['Add herbs.']})}</script>`;
 assert.equal(recipesFromHTML(html,'https://www.bbcgoodfood.com/recipes/test','en')[0].fields.ingredients?.[0].unit,'Blätter');
 const ai=parseAIResult(JSON.stringify({recipe:{ingredients:[{name:'basil',quantity:null,unit:'leaves',note:'8–10 leaves, torn'}]},estimates:[]}),'en');
 assert.deepEqual(ai.ingredients?.[0].quantityRange,{min:8,max:10});assert.equal(ai.ingredients?.[0].note,'torn');
 const legacy=CoreSchema.parse({title:'Old',ingredients:[{name:'2-3 thyme or oregano sprigs leaves picked',quantity:null,unit:'',note:'Mengenbereich prüfen / Check quantity range'}]});
 assert.equal(legacy.ingredients[0].name,'thyme or oregano');assert.equal(legacy.ingredients[0].unit,'Zweige');
 assert(!review(legacy).some(x=>/quantity range|Menge unbekannt/.test(x)));
});
test('Ranges survive backups and shopping sums both bounds; incompatible units remain separate',()=>{
 const r=newRecipe({title:'Herbs',yield:2,ingredients:[parseIngredient('8–10 basil leaves torn'),parseIngredient('2 basil leaves'),parseIngredient('1 cup water'),parseIngredient('100 ml water')]});
 const state=emptyState();state.recipes.push(r);const restored=StateSchema.parse(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.recipes[0].ingredients[0].quantityRange,{min:8,max:10});
 const shop=shoppingFor([{recipe:r,yield:4}],[],false);assert.deepEqual(shop.find(x=>x.name==='basil')?.quantityRange,{min:20,max:24});assert.equal(shop.filter(x=>x.name==='water').length,2);
 const metric=newRecipe({title:'Flour',ingredients:[parseIngredient('0.1–0.2 kg flour'),parseIngredient('50 g flour')]});assert.deepEqual(shoppingFor([{recipe:metric,yield:metric.yield}],[],false)[0].quantityRange,{min:150,max:250});
 assert.throws(()=>CoreSchema.parse({title:'Bad',ingredients:[{name:'salt',unit:'g',quantity:3,quantityRange:{min:1,max:2}}]}));
});

test('Preparation qualifiers, package sizes and abbreviations stay explicit',()=>{
 const a=parseIngredient('1 ½ tsp. salt');assert.equal(a.quantity,1.5);assert.equal(a.unit,'TL');
 const b=parseIngredient('2 heaped tbsp sugar');assert.equal(b.unit,'EL');assert.match(b.note,/heaped/);
 const c=parseIngredient('1 (400 g) can tomatoes');assert.equal(c.unit,'Dose');assert.equal(c.quantity,1);assert.match(c.note,/400 g/);
 const d=parseIngredient('about 200 g flour');assert.equal(d.quantity,200);assert.match(d.note,/about/);
 assert.notEqual(canonicalUnit('Pfund'),canonicalUnit('pound'));
});

test('Volume conversions scale both bounds without mixing weight or vague measures',()=>{
 const recipe=newRecipe({title:'Liquid',yield:1,ingredients:[parseIngredient('1–2 dl water'),parseIngredient('5 cl water'),parseIngredient('50 ml water'),parseIngredient('1 EL water'),parseIngredient('5 g water')]});
 const rows=shoppingFor([{recipe,yield:1}],[],false);assert.deepEqual(rows.find(r=>r.unit==='ml')?.quantityRange,{min:200,max:300});assert.equal(rows.length,3);
});
