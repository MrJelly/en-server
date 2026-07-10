import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const officialHosts = new Set([
  'tatoeba.org',
  'downloads.tatoeba.org',
  'anc.org',
  'www.anc.org',
  'commonvoice.mozilla.org',
  'datacollective.mozillafoundation.org',
])

export function assertOfficialDownloadUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || !officialHosts.has(url.hostname))
    throw new Error(`Download URL is not on an approved official host: ${url.hostname}`)
  return url
}

export async function downloadOfficialExport(urlValue: string, maxBytes = 2 * 1024 * 1024 * 1024) {
  const url = assertOfficialDownloadUrl(urlValue)
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok || !response.body)
    throw new Error(`Download failed with HTTP ${response.status}`)

  const advertisedLength = Number(response.headers.get('content-length') ?? 0)
  if (advertisedLength > maxBytes)
    throw new Error(`Download exceeds ${maxBytes} bytes`)

  const directory = join(tmpdir(), 'speaking-corpus-imports')
  await mkdir(directory, { recursive: true })
  const path = join(directory, `${randomUUID()}.download`)
  let downloadedBytes = 0
  const hash = createHash('sha256')
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      downloadedBytes += chunk.length
      if (downloadedBytes > maxBytes) {
        callback(new Error(`Download exceeds ${maxBytes} bytes`))
        return
      }
      hash.update(chunk)
      callback(null, chunk)
    },
  })

  try {
    await pipeline(Readable.fromWeb(response.body as never), meter, createWriteStream(path, { flags: 'wx' }))
    return { path, sha256: hash.digest(), bytes: downloadedBytes, url: url.toString() }
  }
  catch (error) {
    await rm(path, { force: true })
    throw error
  }
}
