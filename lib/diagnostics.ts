// Deliberately accepts only numbers and fixed codes, never requests/errors.
export function errorDiagnostic(status: number, write: (entry: string) => void = entry => console.warn(entry)) {
    const requestId = crypto.randomUUID();
    const code = `HTTP_${Math.trunc(status)}`;
    write(JSON.stringify({ event: 'api_error', code, status, requestId }));
    return { code, requestId };
}
