/**
 * Helper utility to present biotechnology traits, insect protection features,
 * and disease resistance information in clear, simple English without misleading claims.
 */

export interface FormattedBiotechTraits {
  hasInsectProtection: boolean;
  insectProtectionExplanation?: string;
  technicalDetails?: string;
  otherTraits?: string;
  originalCleaned?: string;
}

/**
 * Formats biotech traits into simple English for farmers while preserving verified technical details.
 * Removes misleading claims such as "Systemic Lepidopteran Immunity".
 */
export function formatInsectProtection(rawTraits?: string | null): FormattedBiotechTraits {
  if (!rawTraits || !rawTraits.trim()) {
    return { hasInsectProtection: false };
  }

  // Remove potentially misleading phrases such as "Systemic Lepidopteran Immunity"
  const sanitized = rawTraits
    .replace(/\(?Systemic\s+Lepidopteran\s+Immunity\)?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Detect specific verified proteins like Cry1Ac, Cry2Ab2, Vip3Aa, Cry1F, etc.
  const proteinMatches = sanitized.match(/\b(Cry\w+|Vip\w+)\b/gi) || [];
  const uniqueProteins = Array.from(new Set(proteinMatches));

  const hasInsectKeywords = /cry|vip|lepidopteran|borer|bollworm|caterpillar|pest|insect/i.test(sanitized);

  if (uniqueProteins.length > 0) {
    const formattedProteins = uniqueProteins.length > 1
      ? `${uniqueProteins.slice(0, -1).join(', ')}, and ${uniqueProteins[uniqueProteins.length - 1]}`
      : uniqueProteins[0];

    // Find non-protein traits (e.g., High Lycopene, Firm Fruit Skin, Drought-Resilience)
    const nonProteinPart = sanitized
      .replace(/Triple\s+Toxin/gi, '')
      .replace(/Cry\w+/gi, '')
      .replace(/Vip\w+/gi, '')
      .replace(/Lepidopteran\s+Fruit\s+Borer\s+Defense/gi, '')
      .replace(/[+&,]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      hasInsectProtection: true,
      insectProtectionExplanation: 'This crop variety produces specific proteins that help protect against certain caterpillar pests.',
      technicalDetails: `Technical details: ${formattedProteins}`,
      otherTraits: nonProteinPart.length > 3 ? nonProteinPart : undefined,
      originalCleaned: sanitized,
    };
  }

  if (hasInsectKeywords) {
    return {
      hasInsectProtection: true,
      insectProtectionExplanation: 'This crop variety includes specialized traits developed to help protect against target insect pests.',
      technicalDetails: `Technical details: ${sanitized}`,
      originalCleaned: sanitized,
    };
  }

  // Other traits without insect protection proteins
  return {
    hasInsectProtection: false,
    otherTraits: sanitized,
    originalCleaned: sanitized,
  };
}

export const DISEASE_RESISTANCE_STANDARD_EXPLANATION =
  'This variety may have resistance to certain diseases. Protection depends on the specific disease and growing conditions.';
