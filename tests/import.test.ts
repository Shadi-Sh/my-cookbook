import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractRecipe} from '../lib/recipe-import.ts';
import {CoreSchema} from '../lib/model.ts';
test('German recipe fills structured amounts, timings and steps without inventing fields',()=>{
 const {fields}=extractRecipe('Mandelkuchen\nFür 4 Portionen\nVorbereitung: 15 min\nZutaten\n120 g Mandeln\n2 Eier\n½ TL Salz\nZubereitung\n1. Alles mischen.\n2. Bei 170 °C backen.','de');
 assert.equal(fields.title,'Mandelkuchen'); assert.equal(fields.yield,4); assert.equal(fields.prep,15); assert.equal(fields.cook,null);
 assert.deepEqual(fields.ingredients?.map(i=>[i.name,i.quantity,i.unit]),[['Mandeln',120,'g'],['Eier',2,''],['Salz',.5,'TL']]);
 assert.equal(fields.steps?.length,2); assert.equal(fields.sourceText, fields.originalImport);
 CoreSchema.parse(fields);
});
test('English mixed fractions and ingredient names beginning with a unit remain intact',()=>{
 const {fields}=extractRecipe('Soup\nIngredients\n1 1/2 cups water\n2 garlic cloves\nInstructions\nStir well.','en');
 assert.equal(fields.ingredients?.[0].quantity,1.5); assert.equal(fields.ingredients?.[1].name,'garlic cloves'); assert.equal(fields.steps?.[0],'Stir well.');
});
test('Persian digits, decimal amounts and name-first quantities are parsed',()=>{
 const {fields}=extractRecipe('کوکی بادام\nبرای ۴ نفر\nمواد لازم\n۱۲۰ گرم بادام\nشکر: ۷۵ گرم\n۱٫۵ قاشق چای‌خوری وانیل\nطرز تهیه\n۱. مخلوط کنید.','fa');
 assert.equal(fields.yield,4); assert.deepEqual(fields.ingredients?.map(i=>[i.name,i.quantity]),[['بادام',120],['شکر',75],['وانیل',1.5]]); assert.equal(fields.steps?.[0],'مخلوط کنید.');
});
test('Unknown quantities and ranges stay visible; oversized and blank inputs are rejected',()=>{
 const {fields,warnings}=extractRecipe('Soup\nIngredients\nSalt to taste\n100–150 g flour\nInstructions\nMix.','en');
 assert.equal(fields.ingredients?.[0].quantity,null);assert.equal(fields.ingredients?.[1].quantity,null);assert.match(fields.ingredients?.[1].name??'',/100–150/);assert.ok(warnings.length);
 assert.throws(()=>extractRecipe('', 'en'));assert.throws(()=>extractRecipe('a'.repeat(30001),'en'));
});
