import type { FastifyInstance } from 'fastify'
import type { DailyAllocator } from '../services/dailyAllocator.js'

export function registerDailyRoutes(app: FastifyInstance, allocator: DailyAllocator) {
  app.get<{ Querystring: { userId?: string, date?: string } }>('/v1/daily', async (request, reply) => {
    const userId = request.query.userId?.trim()
    const localDate = request.query.date?.trim() ?? new Date().toISOString().slice(0, 10)
    if (!userId) {
      return reply.code(400).send({ code: 'USER_ID_REQUIRED', message: 'userId is required in local development' })
    }
    const result = await allocator.getDaily(userId, localDate)
    if (result.kind === 'pool_exhausted')
      return reply.code(409).send({ code: 'POOL_EXHAUSTED', ...result })
    return result
  })
}
