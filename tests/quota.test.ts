import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Worker} from 'node:worker_threads';
import {quotaStatus,readAIQuota,reserveAIQuota} from '../lib/ai-quota.ts';

const migration = readFileSync(new URL('../drizzle/0003_empty_zaran.sql', import.meta.url), 'utf8');
function adapter(sql: DatabaseSync) {
  return {prepare: (q: string) => ({bind: (...v: unknown[]) => ({first: async () => {
    await Promise.resolve();
    return sql.prepare(q).get(...v as never[]) ?? null;
  }})})} as unknown as D1Database;
}

test('Personal quota status resets at UTC midnight, including month/year rollover', () => {
  assert.deepEqual(quotaStatus(2,new Date('2026-10-03T23:59:59Z')),
    {dailyLimit:2,used:2,remaining:0,resetsAt:'2026-10-04T00:00:00.000Z'});
  assert.equal(quotaStatus(10).remaining,0);
  assert.equal(quotaStatus(0,new Date('2026-12-31T23:59:59Z')).resetsAt,'2027-01-01T00:00:00.000Z');
});

test('Migration preserves legacy global history; reads do not consume personal attempts', async () => {
  const sql=new DatabaseSync(':memory:');
  try {
    sql.exec('CREATE TABLE ai_usage(day TEXT PRIMARY KEY, requests INTEGER NOT NULL); INSERT INTO ai_usage VALUES (\'2026-10-03\',5)');
    sql.exec(migration);const db=adapter(sql);const now=new Date('2026-10-03T22:00:00Z');
    for(let i=0;i<3;i++) assert.equal((await readAIQuota(db,'A',now)).remaining,2);
    assert.equal(sql.prepare('SELECT requests FROM ai_usage').get()?.requests,5);
    assert.equal(sql.prepare('SELECT count(*) AS n FROM ai_user_usage').get()?.n,0);
  } finally {sql.close();}
});

test('Authenticated owners have independent budgets; failures remain counted and reset needs no deletion',async()=>{
  const sql=new DatabaseSync(':memory:');sql.exec(migration);const db=adapter(sql);
  try {
    const today=new Date('2026-10-03T23:59:59Z');const tomorrow=new Date('2026-10-04T00:00:00Z');
    assert.equal((await reserveAIQuota(db,'A',today))?.used,1); // provider failure: no refund
    assert.equal((await reserveAIQuota(db,'A',today))?.used,2);
    assert.equal(await reserveAIQuota(db,'A',today),null);
    assert.equal((await readAIQuota(db,'B',today)).remaining,2);
    assert.equal((await reserveAIQuota(db,'B',today))?.used,1);
    assert.equal((await readAIQuota(db,'A',tomorrow)).remaining,2);
    assert.equal((await reserveAIQuota(db,'A',tomorrow))?.used,1);
    assert.equal((await readAIQuota(db,'A',today)).used,2);
    assert.equal((await readAIQuota(db,'B',today)).used,1);
  } finally {sql.close();}
});

test('Overlapping reservations through production helper accept exactly two per owner',async()=>{
  const sql=new DatabaseSync(':memory:');sql.exec(migration);const db=adapter(sql);const now=new Date('2026-10-03T12:00:00Z');
  try {
    const jobs=Array.from({length:40},(_,i)=>({owner:i%2?'A':'B'}));
    const results=await Promise.all(jobs.map(async j=>({owner:j.owner,result:await reserveAIQuota(db,j.owner,now)})));
    for(const owner of ['A','B']) assert.equal(results.filter(r=>r.owner===owner&&r.result!==null).length,2);
    assert.equal((await readAIQuota(db,'A',now)).used,2);
    assert.equal((await readAIQuota(db,'B',now)).used,2);
  } finally {sql.close();}
});

test('Parallel SQLite connections cannot oversubscribe the atomic production SQL',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'cookbook-quota-'));const path=join(dir,'quota.sqlite');
  const sql=new DatabaseSync(path);sql.exec('PRAGMA journal_mode=WAL');sql.exec(migration);sql.close();
  // Capture the SQL/bindings actually used by the production helper, not a copied query.
  let query='';let bindings: unknown[]=[];
  const capture={prepare:(q:string)=>{query=q;return {bind:(...v:unknown[])=>{bindings=v;return {first:async()=>null};}};}} as unknown as D1Database;
  await reserveAIQuota(capture,'A',new Date('2026-10-03T12:00:00Z'));
  try {
    const results=await Promise.all(Array.from({length:6},(_,i)=>new Promise<number>((resolve,reject)=>{
      const worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');
        const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(workerData.path);
        db.exec('PRAGMA busy_timeout=5000');const stmt=db.prepare(workerData.query);let accepted=0;
        for(let j=0;j<10;j++)if(stmt.get(...workerData.bindings))accepted++;
        db.close();parentPort.postMessage(accepted);`,
        {eval:true,workerData:{path,query,bindings:[i%2?'A':'B',bindings[1],bindings[2]]}});
      worker.once('message',resolve);worker.once('error',reject);
      worker.once('exit',code=>{if(code!==0)reject(new Error('Quota worker failed'));});
    })));
    assert.equal(results.reduce((a,b)=>a+b,0),4);
    const check=new DatabaseSync(path);
    try {assert.deepEqual(check.prepare('SELECT requests FROM ai_user_usage ORDER BY owner').all().map(r=>r.requests),[2,2]);}
    finally {check.close();}
  } finally {rmSync(dir,{recursive:true,force:true});}
});
