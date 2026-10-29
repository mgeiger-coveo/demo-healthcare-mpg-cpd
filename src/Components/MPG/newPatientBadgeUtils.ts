// Pure helpers for the "Open to New Patients" badge. No React, no engine and no network
// dependency, so the visibility rule and the variant sizing are unit testable directly.
//
// Kept out of mpgUtils.ts so the badge's tests do not perturb that module's baseline and
// so the one place availability is decided is easy to find.

import { MPGViewModeType } from "../../config/Types/ConfigTypes";
import { MPG_ACCEPTING_PATIENTS_FIELD } from "../../config/MPGConfig";

export type NewPatientBadgeVariant = "compact" | "standard" | "prominent";

export interface NewPatientBadgeStyle {
  /** Diameter in px of the filled green circle behind the glyph. */
  iconCircle: number;
  /** Glyph font-size in px. */
  iconFontSize: number;
  /** Label font-size in px. */
  labelFontSize: number;
  /** Pill padding shorthand. Left side is tighter because the circle sits flush. */
  padding: string;
  /** Gap in px between the circle and the label. */
  gap: number;
  /** True when the label is allowed to wrap onto a second line. */
  wrapLabel: boolean;
}

// No `marginTop` member: both host layouts own their own spacing (ProviderCard's NameRow
// and ProviderHeader's ChipList are flex rows with gaps), so a margin on the pill would
// be dead in every context that exists.

/**
 * The strict availability rule, applied to one raw field value.
 *
 * The requirement is **exact equality with the string "true"**. This deliberately does
 * NOT reuse `coerceBooleanField` from providerDetailUtils: that helper is permissive by
 * design (it accepts boolean `true`, `"TRUE"` and `" true "`, and its tests pin that
 * behaviour for the telehealth chip), and tightening it would change an unrelated
 * feature. So the badge carries its own comparison and `coerceBooleanField` is left
 * exactly as it is.
 *
 * It fails closed: anything that is not the literal string "true" hides the badge, so a
 * schema change in the index can never make the app claim an availability it has not
 * actually been told about.
 *
 * A single-element array is unwrapped once. The live field is scalar, but a future
 * multi-value field mapping in the Merchandising Hub would otherwise silently hide the
 * badge for every provider rather than failing visibly.
 */
export const isAcceptingPatientsValue = (raw: any): boolean => {
  const value = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
  return value === "true";
};

/**
 * Whether a Commerce product should show the badge. Reads exactly one field,
 * `product.additionalFields[fieldName]`, and nothing else: availability is never inferred
 * from status, specialty or any other attribute.
 */
export const isAcceptingNewPatients = (
  product: any,
  fieldName: string = MPG_ACCEPTING_PATIENTS_FIELD,
): boolean => isAcceptingPatientsValue(product?.additionalFields?.[fieldName]);

/**
 * The card variant for a given result layout. `ProviderCard` already knows its view mode
 * on both /mpg and /specialty/*, so this is the whole variant-selection mechanism — no
 * new prop, no layout context and no forked card.
 */
export const selectNewPatientBadgeVariant = (
  viewMode: MPGViewModeType | undefined,
): NewPatientBadgeVariant => (viewMode === "grid" ? "compact" : "standard");

const BADGE_STYLES: Record<NewPatientBadgeVariant, NewPatientBadgeStyle> = {
  compact: {
    iconCircle: 18,
    iconFontSize: 12,
    labelFontSize: 11,
    padding: "3px 8px 3px 4px",
    gap: 6,
    wrapLabel: true,
  },
  standard: {
    iconCircle: 22,
    iconFontSize: 14,
    labelFontSize: 12.5,
    padding: "4px 10px 4px 5px",
    gap: 8,
    wrapLabel: false,
  },
  prominent: {
    iconCircle: 28,
    iconFontSize: 18,
    labelFontSize: 15,
    padding: "6px 14px 6px 6px",
    gap: 10,
    wrapLabel: false,
  },
};

/**
 * The numeric style descriptor a variant renders from, so variant sizing is assertable
 * without rendering React. An unknown variant falls back to `standard`.
 */
export const getNewPatientBadgeStyle = (
  variant: NewPatientBadgeVariant,
): NewPatientBadgeStyle => BADGE_STYLES[variant] ?? BADGE_STYLES.standard;
