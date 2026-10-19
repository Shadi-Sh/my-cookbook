import { authorize, db, bucket, json, limitedBody } from "@/lib/server";
import { imageType } from "@/lib/model";
export async function POST(req: Request) {
  try {
    const auth = await authorize(req, true);
    if (auth.error) return auth.error;
    const count = await db()
      .prepare("SELECT COUNT(*) AS n FROM attachments WHERE owner = ?")
      .bind(auth.user)
      .first<{
        n: number;
      }>();
    if ((count?.n ?? 0) >= 600)
      return json({ error: "Photo limit reached (600)" }, 413);
    const bytes = await limitedBody(req, 2 * 1024 * 1024);
    const mime = imageType(bytes);
    if (!mime || mime !== req.headers.get("content-type"))
      return json(
        { error: "Only JPEG, PNG and WebP images are supported" },
        400,
      );
    const id = crypto.randomUUID();
    const key = `${auth.user}/${id}`;
    await bucket().put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      const inserted=await db()
        .prepare(
          "INSERT INTO attachments (id,owner,object_key,mime,size,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM attachments WHERE owner=?)<600 RETURNING id",
        )
        .bind(id, auth.user, key, mime, bytes.length, Date.now(), auth.user)
        .first();
      if(!inserted){await bucket().delete(key);return json({error:"Photo limit reached (600)"},413);}
    } catch (e) {
      await bucket().delete(key);
      throw e;
    }
    return json({ id });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error && e.message === "Payload too large"
            ? "Photo exceeds 2 MB"
            : "Photo upload failed",
      },
      e instanceof Error && e.message === "Payload too large" ? 413 : 503,
    );
  }
}

export async function GET(req:Request){
 const auth=await authorize(req);if(auth.error)return auth.error;
 try{const row=await db().prepare('SELECT COUNT(*) AS n FROM attachments WHERE owner=?').bind(auth.user).first<{n:number}>();return json({remaining:Math.max(0,600-(row?.n??0))});}
 catch{return json({error:'Photo capacity unavailable'},503);}
}
