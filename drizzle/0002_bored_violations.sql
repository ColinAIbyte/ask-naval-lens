CREATE TABLE `analysis_requests` (
	`subject_id` text NOT NULL,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`analysis_id` text,
	`response_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`subject_id`, `request_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_analysis_requests_updated` ON `analysis_requests` (`updated_at`);