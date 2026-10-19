import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, newRecipe, CoreSchema } from '../lib/model.ts';
import { serializeBackup, parseBackup, restoreBackup, decodeBackupImage, backupMaxBytes } from '../lib/backup.ts';
import { errorDiagnostic } from '../lib/diagnostics.ts';
const image = { mime: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=' };
test('backup and restore preserve photo bytes, review marks and revision references with fresh photo IDs', async () => {
    const state = emptyState();
    const r = newRecipe({ title: 'Synthetic backup', imageId: 'old-photo', aiMarks: { title: { origin: 'extracted', status: 'verified', reason: 'Checked', originalValue: 'Synthetic backup' } } });
    const { id, createdAt, history, revisions, ...core } = r;
    r.revisions.push({ date: 'test', data: CoreSchema.parse(core) });
    state.recipes.push(r);
    const backup = parseBackup(serializeBackup(state, { 'old-photo': image }));
    assert.deepEqual(decodeBackupImage(backup.images['old-photo']), decodeBackupImage(image));
    let calls = 0;
    let saved = emptyState();
    assert.equal(await restoreBackup(backup, async () => { calls++; return 'new-photo'; }, async (s) => { saved = s; return true; }, async () => { throw Error('Should not delete saved image'); }), true);
    assert.equal(calls, 1);
    assert.equal(saved.recipes[0].imageId, 'new-photo');
    assert.equal(saved.recipes[0].revisions[0].data.imageId, 'new-photo');
    assert.equal(saved.recipes[0].aiMarks.title.status, 'verified');
});
test('backup validation rejects missing/mismatched photos and oversized files or notebook before upload', () => {
    const state = emptyState();
    state.recipes.push(newRecipe({ title: 'test', imageId: 'photo' }));
    assert.throws(() => serializeBackup(state, {}));
    assert.throws(() => serializeBackup(state, { photo: { ...image, mime: 'image/jpeg' } }));
    assert.throws(() => parseBackup(' '.repeat(backupMaxBytes + 1)));
    const big = emptyState();
    for (let n = 0; n < 110; n++)
        big.recipes.push(newRecipe({ title: 'r' + n, sourceText: 'x'.repeat(10000) }));
    assert.throws(() => serializeBackup(big, {}), /1 MB/);
    const tooLargeJSON = JSON.stringify({ schemaVersion: 1, state: emptyState(), images: {}, padding: 'x'.repeat(backupMaxBytes) });
    assert.throws(() => parseBackup(tooLargeJSON));
});
test('failed restore cleans staged photos and never replaces current state', async () => {
    const state = emptyState();
    state.recipes.push(newRecipe({ title: 'first', imageId: 'one' }), newRecipe({ title: 'second', imageId: 'two' }));
    const backup = parseBackup(serializeBackup(state, { one: image, two: image }));
    let n = 0, saves = 0;
    const removed: string[] = [];
    await assert.rejects(restoreBackup(backup, async () => { if (++n === 2)
        throw Error('upload failed'); return 'staged'; }, async () => { saves++; return true; }, async (id) => { removed.push(id); }));
    assert.equal(saves, 0);
    assert.deepEqual(removed, ['staged']);
});
test('diagnostics expose only static code, status and generated correlation ID', () => {
    const logs: string[] = [];
    const result = errorDiagnostic(503, v => logs.push(v));
    const parsed = JSON.parse(logs[0]);
    assert.deepEqual(Object.keys(parsed).sort(), ['code', 'event', 'requestId', 'status']);
    assert.equal(result.code, 'HTTP_503');
    assert.equal(parsed.requestId, result.requestId);
    assert.match(result.requestId, /^[a-f0-9-]{36}$/);
});
test('export at the photo boundary produces a file accepted by the same importer', () => {
    const state = emptyState();
    const images: Record<string, {
        mime: string;
        data: string;
    }> = {};
    const bytes = new Uint8Array(2 * 1024 * 1024);
    bytes.set([255, 216, 255]);
    const data = Buffer.from(bytes).toString('base64');
    for (let n = 0; n < 7; n++) {
        const id = `photo-${n}`;
        state.recipes.push(newRecipe({ title: `Photo ${n}`, imageId: id }));
        images[id] = { mime: 'image/jpeg', data };
    }
    const raw = serializeBackup(state, images);
    assert.ok(new TextEncoder().encode(raw).length <= backupMaxBytes);
    assert.equal(Object.keys(parseBackup(raw).images).length, 7);
});
test('an ambiguous/failed save cannot bypass server reference protection during staged-photo cleanup', async () => {
    const state = emptyState();
    state.recipes.push(newRecipe({ title: 'test', imageId: 'photo' }));
    const backup = parseBackup(serializeBackup(state, { photo: image }));
    let removals = 0;
    assert.equal(await restoreBackup(backup, async () => 'staged', async () => false, async () => { removals++; throw Error('Server rejects a referenced image'); }), false);
    assert.equal(removals, 1);
});
