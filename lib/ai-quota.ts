export const dailyAILimit = 2;

// Alpha owner exception. Both emails come from trusted server configuration/authentication.
// No client field can select the higher limit; missing configuration keeps the tester cap.
export function personalAILimit(email: string | undefined, ownerEmail: string | undefined) {
  const configured = ownerEmail?.trim().toLowerCase();
  return configured && email?.trim().toLowerCase() === configured ? 20 : dailyAILimit;
}

export function quotaStatus(requests: number, now = new Date(), limit = dailyAILimit) {
  const used = Math.max(0, Math.min(limit, Math.floor(requests)));
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return { dailyLimit: limit, used, remaining: limit - used, resetsAt: reset.toISOString() };
}

export async function readAIQuota(database: D1Database, owner: string, now = new Date(), limit = dailyAILimit) {
  const row = await database.prepare('SELECT requests FROM ai_user_usage WHERE owner = ? AND day = ?')
    .bind(owner, now.toISOString().slice(0, 10)).first<{requests: number}>();
  return quotaStatus(row?.requests ?? 0, now, limit);
}

// Reserve before provider fetch; failures count and are never refunded.
// owner comes only from server authentication, never from the request body.
export async function reserveAIQuota(database: D1Database, owner: string, now = new Date(), limit = dailyAILimit) {
  const row = await database.prepare(`INSERT INTO ai_user_usage(owner,day,requests) VALUES (?,?,1)
    ON CONFLICT(owner,day) DO UPDATE SET requests=requests+1 WHERE requests < ? RETURNING requests`)
    .bind(owner, now.toISOString().slice(0, 10), limit).first<{requests: number}>();
  return row ? quotaStatus(row.requests, now, limit) : null;
}
