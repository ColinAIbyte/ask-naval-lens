CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`user_id` text,
	`locale` text NOT NULL,
	`topic` text NOT NULL,
	`question` text NOT NULL,
	`result_json` text NOT NULL,
	`mode` text NOT NULL,
	`model_name` text,
	`prompt_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analyses_subject_created` ON `analyses` (`subject_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text,
	`event_name` text NOT NULL,
	`properties_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_event_created` ON `analytics_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE TABLE `credit_balances` (
	`user_id` text PRIMARY KEY NOT NULL,
	`credits` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_usage` (
	`subject_id` text NOT NULL,
	`usage_date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`subject_id`, `usage_date`)
);
--> statement-breakpoint
CREATE TABLE `entitlement_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`analysis_id` text,
	`payment_event_id` text,
	`idempotency_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entitlement_ledger_user` ON `entitlement_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_entitlement_idempotency` ON `entitlement_ledger` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`analysis_id` text PRIMARY KEY NOT NULL,
	`rating` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`provider_event_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount_total` integer,
	`currency` text,
	`credits` integer NOT NULL,
	`created_at` text NOT NULL
);
