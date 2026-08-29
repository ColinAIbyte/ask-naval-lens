import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(), subjectId: text('subject_id').notNull(), userId: text('user_id'), locale: text('locale').notNull(), topic: text('topic').notNull(), question: text('question').notNull(), resultJson: text('result_json').notNull(), mode: text('mode').notNull(), modelName: text('model_name'), promptVersion: text('prompt_version').notNull(), createdAt: text('created_at').notNull(),
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
