import { StateSchema, emptyState, type State } from "./model.ts";
// Recheck attachment ownership in the same atomic SQL statement as the write.
// This closes the race between photo removal and notebook save.
const validImagesSQL=`NOT EXISTS (SELECT 1 FROM json_tree(?) AS image WHERE image.key='imageId' AND image.type='text' AND NOT EXISTS (SELECT 1 FROM attachments WHERE id=image.value AND owner=? AND deleted=0))`;
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
            `INSERT INTO notebooks (owner,payload,version,updated_at) SELECT ?,?,1,? WHERE ${validImagesSQL} ON CONFLICT(owner) DO NOTHING`,
          )
          .bind(user, payload, now, payload, user)
          .run()
      : await database
          .prepare(
            `UPDATE notebooks SET payload=?,version=version+1,updated_at=? WHERE owner=? AND version=? AND ${validImagesSQL}`,
          )
          .bind(payload, now, user, version, payload, user)
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
      "SELECT object_key,mime FROM attachments WHERE id = ? AND owner = ? AND deleted = 0",
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

export async function removeUnreferencedPhoto(database:D1Database,objects:Pick<R2Bucket,'delete'>,user:string,id:string){
 const row=await database.prepare(`UPDATE attachments SET deleted=1 WHERE id=? AND owner=? AND NOT EXISTS (SELECT 1 FROM notebooks,json_tree(notebooks.payload) AS image WHERE notebooks.owner=? AND image.key='imageId' AND image.value=attachments.id) RETURNING object_key`).bind(id,user,user).first<{object_key:string}>();
 if(!row)return false;
 // Tombstone first: save/read can no longer revive this image. Keep the row
 // if R2 fails so an explicit cleanup retry can remove the remaining bytes.
 await objects.delete(row.object_key);
 await database.prepare('DELETE FROM attachments WHERE id=? AND owner=? AND deleted=1').bind(id,user).run();
 return true;
}
export async function cleanupPhotos(database:D1Database,objects:Pick<R2Bucket,'delete'>,user:string,now=Date.now()){
 const rows=await database.prepare(`SELECT id FROM attachments WHERE owner=? AND (deleted=1 OR (created_at<? AND NOT EXISTS (SELECT 1 FROM notebooks,json_tree(notebooks.payload) AS image WHERE notebooks.owner=? AND image.key='imageId' AND image.value=attachments.id))) LIMIT 50`).bind(user,now-24*60*60*1000,user).all<{id:string}>();
 let removed=0;for(const row of rows.results){if(await removeUnreferencedPhoto(database,objects,user,row.id))removed++;}return removed;
}
