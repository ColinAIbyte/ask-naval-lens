CREATE TRIGGER `trg_analysis_request_reserve_free`
BEFORE UPDATE OF `reservation` ON `analysis_requests`
WHEN OLD.`reservation` IS NULL AND NEW.`reservation` = 'free'
BEGIN
  INSERT INTO `daily_usage` (`subject_id`, `usage_date`, `count`)
  VALUES (NEW.`subject_id`, NEW.`usage_period`, 1)
  ON CONFLICT (`subject_id`, `usage_date`)
  DO UPDATE SET `count` = `count` + 1 WHERE `count` < 3;
  SELECT CASE WHEN changes() = 0 THEN RAISE(IGNORE) END;
END;
--> statement-breakpoint
CREATE TRIGGER `trg_analysis_request_reserve_paid`
BEFORE UPDATE OF `reservation` ON `analysis_requests`
WHEN OLD.`reservation` IS NULL AND NEW.`reservation` = 'paid'
BEGIN
  UPDATE `credit_balances`
  SET `credits` = `credits` - 1, `updated_at` = datetime('now')
  WHERE `user_id` = NEW.`reservation_user_id` AND `credits` > 0;
  SELECT CASE WHEN changes() = 0 THEN RAISE(IGNORE) END;
END;
--> statement-breakpoint
CREATE TRIGGER `trg_analysis_request_refund_free`
AFTER UPDATE OF `reservation` ON `analysis_requests`
WHEN OLD.`reservation` = 'free' AND NEW.`reservation` IS NULL AND NEW.`status` = 'failed'
BEGIN
  UPDATE `daily_usage`
  SET `count` = MAX(`count` - 1, 0)
  WHERE `subject_id` = NEW.`subject_id` AND `usage_date` = OLD.`usage_period`;
END;
--> statement-breakpoint
CREATE TRIGGER `trg_analysis_request_refund_paid`
AFTER UPDATE OF `reservation` ON `analysis_requests`
WHEN OLD.`reservation` = 'paid' AND NEW.`reservation` IS NULL AND NEW.`status` = 'failed'
BEGIN
  UPDATE `credit_balances`
  SET `credits` = `credits` + 1, `updated_at` = datetime('now')
  WHERE `user_id` = OLD.`reservation_user_id`;
END;
