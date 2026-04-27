module.exports = async function handler(req, res) {
  const path = (req.query.path || []).join('/');
  const search = req.url.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
  const targetUrl = `https://eu.i.posthog.com/${path}${search}`;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  const headers = {};
  if (req.headers['content-type'])     headers['content-type']     = req.headers['content-type'];
  if (req.headers['content-encoding']) headers['content-encoding'] = req.headers['content-encoding'];

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body.length > 0 ? body : undefined,
  });

  const data = await response.arrayBuffer();
  res.status(response.status).end(Buffer.from(data));
};
