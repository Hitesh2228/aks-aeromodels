import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('x-forwarded-host') || context.url.host || '';

  // If request arrives on any *.vercel.app preview domain:
  if (host && host.endsWith('.vercel.app')) {
    const destination = `https://www.skynodesuav.in${context.url.pathname}${context.url.search}`;
    return new Response(null, {
      status: 301,
      headers: {
        'Location': destination,
        'Cache-Control': 'public, max-age=31536000',
        'X-Robots-Tag': 'noindex, follow',
      },
    });
  }

  // If request arrives on apex domain skynodesuav.in:
  // Redirect to canonical www.skynodesuav.in with indexable 'all' tag (never noindex)
  if (host === 'skynodesuav.in') {
    const destination = `https://www.skynodesuav.in${context.url.pathname}${context.url.search}`;
    return new Response(null, {
      status: 301,
      headers: {
        'Location': destination,
        'Cache-Control': 'public, max-age=31536000',
        'X-Robots-Tag': 'all',
      },
    });
  }

  return next();
});
