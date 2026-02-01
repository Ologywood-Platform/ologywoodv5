CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100),
  `priority` enum('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` enum('open', 'in_progress', 'waiting_user', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_ticket_responses` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ticketId` int NOT NULL,
  `responderId` int NOT NULL,
  `response` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticket_id` (`ticketId`),
  INDEX `idx_responder_id` (`responderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
