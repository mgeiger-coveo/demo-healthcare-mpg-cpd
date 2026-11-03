import { describe, it, expect, vi, afterEach } from "vitest";
import {
  bootstrapSearchPage,
  bootstrapSearchPageSafely,
  buildListingPath,
  buildProvidersHeading,
  buildProviderSuggestionLine,
  buildSearchQueryHref,
  buildAllProvidersHref,
  buildSearchViewUrl,
  buildSpecialtyFacetHref,
  buildSpecialtyPillItems,
  coerceViewMode,
  deferEngineStateUpdate,
  findListingBySpecialtyValue,
  formatProviderCard,
  getAdditionalField,
  getProviderDetailPath,
  normalizeSpecialtyKey,
  orderSpecialtyValues,
  readQueryFromFragment,
  requestFirstRequestOnce,
  selectProviderImageUrl,
  selectRenderableFacets,
  splitLocationBadges,
} from "./mpgUtils";
import {
  MPG_ALL_PROVIDERS_LABEL,
  MPG_FACILITY_JOIN_LIMIT,
  MPG_LISTING_SUPPRESSED_FACET_IDS,
  MPG_LOCATION_BADGE_LIMIT,
  MPG_PROVIDER_CARD_FIELDS,
  MPG_PROVIDER_IMAGE_FIELDS,
  MPG_PROVIDERS_TITLE_SUFFIX,
  MPG_REFINEMENT_FACETS,
  MPG_SEARCH_BOX_ID,
  MPG_SPECIALTY_BUTTON_LIMIT,
  MPG_SPECIALTY_BUTTON_ORDER,
  MPG_SPECIALTY_LISTING_PAGES,
  MPG_VIEW_MODE_DEFAULT,
} from "../../config/MPGConfig";
// Imported under an explicit alias so the side-by-side shape assertion reads as a
// comparison and can never be mistaken for the listing helper being used by this module.
import { buildListingViewUrl as buildListingViewUrlForComparison } from "../SpecialtyListing/specialtyListingUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

const facetValue = (value: string) => ({ value, numberOfResults: 2 });

// Fixture shaped after a live Commerce API product from the HC - Provider Catalog source.
const davidKim = {
  ec_name: "Dr. David Kim",
  permanentid: "PROV-1006",
  additionalFields: {
    hc_specialties: ["Cardiology"],
    hc_languages: ["English", "Korean"],
    hc_locations: ["Downtown Medical Center", "Westside Specialty Center"],
  },
};

describe("orderSpecialtyValues", () => {
  it("puts configured specialties first and truncates to the limit", () => {
    const values = [
      facetValue("Neurology"),
      facetValue("Cardiology"),
      facetValue("Dermatology"),
      facetValue("Orthopedics"),
      facetValue("Primary Care"),
      facetValue("Sports Medicine"),
    ];

    const ordered = orderSpecialtyValues(
      values,
      MPG_SPECIALTY_BUTTON_ORDER,
      MPG_SPECIALTY_BUTTON_LIMIT,
    );

    expect(ordered.map((value) => value.value)).toEqual([
      "Cardiology",
      "Primary Care",
      "Orthopedics",
      "Dermatology",
      "Neurology",
    ]);
  });

  it("appends unconfigured values after the configured ones", () => {
    const values = [
      facetValue("Sports Medicine"),
      facetValue("Family Medicine"),
      facetValue("Cardiology"),
    ];

    const ordered = orderSpecialtyValues(
      values,
      MPG_SPECIALTY_BUTTON_ORDER,
      MPG_SPECIALTY_BUTTON_LIMIT,
    );

    expect(ordered.map((value) => value.value)).toEqual([
      "Cardiology",
      "Family Medicine",
      "Sports Medicine",
    ]);
  });

  it("handles a missing facet value list", () => {
    expect(
      orderSpecialtyValues(undefined, MPG_SPECIALTY_BUTTON_ORDER, 5),
    ).toEqual([]);
  });
});

describe("getAdditionalField", () => {
  it("normalises a single value to an array", () => {
    expect(
      getAdditionalField(
        { additionalFields: { hc_city: "Minneapolis" } },
        "hc_city",
      ),
    ).toEqual(["Minneapolis"]);
  });

  it("returns an empty array when additionalFields is missing", () => {
    expect(getAdditionalField({}, "hc_languages")).toEqual([]);
    expect(getAdditionalField(undefined, "hc_languages")).toEqual([]);
  });
});

describe("formatProviderCard", () => {
  it("renders the three card lines from a live provider payload", () => {
    const card = formatProviderCard(
      davidKim,
      MPG_PROVIDER_CARD_FIELDS as any,
      MPG_FACILITY_JOIN_LIMIT,
    );

    expect(card).toEqual({
      name: "Dr. David Kim",
      secondaryLine: "Cardiology · English, Korean",
      facilityLine: "Downtown Medical Center, Westside Specialty Center",
    });
  });

  it("caps the facility line at the configured limit", () => {
    const card = formatProviderCard(
      davidKim,
      MPG_PROVIDER_CARD_FIELDS as any,
      1,
    );

    expect(card.facilityLine).toBe("Downtown Medical Center");
  });

  it("produces empty lines instead of crashing when fields are absent", () => {
    const card = formatProviderCard(
      { ec_name: "Dr. Nobody" },
      MPG_PROVIDER_CARD_FIELDS as any,
      MPG_FACILITY_JOIN_LIMIT,
    );

    expect(card).toEqual({
      name: "Dr. Nobody",
      secondaryLine: "",
      facilityLine: "",
    });
  });
});

describe("getProviderDetailPath", () => {
  it("builds the detail href from the id field", () => {
    expect(getProviderDetailPath({ ec_product_id: "PROV-1001" })).toBe(
      "/providers/PROV-1001",
    );
  });

  it("encodes ids that are not url safe", () => {
    expect(getProviderDetailPath({ ec_product_id: "PROV 10/01" })).toBe(
      "/providers/PROV%2010%2F01",
    );
  });

  it("returns null when the id is missing so the card stays unwrapped", () => {
    expect(getProviderDetailPath({})).toBeNull();
    expect(getProviderDetailPath(undefined)).toBeNull();
    expect(getProviderDetailPath({ ec_product_id: "" })).toBeNull();
  });
});

describe("buildProvidersHeading", () => {
  it("falls back to the all-providers label with no selection", () => {
    expect(
      buildProvidersHeading(
        [],
        MPG_PROVIDERS_TITLE_SUFFIX,
        MPG_ALL_PROVIDERS_LABEL,
      ),
    ).toBe("All Providers");
  });

  it("names a single selected specialty", () => {
    expect(
      buildProvidersHeading(
        [facetValue("Cardiology")],
        MPG_PROVIDERS_TITLE_SUFFIX,
        MPG_ALL_PROVIDERS_LABEL,
      ),
    ).toBe("Cardiology providers");
  });

  it("comma-joins several selected specialties", () => {
    expect(
      buildProvidersHeading(
        [facetValue("Cardiology"), facetValue("Dermatology")],
        MPG_PROVIDERS_TITLE_SUFFIX,
        MPG_ALL_PROVIDERS_LABEL,
      ),
    ).toBe("Cardiology, Dermatology providers");
  });
});

describe("coerceViewMode", () => {
  it("accepts both supported modes", () => {
    expect(coerceViewMode("list", MPG_VIEW_MODE_DEFAULT)).toBe("list");
    expect(coerceViewMode("grid", MPG_VIEW_MODE_DEFAULT)).toBe("grid");
  });

  it("falls back on an unknown string", () => {
    expect(coerceViewMode("masonry", MPG_VIEW_MODE_DEFAULT)).toBe("list");
    expect(coerceViewMode("masonry", "grid")).toBe("grid");
  });

  it("falls back on a missing or non-string persisted value", () => {
    expect(coerceViewMode(null, MPG_VIEW_MODE_DEFAULT)).toBe("list");
    expect(coerceViewMode(undefined, MPG_VIEW_MODE_DEFAULT)).toBe("list");
    expect(coerceViewMode(3, MPG_VIEW_MODE_DEFAULT)).toBe("list");
    expect(coerceViewMode({ mode: "grid" }, MPG_VIEW_MODE_DEFAULT)).toBe(
      "list",
    );
  });

  it("defaults to list when the fallback itself is unusable", () => {
    expect(coerceViewMode(false, "nonsense")).toBe("list");
  });
});

describe("splitLocationBadges", () => {
  it("shows every location when there are no more than the limit", () => {
    expect(splitLocationBadges([], MPG_LOCATION_BADGE_LIMIT)).toEqual({
      visible: [],
      overflow: [],
      overflowCount: 0,
    });
    expect(splitLocationBadges(["A"], MPG_LOCATION_BADGE_LIMIT)).toEqual({
      visible: ["A"],
      overflow: [],
      overflowCount: 0,
    });
    expect(splitLocationBadges(["A", "B"], MPG_LOCATION_BADGE_LIMIT)).toEqual({
      visible: ["A", "B"],
      overflow: [],
      overflowCount: 0,
    });
  });

  it("collapses the rest once the limit is exceeded", () => {
    expect(
      splitLocationBadges(["A", "B", "C"], MPG_LOCATION_BADGE_LIMIT),
    ).toEqual({
      visible: ["A", "B"],
      overflow: ["C"],
      overflowCount: 1,
    });
    expect(
      splitLocationBadges(["A", "B", "C", "D"], MPG_LOCATION_BADGE_LIMIT),
    ).toEqual({
      visible: ["A", "B"],
      overflow: ["C", "D"],
      overflowCount: 2,
    });
  });

  it("overflows everything at a limit of zero or less", () => {
    expect(splitLocationBadges(["A", "B"], 0)).toEqual({
      visible: [],
      overflow: ["A", "B"],
      overflowCount: 2,
    });
    expect(splitLocationBadges(["A"], -3)).toEqual({
      visible: [],
      overflow: ["A"],
      overflowCount: 1,
    });
  });

  it("tolerates a missing or non-array location list", () => {
    expect(splitLocationBadges(undefined, MPG_LOCATION_BADGE_LIMIT)).toEqual({
      visible: [],
      overflow: [],
      overflowCount: 0,
    });
    expect(
      splitLocationBadges("Downtown" as any, MPG_LOCATION_BADGE_LIMIT),
    ).toEqual({ visible: [], overflow: [], overflowCount: 0 });
  });

  it("splits the live two-location provider at a limit of one", () => {
    const locations = getAdditionalField(
      davidKim,
      MPG_PROVIDER_CARD_FIELDS.facility,
    );
    expect(splitLocationBadges(locations, 1)).toEqual({
      visible: ["Downtown Medical Center"],
      overflow: ["Westside Specialty Center"],
      overflowCount: 1,
    });
  });
});

describe("selectProviderImageUrl", () => {
  const bothVariants = {
    ec_images: ["https://randomuser.me/api/portraits/women/44.jpg"],
    ec_thumbnails: ["https://randomuser.me/api/portraits/med/women/44.jpg"],
  };

  it("prefers the matching variant for each context", () => {
    expect(
      selectProviderImageUrl(bothVariants, MPG_PROVIDER_IMAGE_FIELDS, "large"),
    ).toBe("https://randomuser.me/api/portraits/women/44.jpg");
    expect(
      selectProviderImageUrl(bothVariants, MPG_PROVIDER_IMAGE_FIELDS, "small"),
    ).toBe("https://randomuser.me/api/portraits/med/women/44.jpg");
  });

  it("falls back to the other variant when the preferred one is missing", () => {
    expect(
      selectProviderImageUrl(
        { ec_thumbnails: ["https://example.com/med.jpg"] },
        MPG_PROVIDER_IMAGE_FIELDS,
        "large",
      ),
    ).toBe("https://example.com/med.jpg");
    expect(
      selectProviderImageUrl(
        { ec_images: ["https://example.com/full.jpg"] },
        MPG_PROVIDER_IMAGE_FIELDS,
        "small",
      ),
    ).toBe("https://example.com/full.jpg");
  });

  it("returns null when neither variant is indexed", () => {
    expect(
      selectProviderImageUrl(davidKim, MPG_PROVIDER_IMAGE_FIELDS, "large"),
    ).toBeNull();
    expect(
      selectProviderImageUrl(undefined, MPG_PROVIDER_IMAGE_FIELDS, "small"),
    ).toBeNull();
  });

  it("accepts a scalar instead of an array", () => {
    expect(
      selectProviderImageUrl(
        { ec_images: "https://example.com/scalar.jpg" },
        MPG_PROVIDER_IMAGE_FIELDS,
        "large",
      ),
    ).toBe("https://example.com/scalar.jpg");
  });

  it("ignores whitespace-only urls and trims the one it keeps", () => {
    expect(
      selectProviderImageUrl(
        { ec_images: ["   "], ec_thumbnails: ["  https://example.com/t.jpg "] },
        MPG_PROVIDER_IMAGE_FIELDS,
        "large",
      ),
    ).toBe("https://example.com/t.jpg");
  });
});

describe("buildProviderSuggestionLine", () => {
  it("dot-joins the specialties", () => {
    expect(
      buildProviderSuggestionLine(
        {
          additionalFields: {
            hc_specialties: ["Cardiology", "Preventive Cardiology"],
          },
        },
        MPG_PROVIDER_CARD_FIELDS.specialties,
      ),
    ).toBe("Cardiology · Preventive Cardiology");
  });

  it("renders a single specialty without a separator", () => {
    expect(
      buildProviderSuggestionLine(
        davidKim,
        MPG_PROVIDER_CARD_FIELDS.specialties,
      ),
    ).toBe("Cardiology");
  });

  it("returns an empty line when the provider has no specialties", () => {
    expect(
      buildProviderSuggestionLine({}, MPG_PROVIDER_CARD_FIELDS.specialties),
    ).toBe("");
  });
});

// A generated facet controller as facetGenerator.facets mints them.
const facetController = (facetId: string, valueCount: number = 2) => ({
  state: {
    facetId,
    displayName: `Hub ${facetId}`,
    values: Array.from({ length: valueCount }, (_, index) => ({
      value: `${facetId}-${index}`,
    })),
  },
});

describe("selectRenderableFacets", () => {
  // Hub order deliberately differs from the allow-list order, so the two modes are
  // distinguishable. hc_services has no config entry; hc_city came back empty.
  const hubFacets = [
    facetController("hc_locations"),
    facetController("hc_specialties"),
    facetController("hc_services"),
    facetController("hc_telehealth"),
    facetController("hc_city", 0),
  ];

  it("keeps Hub order and labels only configured facets when there is no allow-list", () => {
    // T-14 — a listing page honours the Hub's facet configuration and order.
    const renderable = selectRenderableFacets(hubFacets, null, {
      labelOverrides: MPG_REFINEMENT_FACETS,
    });

    expect(renderable.map((entry) => entry.facetId)).toEqual([
      "hc_locations",
      "hc_specialties",
      "hc_services",
      "hc_telehealth",
    ]);
    expect(renderable.map((entry) => entry.labelToken)).toEqual([
      "Location",
      "Specialty",
      undefined,
      "Telehealth",
    ]);
    // The helper resolves no translations; it hands back the config token only.
    expect(renderable[0].facet).toBe(hubFacets[0]);
  });

  it("uses allow-list order for the search page", () => {
    // T-15 — today's /mpg behaviour, unchanged.
    const renderable = selectRenderableFacets(hubFacets, MPG_REFINEMENT_FACETS);

    expect(renderable.map((entry) => entry.facetId)).toEqual([
      "hc_specialties",
      "hc_locations",
      "hc_telehealth",
    ]);
    expect(renderable.map((entry) => entry.labelToken)).toEqual([
      "Specialty",
      "Location",
      "Telehealth",
    ]);
  });

  it("tolerates a missing, empty or malformed facet list", () => {
    // T-16
    expect(selectRenderableFacets(undefined, null)).toEqual([]);
    expect(selectRenderableFacets([], null)).toEqual([]);
    expect(selectRenderableFacets([{}], null)).toEqual([]);
    expect(selectRenderableFacets([{}], MPG_REFINEMENT_FACETS)).toEqual([]);
  });

  it("drops suppressed facet ids in both modes", () => {
    // T-16b — the specialty facet is redundant on a page that IS that specialty. This is
    // a rendering rule driven by config, never a hardcoded facet-id check.
    const options = { suppressedFacetIds: MPG_LISTING_SUPPRESSED_FACET_IDS };

    const hubOrder = selectRenderableFacets(hubFacets, null, options);
    expect(hubOrder.map((entry) => entry.facetId)).toEqual([
      "hc_locations",
      "hc_services",
      "hc_telehealth",
    ]);

    const allowListOrder = selectRenderableFacets(
      hubFacets,
      MPG_REFINEMENT_FACETS,
      options,
    );
    expect(allowListOrder.map((entry) => entry.facetId)).toEqual([
      "hc_locations",
      "hc_telehealth",
    ]);
  });
});

describe("buildSpecialtyPillItems", () => {
  const responseValues = [
    { value: "Cardiology" },
    { value: "Orthopedics" },
    { value: "Primary Care" },
  ];

  it("links configured pages first and sends unconfigured values to the search page", () => {
    // T-17 — a listing page: every pill navigates, so nothing filters in place.
    const items = buildSpecialtyPillItems({
      facetValues: responseValues,
      pages: MPG_SPECIALTY_LISTING_PAGES,
      currentSlug: "cardiology",
      unconfiguredValues: "searchLink",
    });

    expect(items).toEqual([
      {
        kind: "link",
        label: "Cardiology",
        href: "/specialty/cardiology",
        isCurrent: true,
      },
      {
        kind: "link",
        label: "Orthopedics",
        href: "/specialty/orthopedics",
        isCurrent: false,
      },
      {
        kind: "link",
        label: "Primary Care",
        href: "/mpg#f-hc_specialties=Primary%20Care",
        isCurrent: false,
      },
    ]);
  });

  it("keeps the facet-filter behaviour for unconfigured values on the search page", () => {
    // T-18 — a specialty with no listing page still filters /mpg, with no code change.
    const items = buildSpecialtyPillItems({
      facetValues: responseValues,
      pages: MPG_SPECIALTY_LISTING_PAGES,
      currentSlug: null,
      unconfiguredValues: "toggle",
    });

    expect(items.slice(0, 2)).toEqual([
      {
        kind: "link",
        label: "Cardiology",
        href: "/specialty/cardiology",
        isCurrent: false,
      },
      {
        kind: "link",
        label: "Orthopedics",
        href: "/specialty/orthopedics",
        isCurrent: false,
      },
    ]);
    expect(items[2]).toEqual({
      kind: "toggle",
      label: "Primary Care",
      facetValue: responseValues[2],
    });
  });

  it("preserves configured baseline specialties when response values are unavailable", () => {
    const items = buildSpecialtyPillItems({
      facetValues: [{ value: "Neurology" }],
      baselineValues: MPG_SPECIALTY_BUTTON_ORDER,
      pages: MPG_SPECIALTY_LISTING_PAGES,
      currentSlug: null,
      unconfiguredValues: "toggle",
    });

    expect(items.map((item) => item.label)).toEqual([
      "Cardiology",
      "Orthopedics",
      "Primary Care",
      "Dermatology",
      "Neurology",
    ]);
    expect(items.filter((item) => item.kind === "toggle")).toEqual([
      {
        kind: "toggle",
        label: "Primary Care",
        facetValue: { value: "Primary Care" },
      },
      {
        kind: "toggle",
        label: "Dermatology",
        facetValue: { value: "Dermatology" },
      },
      {
        kind: "toggle",
        label: "Neurology",
        facetValue: { value: "Neurology" },
      },
    ]);
  });

  it("renders the configured links before any response arrives", () => {
    // T-19 — never the fallback specialty list, and never an "All Providers" pill: the
    // component appends that, because its behaviour differs per page type.
    [undefined, []].forEach((facetValues) => {
      const items = buildSpecialtyPillItems({
        facetValues,
        pages: MPG_SPECIALTY_LISTING_PAGES,
        currentSlug: "nope",
        unconfiguredValues: "toggle",
      });
      expect(items).toHaveLength(MPG_SPECIALTY_LISTING_PAGES.length);
      expect(items.every((item) => item.kind === "link")).toBe(true);
      expect(
        items.every((item) => item.kind === "link" && item.isCurrent === false),
      ).toBe(true);
      expect(items.some((item) => item.label === MPG_ALL_PROVIDERS_LABEL)).toBe(
        false,
      );
    });
  });
});

describe("normalizeSpecialtyKey", () => {
  it("tolerates spacing, casing and punctuation", () => {
    // T-20a
    expect(normalizeSpecialtyKey("Cardiology")).toBe("cardiology");
    expect(normalizeSpecialtyKey("Primary Care")).toBe("primary-care");
    expect(normalizeSpecialtyKey(" ORTHOPEDICS ")).toBe("orthopedics");
    expect(normalizeSpecialtyKey("Ear, Nose & Throat")).toBe("ear-nose-throat");
    expect(normalizeSpecialtyKey("a__b")).toBe("a-b");
    expect(normalizeSpecialtyKey(null)).toBe("");
    expect(normalizeSpecialtyKey(undefined)).toBe("");
    expect(normalizeSpecialtyKey(123)).toBe("123");
  });
});

describe("findListingBySpecialtyValue", () => {
  it("returns null for a specialty with no listing page", () => {
    // T-20b — a null return is the signal to keep the /mpg facet filter.
    const pages = MPG_SPECIALTY_LISTING_PAGES;
    expect(findListingBySpecialtyValue("Cardiology", pages)?.slug).toBe(
      "cardiology",
    );
    expect(findListingBySpecialtyValue("cardiology", pages)?.slug).toBe(
      "cardiology",
    );
    expect(findListingBySpecialtyValue("Primary Care", pages)).toBeNull();
    expect(findListingBySpecialtyValue(null, pages)).toBeNull();
  });
});

describe("buildListingPath", () => {
  it("builds the route path from the slug", () => {
    // T-20c
    expect(buildListingPath({ slug: "cardiology" } as any)).toBe(
      "/specialty/cardiology",
    );
  });
});

describe("buildSearchQueryHref", () => {
  it("encodes the query and omits the fragment when blank", () => {
    // T-21a
    expect(buildSearchQueryHref("cardio")).toBe("/mpg#q=cardio");
    expect(buildSearchQueryHref("dr. kim")).toBe("/mpg#q=dr.%20kim");
    expect(buildSearchQueryHref("a&b=c")).toBe("/mpg#q=a%26b%3Dc");
    expect(buildSearchQueryHref("  ")).toBe("/mpg");
  });
});

describe("buildSpecialtyFacetHref", () => {
  it("matches the commerce serializer's facet format", () => {
    // T-21b
    expect(buildSpecialtyFacetHref("Primary Care")).toBe(
      "/mpg#f-hc_specialties=Primary%20Care",
    );
  });
});

describe("buildAllProvidersHref", () => {
  it("removes only specialty selections", () => {
    expect(
      buildAllProvidersHref(
        "q=neurologist&f-hc_specialties=Neurology&f-hc_locations=Boston&page=2",
      ),
    ).toBe("/mpg#q=neurologist&f-hc_locations=Boston&page=2");
    expect(buildAllProvidersHref("f-hc_specialties=Neurology")).toBe("/mpg");
  });
});

describe("readQueryFromFragment", () => {
  it("decodes the q parameter and defaults to an empty string", () => {
    // T-22a — the input to the search page's explicit querySet write.
    expect(readQueryFromFragment("q=cardio")).toBe("cardio");
    expect(
      readQueryFromFragment("f-hc_specialties=Cardiology&q=dr.%20kim"),
    ).toBe("dr. kim");
    expect(readQueryFromFragment("f-hc_locations=Boston")).toBe("");
    expect(readQueryFromFragment("q")).toBe("");
    expect(readQueryFromFragment("")).toBe("");
    expect(readQueryFromFragment(undefined)).toBe("");
  });
});

describe("requestFirstRequestOnce", () => {
  it("runs once per view url and again when the page changes", () => {
    // T-22b — keyed on the view url, so a specialty-to-specialty transition refetches
    // even when React reuses the component instance.
    const ref: { current: string | null } = { current: null };
    const calls: string[] = [];

    expect(
      requestFirstRequestOnce(ref, "cardiology", () =>
        calls.push("cardiology"),
      ),
    ).toBe(true);
    expect(
      requestFirstRequestOnce(ref, "cardiology", () =>
        calls.push("cardiology"),
      ),
    ).toBe(false);
    expect(
      requestFirstRequestOnce(ref, "orthopedics", () =>
        calls.push("orthopedics"),
      ),
    ).toBe(true);
    expect(calls).toEqual(["cardiology", "orthopedics"]);
  });
});

describe("deferEngineStateUpdate", () => {
  it("does not run the update while the subscriber is being notified", () => {
    // T-43 — the subscriber returns before the state update happens, which is what keeps
    // a notification raised during another component's render out of that render pass.
    const updates: number[] = [];
    const scheduled: Array<() => void> = [];
    const notify = deferEngineStateUpdate(
      () => updates.push(1),
      (callback) => scheduled.push(callback),
    );

    notify();

    expect(updates).toEqual([]);
    expect(scheduled).toHaveLength(1);

    scheduled.forEach((callback) => callback());
    expect(updates).toEqual([1]);
  });

  it("defers one update per notification", () => {
    // T-44 — deferring must not collapse notifications: each engine update still forces
    // one re-read of facetGenerator.facets.
    const updates: number[] = [];
    const scheduled: Array<() => void> = [];
    const notify = deferEngineStateUpdate(
      () => updates.push(updates.length + 1),
      (callback) => scheduled.push(callback),
    );

    notify();
    notify();
    notify();
    expect(updates).toEqual([]);

    scheduled.forEach((callback) => callback());
    expect(updates).toEqual([1, 2, 3]);
  });

  it("keeps a setView dispatched during the incoming page's render out of that render", () => {
    // T-45 — the /mpg -> /specialty/<slug> transition that previously logged
    // "Cannot update a component (`MPGPageRenderer`) while rendering a different
    // component (`ProviderListingPageRenderer`)". The outgoing page's subscriptions are
    // still attached when the incoming page dispatches setView during render, because
    // React has not run their effect cleanup yet.
    const events: string[] = [];
    const scheduled: Array<() => void> = [];
    const subscribers: Array<() => void> = [];

    // The outgoing search page: two subscriptions, both deferred.
    const bump = deferEngineStateUpdate(
      () => events.push("outgoing-page-setState"),
      (callback) => scheduled.push(callback),
    );
    subscribers.push(bump, bump);

    // The incoming listing page's render: dispatching setView notifies synchronously.
    events.push("incoming-render-start");
    subscribers.forEach((subscriber) => subscriber());
    events.push("incoming-render-end");

    // Nothing updated between the two render markers.
    expect(events).toEqual(["incoming-render-start", "incoming-render-end"]);

    // Then the commit runs the microtasks.
    scheduled.forEach((callback) => callback());
    expect(events).toEqual([
      "incoming-render-start",
      "incoming-render-end",
      "outgoing-page-setState",
      "outgoing-page-setState",
    ]);
  });

  it("defaults to queueMicrotask, so the update lands in the same tick", async () => {
    // T-46 — no explicit scheduler is passed at either call site, and the default must
    // not delay past the current tick: a timer would paint a stale frame.
    const updates: string[] = [];
    const notify = deferEngineStateUpdate(() => updates.push("applied"));

    notify();
    expect(updates).toEqual([]);

    await Promise.resolve();
    expect(updates).toEqual(["applied"]);
  });
});

describe("bootstrapSearchPage", () => {
  /**
   * Records dispatches and controller calls into ONE ordered array, so a single
   * assertion expresses the whole sequence. No React, no module mocking.
   */
  const createFakeEngine = (urlManagerBehaviour?: (props: any) => void) => {
    const calls: string[] = [];
    const payloads: any[] = [];

    const engine = {
      dispatch: (action: any) => {
        calls.push(action?.type ?? "unknown");
        payloads.push(action);
        return action;
      },
      addReducers: () => {},
      logger: { error: () => {} },
    };

    const deps = {
      setView: (payload: { url: string }) => ({
        type: "commerce/context/setView",
        payload,
      }),
      updateQuerySetQuery: (payload: { id: string; query: string }) => ({
        type: "commerce/querySet/update",
        payload,
      }),
      buildSearch: () => {
        calls.push("buildSearch");
        return {
          facetGenerator: () => {
            calls.push("facetGenerator");
            return {};
          },
          urlManager: (props: any) => {
            calls.push("urlManager");
            payloads.push(props);
            if (urlManagerBehaviour) urlManagerBehaviour(props);
            return {};
          },
        };
      },
      buildSearchBox: () => {
        calls.push("buildSearchBox");
        return {};
      },
    };

    return { engine, calls, payloads, deps };
  };

  it("resets the view, restores, registers the box, then states its visible text", () => {
    // T-24 — the position matters twice: setView before the restore, and the querySet
    // write after registration, because updateQuerySetQuery is a no-op for an
    // unregistered id.
    const { engine, calls, deps } = createFakeEngine();
    bootstrapSearchPage(
      engine,
      "http://localhost:5173/search/mpg",
      "",
      MPG_SEARCH_BOX_ID,
      deps,
    );
    expect(calls).toEqual([
      "commerce/context/setView",
      "buildSearch",
      "facetGenerator",
      "urlManager",
      "buildSearchBox",
      "commerce/querySet/update",
    ]);
  });

  it("empties the input on a bare fragment", () => {
    // T-25 — the symmetric half of the query-state fix: a bare /mpg states "" rather
    // than inheriting the previous search's text from the shared querySet slice.
    const { engine, payloads, deps } = createFakeEngine();
    bootstrapSearchPage(
      engine,
      "http://localhost:5173/search/mpg",
      "",
      MPG_SEARCH_BOX_ID,
      deps,
    );
    const querySetWrite = payloads.find(
      (entry) => entry?.type === "commerce/querySet/update",
    );
    expect(querySetWrite.payload).toEqual({
      id: "mpg-search-box",
      query: "",
    });
  });

  it("restores the fragment's query into the input", () => {
    // T-26
    const { engine, payloads, deps } = createFakeEngine();
    bootstrapSearchPage(
      engine,
      "http://localhost:5173/search/mpg",
      "q=cardio&f-hc_specialties=Cardiology",
      MPG_SEARCH_BOX_ID,
      deps,
    );
    const querySetWrite = payloads.find(
      (entry) => entry?.type === "commerce/querySet/update",
    );
    expect(querySetWrite.payload).toEqual({
      id: "mpg-search-box",
      query: "cardio",
    });
  });

  it("recovers from a fragment whose validation throws", () => {
    // T-27 (search half) — /mpg#page=abc must load the page, not blank the app.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { engine, deps } = createFakeEngine((props) => {
      if (/page=(abc|-1)|perPage=0/.test(props?.initialState?.fragment ?? "")) {
        throw new Error("SchemaValidationError");
      }
    });

    ["page=abc", "page=-1", "perPage=0"].forEach((fragment) => {
      warn.mockClear();
      const result = bootstrapSearchPageSafely(
        engine,
        "http://localhost:5173/search/mpg",
        fragment,
        MPG_SEARCH_BOX_ID,
        deps,
      );
      expect(result.fragmentUsed).toBe("");
      expect(result.searchBox).toBeDefined();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});

// -----------------------  Phase 0: search view url  -----------------------

describe("buildSearchViewUrl", () => {
  it("builds the search view url from the injected runtime origin", () => {
    // Behavior 1 — the reported url follows the browser, not VITE_COMMERCE_ENGINE_URL.
    // The defect this replaces reported "http://localhost:5173/search/mpg" everywhere.
    const cases: Array<[string, string]> = [
      ["http://localhost:8888", "http://localhost:8888/mpg"],
      ["http://localhost:5173", "http://localhost:5173/mpg"],
      ["https://demo.example.com", "https://demo.example.com/mpg"],
    ];
    cases.forEach(([origin, expected]) => {
      const url = buildSearchViewUrl("/mpg", origin);
      expect(url).toBe(expected);
      // The spurious /search segment the env variable contributed must be gone.
      expect(url).not.toContain("/search");
    });
  });

  it("names the page's own route and never the live pathname", () => {
    // Behavior 2 — the path comes from the caller's route constant, normalised, so a
    // subscriber firing mid-navigation cannot retarget the value.
    expect(buildSearchViewUrl("mpg", "https://x.test")).toBe(
      "https://x.test/mpg",
    );
    expect(buildSearchViewUrl("/mpg", "https://x.test")).toBe(
      "https://x.test/mpg",
    );
    expect(buildSearchViewUrl("/mpg/", "https://x.test")).toBe(
      "https://x.test/mpg",
    );
    expect(buildSearchViewUrl("/mpg//", "https://x.test")).toBe(
      "https://x.test/mpg",
    );
    // A trailing slash on the origin is not doubled either.
    expect(buildSearchViewUrl("/mpg", "https://x.test/")).toBe(
      "https://x.test/mpg",
    );

    // Standing on a provider detail route, the default-origin call still names /mpg.
    window.history.replaceState(null, "", "/providers/PROV-1006");
    expect(buildSearchViewUrl("/mpg")).toBe(`${window.location.origin}/mpg`);
    expect(buildSearchViewUrl("/mpg")).not.toContain("PROV-1006");
    window.history.replaceState(null, "", "/mpg");
  });

  it("reflects a changed origin and never caches one", () => {
    // Behavior 3 — nothing is memoised at module scope, and the default parameter is
    // evaluated per call, so a new origin is picked up immediately.
    expect(buildSearchViewUrl("/mpg", "http://localhost:5173")).toBe(
      "http://localhost:5173/mpg",
    );
    expect(buildSearchViewUrl("/mpg", "http://localhost:8888")).toBe(
      "http://localhost:8888/mpg",
    );

    const realWindow = globalThis.window;
    try {
      vi.stubGlobal("window", { location: { origin: "https://first.test" } });
      expect(buildSearchViewUrl("/mpg")).toBe("https://first.test/mpg");
      vi.stubGlobal("window", { location: { origin: "https://second.test" } });
      expect(buildSearchViewUrl("/mpg")).toBe("https://second.test/mpg");
    } finally {
      vi.stubGlobal("window", realWindow);
    }
  });

  it("degrades to a bare path rather than emitting an undefined origin", () => {
    // A non-browser caller (SSR, a node test) must not produce "undefined/mpg".
    expect(buildSearchViewUrl("/mpg", "")).toBe("/mpg");
    expect(buildSearchViewUrl("/mpg", "   ")).toBe("/mpg");
    expect(buildSearchViewUrl("/mpg", undefined as any)).toBe(
      `${window.location.origin}/mpg`,
    );
    expect(buildSearchViewUrl("", "https://x.test")).toBe("https://x.test/");
  });

  it("documents that search is absolute and listing is relative", () => {
    // Behavior 6b — the two shapes are pinned side by side, so a future attempt to
    // "unify" them fails here with the reason in the test name: an absolute listing url
    // returns 404 LISTING_CONFIGURATION_DOES_NOT_EXIST for healthcare_cpd_demo.
    expect(buildSearchViewUrl("/mpg", "http://localhost:5173")).toBe(
      "http://localhost:5173/mpg",
    );
    expect(buildListingViewUrlForComparison("/specialty/cardiology")).toBe(
      "/specialty/cardiology",
    );
  });
});

describe("search view url stability (no extra Commerce requests)", () => {
  const createRecordingEngine = () => {
    const calls: string[] = [];
    const payloads: any[] = [];
    const engine = {
      dispatch: (action: any) => {
        calls.push(action?.type ?? "unknown");
        payloads.push(action);
        return action;
      },
      addReducers: () => {},
      logger: { error: () => {} },
    };
    const deps = {
      setView: (payload: { url: string }) => ({
        type: "commerce/context/setView",
        payload,
      }),
      updateQuerySetQuery: (payload: { id: string; query: string }) => ({
        type: "commerce/querySet/update",
        payload,
      }),
      buildSearch: () => ({
        facetGenerator: () => ({}),
        urlManager: () => ({}),
      }),
      buildSearchBox: () => ({}),
    };
    return { engine, calls, payloads, deps };
  };

  it("dispatches setView once and executes one first search for a stable search view url", () => {
    // Behavior 10 (search half). The bootstrap useMemo and the first-request effect are
    // both keyed on the view url, so the helper's output must be byte-identical across
    // re-renders. Repeated calls with the same origin therefore yield exactly one first
    // search; only a real route or origin change yields a second.
    const origin = "http://localhost:8888";
    const viewUrl = buildSearchViewUrl("/mpg", origin);
    expect(buildSearchViewUrl("/mpg", origin)).toBe(viewUrl);

    const { engine, payloads, deps } = createRecordingEngine();
    bootstrapSearchPageSafely(engine, viewUrl, "", MPG_SEARCH_BOX_ID, deps);
    const setViewWrites = payloads.filter(
      (entry) => entry?.type === "commerce/context/setView",
    );
    expect(setViewWrites).toHaveLength(1);
    expect(setViewWrites[0].payload).toEqual({
      url: "http://localhost:8888/mpg",
    });

    const firstRequestKey = { current: null as string | null };
    const executeFirstSearch = vi.fn();
    // Three effect runs for the same page: one request.
    requestFirstRequestOnce(firstRequestKey, viewUrl, executeFirstSearch);
    requestFirstRequestOnce(
      firstRequestKey,
      buildSearchViewUrl("/mpg", origin),
      executeFirstSearch,
    );
    requestFirstRequestOnce(
      firstRequestKey,
      buildSearchViewUrl("/mpg", origin),
      executeFirstSearch,
    );
    expect(executeFirstSearch).toHaveBeenCalledTimes(1);

    // A real change — a different origin, then a different route — refetches once each.
    requestFirstRequestOnce(
      firstRequestKey,
      buildSearchViewUrl("/mpg", "https://demo.example.com"),
      executeFirstSearch,
    );
    expect(executeFirstSearch).toHaveBeenCalledTimes(2);
    requestFirstRequestOnce(
      firstRequestKey,
      buildSearchViewUrl("/providers/PROV-1006", "https://demo.example.com"),
      executeFirstSearch,
    );
    expect(executeFirstSearch).toHaveBeenCalledTimes(3);
  });

  it("is unaffected by the location hash the url manager rewrites", () => {
    // Behavior 10 — the search hash changes on every facet, sort and page change. The
    // view url must not, or each refinement would re-bootstrap the page.
    window.history.replaceState(
      null,
      "",
      "/mpg#q=cardio&f-hc_specialties=Cardiology",
    );
    const withHash = buildSearchViewUrl("/mpg");
    window.history.replaceState(null, "", "/mpg#page=2&sortCriteria=relevance");
    const withOtherHash = buildSearchViewUrl("/mpg");
    window.history.replaceState(null, "", "/mpg");
    expect(withHash).toBe(withOtherHash);
    expect(withHash).not.toContain("#");
    expect(withHash).not.toContain("?");
    expect(withHash).not.toContain("cardio");
  });
});

describe("catalog data is reported, never substituted", () => {
  it("never invents a price or a provider field that the catalog did not supply", () => {
    // Behavior 12 (helper half). A provider record with no price and no hc_* fields must
    // yield empty values — never 0, "0", "$0" or a placeholder. Phase 0 deliberately adds
    // no frontend price fallback: the missing numeric ec_price is a catalog defect and is
    // reported as such (see workstream-b-notes.md), not concealed here.
    const bare = { ec_product_id: "PROV-1006", ec_name: "Dr. David Kim" };

    expect(getAdditionalField(bare, "hc_specialties")).toEqual([]);
    expect(getAdditionalField(bare, "hc_locations")).toEqual([]);
    expect(getAdditionalField(bare, "hc_accepting_patients")).toEqual([]);

    const card = formatProviderCard(
      bare,
      MPG_PROVIDER_CARD_FIELDS as any,
      MPG_FACILITY_JOIN_LIMIT,
    );
    expect(card.name).toBe("Dr. David Kim");
    expect(card.secondaryLine).toBe("");
    expect(card.facilityLine).toBe("");
    const serialized = JSON.stringify(card);
    expect(serialized).not.toContain("$");
    expect(serialized).not.toMatch(/\b0\b/);
    expect(serialized.toLowerCase()).not.toContain("price");
    expect(serialized.toLowerCase()).not.toContain("free");

    // No helper in this module manufactures a price field of any kind.
    expect(Object.keys(card)).toEqual([
      "name",
      "secondaryLine",
      "facilityLine",
    ]);
  });
});
