-- ============================================================================
-- Drizzle Migration: Age-Based Aggressive Eviction Policy Implementation
-- ============================================================================
-- Purpose: Implement automated Age-Based Aggressive Eviction Policy
-- Retention: 7 days (delete embeddings unused for 7+ days)
-- Frequency: Daily at 2 AM
-- Expected Deletion: 30-40% of cache per run
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE MAINTENANCE TRACKING TABLE
-- ============================================================================
-- Purpose: Track all eviction operations for monitoring and auditing

CREATE TABLE IF NOT EXISTS `eviction_maintenance_log` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `policy_name` varchar(50) NOT NULL DEFAULT 'aggressive-age-based',
  `execution_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `embeddings_deleted` int NOT NULL DEFAULT 0,
  `space_freed_mb` decimal(10, 2) NOT NULL DEFAULT 0,
  `cache_size_before_mb` decimal(10, 2) NOT NULL DEFAULT 0,
  `cache_size_after_mb` decimal(10, 2) NOT NULL DEFAULT 0,
  `execution_time_ms` int NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'success',
  `error_message` text,
  `parameters` json,
  `notes` text,
  
  -- Indexes for efficient querying
  KEY `idx_execution_timestamp` (`execution_timestamp`),
  KEY `idx_policy_name` (`policy_name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 2: CREATE EVICTION CONFIGURATION TABLE
-- ============================================================================
-- Purpose: Store configurable eviction parameters

CREATE TABLE IF NOT EXISTS `eviction_policy_config` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `policy_name` varchar(50) NOT NULL UNIQUE,
  `policy_type` varchar(50) NOT NULL,
  `age_threshold_days` int DEFAULT 7,
  `usage_threshold` int DEFAULT NULL,
  `usage_percentile` decimal(3, 2) DEFAULT NULL,
  `max_cache_size_mb` int DEFAULT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `run_frequency` varchar(50) NOT NULL DEFAULT 'daily',
  `run_time` time DEFAULT '02:00:00',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  KEY `idx_policy_name` (`policy_name`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 3: INSERT AGGRESSIVE AGE-BASED POLICY CONFIGURATION
-- ============================================================================

INSERT INTO `eviction_policy_config` (
  `policy_name`,
  `policy_type`,
  `age_threshold_days`,
  `usage_threshold`,
  `usage_percentile`,
  `max_cache_size_mb`,
  `enabled`,
  `run_frequency`,
  `run_time`,
  `description`
) VALUES (
  'aggressive-age-based',
  'age-based',
  7,
  NULL,
  NULL,
  100,
  true,
  'daily',
  '02:00:00',
  'Aggressive age-based eviction: Delete embeddings unused for 7+ days. Expected deletion: 30-40% of cache. Ideal for resource-constrained environments.'
) ON DUPLICATE KEY UPDATE
  `updated_at` = CURRENT_TIMESTAMP;

-- ============================================================================
-- PART 4: CREATE STORED PROCEDURE FOR AGE-BASED EVICTION
-- ============================================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `evict_embeddings_age_based`(
  IN p_age_threshold_days INT,
  OUT p_embeddings_deleted INT,
  OUT p_space_freed_mb DECIMAL(10, 2),
  OUT p_execution_time_ms INT,
  OUT p_status VARCHAR(20),
  OUT p_error_message TEXT
)
BEGIN
  DECLARE v_start_time DATETIME(6);
  DECLARE v_cache_size_before DECIMAL(10, 2);
  DECLARE v_cache_size_after DECIMAL(10, 2);
  DECLARE v_error_occurred BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    SET v_error_occurred = TRUE;
    GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
    SET p_status = 'error';
  END;

  -- Record start time
  SET v_start_time = NOW(6);
  SET p_status = 'running';
  SET p_embeddings_deleted = 0;
  SET p_space_freed_mb = 0;
  SET p_error_message = NULL;

  -- Get cache size before eviction
  SELECT ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2)
  INTO v_cache_size_before
  FROM embedding_cache;

  -- Execute age-based eviction
  DELETE FROM embedding_cache
  WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL p_age_threshold_days DAY);

  IF NOT v_error_occurred THEN
    SET p_embeddings_deleted = ROW_COUNT();

    -- Get cache size after eviction
    SELECT ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2)
    INTO v_cache_size_after
    FROM embedding_cache;

    -- Calculate space freed
    SET p_space_freed_mb = COALESCE(v_cache_size_before, 0) - COALESCE(v_cache_size_after, 0);

    -- Optimize table to reclaim space
    OPTIMIZE TABLE embedding_cache;

    -- Calculate execution time
    SET p_execution_time_ms = ROUND(TIMESTAMPDIFF(MICROSECOND, v_start_time, NOW(6)) / 1000);

    -- Set success status
    SET p_status = 'success';

    -- Log the operation
    INSERT INTO eviction_maintenance_log (
      policy_name,
      execution_timestamp,
      embeddings_deleted,
      space_freed_mb,
      cache_size_before_mb,
      cache_size_after_mb,
      execution_time_ms,
      status,
      parameters
    ) VALUES (
      'aggressive-age-based',
      NOW(),
      p_embeddings_deleted,
      p_space_freed_mb,
      v_cache_size_before,
      v_cache_size_after,
      p_execution_time_ms,
      'success',
      JSON_OBJECT('age_threshold_days', p_age_threshold_days)
    );
  ELSE
    -- Log the error
    INSERT INTO eviction_maintenance_log (
      policy_name,
      execution_timestamp,
      embeddings_deleted,
      status,
      error_message,
      parameters
    ) VALUES (
      'aggressive-age-based',
      NOW(),
      0,
      'error',
      p_error_message,
      JSON_OBJECT('age_threshold_days', p_age_threshold_days)
    );
  END IF;
END //

DELIMITER ;

-- ============================================================================
-- PART 5: CREATE SCHEDULED EVENT FOR DAILY EVICTION
-- ============================================================================

-- Drop existing event if it exists
DROP EVENT IF EXISTS `scheduled_aggressive_eviction`;

-- Create new scheduled event
CREATE EVENT `scheduled_aggressive_eviction`
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(CURDATE(), INTERVAL 1 DAY + INTERVAL 2 HOUR)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Daily aggressive age-based eviction at 2 AM'
DO
BEGIN
  DECLARE v_embeddings_deleted INT;
  DECLARE v_space_freed_mb DECIMAL(10, 2);
  DECLARE v_execution_time_ms INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_error_message TEXT;

  -- Call the eviction procedure with 7-day threshold
  CALL evict_embeddings_age_based(
    7,
    v_embeddings_deleted,
    v_space_freed_mb,
    v_execution_time_ms,
    v_status,
    v_error_message
  );
END;

-- ============================================================================
-- PART 6: CREATE MONITORING VIEWS
-- ============================================================================

-- View 1: Current Cache Status
CREATE OR REPLACE VIEW `v_cache_status` AS
SELECT
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(JSON_LENGTH(embedding)), 2) as avg_embedding_size_bytes,
  ROUND(AVG(usageCount), 2) as avg_usage,
  MIN(usageCount) as min_usage,
  MAX(usageCount) as max_usage,
  MIN(lastUsedAt) as oldest_access,
  MAX(lastUsedAt) as newest_access,
  DATEDIFF(NOW(), MIN(lastUsedAt)) as oldest_days_unused,
  DATEDIFF(NOW(), MAX(lastUsedAt)) as newest_days_unused
FROM embedding_cache;

-- View 2: Eviction Impact Preview
CREATE OR REPLACE VIEW `v_eviction_preview_7day` AS
SELECT
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb,
  ROUND(COUNT(*) / (SELECT COUNT(*) FROM embedding_cache) * 100, 2) as percent_of_cache,
  MIN(lastUsedAt) as oldest_to_delete,
  MAX(lastUsedAt) as newest_to_delete,
  ROUND(AVG(usageCount), 2) as avg_usage_to_delete,
  MIN(usageCount) as min_usage_to_delete,
  MAX(usageCount) as max_usage_to_delete
FROM embedding_cache
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- View 3: Recent Eviction History
CREATE OR REPLACE VIEW `v_eviction_history_recent` AS
SELECT
  id,
  policy_name,
  execution_timestamp,
  embeddings_deleted,
  space_freed_mb,
  cache_size_before_mb,
  cache_size_after_mb,
  execution_time_ms,
  status,
  error_message,
  ROUND((cache_size_before_mb - cache_size_after_mb) / cache_size_before_mb * 100, 2) as percent_reduction
FROM eviction_maintenance_log
WHERE execution_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY execution_timestamp DESC;

-- View 4: Eviction Statistics
CREATE OR REPLACE VIEW `v_eviction_statistics` AS
SELECT
  policy_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_runs,
  ROUND(AVG(embeddings_deleted), 2) as avg_embeddings_deleted,
  ROUND(AVG(space_freed_mb), 2) as avg_space_freed_mb,
  ROUND(AVG(execution_time_ms), 2) as avg_execution_time_ms,
  MAX(execution_timestamp) as last_execution,
  MIN(execution_timestamp) as first_execution
FROM eviction_maintenance_log
GROUP BY policy_name;

-- ============================================================================
-- PART 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function 1: Get cache health score (0-100)
DELIMITER //

CREATE FUNCTION IF NOT EXISTS `get_cache_health_score`()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_total_embeddings INT;
  DECLARE v_avg_usage DECIMAL(10, 2);
  DECLARE v_cache_size_mb DECIMAL(10, 2);
  DECLARE v_health_score INT DEFAULT 0;

  SELECT COUNT(*), ROUND(AVG(usageCount), 2), ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2)
  INTO v_total_embeddings, v_avg_usage, v_cache_size_mb
  FROM embedding_cache;

  -- Calculate health score based on multiple factors
  -- Total embeddings: 0-30 points (optimal: 5,000-10,000)
  IF v_total_embeddings >= 5000 AND v_total_embeddings <= 10000 THEN
    SET v_health_score = v_health_score + 30;
  ELSEIF v_total_embeddings >= 3000 AND v_total_embeddings <= 15000 THEN
    SET v_health_score = v_health_score + 20;
  ELSEIF v_total_embeddings > 0 THEN
    SET v_health_score = v_health_score + 10;
  END IF;

  -- Average usage: 0-35 points (optimal: >3)
  IF v_avg_usage >= 3 THEN
    SET v_health_score = v_health_score + 35;
  ELSEIF v_avg_usage >= 2 THEN
    SET v_health_score = v_health_score + 25;
  ELSEIF v_avg_usage >= 1 THEN
    SET v_health_score = v_health_score + 15;
  END IF;

  -- Cache size: 0-35 points (optimal: 50-150MB)
  IF v_cache_size_mb >= 50 AND v_cache_size_mb <= 150 THEN
    SET v_health_score = v_health_score + 35;
  ELSEIF v_cache_size_mb >= 20 AND v_cache_size_mb <= 200 THEN
    SET v_health_score = v_health_score + 25;
  ELSEIF v_cache_size_mb > 0 THEN
    SET v_health_score = v_health_score + 10;
  END IF;

  RETURN v_health_score;
END //

DELIMITER ;

-- ============================================================================
-- PART 8: CREATE VERIFICATION QUERIES
-- ============================================================================

-- Verification Query 1: Check table structure
-- SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'embedding_cache' AND TABLE_SCHEMA = DATABASE();

-- Verification Query 2: Check indexes
-- SHOW INDEX FROM embedding_cache;

-- Verification Query 3: Check stored procedure
-- SHOW PROCEDURE STATUS WHERE NAME = 'evict_embeddings_age_based';

-- Verification Query 4: Check scheduled event
-- SHOW EVENTS WHERE NAME = 'scheduled_aggressive_eviction';

-- Verification Query 5: Check views
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'v_%';

-- ============================================================================
-- PART 9: MANUAL TESTING QUERIES
-- ============================================================================

-- Test 1: Preview eviction impact
-- SELECT * FROM v_eviction_preview_7day;

-- Test 2: Check cache status
-- SELECT * FROM v_cache_status;

-- Test 3: Manual eviction (for testing)
-- CALL evict_embeddings_age_based(7, @deleted, @freed, @time, @status, @error);
-- SELECT @deleted as embeddings_deleted, @freed as space_freed_mb, @time as execution_time_ms, @status as status;

-- Test 4: Check eviction history
-- SELECT * FROM v_eviction_history_recent;

-- Test 5: Check statistics
-- SELECT * FROM v_eviction_statistics;

-- Test 6: Check cache health
-- SELECT get_cache_health_score() as health_score;

-- ============================================================================
-- PART 10: ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, execute:
-- DROP EVENT IF EXISTS `scheduled_aggressive_eviction`;
-- DROP PROCEDURE IF EXISTS `evict_embeddings_age_based`;
-- DROP FUNCTION IF EXISTS `get_cache_health_score`;
-- DROP VIEW IF EXISTS `v_cache_status`;
-- DROP VIEW IF EXISTS `v_eviction_preview_7day`;
-- DROP VIEW IF EXISTS `v_eviction_history_recent`;
-- DROP VIEW IF EXISTS `v_eviction_statistics`;
-- DROP TABLE IF EXISTS `eviction_policy_config`;
-- DROP TABLE IF EXISTS `eviction_maintenance_log`;

-- ============================================================================
-- PART 11: POST-MIGRATION SETUP
-- ============================================================================

-- Enable the scheduled event (if not already enabled)
-- SET GLOBAL event_scheduler = ON;

-- Verify event is enabled
-- SELECT @@global.event_scheduler;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- This migration implements:
-- 1. ✅ Eviction maintenance log table (tracks all operations)
-- 2. ✅ Eviction policy config table (configurable parameters)
-- 3. ✅ Aggressive age-based policy configuration (7-day retention)
-- 4. ✅ Stored procedure for eviction logic (with error handling)
-- 5. ✅ Scheduled event for daily execution (2 AM)
-- 6. ✅ Monitoring views (cache status, preview, history, statistics)
-- 7. ✅ Helper function (cache health score)
-- 8. ✅ Verification queries (for testing)
-- 9. ✅ Rollback script (for reverting changes)
-- 10. ✅ Post-migration setup (enable scheduler)
--
-- Expected Results:
-- - Daily eviction at 2 AM
-- - 30-40% cache reduction per run
-- - Automatic space reclamation via OPTIMIZE TABLE
-- - Complete audit trail in maintenance log
-- - Real-time monitoring via views
-- ============================================================================
