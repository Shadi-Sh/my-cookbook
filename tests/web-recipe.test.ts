import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recipeURL,recipesFromHTML,fetchRecipes,duration} from '../lib/web-recipe.ts';
import {CoreSchema} from '../lib/model.ts';
const recipe={'@type':'Recipe',name:'Cake &amp; tea',inLanguage:'en',recipeIngredient:['120 g flour','2 eggs'],recipeInstructions:[{'@type':'HowToSection',itemListElement:[{'@type':'HowToStep',text:'Mix.'},{'@type':'HowToStep',text:'Bake.'}]}],prepTime:'PT15M',cookTime:'PT1H',recipeYield:'4 portions'};
const html=(data:unknown)=>`<script type="application/ld+json">${JSON.stringify(data)}</script>`;
test('Graph recipes preserve source, quantities, sections and known timings',()=>{
 const [r]=recipesFromHTML(html({'@graph':[recipe]}),'https://www.bbcgoodfood.com/recipes/cake','de');
 assert.equal(r.fields.title,'Cake & tea');assert.equal(r.fields.language,'en');assert.equal(r.fields.prep,15);assert.equal(r.fields.cook,60);assert.equal(r.fields.yield,4);
 assert.deepEqual(r.fields.steps,['Mix.','Bake.']);assert.equal(r.fields.ingredients?.[0].quantity,120);assert.equal(r.fields.source,'https://www.bbcgoodfood.com/recipes/cake');CoreSchema.partial().parse(r.fields);
});
test('Multiple recipes offered independently; missing and ambiguous values not invented',()=>{
 const result=recipesFromHTML(html([recipe,{...recipe,name:'Other',prepTime:null,cookTime:'unknown',recipeYield:'4–6 portions'}]),'https://www.chefkoch.de/a','de');
 assert.equal(result.length,2);assert.equal(result[1].fields.prep,null);assert.equal(result[1].fields.cook,null);assert.equal(result[1].fields.yield,undefined);assert.ok(result[1].warnings.some(w=>w.includes('mehrdeutig')));
 assert.equal(duration('PT30S'),1);assert.equal(duration('nonsense'),null);
});
test('No recipe, malformed blocks, script markup and invalid address protections',()=>{
 assert.deepEqual(recipesFromHTML('<script type="application/ld+json">broken</script>','https://www.chefkoch.de/a','de'),[]);
 for(const url of ['http://chefkoch.de/a','https://127.0.0.1/','https://localhost/','https://chefkoch.de.evil.com/','https://evil.chefkoch.de/','https://user:pass@chefkoch.de/','https://chefkoch.de:444/','file:///etc/passwd','https://2130706433/','https://[::1]/']) assert.throws(()=>recipeURL(url));
 assert.equal(recipeURL('https://www.chefkoch.de/a#recipe').href,'https://www.chefkoch.de/a');
});
test('Fetch follows supported redirects, blocks external redirects and non-HTML',async()=>{
 let calls=0;
 const mocked:typeof fetch=async()=>{calls++;return calls===1?new Response(null,{status:302,headers:{location:'/recipes/cake'}}):new Response(html(recipe),{headers:{'content-type':'text/html'}});};
 const results=await fetchRecipes('https://www.bbcgoodfood.com/old','en',mocked);assert.equal(calls,2);assert.equal(results[0].fields.source,'https://www.bbcgoodfood.com/recipes/cake');
 let unsafeCalls=0;
 await assert.rejects(fetchRecipes('https://www.chefkoch.de/a','de',async()=>{unsafeCalls++;return new Response(null,{status:302,headers:{location:'https://127.0.0.1/'}});}));assert.equal(unsafeCalls,1);
 await assert.rejects(fetchRecipes('https://www.chefkoch.de/a','de',async()=>new Response('x',{headers:{'content-type':'image/png'}})));
 await assert.rejects(fetchRecipes('https://www.chefkoch.de/a','de',async()=>new Response('x'.repeat(2_000_001),{headers:{'content-type':'text/html'}})));
});
