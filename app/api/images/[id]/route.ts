import { authorize, db, bucket, json } from "@/lib/server";
import { ownedImage, removeUnreferencedPhoto } from "@/lib/storage";
export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const auth = await authorize(req);
    if (auth.error) return auth.error;
    const { id } = await params;
    const row = await ownedImage(db(), auth.user, id);
    if (!row) return json({ error: "Not found" }, 404);
    const object = await bucket().get(row.object_key);
    if (!object) return json({ error: "Not found" }, 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": row.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return json({ error: "Photo unavailable" }, 503);
  }
}

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await authorize(req,true);if(auth.error)return auth.error;
 try{const {id}=await params;const removed=await removeUnreferencedPhoto(db(),bucket(),auth.user,id);return removed?json({removed:true}):json({error:'Photo still in use or unavailable'},409);}
 catch{return json({error:'Photo cleanup failed; retry from Data & backup'},503);}
}
