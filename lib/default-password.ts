/** Default password: first 5 letters of name + @ + current year, first letter uppercase. */
export function generateDefaultPassword(fullName: string): string {
  const letters = fullName.replace(/\s+/g, "").slice(0, 5);
  const base = letters || "User";
  const prefix = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return `${prefix}@${new Date().getFullYear()}`;
}

export const DEFAULT_PASSWORD_HINT =
  "First 5 letters of their name (no spaces), @, and the current year — first letter uppercase. Example: Alex@2026";
