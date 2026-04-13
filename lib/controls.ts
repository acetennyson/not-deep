export const JUMP_KEY_NAMES = ["SPACE", "↑", "S", "↓"];

export function getJumpKeyName(runIndex: number): string {
  return JUMP_KEY_NAMES[runIndex % JUMP_KEY_NAMES.length];
}

export function getSlamKeyName(runIndex: number): string {
  // slam is always opposite of jump
  const jumpKey = JUMP_KEY_NAMES[runIndex % JUMP_KEY_NAMES.length];
  return jumpKey === "↓" ? "SPACE" : "↓";
}
