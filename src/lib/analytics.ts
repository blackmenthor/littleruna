function publicValue(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function matched(value: string, pattern: RegExp, label: string): string {
  if (!value) return '';
  if (pattern.test(value)) return value;
  console.warn(`${label} is set but was ignored because the value does not match the expected shape.`);
  return '';
}

/** Cloudflare Web Analytics site token. Empty when unset or unusable. */
export const cfBeaconToken = matched(
  publicValue('PUBLIC_CF_BEACON_TOKEN'),
  /^[A-Za-z0-9_-]{8,128}$/,
  'PUBLIC_CF_BEACON_TOKEN',
);

/** GA4 measurement id (G-XXXXXXXX). Empty when unset or unusable. */
export const ga4MeasurementId = matched(publicValue('PUBLIC_GA4_ID'), /^G-[A-Z0-9]{4,}$/i, 'PUBLIC_GA4_ID');
