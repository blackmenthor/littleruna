const runtimeKeys = ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL', 'RESEND_AUDIENCE_ID'] as const;

export type RuntimeSecret = (typeof runtimeKeys)[number];

export async function readSecret(key: RuntimeSecret): Promise<string | undefined> {
  try {
    const { env } = await import('cloudflare:workers');
    const fromWorkers = env?.[key];
    if (typeof fromWorkers === 'string' && fromWorkers.trim()) return fromWorkers.trim();
  } catch {
    // `cloudflare:workers` is empty during a plain Node preview.
  }
  const fromFile = import.meta.env[key];
  if (typeof fromFile === 'string' && fromFile.trim()) return fromFile.trim();
  return undefined;
}
