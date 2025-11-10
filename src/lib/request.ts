export async function readJSON<T=any>(req: Request): Promise<T> {
  const text = await req.text();
  try { return JSON.parse(text) as T; } catch {
    throw new Error('Invalid JSON body');
  }
}
