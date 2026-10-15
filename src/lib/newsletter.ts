export const newsletterCountries = ['DE', 'ES', 'FR', 'TR', 'ID', 'other'] as const;

export type NewsletterCountry = (typeof newsletterCountries)[number];

export function isNewsletterCountry(value: string): value is NewsletterCountry {
  return (newsletterCountries as readonly string[]).includes(value);
}
