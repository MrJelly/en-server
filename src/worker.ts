import type { Env } from './cloudflare/bindings.js'
import type { DailyRepository } from './services/dailyAllocator.js'
import { D1DailyRepository } from './cloudflare/d1DailyRepository.js'
import { DailyAllocator } from './services/dailyAllocator.js'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function json(data: unknown, status: number, origin: string) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'no-store',
    },
  })
}

export function createWorkerHandler(createRepository: (env: Env) => DailyRepository = env => new D1DailyRepository(env.DB)) {
  return async function fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.CORS_ORIGIN ?? '*'
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })

    const url = new URL(request.url)
    if (url.pathname === '/health')
      return json({ status: 'ok', runtime: 'cloudflare-workers' }, 200, origin)

    if (url.pathname.startsWith('/media/') && request.method === 'GET') {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length))
      if (!key || key.includes('..'))
        return json({ code: 'INVALID_MEDIA_KEY' }, 400, origin)
      const object = await env.MEDIA.get(key)
      if (!object)
        return json({ code: 'MEDIA_NOT_FOUND' }, 404, origin)
      const headers = new Headers({ 'Access-Control-Allow-Origin': origin, 'Cache-Control': 'public, max-age=86400' })
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      return new Response(object.body, { headers })
    }

    if (url.pathname !== '/v1/daily' || request.method !== 'GET')
      return json({ code: 'NOT_FOUND' }, 404, origin)

    const userId = url.searchParams.get('userId')?.trim() ?? ''
    const localDate = url.searchParams.get('date')?.trim() || new Date().toISOString().slice(0, 10)
    if (!userId || userId.length > 128)
      return json({ code: 'INVALID_USER_ID', message: 'userId is required and must be at most 128 characters' }, 400, origin)
    if (!datePattern.test(localDate))
      return json({ code: 'INVALID_DATE', message: 'date must use YYYY-MM-DD' }, 400, origin)

    try {
      const result = await new DailyAllocator(createRepository(env)).getDaily(userId, localDate)
      if (result.kind === 'pool_exhausted')
        return json({ code: 'POOL_EXHAUSTED', ...result }, 409, origin)
      return json(result, 200, origin)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const isLimit = /limit|quota|too many/i.test(message)
      return json({ code: isLimit ? 'FREE_TIER_LIMIT' : 'SERVICE_UNAVAILABLE' }, 503, origin)
    }
  }
}

export default { fetch: createWorkerHandler() }
