import { FieldToIncludesInSearchResults } from "../SearchConfig";

export interface DefaultSideBarRecommendationConfigType {
  pipeline: string;
  searchHub: string;
  NumberofResults: number;
  title: string;
  HomeBottomRecommendation?: boolean;
  imageField?: (typeof FieldToIncludesInSearchResults)[number];
}

export interface NoResultRecommendationConfigType {
  enable: boolean;
  heading: string;
  pipeline: string;
  searchHub: string;
  NumberofResults: number;
  imageField: string | null;
  excerptField: string;
}

export interface FacetConfigType {
  field: string;
  title: string;
}

export interface MPGRefinementFacetConfigType {
  facetId: string;
  label: string;
}

// A labelled block of the provider detail page's "About" grid, or one of the boolean
// attribute chips in its header. `key` is the i18n lookup suffix, `field` is read from
// `product.additionalFields`.
export interface MPGProviderDetailSectionType {
  key: string;
  field: string;
  label: string;
}

// The two layouts the /mpg provider listing can be rendered in.
export type MPGViewModeType = "list" | "grid";

// Which product field carries each indexed image variant. `large` is the full-size
// headshot, `small` the smaller variant; both are top-level product fields.
export interface MPGProviderImageFieldsType {
  large: string;
  small: string;
}

// Rendered box size in pixels per context. Used for both the CSS frame and the
// width/height attributes, so the box is reserved before the image loads.
export interface MPGProviderImageSizesType {
  list: number;
  grid: number;
  suggestion: number;
}

// Column count of the tight-grid layout at each breakpoint.
export interface MPGGridColumnsType {
  xs: number;
  sm: number;
  md: number;
  lg: number;
}

// One Commerce Product Listing Page. `slug` is the /specialty/<slug> path segment and
// must match the listing url configured in the Merchandising Hub. `specialtyValue` is the
// exact hc_specialties facet value, used to map a specialty pill to this page.
// `listingId` is recorded for diagnosing API responses only — it is never sent in a
// request; the view url is the only routing input the Listings API gets.
export interface MPGSpecialtyListingConfigType {
  slug: string;
  specialtyValue: string;
  title: string;
  description?: string;
  listingId?: string;
}

export interface FileTypeIconsConfigType {
  imageRef: string;
}

export interface sideBarRecommendationConfigType {
  pipeline: string;
  searchHub: string;
  NumberofResults: number;
  title: string;
  HomeBottomRecommendation?: boolean;
  imageField?: (typeof FieldToIncludesInSearchResults)[number];
}

export interface SearchPageTabConfigType {
  caption: string;
  expression: string;
  isActive: boolean;
  sideBarRecommendationConfig?: sideBarRecommendationConfigType[];
  facetToInclude?: String[];
  commerceTab?: boolean;
}

export interface RecommendationType {
  title?: string;
  description?: string;
  numberOfResults?: number;
  imageField?: (typeof FieldToIncludesInSearchResults)[number];
  pipeline?: string;
  id?: string;
  searchHub: string;
  active: boolean;
  type: "list" | "carousel" | "slider";
  slotID: string;
}

export interface CommerceRecommendationType {
  active: boolean;
  type: "list" | "carousel" | "slider";
  slotID: string;
}
