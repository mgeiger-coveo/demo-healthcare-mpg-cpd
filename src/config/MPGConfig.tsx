import {
  MPGGridColumnsType,
  MPGProviderDetailSectionType,
  MPGProviderImageFieldsType,
  MPGProviderImageSizesType,
  MPGRefinementFacetConfigType,
  MPGSpecialtyListingConfigType,
  MPGViewModeType,
} from "./Types/ConfigTypes";

// -----------------------  MPGConfig  -----------------------
// Tunables for the "Find Care" page served at /mpg.
// Every string, facet id and field mapping used by src/Components/MPG lives here.

export const MPG_PAGE_TITLE = "Find Care at Barca Health";
export const MPG_PAGE_SUBTITLE =
  "Find a doctor, explore specialties, and discover care that fits your needs.";
export const MPG_SEARCH_PLACEHOLDER =
  "Search doctors, specialties, or services...";
export const MPG_SEARCH_INPUT_LABEL =
  "Search doctors, specialties, or services";
export const MPG_REFINEMENTS_TITLE = "Refine your search";
export const MPG_PROVIDERS_TITLE_SUFFIX = "providers";
export const MPG_ALL_PROVIDERS_LABEL = "All Providers";
export const MPG_NO_PROVIDERS_MESSAGE = "No providers match your search.";

// The specialty pills and the "Specialty" refinement are the same commerce facet,
// so selecting a pill and checking the facet value stay in sync through engine state.
export const MPG_SPECIALTY_FACET_ID = "hc_specialties";

// Preferred display order for the specialty pills. Any live facet value that is not
// listed here is appended alphabetically, then the list is truncated to the limit.
export const MPG_SPECIALTY_BUTTON_ORDER = [
  "Cardiology",
  "Primary Care",
  "Orthopedics",
  "Dermatology",
  "Neurology",
];
export const MPG_SPECIALTY_BUTTON_LIMIT = 5;

// Rendered (non-interactive) only while the first search is in flight.
export const MPG_FALLBACK_SPECIALTIES = [
  "Cardiology",
  "Primary Care",
  "Orthopedics",
  "Dermatology",
  "Neurology",
];

// Allow-list for the "Refine your search" column, in render order.
// Labels override the display names configured in Commerce Merchandising Hub.
export const MPG_REFINEMENT_FACETS: MPGRefinementFacetConfigType[] = [
  { facetId: "hc_specialties", label: "Specialty" },
  { facetId: "hc_locations", label: "Location" },
  { facetId: "hc_languages", label: "Languages" },
  { facetId: "hc_accepting_patients", label: "Accepting patients" },
  { facetId: "hc_telehealth", label: "Telehealth" },
];

// Provider card field mapping. `name` is read off the product, the other three are
// read from `product.additionalFields`.
export const MPG_PROVIDER_CARD_FIELDS = {
  name: "ec_name",
  specialties: "hc_specialties",
  languages: "hc_languages",
  facility: "hc_locations",
};

// Some providers list more than one facility; lower this to 1 to show only the first.
export const MPG_FACILITY_JOIN_LIMIT = 2;

// -----------------------  Search typeahead  -----------------------

// Shared by the search box and the instant-products controller so the product
// suggestions are keyed to this page's search box rather than another one's.
export const MPG_SEARCH_BOX_ID = "mpg-search-box";

// The commerce `SearchBoxOptions` has no `numberOfSuggestions`, so both limits are
// applied client-side by slicing the controller state.
export const MPG_QUERY_SUGGESTION_LIMIT = 5;
export const MPG_PRODUCT_SUGGESTION_LIMIT = 5;

// Keystrokes are coalesced before asking for product suggestions; the cache timeout
// bounds how often the same query is re-requested.
export const MPG_PRODUCT_SUGGESTION_DEBOUNCE_MS = 200;
export const MPG_PRODUCT_SUGGESTION_CACHE_TIMEOUT_MS = 60000;

export const MPG_QUERY_SUGGESTIONS_GROUP_LABEL = "Suggested searches";
export const MPG_PRODUCT_SUGGESTIONS_GROUP_LABEL = "Providers";
// `{count}` is substituted after the translation lookup.
export const MPG_SUGGESTION_COUNT_TEMPLATE = "{count} suggestions available";
export const MPG_SEARCH_CLEAR_LABEL = "Clear search";
export const MPG_SEARCH_SUBMIT_LABEL = "Search";

// -----------------------  Listing view modes  -----------------------

// "list" (one card per row, larger headshot) or "grid" (denser multi-column cards,
// smaller headshot). Persisted per browser rather than in the url: the /mpg hash is
// owned by the commerce url manager, which rewrites it wholesale.
export const MPG_VIEW_MODE_DEFAULT: MPGViewModeType = "list";
export const MPG_VIEW_MODE_STORAGE_KEY = "mpg-view-mode";
export const MPG_VIEW_MODE_GROUP_LABEL = "Result layout";
export const MPG_VIEW_MODE_LIST_LABEL = "List";
export const MPG_VIEW_MODE_GRID_LABEL = "Grid";
export const MPG_GRID_COLUMNS: MPGGridColumnsType = {
  xs: 1,
  sm: 2,
  md: 2,
  lg: 3,
};

// Two image variants are indexed: `ec_images` (full size) and `ec_thumbnails` (the
// smaller variant). The suggestion avatar reuses the smaller asset downscaled; there is
// no third variant in the index and the urls are not rewritten to invent one.
export const MPG_PROVIDER_IMAGE_FIELDS: MPGProviderImageFieldsType = {
  large: "ec_images",
  small: "ec_thumbnails",
};
export const MPG_PROVIDER_IMAGE_SIZES: MPGProviderImageSizesType = {
  list: 112,
  grid: 72,
  suggestion: 40,
};

// -----------------------  Location badges  -----------------------

// How many location badges a card shows before collapsing the rest into a single
// overflow indicator. Lower this to 1 to see the overflow against sparse data.
export const MPG_LOCATION_BADGE_LIMIT = 2;
// `{count}` / `{locations}` are substituted after the translation lookup.
export const MPG_LOCATION_OVERFLOW_TEMPLATE = "+{count} more";
export const MPG_LOCATION_OVERFLOW_TITLE_TEMPLATE = "Also at {locations}";

// -----------------------  "Open to New Patients" badge  -----------------------

// The one `product.additionalFields` key the badge reads. Kept separate from
// MPG_PROVIDER_CARD_FIELDS because that map feeds formatProviderCard's three text lines;
// availability is a visibility rule, not a card line.
export const MPG_ACCEPTING_PATIENTS_FIELD = "hc_accepting_patients";

// One label for all three variants, so the visible text and the accessible text are
// always the same string. The compact variant wraps it instead of shortening it.
export const MPG_NEW_PATIENT_BADGE_LABEL = "Open to New Patients";

// -----------------------  Provider detail page (/providers/:providerId)  -----------------------

// The product field the provider detail route is keyed on. Equal to `permanentid` and
// `ec_item_group_id` in the HC - Provider Catalog source.
export const MPG_PROVIDER_ID_FIELD = "ec_product_id";

// Provider detail field mapping. `name`, `image`, `imageFallback` and `bio` are read off
// the product itself; everything else comes from `product.additionalFields`.
export const MPG_PROVIDER_DETAIL_FIELDS = {
  name: "ec_name",
  image: "ec_images",
  imageFallback: "ec_thumbnails",
  bio: "ec_description",
  specialties: "hc_specialties",
  languages: "hc_languages",
  locations: "hc_locations",
  services: "hc_services",
  affiliation: "hc_medical_group",
  acceptingPatients: "hc_accepting_patients",
  telehealth: "hc_telehealth",
  boardCertifications: "hc_board_certifications",
};

// Labelled blocks of the "About" grid, in render order. A block whose field has no value
// is dropped rather than rendered empty. Uncomment the last entry to surface board
// certifications as a fifth block.
export const MPG_PROVIDER_DETAIL_SECTIONS: MPGProviderDetailSectionType[] = [
  { key: "specialties", field: "hc_specialties", label: "Specialties" },
  { key: "languages", field: "hc_languages", label: "Languages" },
  { key: "locations", field: "hc_locations", label: "Locations" },
  { key: "services", field: "hc_services", label: "Services" },
  // { key: "boardCertifications", field: "hc_board_certifications", label: "Board Certifications" },
];

// Non-interactive header chips. The index stores these as the strings "true" / "false",
// so the value is coerced rather than read for truthiness.
// `hc_accepting_patients` is deliberately NOT a chip here: it now renders as the green
// NewPatientBadge at the head of the same indicator row (see MPG_NEW_PATIENT_BADGE_LABEL
// below), so a grey "Accepting Patients" chip would duplicate it.
export const MPG_PROVIDER_ATTRIBUTE_CHIPS: MPGProviderDetailSectionType[] = [
  { key: "telehealth", field: "hc_telehealth", label: "Telehealth" },
];

// `{lastName}` and `{name}` are substituted after the translation lookup so word order
// stays translatable.
export const MPG_PROVIDER_ABOUT_HEADING_TEMPLATE = "About Dr. {lastName}";
export const MPG_PROVIDER_PHOTO_ALT_TEMPLATE = "Photo of {name}";
export const MPG_PROVIDER_BACK_LABEL = "Back to Find Care";
export const MPG_PROVIDER_LOADING_LABEL = "Loading provider...";
export const MPG_PROVIDER_NOT_FOUND_TITLE = "Provider not found";
export const MPG_PROVIDER_NOT_FOUND_BODY =
  "We could not find a provider with that identifier. It may have been removed from the directory.";
export const MPG_PROVIDER_CTA_TITLE = "Ready to schedule an appointment?";
export const MPG_PROVIDER_CTA_SUBTEXT =
  "Choose a location and request an appointment with this provider.";
export const MPG_PROVIDER_CTA_BUTTON = "Request Appointment →";
// Superseded by the appointment dialog's step 4 (MPG_APPOINTMENT_CONFIRMATION_* below),
// which now owns the confirmation copy. Retained intentionally rather than deleted: these
// three constants and their translation entries are harmless, and removing translations is
// not worth the churn in a file that carries uncommitted work.
export const MPG_PROVIDER_CTA_CONFIRMATION_TITLE =
  "Appointment request received";
export const MPG_PROVIDER_CTA_CONFIRMATION_BODY =
  "This is a demo. No appointment was scheduled and no information was sent.";
export const MPG_PROVIDER_CTA_CONFIRMATION_CLOSE = "Close";

// -----------------------  Appointment request flow (simulated)  -----------------------
// Copy for the four-step appointment request dialog. The flow is a demonstration only: it
// schedules nothing, collects nothing and sends nothing anywhere, and the copy below says
// so at the visit-type, review and confirmation steps.
export const MPG_APPOINTMENT_DIALOG_TITLE = "Request an Appointment (Demo)";
export const MPG_APPOINTMENT_DIALOG_CLOSE_LABEL = "Close appointment request";
// `{current}`, `{total}` and `{label}` are substituted after the translation lookup so
// word order stays translatable.
export const MPG_APPOINTMENT_STEP_PROGRESS_TEMPLATE =
  "Step {current} of {total}: {label}";
export const MPG_APPOINTMENT_STEP_LOCATION_LABEL = "Location";
export const MPG_APPOINTMENT_STEP_VISIT_TYPE_LABEL = "Visit type";
export const MPG_APPOINTMENT_STEP_REVIEW_LABEL = "Review";
export const MPG_APPOINTMENT_STEP_CONFIRMATION_LABEL = "Submitted";
export const MPG_APPOINTMENT_LOCATION_HEADING = "Select a location";
export const MPG_APPOINTMENT_LOCATION_GROUP_LABEL =
  "Locations listed for this provider";
export const MPG_APPOINTMENT_LOCATION_HINT = "Select a location to continue.";
export const MPG_APPOINTMENT_LOCATION_UNAVAILABLE_TITLE =
  "No locations are listed for this provider";
export const MPG_APPOINTMENT_LOCATION_UNAVAILABLE_BODY =
  "This provider has no locations in the directory, so no location can be selected. No location is suggested or assumed on their behalf.";
export const MPG_APPOINTMENT_VISIT_TYPE_HEADING = "Select a visit type";
export const MPG_APPOINTMENT_VISIT_TYPE_GROUP_LABEL =
  "Demonstration visit types";
export const MPG_APPOINTMENT_VISIT_TYPE_HINT =
  "Select a visit type to continue.";
export const MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT =
  "New Patient Consultation";
export const MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP = "Follow-up Visit";
export const MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH = "Telehealth Visit";
export const MPG_APPOINTMENT_VISIT_TYPE_DEMO_NOTE =
  "These are demonstration options only. They do not represent verified availability or bookable appointment inventory.";
export const MPG_APPOINTMENT_REVIEW_HEADING = "Review this simulated request";
export const MPG_APPOINTMENT_REVIEW_PROVIDER_LABEL = "Provider";
export const MPG_APPOINTMENT_REVIEW_SPECIALTY_LABEL = "Specialty";
export const MPG_APPOINTMENT_REVIEW_LOCATION_LABEL = "Location";
export const MPG_APPOINTMENT_REVIEW_VISIT_TYPE_LABEL = "Visit type";
export const MPG_APPOINTMENT_REVIEW_SIMULATED_NOTICE =
  "Simulated request. Submitting this form does not schedule an appointment, and no information is collected, stored, or sent to a healthcare provider.";
export const MPG_APPOINTMENT_BACK_LABEL = "Back";
export const MPG_APPOINTMENT_CONTINUE_LABEL = "Continue";
export const MPG_APPOINTMENT_CANCEL_LABEL = "Cancel";
export const MPG_APPOINTMENT_SUBMIT_LABEL = "Submit simulated request";
// Fixed by the user brief and asserted byte-exact by a test. Do not reword.
export const MPG_APPOINTMENT_CONFIRMATION_TITLE =
  "Appointment Request Submitted (Demo)";
export const MPG_APPOINTMENT_CONFIRMATION_BODY =
  "This is a demonstration. No appointment has been scheduled and no information has been sent to a healthcare provider.";
export const MPG_APPOINTMENT_CONFIRMATION_CLOSE_LABEL = "Close";
export const MPG_APPOINTMENT_CONFIRMATION_DISCOVERY_LABEL =
  "Return to provider search";

// How many products the detail-page lookup asks for before filtering on an exact
// `ec_product_id` match.
export const MPG_PROVIDER_DETAIL_SEARCH_PER_PAGE = 10;

// -----------------------  Specialty listing pages (/specialty/:specialtySlug)  -----------------------

// Route prefix for the Commerce Product Listing Pages. The full path, /specialty/<slug>,
// is also the Commerce context view url path and must equal the listing url configured in
// the Merchandising Hub for that listing.
export const MPG_SPECIALTY_LISTING_ROUTE_BASE = "/specialty";

// One entry per listing page. Adding a specialty page is a new entry here and nothing
// else: the route, the header, the specialty pill target and the view url all derive from
// it. Membership, ranking, facets and sorting are owned by the Hub, not by this file.
// `listingId` is diagnostic reference only and is never sent in a request.
export const MPG_SPECIALTY_LISTING_PAGES: MPGSpecialtyListingConfigType[] = [
  {
    slug: "cardiology",
    specialtyValue: "Cardiology",
    title: "Cardiology Providers",
    description: "Find cardiologists and cardiovascular specialists.",
    listingId: "4a0b9677-230a-460d-8f87-2ab06d62e86d",
  },
  {
    slug: "orthopedics",
    specialtyValue: "Orthopedics",
    title: "Orthopedic Providers",
    description:
      "Find orthopedic specialists and musculoskeletal care providers.",
    listingId: "a7406a88-f5fe-4337-ab3c-c347d5fe453d",
  },
];

// Facet ids that a listing page does not render in its refinement column. The Hub still
// returns them and they are still part of the response and the request; this is a
// rendering rule only. hc_specialties is suppressed because each configured specialty is
// its own page, so a specialty filter inside one of those pages is redundant with the
// pill navigation.
export const MPG_LISTING_SUPPRESSED_FACET_IDS: string[] = [
  MPG_SPECIALTY_FACET_ID,
];

// Instant-products key for the listing pages' search entry. It is NOT a search-box id:
// listing pages build no search box, so they hold no querySet entry. Distinct from
// MPG_SEARCH_BOX_ID so the two pages' product-suggestion caches do not overwrite each
// other.
export const MPG_LISTING_SUGGESTIONS_ID = "specialty-listing-suggestions";

export const MPG_LISTING_ERROR_MESSAGE =
  "We could not load this specialty listing.";
export const MPG_LISTING_UNKNOWN_SPECIALTY_MESSAGE =
  "We do not have a listing page for that specialty.";
export const MPG_LISTING_EMPTY_MESSAGE =
  "This specialty listing has no providers right now.";
export const MPG_LISTING_UNRESOLVED_MESSAGE =
  "This listing did not resolve in the Merchandising Hub.";
// `{viewUrl}` is substituted after the translation lookup by formatTemplate.
export const MPG_LISTING_UNRESOLVED_DETAIL_TEMPLATE =
  "No products and no facets came back for the listing url {viewUrl}. Check the listing url and facet configuration in the Merchandising Hub.";
export const MPG_LISTING_CLEAR_FILTERS_LABEL = "Clear all filters";
