export default async function middleware(req) {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace('/ph', '');
  const targetUrl = `https://eu.i.posthog.com${targetPath}${url.search}`;

  return fetch(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
}

export const config = {
  matcher: '/ph/:path*',
};
