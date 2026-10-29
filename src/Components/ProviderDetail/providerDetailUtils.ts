// Pure helpers for the provider detail page served at /providers/:providerId.
// No React, no engine and no network dependency, so they can be unit tested directly.

import { MPGProviderDetailSectionType } from "../../config/Types/ConfigTypes";
import { getAdditionalField } from "../MPG/mpgUtils";

export interface ProviderDetailFieldMap {
  name: string;
  image: string;
  imageFallback: string;
  bio: string;
  specialties: string;
  languages: string;
  locations: string;
  services: string;
  affiliation: string;
  acceptingPatients: string;
  telehealth: string;
  boardCertifications: string;
}

export interface ProviderDetailSection {
  key: string;
  label: string;
  value: string;
}

export interface ProviderAttributeChip {
  key: string;
  label: string;
}

const HONORIFICS = ["dr.", "dr", "doctor"];

/**
 * Replaces `{key}` tokens in a translated template. Interpolation happens after the
 * `getText` lookup so each locale keeps one whole string and its own word order.
 * Unknown tokens are left untouched.
 */
export const formatTemplate = (
  template: string,
  values: Record<string, string>,
) => {
  if (!template) return "";
  return Object.keys(values ?? {}).reduce(
    (text, key) => text.split(`{${key}}`).join(values[key] ?? ""),
    template,
  );
};

/** Drops a leading "Dr." / "Dr" / "Doctor" and returns the remaining name tokens. */
const stripHonorific = (name: string) => {
  const tokens = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (tokens.length > 1 && HONORIFICS.indexOf(tokens[0].toLowerCase()) !== -1) {
    return tokens.slice(1);
  }
  return tokens;
};

/** "Dr. Sarah Mitchell" -> "Mitchell". Empty string when there is no usable name. */
export const getProviderLastName = (name: string) => {
  const tokens = stripHonorific(name);
  return tokens.length === 0 ? "" : tokens[tokens.length - 1];
};

/** "Dr. Sarah Mitchell" -> "SM". At most two characters, honorific ignored. */
export const getProviderInitials = (name: string) => {
  const tokens = stripHonorific(name);
  return tokens
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");
};

/**
 * The index stores `hc_accepting_patients` / `hc_telehealth` as the strings "true" and
 * "false", so a plain truthiness check would treat "false" as true.
 */
export const coerceBooleanField = (raw: any) => {
  if (typeof raw === "boolean") return raw;
  if (Array.isArray(raw)) return coerceBooleanField(raw[0]);
  if (raw === null || raw === undefined) return false;
  return String(raw).trim().toLowerCase() === "true";
};

/** First usable headshot URL: `ec_images`, then `ec_thumbnails`, else null. */
export const getProviderImageUrl = (
  product: any,
  fields: ProviderDetailFieldMap,
) => {
  const candidates = [fields.image, fields.imageFallback];
  for (const field of candidates) {
    const raw = product?.[field];
    const asArray = Array.isArray(raw) ? raw : [raw];
    const found = asArray.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    if (found) return String(found).trim();
  }
  return null;
};

/** Trimmed `ec_description`, or "" when the provider has no bio indexed. */
export const getProviderBio = (
  product: any,
  fields: ProviderDetailFieldMap,
) => {
  const raw = product?.[fields.bio];
  return raw === null || raw === undefined ? "" : String(raw).trim();
};

/** Scalar `hc_medical_group` affiliation line, or "" when absent. */
export const getProviderAffiliation = (
  product: any,
  fields: ProviderDetailFieldMap,
) => getAdditionalField(product, fields.affiliation).join(", ");

/** "Cardiology · Preventive Cardiology" for the header, "" when no specialties. */
export const getProviderSpecialtyLine = (
  product: any,
  fields: ProviderDetailFieldMap,
) => getAdditionalField(product, fields.specialties).join(" · ");

/**
 * Maps the configured sections to label / comma-joined-value pairs, dropping any section
 * whose field has no value so the grid never shows a hollow label.
 */
export const buildProviderDetailSections = (
  product: any,
  sections: MPGProviderDetailSectionType[],
  labels: Record<string, string> = {},
): ProviderDetailSection[] =>
  (Array.isArray(sections) ? sections : [])
    .map((section) => ({
      key: section.key,
      label: labels[section.key] ?? section.label,
      value: getAdditionalField(product, section.field).join(", "),
    }))
    .filter((section) => section.value.length > 0);

/** Keeps only the chips whose boolean field coerces to true. */
export const buildProviderAttributeChips = (
  product: any,
  chips: MPGProviderDetailSectionType[],
  labels: Record<string, string> = {},
): ProviderAttributeChip[] =>
  (Array.isArray(chips) ? chips : [])
    .filter((chip) =>
      coerceBooleanField(product?.additionalFields?.[chip.field]),
    )
    .map((chip) => ({
      key: chip.key,
      label: labels[chip.key] ?? chip.label,
    }));
