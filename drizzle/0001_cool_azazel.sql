CREATE TABLE `ai_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text,
	`model_name` text NOT NULL,
	`latency_ms` integer NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`total_tokens` integer,
	`success` integer NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_requests_created` ON `ai_requests` (`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`scope` text NOT NULL,
	`identifier_hash` text NOT NULL,
	`window_start` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`scope`, `identifier_hash`, `window_start`)
);
--> statement-breakpoint
ALTER TABLE `analyses` ADD `latency_ms` integer;--> statement-breakpoint
ALTER TABLE `analyses` ADD `input_tokens` integer;--> statement-breakpoint
ALTER TABLE `analyses` ADD `output_tokens` integer;--> statement-breakpoint
ALTER TABLE `analyses` ADD `total_tokens` integer;--> statement-breakpoint
ALTER TABLE `analyses` ADD `retry_count` integer DEFAULT 0 NOT NULL;