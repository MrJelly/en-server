-- Curated from Mozilla Common Voice's official English sentence collector.
-- Dataset/source license: CC0-1.0. Reviewed 2026-07-10.

INSERT OR IGNORE INTO corpus_sources
  (code, name, official_url, default_license, enabled)
VALUES
  ('common_voice', 'Mozilla Common Voice English',
   'https://commonvoice.mozilla.org/en/datasets', 'CC0-1.0', 1);

INSERT OR IGNORE INTO corpus_sentences
  (source_id, external_id, normalized_text, text_sha256, language, license,
   source_url, quality_status, cefr_level, scene_key, sample_bucket)
VALUES
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:55213', 'Where can I find the enquiry desk?', '2d21e8aca18e2d3533609a3dff0be9b2ed730338528dca902d25c00865be2e2c', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A2', 'getting_around', 198),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:54616', 'What time is there a train?', 'fac17de39f78378d31e204f256596235e822cbebb0b7c4b6ad068864d89b7e2a', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'getting_around', 755),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:18324', 'How much does it cost to park for one hour?', '497bf8fb2390968674b138143c408951bf0dc0ef5bd1cb0cec1f8683c9b9205c', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A2', 'getting_around', 742),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:21530', 'I need a glass of water.', 'e61bdb2c94634b16383d52f772d4a56adfab09aaeb21e5ab16d25d9179a88244', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'coffee_and_food', 854),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:21534', 'I need help.', '41fe09dacce63eccf2d6d57ecded6acecfd4c835f1936abc3a1433f5533aa2a4', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'daily_life', 203),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:34271', 'Please be quiet, I''m trying to study.', '5d9fe8594932f7af4f35e27d69ff0903df79f0549b2609d543cb1cded2d13b3b', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A2', 'daily_life', 481),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:39135', 'Thank you for waiting.', '4f9a8705d94db724bddeea84a721ff0e87a1d67fac47729f408d1c05a06abda5', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'meeting_people', 650),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:29902', 'May I ask a question?', 'b13b201253d571655ba935c38213f2eec61b9dd09b6ac2e5dfad9bb5ad8c76a6', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'meeting_people', 737),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:56344', 'Would you care for something to drink?', 'f12f53c3823a7da44ad4ac9b4248332b994939c5c79d88d96bc710cbcbe976c7', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A2', 'coffee_and_food', 642),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:9067', 'Could you put the sauce on the side?', '04c1ad3f978378848b524fedf41bd015d7351b6c67fa9fd4e2fd5e9c725c6ed3', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A2', 'coffee_and_food', 765),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:8184', 'Can I be of any assistance?', '2845db027d14ef02b10d13ef909555481e44fe2929b50ec337767d7e74300641', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'meeting_people', 421),
  ((SELECT id FROM corpus_sources WHERE code='common_voice'), 'sentence-collector:9759', 'Do you have allergies?', '2adfeb4bd0b09f8d01e76642dd0aefeaeaa357eafebe2a33193c22ba980f10a4', 'en', 'CC0-1.0', 'https://github.com/common-voice/common-voice/blob/main/server/data/en/sentence-collector.txt', 'approved', 'A1', 'coffee_and_food', 25);

INSERT OR IGNORE INTO lesson_cards
  (sentence_id, title_zh, translation_zh, teaching_note_zh, status,
   daily_eligible, published_at)
SELECT id, 'Common Voice 日常口语',
  CASE external_id
    WHEN 'sentence-collector:55213' THEN '请问咨询台在哪里？'
    WHEN 'sentence-collector:54616' THEN '几点有火车？'
    WHEN 'sentence-collector:18324' THEN '停车一小时要多少钱？'
    WHEN 'sentence-collector:21530' THEN '我需要一杯水。'
    WHEN 'sentence-collector:21534' THEN '我需要帮助。'
    WHEN 'sentence-collector:34271' THEN '请安静，我正在学习。'
    WHEN 'sentence-collector:39135' THEN '谢谢你的等待。'
    WHEN 'sentence-collector:29902' THEN '我可以问一个问题吗？'
    WHEN 'sentence-collector:56344' THEN '你想喝点什么吗？'
    WHEN 'sentence-collector:9067' THEN '你能把酱汁放在旁边吗？'
    WHEN 'sentence-collector:8184' THEN '有什么我可以帮忙的吗？'
    WHEN 'sentence-collector:9759' THEN '你有过敏症吗？'
  END,
  '来源：Mozilla Common Voice 英语句库（CC0-1.0）',
  'published', 1, CURRENT_TIMESTAMP
FROM corpus_sentences
WHERE source_id=(SELECT id FROM corpus_sources WHERE code='common_voice');
