import { StateSchema, emptyState, type State } from "./model.ts";
export async function readNotebook(database: D1Database, user: string) {
  const row = await database
    .prepare("SELECT payload, version FROM notebooks WHERE owner = ?")
    .bind(user)
    .first<{
      payload: string;
      version: number;
    }>();
  return {
    state: row ? StateSchema.parse(JSON.parse(row.payload)) : emptyState(),
    version: row?.version ?? 0,
  };
}
export async function writeNotebook(
  database: D1Database,
  user: string,
  state: State,
  version: number,
) {
  const payload = JSON.stringify(StateSchema.parse(state));
  const now = new Date().toISOString();
  const result =
    version === 0
      ? await database
          .prepare(
            "INSERT INTO notebooks (owner,payload,version,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner) DO NOTHING",
          )
          .bind(user, payload, now)
          .run()
      : await database
          .prepare(
            "UPDATE notebooks SET payload=?,version=version+1,updated_at=? WHERE owner=? AND version=?",
          )
          .bind(payload, now, user, version)
          .run();
  return result.meta.changes ? version + 1 : null;
}
export async function ownedImage(
  database: D1Database,
  user: string,
  id: string,
) {
  return database
    .prepare(
      "SELECT object_key,mime FROM attachments WHERE id = ? AND owner = ?",
    )
    .bind(id, user)
    .first<{
      object_key: string;
      mime: string;
    }>();
}
export function accessAllowed(
  userId: string | null,
  origin: string | null,
  url: string,
  write: boolean,
) {
  if (!userId) return false;
  return !write || origin === new URL(url).origin;
}
