const DEFAULT_UPSTREAM = 'https://vip.mianyunai.com/v1'
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

export const config = {
  api: {
    bodyParser: false,
  },
}

function getPathSegments(request) {
  const value = request.query?.path
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) return value.split('/')
  return []
}

function copyRequestHeaders(request) {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    const lowerName = name.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lowerName) || value == null) continue
    headers.set(name, Array.isArray(value) ? value.join(', ') : String(value))
  }
  return headers
}

async function readBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  return chunks.length ? Buffer.concat(chunks) : undefined
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.setHeader('Allow', 'OPTIONS, POST')
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'OPTIONS, POST')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const pathSegments = getPathSegments(request)
  if (!pathSegments.length || pathSegments.some((segment) => segment === '..' || segment === '.')) {
    response.status(400).json({ error: 'Invalid proxy path' })
    return
  }

  const upstream = (process.env.API_PROXY_URL || process.env.MIANYUN_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/+$/, '')
  const requestUrl = new URL(request.url || '/', 'https://vercel.local')
  const target = `${upstream}/${pathSegments.map((segment) => encodeURIComponent(segment)).join('/')}${requestUrl.search}`

  try {
    const upstreamResponse = await fetch(target, {
      method: 'POST',
      headers: copyRequestHeaders(request),
      body: await readBody(request),
    })

    for (const name of ['cache-control', 'content-type', 'retry-after']) {
      const value = upstreamResponse.headers.get(name)
      if (value) response.setHeader(name, value)
    }

    response.status(upstreamResponse.status)
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()))
  } catch (error) {
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Upstream request failed',
    })
  }
}
