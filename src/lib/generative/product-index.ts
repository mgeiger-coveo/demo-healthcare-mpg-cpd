import type { Product } from "@coveo/headless/commerce";

export function registerProducts(
  productMap: Map<string, Product>,
  products?: Product[],
): void {
  if (!products || !Array.isArray(products)) {
    return;
  }

  products.forEach((product) => {
    if (product.ec_product_id) {
      productMap.set(product.ec_product_id, product);
      productMap.set(product.ec_product_id.toLowerCase(), product);
    }
    if (product.permanentid) {
      productMap.set(product.permanentid, product);
      productMap.set(product.permanentid.toLowerCase(), product);
    }
  });
}
