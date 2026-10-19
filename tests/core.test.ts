import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  CoreSchema,
  StateSchema,
  emptyState,
  newRecipe,
  missing,
  matches,
  canonical,
  shoppingFor,
  imageType,
  total,
} from "../lib/model.ts";
import {
  accessAllowed,
  readNotebook,
  writeNotebook,
  ownedImage,
  removeUnreferencedPhoto,
  cleanupPhotos,
} from "../lib/storage.ts";
const recipe = (ingredients: unknown[]) =>
  newRecipe({ title: "Dinner", ingredients });
test("unknown import values remain unknown and foreign fields are rejected", () => {
  const v = CoreSchema.parse({ title: "Cake" });
  assert.equal(v.prep, null);
  assert.equal(total(v), null);
  assert.throws(() =>
    CoreSchema.parse({ title: "Cake", javascript: "alert(1)" }),
  );
  assert.throws(() =>
    CoreSchema.parse({
      title: "Cake",
      ingredients: [{ name: "flour", quantity: -1, unit: "g" }],
    }),
  );
});
test("Persian and German aliases match pantry and search, ingredients remain distinct", () => {
  const r = recipe([
    { name: "Kartoffeln", quantity: 500, unit: "g" },
    { name: "Salz", quantity: null, unit: "", optional: true },
  ]);
  assert.deepEqual(missing(r, ["سیب‌زمینی"]), []);
  assert.equal(matches(r, "potato"), true);
  assert.notEqual(canonical("Mandelmehl"), canonical("gemahlene Mandeln"));
  assert.deepEqual(missing(r, ["rice"]), ["Kartoffeln"]);
  assert.equal(canonical("كنسرو لوبيا قرمز"), canonical("کنسرو لوبیا قرمز"));
});
test("custom aliases support pantry and search", () => {
  const aliases = [{ canonical: "courgette", names: ["کدو سبز", "Zucchini"] }];
  const r = recipe([{ name: "Zucchini", quantity: 1, unit: "pc" }]);
  assert.deepEqual(missing(r, ["کدو سبز"], aliases), []);
  assert.equal(matches(r, "کدو سبز", aliases), true);
});
test("shopping scales and combines compatible units without mass-volume conversion", () => {
  const a = recipe([
    { name: "Kartoffel", quantity: 0.5, unit: "kg" },
    { name: "Milch", quantity: 100, unit: "ml" },
    { name: "salt", quantity: null, unit: "", optional: true },
  ]);
  const b = recipe([
    { name: "سیب زمینی", quantity: 200, unit: "g" },
    { name: "milk", quantity: 100, unit: "g" },
  ]);
  const list = shoppingFor(
    [
      { recipe: a, yield: 4 },
      { recipe: b, yield: 2 },
    ],
    [],
    false,
  );
  assert.equal(
    list.find((i) => i.unit === "g" && canonical(i.name) === "potato")
      ?.quantity,
    1200,
  );
  assert.equal(list.filter((i) => canonical(i.name) === "milk").length, 2);
  assert.equal(
    list.some((i) => i.name === "salt"),
    false,
  );
  assert.equal(
    shoppingFor([{ recipe: a, yield: 2 }], ["potato", "milk"], true).length,
    0,
  );
});
test("duplicate recipe ids are rejected and full backup state round-trips", () => {
  const r = recipe([{ name: "Ei", quantity: 2, unit: "pc" }]);
  const state = {
    ...emptyState(),
    recipes: [r],
    tags: ["Yalda"],
    pantry: ["تخم مرغ"],
  };
  assert.deepEqual(StateSchema.parse(JSON.parse(JSON.stringify(state))), state);
  assert.throws(() => StateSchema.parse({ ...state, recipes: [r, r] }));
});
test("image signatures reject active content and content masquerading as an image", () => {
  assert.equal(
    imageType(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),
    null,
  );
  assert.equal(
    imageType(new Uint8Array([255, 216, 255, 0, 0, 0, 0, 0, 0])),
    "image/jpeg",
  );
});
test("requests require an identity and same-origin writes", () => {
  assert.equal(
    accessAllowed(
      null,
      "https://app.test",
      "https://app.test/api/state",
      false,
    ),
    false,
  );
  assert.equal(
    accessAllowed(
      "alice",
      "https://evil.test",
      "https://app.test/api/state",
      true,
    ),
    false,
  );
  assert.equal(
    accessAllowed("alice", null, "https://app.test/api/state", true),
    false,
  );
  assert.equal(
    accessAllowed(
      "alice",
      "https://app.test",
      "https://app.test/api/state",
      true,
    ),
    true,
  );
});
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(readFileSync("drizzle/0000_salty_azazel.sql", "utf8"));
  sql.exec(readFileSync("drizzle/0002_wide_sumo.sql", "utf8"));
  return {
    raw: sql,
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        all: async () => ({results:sql.prepare(query).all(...(values as never[]))}),
        first: async () =>
          sql.prepare(query).get(...(values as never[])) ?? null,
        run: async () => ({
          meta: {
            changes: Number(
              sql.prepare(query).run(...(values as never[])).changes,
            ),
          },
        }),
      }),
    }),
  } as unknown as D1Database & {
    raw: DatabaseSync;
  };
}
test("real SQL isolates accounts, prevents stale overwrite and rejects absent versions", async () => {
  const db = database();
  const state = { ...emptyState(), pantry: ["milk"] };
  assert.equal(await writeNotebook(db, "alice", state, 0), 1);
  assert.equal((await readNotebook(db, "bob")).state.pantry.length, 0);
  assert.equal(
    await writeNotebook(db, "alice", { ...state, pantry: ["eggs"] }, 0),
    null,
  );
  assert.equal(
    await writeNotebook(db, "alice", { ...state, pantry: ["eggs"] }, 1),
    2,
  );
  assert.equal(await writeNotebook(db, "alice", state, 1), null);
  assert.equal(await writeNotebook(db, "bob", state, 5), null);
  assert.deepEqual((await readNotebook(db, "alice")).state.pantry, ["eggs"]);
  db.raw.close();
});
test("photo metadata cannot be read across accounts", async () => {
  const db = database();
  db.raw
    .prepare("INSERT INTO attachments (id,owner,object_key,mime,size) VALUES (?,?,?,?,?)")
    .run("image-1", "alice", "alice/image-1", "image/jpeg", 100);
  assert.equal(await ownedImage(db, "bob", "image-1"), null);
  assert.equal((await ownedImage(db, "alice", "image-1"))?.mime, "image/jpeg");
  db.raw.close();
});
test('Saved recipe edits, AI review status, revisions and shopping checks survive reload and backup', async()=>{
 const db=database();
 const r=newRecipe({title:'Herb pasta',yield:2,prep:5,cook:15,totalMinutes:20,ingredients:[{name:'basil',quantity:null,quantityRange:{min:8,max:10},unit:'leaves'}],steps:['Mix herbs into pasta.'],aiMarks:{totalMinutes:{origin:'estimated',status:'verified',reason:'Compared with recipe',originalValue:'20'}}});
 const state=emptyState();state.recipes.push(r);state.pantry=['rice'];state.shopping=shoppingFor([{recipe:r,yield:4}],state.pantry,true);state.shopping[0].checked=true;
 assert.equal(await writeNotebook(db,'test-owner',state,0),1);
 const loaded=await readNotebook(db,'test-owner');assert.deepEqual(loaded.state,state);assert.deepEqual(loaded.state.shopping[0].quantityRange,{min:16,max:20});
 const {id,createdAt,history,revisions,...before}=loaded.state.recipes[0];
 loaded.state.recipes[0].revisions.push({date:'2026-10-01T20:00:00Z',data:CoreSchema.parse(before)});loaded.state.recipes[0].notes='Use fresh herbs';loaded.state.recipes[0].aiMarks.totalMinutes.status='edited';
 assert.equal(await writeNotebook(db,'test-owner',loaded.state,loaded.version),2);
 assert.equal(await writeNotebook(db,'test-owner',state,1),null);
 const reloaded=await readNotebook(db,'test-owner');const backup=StateSchema.parse(JSON.parse(JSON.stringify(reloaded.state)));
 assert.equal(backup.recipes[0].notes,'Use fresh herbs');assert.equal(backup.recipes[0].aiMarks.totalMinutes.status,'edited');assert.equal(backup.recipes[0].revisions[0].data.aiMarks.totalMinutes.status,'verified');assert.equal(backup.shopping[0].checked,true);
 assert.equal(backup.recipes[0].yield,2);assert.equal(backup.recipes[0].cook,15);assert.equal(backup.recipes[0].totalMinutes,20);
 assert.deepEqual((await readNotebook(db,'other-owner')).state,emptyState());db.raw.close();
});

test('photo deletion rejects foreign/referenced photos; tombstones survive R2 failure and block resurrection',async()=>{
 const db=database();db.raw.prepare('INSERT INTO attachments (id,owner,object_key,mime,size) VALUES (?,?,?,?,?)').run('photo-1','alice','key-1','image/jpeg',100);
 const state=emptyState();state.recipes.push(newRecipe({title:'Photo recipe',imageId:'photo-1'}));
 assert.equal(await writeNotebook(db,'alice',state,0),1);
 const deleted:string[]=[];const bucket={delete:async(key:string)=>{deleted.push(key);}};
 assert.equal(await removeUnreferencedPhoto(db,bucket as never,'bob','photo-1'),false);
 assert.equal(await removeUnreferencedPhoto(db,bucket as never,'alice','photo-1'),false);
 const {id,createdAt,history,revisions,...core}=state.recipes[0];state.recipes[0].revisions.push({date:'test',data:CoreSchema.parse(core)});state.recipes[0].imageId=null;
 assert.equal(await writeNotebook(db,'alice',state,1),2);assert.equal(await removeUnreferencedPhoto(db,bucket as never,'alice','photo-1'),false);
 assert.equal(await writeNotebook(db,'alice',emptyState(),2),3);
 await assert.rejects(removeUnreferencedPhoto(db,{delete:async()=>{throw Error('R2 unavailable');}} as never,'alice','photo-1'));
 assert.equal(await ownedImage(db,'alice','photo-1'),null);
 state.recipes[0].imageId='photo-1';assert.equal(await writeNotebook(db,'alice',state,3),null);
 assert.equal(await cleanupPhotos(db,bucket as never,'alice'),1);assert.deepEqual(deleted,['key-1']);
 assert.equal(db.raw.prepare('SELECT COUNT(*) as n FROM attachments').get()!.n,0);db.raw.close();
});
test('cleanup preserves recent unsaved uploads and owner isolation',async()=>{
 const db=database();const now=Date.now();for(const [id,owner,created] of [['recent','alice',now],['old','alice',0],['foreign','bob',0]])db.raw.prepare('INSERT INTO attachments (id,owner,object_key,mime,size,created_at) VALUES (?,?,?,?,?,?)').run(id as string,owner as string,id as string,'image/jpeg',100,created as number);
 const keys:string[]=[];assert.equal(await cleanupPhotos(db,{delete:async(k:string)=>{keys.push(k);}} as never,'alice',now),1);assert.deepEqual(keys,['old']);assert.ok(await ownedImage(db,'alice','recent'));assert.ok(await ownedImage(db,'bob','foreign'));db.raw.close();
});

test('DE/EN/FA structured text can be reviewed, saved and found after reload without AI',async()=>{
 const {extractRecipe}=await import('../lib/recipe-import.ts');
 const fixtures=[{lang:'de',text:'Alpha Suppe\nFür 2 Portionen\nZutaten\n200 g Kartoffeln\nZubereitung\n1. Kartoffeln kochen.',query:'Suppe'}, {lang:'en',text:'Alpha soup\nServes 2 portions\nIngredients\n200 g potatoes\nInstructions\n1. Cook potatoes.',query:'soup'}, {lang:'fa',text:'سوپ آلفا\nبرای ۲ نفر\nمواد لازم\nسیب زمینی: ۲۰۰ گرم\nطرز تهیه\n۱. سیب زمینی را بپزید.',query:'آلفا'}] as const;
 const db=database();
 for(const [index,f] of fixtures.entries()){
  const {fields}=extractRecipe(f.text,f.lang);const r=newRecipe({...fields,notes:'Reviewed manually'});const state=emptyState();state.recipes.push(r);
  assert.equal(r.ingredients[0].quantity,200);assert.ok(r.steps.length);assert.equal(await writeNotebook(db,'owner-'+index,state,0),1);
  const loaded=await readNotebook(db,'owner-'+index);assert.equal(loaded.state.recipes[0].notes,'Reviewed manually');assert.equal(matches(loaded.state.recipes[0],f.query),true);assert.deepEqual((await readNotebook(db,'outsider')).state,emptyState());
 }db.raw.close();
});
