export default async function middleware(req) {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace('/ph', '');
  const targetUrl = `https://eu.i.posthog.com${targetPath}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const config = {
  matcher: '/ph/:path*',
};
