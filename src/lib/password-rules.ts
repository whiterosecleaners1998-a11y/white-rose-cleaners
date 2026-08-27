/**
 * What counts as an acceptable password. Kept apart from lib/password.ts so the
 * change-password form can state the rule without dragging node crypto and the
 * Prisma client into the browser bundle.
 */
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;
