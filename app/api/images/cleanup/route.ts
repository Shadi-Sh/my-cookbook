import { authorize, db, bucket, json } from '@/lib/server';
import { cleanupPhotos } from '@/lib/storage';
export async function POST(req: Request) {
    const auth = await authorize(req, true);
    if (auth.error)
        return auth.error;
    try {
        return json({ removed: await cleanupPhotos(db(), bucket(), auth.user) });
    }
    catch {
        return json({ error: 'Photo cleanup failed. Retry later / Fotobereinigung fehlgeschlagen. Später erneut versuchen.' }, 503);
    }
}
