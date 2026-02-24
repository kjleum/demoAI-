export function newRequestId(): string {
  const a = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}
