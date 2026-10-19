import { StateSchema, imageType, type State } from './model.ts';
export const backupMaxBytes = 20 * 1024 * 1024;
export const notebookMaxBytes = 1024 * 1024;
export type BackupImage = {
    mime: string;
    data: string;
};
export type Backup = {
    schemaVersion: 1;
    exportedAt: string;
    state: State;
    images: Record<string, BackupImage>;
};
export function referencedImages(state: State) { return [...new Set(state.recipes.flatMap(r => [r.imageId, ...r.revisions.map(v => v.data.imageId)]).filter((id): id is string => !!id))]; }
export function validateNotebookSize(state: State) { if (new TextEncoder().encode(JSON.stringify({ state, version: Number.MAX_SAFE_INTEGER })).length > notebookMaxBytes)
    throw Error('Kochbuch zu groß (1 MB). Weniger Rezeptversionen verwenden. / Notebook exceeds 1 MB. Reduce recipe revisions.'); }
export function decodeBackupImage(image: BackupImage) {
    if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mime) || typeof image.data !== 'string' || image.data.length > 2800000 || !image.data.length || image.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data))
        throw Error('Ungültiges Backupfoto / Invalid backup photo');
    const bytes = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
    if (bytes.length > 2 * 1024 * 1024 || imageType(bytes) !== image.mime)
        throw Error('Ungültiges oder zu großes Backupfoto / Invalid or oversized backup photo');
    return bytes;
}
export function parseBackup(raw: string): Backup {
    if (new TextEncoder().encode(raw).length > backupMaxBytes)
        throw Error('Backup überschreitet 20 MB / Backup exceeds 20 MB');
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1)
        throw Error('Nicht unterstützte Backupversion / Unsupported backup version');
    const state = StateSchema.parse(value.state);
    validateNotebookSize(state);
    const images = value.images ?? {};
    if (!images || typeof images !== 'object' || Array.isArray(images) || Object.keys(images).length > 600)
        throw Error('Ungültige Backupbilder / Invalid backup images');
    const selected: Record<string, BackupImage> = {};
    for (const id of referencedImages(state)) {
        const image = images[id];
        decodeBackupImage(image);
        selected[id] = { mime: image.mime, data: image.data };
    }
    return { schemaVersion: 1, exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '', state, images: selected };
}
export function serializeBackup(state: State, images: Record<string, BackupImage>, now = new Date()) {
    const raw = JSON.stringify({ schemaVersion: 1, exportedAt: now.toISOString(), state, images });
    parseBackup(raw);
    return raw;
}
export async function restoreBackup(backup: Backup, upload: (image: BackupImage) => Promise<string>, save: (state: State) => Promise<boolean>, remove: (id: string) => Promise<void>) {
    const uploaded: string[] = [];
    let saved = false;
    try {
        const map = new Map<string, string>();
        for (const id of referencedImages(backup.state)) {
            const next = await upload(backup.images[id]);
            uploaded.push(next);
            map.set(id, next);
        }
        const next: State = { ...backup.state, recipes: backup.state.recipes.map(r => ({ ...r, imageId: r.imageId ? map.get(r.imageId)! : null, revisions: r.revisions.map(v => ({ ...v, data: { ...v.data, imageId: v.data.imageId ? map.get(v.data.imageId)! : null } })) })) };
        validateNotebookSize(next);
        saved = await save(next);
        return saved;
    }
    finally {
        // A failed/ambiguous save may already have committed. Server deletion must
        // always reject referenced images, even for rollback cleanup.
        if (!saved)
            await Promise.allSettled(uploaded.map(remove));
    }
}
