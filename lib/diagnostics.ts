import {isAIErrorCode, type AIErrorCode} from './ai-errors.ts';
// Deliberately accepts only numbers and fixed codes, never requests/errors.
export function errorDiagnostic(status: number, write: (entry: string) => void = entry => console.warn(entry), category?: AIErrorCode) {
    const requestId = crypto.randomUUID();
    const code = isAIErrorCode(category) ? category : `HTTP_${Math.trunc(status)}`;
    write(JSON.stringify({ event: 'api_error', code, status, requestId }));
    return { code, requestId };
}
