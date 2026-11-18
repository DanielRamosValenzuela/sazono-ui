interface PathedModifier {
  modifierOptionId: string | null;
  parentModifierOptionId?: string | null;
  name: string;
  path?: string[];
}

export function formatModifierLines(modifiers: PathedModifier[]) {
  const parentIds = new Set(
    modifiers.map((modifier) => modifier.parentModifierOptionId).filter(Boolean)
  );

  return modifiers
    .filter(
      (modifier) =>
        !modifier.modifierOptionId || !parentIds.has(modifier.modifierOptionId)
    )
    .map((modifier) =>
      modifier.path && modifier.path.length > 0
        ? modifier.path.join(" > ")
        : modifier.name
    );
}
