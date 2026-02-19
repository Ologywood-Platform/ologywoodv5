-- Create signatures table if it doesn't exist
CREATE TABLE IF NOT EXISTS `signatures` (
  `id` int AUTO_INCREMENT NOT NULL,
  `contractid` int NOT NULL,
  `signerid` int NOT NULL,
  `signaturedata` text,
  `signedat` timestamp,
  `createdat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`contractid`) REFERENCES `contracts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`signerid`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
