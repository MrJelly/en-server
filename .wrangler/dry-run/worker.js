var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/cloudflare/d1DailyRepository.ts
function toCard(row) {
  return {
    lessonCardId: row.lesson_card_id,
    sentenceId: row.sentence_id,
    text: row.normalized_text,
    translationZh: row.translation_zh
  };
}
__name(toCard, "toCard");
function toAssignment(row, kind, localDate = row.local_date) {
  return {
    id: row.id,
    userId: row.user_id,
    localDate,
    card: toCard(row),
    kind
  };
}
__name(toAssignment, "toAssignment");
var assignmentSelect = `
  SELECT a.id, a.user_id, a.local_date, a.lesson_card_id, a.sentence_id,
         s.normalized_text, c.translation_zh
  FROM user_daily_assignments a
  JOIN lesson_cards c ON c.id = a.lesson_card_id
  JOIN corpus_sentences s ON s.id = a.sentence_id`;
var D1DailyRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  static {
    __name(this, "D1DailyRepository");
  }
  async findDueReview(userId, localDate) {
    const row = await this.db.prepare(`${assignmentSelect}
      WHERE a.user_id = ?1 AND a.next_review_at IS NOT NULL AND a.next_review_at <= ?2
      ORDER BY a.next_review_at, a.id LIMIT 1`).bind(userId, `${localDate}T23:59:59Z`).first();
    return row ? toAssignment(row, "review", localDate) : null;
  }
  async listCandidates(bucket, limit) {
    const result = await this.db.prepare(`
      SELECT c.id AS lesson_card_id, s.id AS sentence_id,
             s.normalized_text, c.translation_zh
      FROM corpus_sentences s
      JOIN lesson_cards c ON c.sentence_id = s.id
      WHERE s.quality_status = 'approved' AND s.sample_bucket = ?1
        AND c.status = 'published' AND c.daily_eligible = 1
      ORDER BY s.id LIMIT ?2`).bind(bucket, Math.min(limit, 3)).all();
    return result.results.map(toCard);
  }
  async tryClaimNew(input) {
    const existing = await this.findForDate(input.userId, input.localDate);
    if (existing)
      return { kind: "existing", assignment: existing };
    try {
      await this.db.batch([
        this.db.prepare(`
          INSERT INTO user_daily_assignments
            (user_id, local_date, lesson_card_id, sentence_id)
          VALUES (?1, ?2, ?3, ?4)`).bind(
          input.userId,
          input.localDate,
          input.card.lessonCardId,
          input.card.sentenceId
        ),
        this.db.prepare(`
          INSERT INTO user_sentence_history
            (user_id, sentence_id, assignment_id)
          VALUES (?1, ?2, (
            SELECT id FROM user_daily_assignments
            WHERE user_id = ?1 AND local_date = ?3
          ))`).bind(input.userId, input.card.sentenceId, input.localDate)
      ]);
    } catch {
      const concurrent = await this.findForDate(input.userId, input.localDate);
      if (concurrent)
        return { kind: "existing", assignment: concurrent };
      return { kind: "seen" };
    }
    const created = await this.findForDate(input.userId, input.localDate);
    if (!created)
      throw new Error("D1 claim succeeded without creating an assignment");
    return { kind: "created", assignment: created };
  }
  async findForDate(userId, localDate) {
    const row = await this.db.prepare(`${assignmentSelect}
      WHERE a.user_id = ?1 AND a.local_date = ?2 LIMIT 1`).bind(userId, localDate).first();
    return row ? toAssignment(row, "new") : null;
  }
};

// src/services/dailyAllocator.ts
var MAX_BUCKET_ATTEMPTS = 5;
var CANDIDATES_PER_BUCKET = 3;
function bucketSequence(userId, localDate) {
  let hash = 2166136261;
  for (const character of `${userId}:${localDate}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const start = (hash >>> 0) % 1e3;
  return Array.from({ length: MAX_BUCKET_ATTEMPTS }, (_, index) => (start + index * 137) % 1e3);
}
__name(bucketSequence, "bucketSequence");
var DailyAllocator = class {
  constructor(repository) {
    this.repository = repository;
  }
  repository;
  static {
    __name(this, "DailyAllocator");
  }
  async getDaily(userId, localDate) {
    const review = await this.repository.findDueReview(userId, localDate);
    if (review)
      return review;
    for (const bucket of bucketSequence(userId, localDate)) {
      const candidates = await this.repository.listCandidates(bucket, CANDIDATES_PER_BUCKET);
      for (const card of candidates) {
        const result = await this.repository.tryClaimNew({ userId, localDate, card });
        if (result.kind === "created" || result.kind === "existing")
          return result.assignment;
      }
    }
    return { kind: "pool_exhausted", userId, localDate };
  }
};

// src/worker.ts
var datePattern = /^\d{4}-\d{2}-\d{2}$/;
function json(data, status, origin) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store"
    }
  });
}
__name(json, "json");
function createWorkerHandler(createRepository = (env) => new D1DailyRepository(env.DB)) {
  return /* @__PURE__ */ __name(async function fetch(request, env) {
    const origin = env.CORS_ORIGIN ?? "*";
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return json({ status: "ok", runtime: "cloudflare-workers" }, 200, origin);
    if (url.pathname.startsWith("/media/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      if (!key || key.includes(".."))
        return json({ code: "INVALID_MEDIA_KEY" }, 400, origin);
      const object = await env.MEDIA.get(key);
      if (!object)
        return json({ code: "MEDIA_NOT_FOUND" }, 404, origin);
      const headers = new Headers({ "Access-Control-Allow-Origin": origin, "Cache-Control": "public, max-age=86400" });
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }
    if (url.pathname !== "/v1/daily" || request.method !== "GET")
      return json({ code: "NOT_FOUND" }, 404, origin);
    const userId = url.searchParams.get("userId")?.trim() ?? "";
    const localDate = url.searchParams.get("date")?.trim() || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (!userId || userId.length > 128)
      return json({ code: "INVALID_USER_ID", message: "userId is required and must be at most 128 characters" }, 400, origin);
    if (!datePattern.test(localDate))
      return json({ code: "INVALID_DATE", message: "date must use YYYY-MM-DD" }, 400, origin);
    try {
      const result = await new DailyAllocator(createRepository(env)).getDaily(userId, localDate);
      if (result.kind === "pool_exhausted")
        return json({ code: "POOL_EXHAUSTED", ...result }, 409, origin);
      return json(result, 200, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isLimit = /limit|quota|too many/i.test(message);
      return json({ code: isLimit ? "FREE_TIER_LIMIT" : "SERVICE_UNAVAILABLE" }, 503, origin);
    }
  }, "fetch");
}
__name(createWorkerHandler, "createWorkerHandler");
var worker_default = { fetch: createWorkerHandler() };
export {
  createWorkerHandler,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
