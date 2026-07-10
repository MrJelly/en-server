export interface ChunkWriter<T> {
  write: (rows: readonly T[]) => Promise<void>
}

export async function writeInChunks<T>(rows: Iterable<T>, writer: ChunkWriter<T>, chunkSize = 1000) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1)
    throw new Error('chunkSize must be a positive integer')

  let chunk: T[] = []
  let written = 0
  for (const row of rows) {
    chunk.push(row)
    if (chunk.length === chunkSize) {
      await writer.write(chunk)
      written += chunk.length
      chunk = []
    }
  }
  if (chunk.length > 0) {
    await writer.write(chunk)
    written += chunk.length
  }
  return written
}
