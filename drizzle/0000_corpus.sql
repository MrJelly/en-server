CREATE TABLE `corpus_sources` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `official_url` varchar(2048) NOT NULL,
  `default_license` varchar(128) NOT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `corpus_sources_id` PRIMARY KEY(`id`),
  CONSTRAINT `corpus_sources_code_unique` UNIQUE(`code`)
);

CREATE TABLE `corpus_import_batches` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `source_id` bigint unsigned NOT NULL,
  `version` varchar(128) NOT NULL,
  `download_url` varchar(2048) NOT NULL,
  `file_sha256` binary(32) NOT NULL,
  `imported_at` datetime NOT NULL,
  `imported_count` bigint unsigned NOT NULL DEFAULT 0,
  `rejected_count` bigint unsigned NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL,
  `manifest_json` json,
  CONSTRAINT `corpus_import_batches_id` PRIMARY KEY(`id`),
  CONSTRAINT `corpus_import_batches_source_fk` FOREIGN KEY (`source_id`) REFERENCES `corpus_sources`(`id`)
);

CREATE TABLE `corpus_documents` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `source_id` bigint unsigned NOT NULL,
  `external_id` varchar(255) NOT NULL,
  `title` varchar(1024) NOT NULL,
  `domain` varchar(128),
  `rights_status` varchar(32) NOT NULL,
  `license` varchar(128) NOT NULL,
  `attribution` varchar(2048),
  `source_url` varchar(2048) NOT NULL,
  `review_status` varchar(32) NOT NULL DEFAULT 'pending',
  CONSTRAINT `corpus_documents_id` PRIMARY KEY(`id`),
  CONSTRAINT `corpus_documents_source_external_unique` UNIQUE(`source_id`,`external_id`),
  CONSTRAINT `corpus_documents_source_fk` FOREIGN KEY (`source_id`) REFERENCES `corpus_sources`(`id`)
);

CREATE TABLE `corpus_sentences` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `source_id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned,
  `external_id` varchar(255) NOT NULL,
  `raw_text` mediumtext NOT NULL,
  `normalized_text` varchar(1024) NOT NULL,
  `text_sha256` binary(32) NOT NULL,
  `language` char(2) NOT NULL,
  `license` varchar(128) NOT NULL,
  `attribution` varchar(2048),
  `source_url` varchar(2048) NOT NULL,
  `import_batch_id` bigint unsigned NOT NULL,
  `quality_status` varchar(32) NOT NULL DEFAULT 'raw',
  `word_count` smallint unsigned NOT NULL,
  `cefr_level` varchar(3),
  `speaking_score` smallint unsigned NOT NULL DEFAULT 0,
  `scene_key` varchar(64),
  `sample_bucket` smallint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `corpus_sentences_id` PRIMARY KEY(`id`),
  CONSTRAINT `corpus_sentences_source_external_unique` UNIQUE(`source_id`,`external_id`),
  CONSTRAINT `corpus_sentences_text_language_unique` UNIQUE(`text_sha256`,`language`),
  CONSTRAINT `corpus_sentences_source_fk` FOREIGN KEY (`source_id`) REFERENCES `corpus_sources`(`id`),
  CONSTRAINT `corpus_sentences_document_fk` FOREIGN KEY (`document_id`) REFERENCES `corpus_documents`(`id`),
  CONSTRAINT `corpus_sentences_batch_fk` FOREIGN KEY (`import_batch_id`) REFERENCES `corpus_import_batches`(`id`),
  CONSTRAINT `corpus_sentences_license_check` CHECK (`license` <> ''),
  CONSTRAINT `corpus_sentences_source_url_check` CHECK (`source_url` <> '')
);
CREATE INDEX `corpus_sentences_candidate_idx` ON `corpus_sentences` (`quality_status`,`cefr_level`,`scene_key`,`sample_bucket`,`id`);

CREATE TABLE `lesson_cards` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `sentence_id` bigint unsigned NOT NULL,
  `title_zh` varchar(255) NOT NULL,
  `translation_zh` varchar(1024) NOT NULL,
  `teaching_note_zh` varchar(2048),
  `audio_url` varchar(2048),
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `daily_eligible` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `published_at` datetime,
  CONSTRAINT `lesson_cards_id` PRIMARY KEY(`id`),
  CONSTRAINT `lesson_cards_sentence_unique` UNIQUE(`sentence_id`),
  CONSTRAINT `lesson_cards_sentence_fk` FOREIGN KEY (`sentence_id`) REFERENCES `corpus_sentences`(`id`)
);
CREATE INDEX `lesson_cards_daily_idx` ON `lesson_cards` (`daily_eligible`,`status`,`id`);

CREATE TABLE `user_daily_assignments` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `user_id` varchar(128) NOT NULL,
  `local_date` char(10) NOT NULL,
  `lesson_card_id` bigint unsigned NOT NULL,
  `sentence_id` bigint unsigned NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'assigned',
  `assigned_at` datetime NOT NULL,
  `completed_at` datetime,
  `next_review_at` datetime,
  CONSTRAINT `user_daily_assignments_id` PRIMARY KEY(`id`),
  CONSTRAINT `user_daily_assignments_user_date_unique` UNIQUE(`user_id`,`local_date`),
  CONSTRAINT `user_daily_assignments_user_sentence_unique` UNIQUE(`user_id`,`sentence_id`),
  CONSTRAINT `user_daily_assignments_card_fk` FOREIGN KEY (`lesson_card_id`) REFERENCES `lesson_cards`(`id`),
  CONSTRAINT `user_daily_assignments_sentence_fk` FOREIGN KEY (`sentence_id`) REFERENCES `corpus_sentences`(`id`)
);
CREATE INDEX `user_daily_assignments_review_idx` ON `user_daily_assignments` (`user_id`,`next_review_at`);

CREATE TABLE `user_sentence_history` (
  `user_id` varchar(128) NOT NULL,
  `sentence_id` bigint unsigned NOT NULL,
  `first_assigned_at` datetime NOT NULL,
  `assignment_id` bigint unsigned NOT NULL,
  CONSTRAINT `user_sentence_history_primary` PRIMARY KEY(`user_id`,`sentence_id`),
  CONSTRAINT `user_sentence_history_sentence_fk` FOREIGN KEY (`sentence_id`) REFERENCES `corpus_sentences`(`id`)
);
