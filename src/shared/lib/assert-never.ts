export function assertNever(value: never): never {
  throw new Error(`Caso no manejado en un switch exhaustivo: ${String(value)}`);
}
