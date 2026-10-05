export const aiFailures = {
  AI_INPUT_INVALID: [400, 'Rezeptdaten sind ungültig. Bitte Text oder Bild prüfen. / Recipe input is invalid. Check the text or image.'],
  AI_INPUT_TOO_LARGE: [413, 'Rezeptdaten sind zu groß. Bitte kürzen. / Recipe input is too large. Please shorten it.'],
  AI_STORAGE_UNAVAILABLE: [503, 'Das persönliche KI-Kontingent konnte nicht geprüft werden. / Your AI quota could not be checked.'],
  AI_PROVIDER_TIMEOUT: [504, 'Cloudflare hat nicht innerhalb von 45 Sekunden vollständig geantwortet. / Cloudflare did not finish responding within 45 seconds.'],
  AI_PROVIDER_NETWORK: [502, 'Die Verbindung zu Cloudflare ist fehlgeschlagen. / The connection to Cloudflare failed.'],
  AI_PROVIDER_ACCESS: [502, 'Cloudflare hat den API-Zugang abgelehnt. / Cloudflare denied API access.'],
  AI_PROVIDER_RATE_LIMIT: [503, 'Cloudflare ist ausgelastet oder sein kostenloses Kontingent ist erreicht. / Cloudflare is busy or its free quota is exhausted.'],
  AI_PROVIDER_FAILURE: [502, 'Cloudflare konnte die Auswertung nicht durchführen. / Cloudflare could not complete the analysis.'],
  AI_PROVIDER_RESPONSE_TOO_LARGE: [502, 'Die Antwort von Cloudflare überschreitet das sichere Größenlimit. / The Cloudflare response exceeds the safe size limit.'],
  AI_PROVIDER_JSON_INVALID: [502, 'Cloudflare hat eine ungültige JSON-Antwort geliefert. / Cloudflare returned an invalid JSON response.'],
  AI_PROVIDER_FORMAT_INVALID: [502, 'Cloudflare hat ein unerwartetes Antwortformat geliefert. / Cloudflare returned an unexpected response format.'],
  AI_OUTPUT_TRUNCATED: [502, 'Die KI-Antwort wurde am Ausgabelimit abgeschnitten. Bitte ein kürzeres Rezept verwenden. / The AI response was cut off at its output limit. Try a shorter recipe.'],
  AI_OUTPUT_JSON_INVALID: [502, 'Die KI hat keinen gültigen Rezeptentwurf als JSON geliefert. / The AI did not return valid recipe JSON.'],
  AI_OUTPUT_SCHEMA_INVALID: [502, 'Die KI-Angaben passen nicht zum sicheren Rezeptformat. / The AI fields do not match the safe recipe format.'],
  AI_NO_RECIPE: [422, 'Kein lesbares Rezept erkannt. / No readable recipe found.'],
  AI_INTERNAL: [500, 'Die Rezeptauswertung ist intern fehlgeschlagen. / Recipe analysis failed internally.'],
} as const;
export type AIErrorCode = keyof typeof aiFailures;
export function isAIErrorCode(value: unknown): value is AIErrorCode {
  return typeof value === 'string' && Object.hasOwn(aiFailures, value);
}
export class AIError extends Error {
  readonly code: AIErrorCode;
  constructor(code: AIErrorCode) { super(code); this.code = code; this.name = 'AIError'; }
}
export function aiFailure(code: AIErrorCode) {
  const [status, message] = aiFailures[code];
  return {status, error: message + ' Dein Entwurf bleibt erhalten. / Your draft is preserved.'};
}
