import type {AIErrorCode} from './ai-errors.ts';
import {errorDiagnostic} from "./diagnostics.ts";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { accessAllowed } from "@/lib/storage";
export function db() {
  const value = (
    env as unknown as {
      DB: D1Database;
    }
  ).DB;
  if (!value) throw new Error("Database unavailable");
  return value;
}
export function bucket() {
  const value = (
    env as unknown as {
      BUCKET: R2Bucket;
    }
  ).BUCKET;
  if (!value) throw new Error("Image storage unavailable");
  return value;
}
export async function owner() {
  return (await getChatGPTUser())?.userId ?? null;
}
export function json(value: unknown, status = 200, category?: AIErrorCode) {
  const diagnostic=status>=400?errorDiagnostic(status, undefined, category):undefined;
  return Response.json(diagnostic&&value&&typeof value==="object"?{...value,...diagnostic}:value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function authorize(req: Request, write = false) {
  const user = await owner();
  if (!user)
    return {
      error: json({ error: "Sign in required / Anmeldung erforderlich" }, 401),
    };
  if (!accessAllowed(user, req.headers.get("origin"), req.url, write))
    return { error: json({ error: "Cross-origin request rejected" }, 403) };
  return { user };
}
export async function limitedBody(req: Request, max: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Empty body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new Error("Payload too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const b of chunks) {
    out.set(b, offset);
    offset += b.length;
  }
  return out;
}
