import {AIError} from './ai-errors.ts';
import {providerText} from './cloudflare-ai.ts';
import {parseAIResult} from './recipe-ai.ts';

// Bounded streaming read: no response cloning or synthetic Request construction.
export async function decodeProviderResponse(response: Response, maxBytes = 120000) {
  const reader = response.body?.getReader();
  if (!reader) throw new AIError('AI_PROVIDER_JSON_INVALID');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new AIError('AI_PROVIDER_RESPONSE_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
  try {return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));}
  catch {throw new AIError('AI_PROVIDER_JSON_INVALID');}
}

export async function extractProviderRecipe(url: string, init: RequestInit, language: 'de'|'en', fetcher: typeof fetch = fetch, timeoutMs = 45000) {
  const signal = AbortSignal.timeout(timeoutMs);
  let stage: 'fetch'|'body'|'parse' = 'fetch';
  try {
    const response = await fetcher(url, {...init, signal});
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      if (response.status === 401 || response.status === 403) throw new AIError('AI_PROVIDER_ACCESS');
      if (response.status === 429) throw new AIError('AI_PROVIDER_RATE_LIMIT');
      throw new AIError('AI_PROVIDER_FAILURE');
    }
    stage = 'body';
    const data = await decodeProviderResponse(response);
    stage = 'parse';
    const fields = parseAIResult(providerText(data), language);
    if (!Object.keys(fields.aiMarks ?? {}).length) throw new AIError('AI_NO_RECIPE');
    return fields;
  } catch (error) {
    if (signal.aborted) throw new AIError('AI_PROVIDER_TIMEOUT');
    if (error instanceof AIError) throw error;
    throw new AIError(stage === 'parse' ? 'AI_INTERNAL' : 'AI_PROVIDER_NETWORK');
  }
}
