import process from 'node:process'
import Fastify from 'fastify'
import { loadConfig } from './config.js'
import { registerDailyRoutes } from './routes/daily.js'
import { DailyAllocator, InMemoryDailyRepository } from './services/dailyAllocator.js'

export function buildServer() {
  const app = Fastify({ logger: true })

  app.get('/health', async () => ({ status: 'ok' }))
  const demoCard = {
    lessonCardId: 1,
    sentenceId: 1,
    text: 'Could I get a latte, please?',
    translationZh: '我可以要一杯拿铁吗？',
  }
  const demoRepository = new InMemoryDailyRepository(new Map([[0, [demoCard]]]))
  registerDailyRoutes(app, new DailyAllocator(demoRepository))

  return app
}

async function start() {
  const config = loadConfig()
  const app = buildServer()
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
}

if (process.env.VITEST !== 'true') {
  start().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
