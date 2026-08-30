import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(), subjectId: text('subject_id').notNull(), userId: text('user_id'), locale: text('locale').notNull(), topic: text('topic').notNull(), question: text('question').notNull(), resultJson: text('result_json').notNull(), mode: text('mode').notNull(), modelName: text('model_name'), promptVersion: text('prompt_version').notNull(), latencyMs: integer('latency_ms'), inputTokens: integer('input_tokens'), outputTokens: integer('output_tokens'), totalTokens: integer('total_tokens'), retryCount: integer('retry_count').notNull().default(0), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_analyses_subject_created').on(table.subjectId, table.createdAt)]);

export const dailyUsage = sqliteTable('daily_usage', {
  subjectId: text('subject_id').notNull(), usageDate: text('usage_date').notNull(), count: integer('count').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.subjectId, table.usageDate] })]);

export const creditBalances = sqliteTable('credit_balances', {
  userId: text('user_id').primaryKey(), credits: integer('credits').notNull().default(0), updatedAt: text('updated_at').notNull(),
});

export const entitlementLedger = sqliteTable('entitlement_ledger', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), delta: integer('delta').notNull(), reason: text('reason').notNull(), analysisId: text('analysis_id'), paymentEventId: text('payment_event_id'), idempotencyKey: text('idempotency_key').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_entitlement_ledger_user').on(table.userId, table.createdAt), uniqueIndex('idx_entitlement_idempotency').on(table.idempotencyKey)]);

export const feedback = sqliteTable('feedback', {
  analysisId: text('analysis_id').primaryKey(), rating: text('rating').notNull(), updatedAt: text('updated_at').notNull(),
});

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(), subjectId: text('subject_id'), eventName: text('event_name').notNull(), propertiesJson: text('properties_json').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_analytics_event_created').on(table.eventName, table.createdAt)]);

export const paymentEvents = sqliteTable('payment_events', {
  providerEventId: text('provider_event_id').primaryKey(), userId: text('user_id').notNull(), amountTotal: integer('amount_total'), currency: text('currency'), credits: integer('credits').notNull(), createdAt: text('created_at').notNull(),
});

export const aiRequests = sqliteTable('ai_requests', {
  id: text('id').primaryKey(), subjectId: text('subject_id'), modelName: text('model_name').notNull(), latencyMs: integer('latency_ms').notNull(), inputTokens: integer('input_tokens'), outputTokens: integer('output_tokens'), totalTokens: integer('total_tokens'), success: integer('success', { mode: 'boolean' }).notNull(), retryCount: integer('retry_count').notNull().default(0), errorCode: text('error_code'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_ai_requests_created').on(table.createdAt)]);

export const analysisRequests = sqliteTable('analysis_requests', {
  subjectId: text('subject_id').notNull(), requestId: text('request_id').notNull(), requestHash: text('request_hash'), status: text('status').notNull(), analysisId: text('analysis_id'), responseJson: text('response_json'), leaseId: text('lease_id'), leaseExpiresAt: text('lease_expires_at'), reservation: text('reservation'), usagePeriod: text('usage_period'), reservationUserId: text('reservation_user_id'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [primaryKey({ columns: [table.subjectId, table.requestId] }), index('idx_analysis_requests_updated').on(table.updatedAt)]);

export const rateLimits = sqliteTable('rate_limits', {
  scope: text('scope').notNull(), identifierHash: text('identifier_hash').notNull(), windowStart: text('window_start').notNull(), count: integer('count').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.scope, table.identifierHash, table.windowStart] })]);
