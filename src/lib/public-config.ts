import { BEACON_TOKEN, GA4_ID } from './ids';

function readPublic(name: 'PUBLIC_CF_BEACON_TOKEN' | 'PUBLIC_GA4_ID'): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

/** Empty when the token is missing or not a token shape, so the beacon is omitted. */
export function cloudflareBeaconToken(): string {
  const token = readPublic('PUBLIC_CF_BEACON_TOKEN');
  return BEACON_TOKEN.test(token) ? token : '';
}

/** Empty when the id is missing or not a GA4 measurement id, so the tag is never requested. */
export function gaMeasurementId(): string {
  const id = readPublic('PUBLIC_GA4_ID');
  return GA4_ID.test(id) ? id : '';
}
