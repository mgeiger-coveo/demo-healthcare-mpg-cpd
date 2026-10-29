// Message markup parser utilities

export interface RefinementChip {
  label: string;
  value?: string;
}

export interface NextAction {
  type: "search" | "followup";
  query?: string;
  message?: string;
}

export interface PendingRichContent {
  type:
    | "carousel"
    | "product_ref"
    | "table"
    | "code_block"
    | "nextaction"
    | "refinement_chip";
  partialText: string;
}

export interface ProductRef {
  identifier: string | null;
  startIndex: number;
  endIndex: number;
}

export interface ContentSegment {
  type: "text" | "carousel";
  value?: string;
  identifiers?: string[];
}

export function hasSpecialMarkup(content: string): boolean {
  return (
    content.includes("<carousel") ||
    content.includes("<product") ||
    content.includes("<product_ref") ||
    content.includes("<nextaction") ||
    content.includes("<refinement")
  );
}

export function hasPotentialStreamingMarkup(content: string): boolean {
  return content.includes("<");
}

export function detectPendingRichContent(
  content: string,
): PendingRichContent | null {
  const lastOpenTag = content.lastIndexOf("<");
  if (lastOpenTag === -1) {
    return null;
  }

  const afterTag = content.slice(lastOpenTag);
  if (afterTag.includes(">")) {
    return null; // Tag is complete
  }

  // Detect partial tag type
  if (afterTag.startsWith("<carousel")) {
    return { type: "carousel", partialText: afterTag };
  }
  if (afterTag.startsWith("<product_ref") || afterTag.startsWith("<product")) {
    return { type: "product_ref", partialText: afterTag };
  }
  if (afterTag.startsWith("<nextaction")) {
    return { type: "nextaction", partialText: afterTag };
  }
  if (afterTag.startsWith("<refinement")) {
    return { type: "refinement_chip", partialText: afterTag };
  }

  return null;
}

export function extractNextActions(content: string): {
  cleanedContent: string;
  nextActions: NextAction[];
} {
  const nextActions: NextAction[] = [];
  let cleanedContent = content;

  const nextActionRegex =
    /<nextaction\s+type="(search|followup)"(?:\s+query="([^"]*)")?(?:\s+message="([^"]*)")?\s*\/>/g;
  let match;

  while ((match = nextActionRegex.exec(content)) !== null) {
    const type = match[1] as "search" | "followup";
    const query = match[2];
    const message = match[3];

    nextActions.push({
      type,
      ...(query && { query }),
      ...(message && { message }),
    });
  }

  cleanedContent = content.replace(nextActionRegex, "");

  return { cleanedContent, nextActions };
}

export function extractRefinementChips(content: string): {
  cleanedContent: string;
  refinementChips: RefinementChip[];
} {
  const chips: RefinementChip[] = [];
  let cleanedContent = content;

  const chipRegex =
    /<refinement\s+label="([^"]*)"(?:\s+value="([^"]*)")?\s*\/>/g;
  let match;

  while ((match = chipRegex.exec(content)) !== null) {
    chips.push({
      label: match[1],
      value: match[2],
    });
  }

  cleanedContent = content.replace(chipRegex, "");

  return { cleanedContent, refinementChips: chips };
}

export function splitContentByCarousels(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const carouselRegex = /<carousel>(.*?)<\/carousel>/gs;

  let lastIndex = 0;
  let match;

  while ((match = carouselRegex.exec(content)) !== null) {
    // Add text before carousel
    if (match.index > lastIndex) {
      const textSegment = content.slice(lastIndex, match.index).trim();
      if (textSegment) {
        segments.push({ type: "text", value: textSegment });
      }
    }

    // Extract product IDs from carousel - support multiple formats:
    // <product id="..." /> OR <product_ref ec_product_id="..." />
    const carouselContent = match[1];
    const productRegex =
      /<(?:product|product_ref)\s+(?:id|ec_product_id)="([^"]*)"\s*\/>/g;
    const identifiers: string[] = [];
    let productMatch;

    while ((productMatch = productRegex.exec(carouselContent)) !== null) {
      identifiers.push(productMatch[1]);
    }

    if (identifiers.length > 0) {
      segments.push({ type: "carousel", identifiers });
    }

    lastIndex = carouselRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textSegment = content.slice(lastIndex).trim();
    if (textSegment) {
      segments.push({ type: "text", value: textSegment });
    }
  }

  return segments;
}

export function extractInlineProductRefs(text: string): ProductRef[] {
  const refs: ProductRef[] = [];
  // Support multiple formats: <product id="..." /> OR <product_ref ec_product_id="..." />
  const productRefRegex =
    /<(?:product|product_ref)\s+(?:id|ec_product_id)="([^"]*)"\s*\/>/g;
  let match;

  while ((match = productRefRegex.exec(text)) !== null) {
    refs.push({
      identifier: match[1],
      startIndex: match.index,
      endIndex: productRefRegex.lastIndex,
    });
  }

  return refs;
}
