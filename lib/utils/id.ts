let counter = 0;

/** Unique-enough id for newly created entities at runtime. */
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
