export async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = (await response.json()) as {
    error?: string;
    state?: unknown;
    version?: number;
    id?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}
