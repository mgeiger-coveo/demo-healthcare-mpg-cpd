import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  bootstrapProductListing,
  bootstrapProductListingSafely,
  buildHistoryUrl,
  buildListingHeading,
  buildListingViewUrl,
  classifyListingState,
  findListingBySlug,
  isSameRoutePath,
  shouldResyncListingAfterForeignSearch,
  shouldSynchronizeFragment,
  stripQueryFromFragment,
} from "./specialtyListingUtils";
import { MPG_SPECIALTY_LISTING_PAGES } from "../../config/MPGConfig";
import {
  buildListingPath,
  buildSearchViewUrl,
  requestFirstRequestOnce,
} from "../MPG/mpgUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

// A healthy state for classifyListingState, so each test varies exactly one signal.
const listingState = (overrides: Record<string, any> = {}) => ({
  firstRequestExecuted: true,
  isLoading: false,
  hasError: false,
  productCount: 2,
  facetCount: 5,
  hasActiveFilters: false,
  ...overrides,
});

/**
 * Records every dispatch and every controller call into ONE ordered array, so a single
 * assertion expresses the whole bootstrap sequence. No React, no module mocking.
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

  const setView = (payload: { url: string }) => ({
    type: "commerce/context/setView",
    payload,
  });

  const buildProductListing = () => {
    calls.push("buildProductListing");
    return {
      facetGenerator: () => {
        calls.push("facetGenerator");
        return {};
      },
      summary: () => {
        calls.push("summary");
        return {};
      },
      breadcrumbManager: () => {
        calls.push("breadcrumbManager");
        return {};
      },
      urlManager: (props: any) => {
        calls.push("urlManager");
        payloads.push(props);
        if (urlManagerBehaviour) urlManagerBehaviour(props);
        return {};
      },
    };
  };

  return { engine, calls, payloads, deps: { setView, buildProductListing } };
};

describe("buildListingViewUrl", () => {
  it("sends the route path only, with no origin", () => {
    // T-01 — the Hub for this org stores relative listing urls. Live evidence: a view url
    // of "http://localhost:5173/specialty/cardiology" returned
    // 404 LISTING_CONFIGURATION_DOES_NOT_EXIST, while "/specialty/cardiology" returned
    // 200 with PROV-1001 and PROV-1006.
    expect(buildListingViewUrl("/specialty/cardiology")).toBe(
      "/specialty/cardiology",
    );
  });

  it("adds the leading slash exactly once", () => {
    // T-02
    expect(buildListingViewUrl("specialty/orthopedics")).toBe(
      "/specialty/orthopedics",
    );
    expect(buildListingViewUrl("/specialty/orthopedics")).toBe(
      "/specialty/orthopedics",
    );
  });

  it("drops a trailing slash, which the Hub does not match", () => {
    // T-03 — live: "/specialty/cardiology/" returns 404 where "/specialty/cardiology"
    // returns 200.
    expect(buildListingViewUrl("/specialty/cardiology/")).toBe(
      "/specialty/cardiology",
    );
    expect(buildListingViewUrl("/specialty/cardiology//")).toBe(
      "/specialty/cardiology",
    );
  });

  it("never produces a fully qualified url for any configured listing", () => {
    // T-03b — the regression test for the live 404. Every configured specialty route
    // must send a relative path: no scheme, no host, no VITE_COMMERCE_ENGINE_URL origin.
    expect(MPG_SPECIALTY_LISTING_PAGES.length).toBeGreaterThan(0);
    MPG_SPECIALTY_LISTING_PAGES.forEach((entry) => {
      const viewUrl = buildListingViewUrl(buildListingPath(entry));
      expect(viewUrl).toBe(`/specialty/${entry.slug}`);
      expect(viewUrl.startsWith("/")).toBe(true);
      expect(/^[a-z]+:\/\//i.test(viewUrl)).toBe(false);
      expect(viewUrl).not.toContain("localhost");
      expect(viewUrl).not.toContain("//");
    });
  });

  it("sends the relative view url through the bootstrap for both routes", () => {
    // T-03c — the same guarantee one level up, at the only place the listing view url
    // reaches the engine: the setView payload bootstrapProductListing dispatches.
    MPG_SPECIALTY_LISTING_PAGES.forEach((entry) => {
      const { engine, payloads, deps } = createFakeEngine();
      bootstrapProductListing(
        engine,
        buildListingViewUrl(buildListingPath(entry)),
        "",
        deps,
      );
      const setViewAction = payloads.find(
        (payload) => payload?.type === "commerce/context/setView",
      );
      expect(setViewAction.payload.url).toBe(`/specialty/${entry.slug}`);
    });
  });
});

describe("findListingBySlug", () => {
  it("resolves a slug regardless of casing and surrounding space", () => {
    // T-04
    const pages = MPG_SPECIALTY_LISTING_PAGES;
    expect(findListingBySlug("cardiology", pages)?.slug).toBe("cardiology");
    expect(findListingBySlug("Cardiology", pages)?.slug).toBe("cardiology");
    expect(findListingBySlug("CARDIOLOGY", pages)?.slug).toBe("cardiology");
    expect(findListingBySlug(" cardiology ", pages)?.slug).toBe("cardiology");
    // An unconfigured specialty and an empty slug both mean "no listing page".
    expect(findListingBySlug("primary-care", pages)).toBeNull();
    expect(findListingBySlug("", pages)).toBeNull();
  });
});

describe("buildHistoryUrl", () => {
  it("appends a fragment and never writes a bare hash", () => {
    // T-05
    expect(
      buildHistoryUrl("/specialty/cardiology", "f-hc_locations=Boston"),
    ).toBe("/specialty/cardiology#f-hc_locations=Boston");
    expect(buildHistoryUrl("/specialty/cardiology", "")).toBe(
      "/specialty/cardiology",
    );
  });
});

describe("stripQueryFromFragment", () => {
  it("drops only a real q pair", () => {
    // T-06
    expect(stripQueryFromFragment("q=foo")).toBe("");
    expect(stripQueryFromFragment("q=foo&f-hc_specialties=Cardiology")).toBe(
      "f-hc_specialties=Cardiology",
    );
    expect(stripQueryFromFragment("f-hc_locations=Boston")).toBe(
      "f-hc_locations=Boston",
    );
    expect(stripQueryFromFragment("q")).toBe("");
    // A key that merely starts with q survives.
    expect(stripQueryFromFragment("qq=1")).toBe("qq=1");
    expect(stripQueryFromFragment("")).toBe("");
    expect(stripQueryFromFragment(undefined)).toBe("");
  });
});

describe("isSameRoutePath", () => {
  it("gates a url-manager write to the page that owns the route", () => {
    // T-41 — the writer-side half of the guard. A specialty-to-specialty transition
    // notifies the OUTGOING url manager after the router has already pushed the new
    // route, so a write that is not gated on the page's own path puts the address bar on
    // the previous specialty while the new one renders.
    expect(
      isSameRoutePath("/specialty/cardiology", "/specialty/cardiology"),
    ).toBe(true);
    expect(
      isSameRoutePath("/specialty/orthopedics", "/specialty/cardiology"),
    ).toBe(false);
    // The /mpg writer stamping its parameter hash onto a listing route is the same bug
    // in the other direction.
    expect(isSameRoutePath("/specialty/cardiology", "/mpg")).toBe(false);
  });

  it("treats a trailing slash as the same route and tolerates missing values", () => {
    // T-42 — React Router matches /specialty/cardiology/ to the same route.
    expect(
      isSameRoutePath("/specialty/cardiology/", "/specialty/cardiology"),
    ).toBe(true);
    expect(isSameRoutePath("/mpg", "/mpg/")).toBe(true);
    expect(isSameRoutePath("/", "/")).toBe(true);
    expect(isSameRoutePath(undefined, "/mpg")).toBe(false);
  });
});

describe("shouldSynchronizeFragment", () => {
  it("synchronizes a new fragment on the same path", () => {
    // T-07
    expect(
      shouldSynchronizeFragment({
        currentPathname: "/specialty/cardiology",
        listingPath: "/specialty/cardiology",
        fragment: "f-hc_locations=Boston",
        lastSynchronized: "",
      }),
    ).toBe(true);
  });

  it("ignores an event belonging to another route", () => {
    // T-08
    expect(
      shouldSynchronizeFragment({
        currentPathname: "/mpg",
        listingPath: "/specialty/cardiology",
        fragment: "q=cardio",
        lastSynchronized: "",
      }),
    ).toBe(false);
  });

  it("collapses the popstate/hashchange pair and our own pushState echo", () => {
    // T-09
    expect(
      shouldSynchronizeFragment({
        currentPathname: "/specialty/cardiology",
        listingPath: "/specialty/cardiology",
        fragment: "f-hc_locations=Boston",
        lastSynchronized: "f-hc_locations=Boston",
      }),
    ).toBe(false);
  });

  it("synchronizes Back to a bare hash", () => {
    // T-10 — the regression that swallowed Back after a facet toggle.
    expect(
      shouldSynchronizeFragment({
        currentPathname: "/specialty/cardiology",
        listingPath: "/specialty/cardiology",
        fragment: "",
        lastSynchronized: "f-hc_locations=Boston",
      }),
    ).toBe(true);
  });

  it("tolerates a trailing slash on either side", () => {
    // T-11
    expect(
      shouldSynchronizeFragment({
        currentPathname: "/specialty/cardiology/",
        listingPath: "/specialty/cardiology",
        fragment: "f-hc_locations=Boston",
        lastSynchronized: "",
      }),
    ).toBe(true);
  });
});

describe("buildListingHeading", () => {
  it("appends the total and omits it at zero", () => {
    // T-12
    expect(buildListingHeading("Cardiology Providers", 2)).toBe(
      "Cardiology Providers (2)",
    );
    expect(buildListingHeading("Cardiology Providers", 0)).toBe(
      "Cardiology Providers",
    );
  });
});

describe("classifyListingState", () => {
  it("puts an error ahead of retained products after a failed refetch", () => {
    // T-13 — the exact state a rejected fetch leaves: error set, loading cleared, and the
    // previous page of products still in headless state. The routing table must therefore
    // send the column to the banner so no stale card can render.
    expect(
      classifyListingState(
        listingState({
          hasError: true,
          productCount: 3,
          firstRequestExecuted: true,
          isLoading: false,
        }),
      ),
    ).toBe("error");
  });

  it("reads hasError first and alone, even with a request pending", () => {
    // T-13g
    expect(
      classifyListingState(
        listingState({ hasError: true, isLoading: true, productCount: 3 }),
      ),
    ).toBe("error");
  });

  it("is loading before the first response and while a request is in flight", () => {
    // T-13b
    expect(
      classifyListingState(
        listingState({ firstRequestExecuted: false, productCount: 0 }),
      ),
    ).toBe("loading");
    expect(classifyListingState(listingState({ isLoading: true }))).toBe(
      "loading",
    );
  });

  it("renders results when there are products", () => {
    // T-13c
    expect(classifyListingState(listingState({ productCount: 2 }))).toBe(
      "results",
    );
  });

  it("distinguishes a facet-filtered zero", () => {
    // T-13d
    expect(
      classifyListingState(
        listingState({
          productCount: 0,
          hasActiveFilters: true,
          facetCount: 5,
        }),
      ),
    ).toBe("filtered-empty");
  });

  it("distinguishes an empty but resolved listing", () => {
    // T-13e
    expect(
      classifyListingState(
        listingState({
          productCount: 0,
          hasActiveFilters: false,
          facetCount: 5,
        }),
      ),
    ).toBe("listing-empty");
  });

  it("distinguishes a listing that did not resolve at all", () => {
    // T-13f — zero products AND zero facets with nothing filtered: the signal that the
    // view url matched no Hub listing, which must not look like a filtered empty result.
    expect(
      classifyListingState(
        listingState({
          productCount: 0,
          hasActiveFilters: false,
          facetCount: 0,
        }),
      ),
    ).toBe("listing-unresolved");
  });
});

describe("shouldResyncListingAfterForeignSearch", () => {
  it("resyncs once for a late search response", () => {
    // T-30
    expect(
      shouldResyncListingAfterForeignSearch({
        searchResponseId: "search-1",
        listingResponseId: "listing-1",
        lastResyncedSearchResponseId: null,
      }),
    ).toBe(true);
  });

  it("does not repeat for a response it already handled", () => {
    // T-31
    expect(
      shouldResyncListingAfterForeignSearch({
        searchResponseId: "search-1",
        listingResponseId: "listing-1",
        lastResyncedSearchResponseId: "search-1",
      }),
    ).toBe(false);
  });

  it("stays quiet before the listing has its own response, and with no search response", () => {
    // T-32 — the in-flight listing request will fix the shared slices anyway, and firing
    // here would duplicate the cold-load request.
    expect(
      shouldResyncListingAfterForeignSearch({
        searchResponseId: "search-1",
        listingResponseId: "",
        lastResyncedSearchResponseId: null,
      }),
    ).toBe(false);
    expect(
      shouldResyncListingAfterForeignSearch({
        searchResponseId: "",
        listingResponseId: "listing-1",
        lastResyncedSearchResponseId: null,
      }),
    ).toBe(false);
  });
});

describe("bootstrapProductListing", () => {
  it("resets the view before restoring the fragment", () => {
    // T-23 — the ordering constraint: setView clears the facet/parameter slices that
    // building the url manager then restores into.
    const { engine, calls, deps } = createFakeEngine();
    bootstrapProductListing(
      engine,
      "http://localhost:5173/specialty/cardiology",
      "f-hc_locations=Boston",
      deps,
    );
    expect(calls).toEqual([
      "commerce/context/setView",
      "buildProductListing",
      "facetGenerator",
      "summary",
      "breadcrumbManager",
      "urlManager",
    ]);
  });

  it("sends the listing page's own view url", () => {
    // T-23b
    const { engine, payloads, deps } = createFakeEngine();
    bootstrapProductListing(
      engine,
      "http://localhost:5173/specialty/cardiology",
      "",
      deps,
    );
    expect(payloads[0].payload).toEqual({
      url: "http://localhost:5173/specialty/cardiology",
    });
  });

  it("builds the url manager with the stripped fragment and no default parameters", () => {
    // T-23c
    const { engine, payloads, deps } = createFakeEngine();
    bootstrapProductListing(
      engine,
      "http://localhost:5173/specialty/cardiology",
      "q=cardio&f-hc_locations=Boston",
      deps,
    );
    const urlManagerProps = payloads[payloads.length - 1];
    expect(urlManagerProps).toEqual({
      initialState: { fragment: "q=cardio&f-hc_locations=Boston" },
      excludeDefaultParameters: true,
    });
  });

  it("issues no fetch of its own", () => {
    // T-23d — the single first request comes from an effect, so a headless change that
    // made construction fetch would be caught here.
    const { engine, calls, deps } = createFakeEngine();
    bootstrapProductListing(
      engine,
      "http://localhost:5173/specialty/cardiology",
      "",
      deps,
    );
    expect(calls.filter((call) => /fetch|execute/i.test(call))).toHaveLength(0);
  });

  it("dispatches no query-state action", () => {
    // T-23e — the machine-checkable form of the ownership rule: a listing page registers
    // no querySet entry, so there is nothing for another page's query to leak into.
    const { engine, calls, deps } = createFakeEngine();
    bootstrapProductListing(
      engine,
      "http://localhost:5173/specialty/cardiology",
      "q=cardio",
      deps,
    );
    expect(
      calls.filter((call) => /querySet|commerce\/query/.test(call)),
    ).toEqual([]);
  });
});

describe("bootstrapProductListingSafely", () => {
  it("recovers from a fragment whose validation throws", () => {
    // T-27 (listing half) — #page=abc must load the unfiltered listing, not blank the app.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { engine, deps } = createFakeEngine((props) => {
      if (/page=(abc|-1)|perPage=0/.test(props?.initialState?.fragment ?? "")) {
        throw new Error("SchemaValidationError");
      }
    });

    ["page=abc", "page=-1", "perPage=0"].forEach((fragment) => {
      warn.mockClear();
      const result = bootstrapProductListingSafely(
        engine,
        "http://localhost:5173/specialty/cardiology",
        fragment,
        deps,
      );
      expect(result.fragmentUsed).toBe("");
      expect(result.urlManager).toBeDefined();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});

describe("query-state ownership, statically", () => {
  it("never reaches for a search box or a query action anywhere in the folder", () => {
    // T-40 — a cheap static proof that survives refactors: listing pages own no commerce
    // query state, so these symbols must not appear. `buildSearch` is allowed at most
    // twice in the page (one import specifier, one call site for the read-only watch).
    const folder = __dirname;
    // Test files are excluded: this very file names the forbidden symbols in order to
    // assert their absence from the shipped modules.
    const files = readdirSync(folder).filter(
      (name) => /\.tsx?$/.test(name) && !name.includes(".test."),
    );
    expect(files.length).toBeGreaterThan(0);

    const forbidden = [
      "buildSearchBox",
      "updateQuerySetQuery",
      "registerQuerySetQuery",
      "loadQueryActions",
      "updateQuery(",
    ];

    files.forEach((name) => {
      const source = readFileSync(join(folder, name), "utf8");
      forbidden.forEach((symbol) => {
        expect(
          source.includes(symbol),
          `${name} must not reference ${symbol}`,
        ).toBe(false);
      });

      const buildSearchMatches = source.match(/\bbuildSearch\b/g) ?? [];
      const allowed = name === "ProviderListingPage.tsx" ? 2 : 0;
      expect(
        buildSearchMatches.length,
        `${name} may contain at most ${allowed} buildSearch occurrences`,
      ).toBeLessThanOrEqual(allowed);
    });
  });
});

// -----------------  Phase 0: listing urls are unaffected by the search url change  ----

describe("listing view urls after the Phase 0 search url change", () => {
  const cardiology = MPG_SPECIALTY_LISTING_PAGES.find(
    (entry) => entry.slug === "cardiology",
  )!;
  const orthopedics = MPG_SPECIALTY_LISTING_PAGES.find(
    (entry) => entry.slug === "orthopedics",
  )!;

  it("still sends /specialty/cardiology after the search url change", () => {
    // Behaviors 4 and 5 — the two configured listings keep their exact relative paths.
    // An absolute url here produced a live 404 LISTING_CONFIGURATION_DOES_NOT_EXIST for
    // tracking id healthcare_cpd_demo, so these two strings are a wire contract.
    expect(cardiology).toBeDefined();
    expect(orthopedics).toBeDefined();
    expect(buildListingViewUrl(buildListingPath(cardiology))).toBe(
      "/specialty/cardiology",
    );
    expect(buildListingViewUrl(buildListingPath(orthopedics))).toBe(
      "/specialty/orthopedics",
    );
  });

  it("keeps the search helper out of the listing path", () => {
    // Behavior 6 — no configured listing may acquire an origin, and in particular the
    // listing url must never equal what the search helper would produce for the same
    // path. The two helpers live in different modules on purpose.
    expect(MPG_SPECIALTY_LISTING_PAGES.length).toBeGreaterThan(0);
    MPG_SPECIALTY_LISTING_PAGES.forEach((entry) => {
      const path = buildListingPath(entry);
      const listingUrl = buildListingViewUrl(path);
      expect(listingUrl).not.toContain("://");
      expect(listingUrl).not.toBe(
        buildSearchViewUrl(path, "http://localhost:5173"),
      );
      expect(listingUrl).not.toBe(
        buildSearchViewUrl(path, "https://demo.example.com"),
      );
      // The only difference is the origin; the path half still agrees.
      expect(buildSearchViewUrl(path, "https://demo.example.com")).toBe(
        `https://demo.example.com${listingUrl}`,
      );
    });
  });

  it("matches the search helper's trailing-slash contract while keeping its own shape", () => {
    // Behavior 7 — both helpers strip a trailing slash (the Hub 404s on
    // "/specialty/cardiology/"), and only the search one prepends an origin.
    expect(buildListingViewUrl("/specialty/cardiology/")).toBe(
      "/specialty/cardiology",
    );
    expect(buildSearchViewUrl("/specialty/cardiology/", "https://x.test")).toBe(
      "https://x.test/specialty/cardiology",
    );
  });

  it("adds no listing requests as a result of the search url change", () => {
    // Behavior 10 (listing half) — one setView and one first request per listing view
    // url, with the url still relative. Repeated effect runs for the same page stay at
    // one request; the cardiology -> orthopedics transition refetches exactly once.
    const { engine, payloads, deps } = createFakeEngine();
    const viewUrl = buildListingViewUrl(buildListingPath(cardiology));
    bootstrapProductListing(engine, viewUrl, "", deps);

    const setViewWrites = payloads.filter(
      (entry) => entry?.type === "commerce/context/setView",
    );
    expect(setViewWrites).toHaveLength(1);
    expect(setViewWrites[0].payload).toEqual({ url: "/specialty/cardiology" });

    const firstRequestKey = { current: null as string | null };
    const executeFirstRequest = vi.fn();
    requestFirstRequestOnce(firstRequestKey, viewUrl, executeFirstRequest);
    requestFirstRequestOnce(firstRequestKey, viewUrl, executeFirstRequest);
    requestFirstRequestOnce(
      firstRequestKey,
      buildListingViewUrl(buildListingPath(cardiology)),
      executeFirstRequest,
    );
    expect(executeFirstRequest).toHaveBeenCalledTimes(1);

    requestFirstRequestOnce(
      firstRequestKey,
      buildListingViewUrl(buildListingPath(orthopedics)),
      executeFirstRequest,
    );
    expect(executeFirstRequest).toHaveBeenCalledTimes(2);
  });
});
