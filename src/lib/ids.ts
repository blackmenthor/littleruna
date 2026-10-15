/** GA4 measurement ids look like `G-ABC123XYZ`. */
export const GA4_ID = /^G-[A-Z0-9]{4,32}$/;

/** Cloudflare Web Analytics site tokens are URL-safe and public in the page. */
export const BEACON_TOKEN = /^[A-Za-z0-9_-]{8,128}$/;

/** Resend audience and segment ids are UUIDs. A wider token is accepted so a renamed id still fits. */
export const RESEND_AUDIENCE_ID = /^[A-Za-z0-9_-]{8,80}$/;
