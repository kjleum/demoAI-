// path: src/shared/lib/ids/id.ts
export function uid(): string {
  // no crypto dependency assumptions
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
