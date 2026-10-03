export const dailyAILimit = 2;

export function quotaStatus(requests: number, now = new Date()) {
  const used = Math.max(0, Math.min(dailyAILimit, Math.floor(requests)));
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return { dailyLimit: dailyAILimit, used, remaining: dailyAILimit - used, resetsAt: reset.toISOString() };
}

export async function readAIQuota(database: D1Database, owner: string, now = new Date()) {
  const row = await database.prepare('SELECT requests FROM ai_user_usage WHERE owner = ? AND day = ?')
    .bind(owner, now.toISOString().slice(0, 10)).first<{requests: number}>();
  return quotaStatus(row?.requests ?? 0, now);
}

// Reserve before provider fetch; failures count and are never refunded.
// owner comes only from server authentication, never from the request body.
export async function reserveAIQuota(database: D1Database, owner: string, now = new Date()) {
  const row = await database.prepare(`INSERT INTO ai_user_usage(owner,day,requests) VALUES (?,?,1)
    ON CONFLICT(owner,day) DO UPDATE SET requests=requests+1 WHERE requests < ? RETURNING requests`)
    .bind(owner, now.toISOString().slice(0, 10), dailyAILimit).first<{requests: number}>();
  return row ? quotaStatus(row.requests, now) : null;
}
