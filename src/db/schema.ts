import {
  bigint,
  binary,
  boolean,
  char,
  datetime,
  index,
  json,
  mediumtext,
  mysqlTable,
  primaryKey,
  smallint,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'

export const corpusSources = mysqlTable('corpus_sources', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  code: varchar('code', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  officialUrl: varchar('official_url', { length: 2048 }).notNull(),
  defaultLicense: varchar('default_license', { length: 128 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, table => [unique('corpus_sources_code_unique').on(table.code)])

export const corpusImportBatches = mysqlTable('corpus_import_batches', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  sourceId: bigint('source_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSources.id),
  version: varchar('version', { length: 128 }).notNull(),
  downloadUrl: varchar('download_url', { length: 2048 }).notNull(),
  fileSha256: binary('file_sha256', { length: 32 }).notNull(),
  importedAt: datetime('imported_at').notNull(),
  importedCount: bigint('imported_count', { mode: 'number', unsigned: true }).notNull().default(0),
  rejectedCount: bigint('rejected_count', { mode: 'number', unsigned: true }).notNull().default(0),
  status: varchar('status', { length: 32 }).notNull(),
  manifestJson: json('manifest_json'),
})

export const corpusDocuments = mysqlTable('corpus_documents', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  sourceId: bigint('source_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSources.id),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 1024 }).notNull(),
  domain: varchar('domain', { length: 128 }),
  rightsStatus: varchar('rights_status', { length: 32 }).notNull(),
  license: varchar('license', { length: 128 }).notNull(),
  attribution: varchar('attribution', { length: 2048 }),
  sourceUrl: varchar('source_url', { length: 2048 }).notNull(),
  reviewStatus: varchar('review_status', { length: 32 }).notNull().default('pending'),
}, table => [unique('corpus_documents_source_external_unique').on(table.sourceId, table.externalId)])

export const corpusSentences = mysqlTable('corpus_sentences', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  sourceId: bigint('source_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSources.id),
  documentId: bigint('document_id', { mode: 'number', unsigned: true }).references(() => corpusDocuments.id),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  rawText: mediumtext('raw_text').notNull(),
  normalizedText: varchar('normalized_text', { length: 1024 }).notNull(),
  textSha256: binary('text_sha256', { length: 32 }).notNull(),
  language: char('language', { length: 2 }).notNull(),
  license: varchar('license', { length: 128 }).notNull(),
  attribution: varchar('attribution', { length: 2048 }),
  sourceUrl: varchar('source_url', { length: 2048 }).notNull(),
  importBatchId: bigint('import_batch_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusImportBatches.id),
  qualityStatus: varchar('quality_status', { length: 32 }).notNull().default('raw'),
  wordCount: smallint('word_count', { unsigned: true }).notNull(),
  cefrLevel: varchar('cefr_level', { length: 3 }),
  speakingScore: smallint('speaking_score', { unsigned: true }).notNull().default(0),
  sceneKey: varchar('scene_key', { length: 64 }),
  sampleBucket: smallint('sample_bucket', { unsigned: true }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, table => [
  unique('corpus_sentences_source_external_unique').on(table.sourceId, table.externalId),
  unique('corpus_sentences_text_language_unique').on(table.textSha256, table.language),
  index('corpus_sentences_candidate_idx').on(table.qualityStatus, table.cefrLevel, table.sceneKey, table.sampleBucket, table.id),
])

export const lessonCards = mysqlTable('lesson_cards', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  sentenceId: bigint('sentence_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSentences.id),
  titleZh: varchar('title_zh', { length: 255 }).notNull(),
  translationZh: varchar('translation_zh', { length: 1024 }).notNull(),
  teachingNoteZh: varchar('teaching_note_zh', { length: 2048 }),
  audioUrl: varchar('audio_url', { length: 2048 }),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  dailyEligible: boolean('daily_eligible').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  publishedAt: datetime('published_at'),
}, table => [
  unique('lesson_cards_sentence_unique').on(table.sentenceId),
  index('lesson_cards_daily_idx').on(table.dailyEligible, table.status, table.id),
])

export const userDailyAssignments = mysqlTable('user_daily_assignments', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  localDate: char('local_date', { length: 10 }).notNull(),
  lessonCardId: bigint('lesson_card_id', { mode: 'number', unsigned: true }).notNull().references(() => lessonCards.id),
  sentenceId: bigint('sentence_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSentences.id),
  status: varchar('status', { length: 32 }).notNull().default('assigned'),
  assignedAt: datetime('assigned_at').notNull(),
  completedAt: datetime('completed_at'),
  nextReviewAt: datetime('next_review_at'),
}, table => [
  unique('user_daily_assignments_user_date_unique').on(table.userId, table.localDate),
  unique('user_daily_assignments_user_sentence_unique').on(table.userId, table.sentenceId),
  index('user_daily_assignments_review_idx').on(table.userId, table.nextReviewAt),
])

export const userSentenceHistory = mysqlTable('user_sentence_history', {
  userId: varchar('user_id', { length: 128 }).notNull(),
  sentenceId: bigint('sentence_id', { mode: 'number', unsigned: true }).notNull().references(() => corpusSentences.id),
  firstAssignedAt: datetime('first_assigned_at').notNull(),
  assignmentId: bigint('assignment_id', { mode: 'number', unsigned: true }).notNull(),
}, table => [primaryKey({ columns: [table.userId, table.sentenceId] })])

export const schemaMetadata = {
  nonRepeatConstraint: 'user_daily_assignments_user_sentence_unique',
  provenanceFields: ['license', 'source_url', 'source_id', 'import_batch_id'],
  candidateIndex: 'corpus_sentences_candidate_idx',
} as const
