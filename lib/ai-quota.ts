export const dailyAILimit=5;
export function quotaStatus(requests:number,now=new Date()){
 const used=Math.max(0,Math.min(dailyAILimit,Math.floor(requests)));
 const reset=new Date(now);reset.setUTCHours(24,0,0,0);
 return {dailyLimit:dailyAILimit,used,remaining:dailyAILimit-used,resetsAt:reset.toISOString()};
}
export async function readAIQuota(database:D1Database,now=new Date()){
 const row=await database.prepare('SELECT requests FROM ai_usage WHERE day = ?').bind(now.toISOString().slice(0,10)).first<{requests:number}>();
 return quotaStatus(row?.requests??0,now);
}
