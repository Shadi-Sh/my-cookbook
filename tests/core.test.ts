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
  return {
    raw: sql,
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
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
    .prepare("INSERT INTO attachments VALUES (?,?,?,?,?)")
    .run("image-1", "alice", "alice/image-1", "image/jpeg", 100);
  assert.equal(await ownedImage(db, "bob", "image-1"), null);
  assert.equal((await ownedImage(db, "alice", "image-1"))?.mime, "image/jpeg");
  db.raw.close();
});
