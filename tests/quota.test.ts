import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {quotaStatus,readAIQuota} from '../lib/ai-quota.ts';
test('Daily status counts used requests and always resets at next UTC midnight',()=>{
 const now=new Date('2026-10-01T21:59:59Z');assert.deepEqual(quotaStatus(5,now),{dailyLimit:5,used:5,remaining:0,resetsAt:'2026-10-02T00:00:00.000Z'});
 assert.equal(quotaStatus(2,now).remaining,3);assert.equal(quotaStatus(10,now).remaining,0);
 assert.equal(quotaStatus(0,new Date('2026-10-02T00:00:00Z')).resetsAt,'2026-10-03T00:00:00.000Z');
});
test('Status reads do not consume any quota; a fresh UTC day has five requests',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE ai_usage(day TEXT PRIMARY KEY,requests INTEGER NOT NULL)');sql.prepare('INSERT INTO ai_usage VALUES (?,?)').run('2026-10-01',5);
 const db={prepare:(q:string)=>({bind:(...v:unknown[])=>({first:async()=>sql.prepare(q).get(...v as never[])??null})})} as unknown as D1Database;
 for(let i=0;i<3;i++)assert.equal((await readAIQuota(db,new Date('2026-10-01T22:00:00Z'))).remaining,0);
 assert.equal(sql.prepare('SELECT requests FROM ai_usage').get()?.requests,5);
 assert.equal((await readAIQuota(db,new Date('2026-10-02T00:00:00Z'))).remaining,5);sql.close();
});
