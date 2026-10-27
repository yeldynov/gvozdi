// Usage-stats consent is asked only where GDPR-style rules apply: EU + EEA (IS, LI, NO) + UK + CH.
const ASK = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
]);

/** Unknown country (offline, no header, dev server) counts as not asking: the product decision is to auto-approve. */
export const needsConsent = (country: string | null | undefined) => !!country && ASK.has(country.toUpperCase());
