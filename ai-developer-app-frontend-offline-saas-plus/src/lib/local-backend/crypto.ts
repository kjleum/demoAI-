// Minimal password hashing for offline demo. Not for real security.
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(prefix="tok") {
  const a = crypto.getRandomValues(new Uint8Array(16));
  return prefix + "_" + Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}
