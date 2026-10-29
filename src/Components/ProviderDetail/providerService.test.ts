import { describe, it, expect } from "vitest";
import { selectProviderById } from "./providerService";

const products = [
  { ec_product_id: "PROV-1001", ec_name: "Dr. Sarah Mitchell" },
  { ec_product_id: "PROV-1006", ec_name: "Dr. David Kim" },
  { ec_product_id: "PROV-100", ec_name: "Dr. Partial Match" },
];

describe("selectProviderById", () => {
  it("picks the strict id match out of a multi-product response", () => {
    expect(selectProviderById(products, "PROV-1006")).toEqual(products[1]);
  });

  it("never settles for a partial id match", () => {
    expect(selectProviderById(products, "PROV-10")).toBeNull();
    expect(selectProviderById(products, "PROV-100")).toEqual(products[2]);
  });

  it("returns null for an unknown id", () => {
    expect(selectProviderById(products, "NOPE-123")).toBeNull();
  });

  it("is safe on an empty or missing product list", () => {
    expect(selectProviderById([], "PROV-1001")).toBeNull();
    expect(selectProviderById(undefined, "PROV-1001")).toBeNull();
  });

  it("returns null without an id to look for", () => {
    expect(selectProviderById(products, "")).toBeNull();
  });
});
