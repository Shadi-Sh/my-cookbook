import { authorize, db, json, limitedBody } from "@/lib/server";
import { StateSchema } from "@/lib/model";
import { z } from "zod";
import { readNotebook, writeNotebook, ownedImage } from "@/lib/storage";
export async function GET(req: Request) {
  try {
    const auth = await authorize(req);
    if (auth.error) return auth.error;
    return json(await readNotebook(db(), auth.user));
  } catch {
    return json(
      {
        error: "Storage unavailable. Please retry / Speicher nicht verfügbar.",
      },
      503,
    );
  }
}
export async function POST(req: Request) {
  try {
    const auth = await authorize(req, true);
    if (auth.error) return auth.error;
    const input = z
      .object({ state: StateSchema, version: z.number().int().nonnegative() })
      .strict()
      .parse(
        JSON.parse(
          new TextDecoder().decode(await limitedBody(req, 1024 * 1024)),
        ),
      );
    const ids = [
      ...new Set(
        input.state.recipes
          .flatMap((r) => [
            r.imageId,
            ...r.revisions.map((v) => v.data.imageId),
          ])
          .filter((v): v is string => !!v),
      ),
    ];
    for (const id of ids) {
      if (!(await ownedImage(db(), auth.user, id)))
        return json({ error: "Image unavailable or not owned" }, 400);
    }
    const newVersion = await writeNotebook(
      db(),
      auth.user,
      input.state,
      input.version,
    );
    if (newVersion === null)
      return json(
        {
          error:
            "Another device changed this notebook. Reload before saving. / Ein anderes Gerät hat Änderungen gespeichert. Bitte neu laden.",
        },
        409,
      );
    return json({ version: newVersion });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError)
      return json(
        { error: "Invalid recipe data / Ungültige Rezeptdaten" },
        400,
      );
    if (e instanceof Error && e.message === "Payload too large")
      return json({ error: "Notebook exceeds 1 MB" }, 413);
    return json(
      {
        error:
          "Save failed. Your draft is still open / Speichern fehlgeschlagen.",
      },
      503,
    );
  }
}
