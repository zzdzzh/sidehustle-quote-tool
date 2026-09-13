export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  if (!host) return false;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  return false;
}

export function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: '操作失败' }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
