import { authorize, json, limitedBody } from '@/lib/server';
import { fetchRecipes } from '@/lib/web-recipe';
import { CoreSchema } from '@/lib/model';
export async function POST(req: Request) {
  const auth = await authorize(req,true);
  if (auth.error) return auth.error;
  try {
    const input = JSON.parse(new TextDecoder().decode(await limitedBody(req,5000)));
    if (typeof input.url !== 'string' || !['de','en'].includes(input.language)) return json({error:'Ungültige Eingabe / Invalid input'},400);
    const recipes = await fetchRecipes(input.url,input.language);
    for (const recipe of recipes) CoreSchema.partial().parse(recipe.fields);
    return json({recipes});
  } catch(e) {
    return json({error:e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'Die Webseite antwortet zu langsam. / Website timeout.' : e instanceof Error ? e.message : 'Import fehlgeschlagen / Import failed'},422);
  }
}
