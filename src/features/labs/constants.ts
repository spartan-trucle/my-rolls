/**
 * B5: shared between `queries.ts` and `actions.ts` (and reused by
 * `scripts/seed-catalogue.ts`'s `seedHomeDevelopmentLab`), so the slug
 * and the service list can't drift between the two.
 */
export const HOME_DEVELOPMENT_SLUG = "home-development";

/** LAB-2: the fixed set of process types a custom lab can be tagged with. */
export const LAB_SERVICES = ["C-41", "E-6", "B&W", "ECN-2"] as const;

export type TLabService = (typeof LAB_SERVICES)[number];
