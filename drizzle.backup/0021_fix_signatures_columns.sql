-- Fix signatures table column case sensitivity
-- Rename lowercase columns to camelCase to match schema definition

ALTER TABLE `signatures` CHANGE COLUMN `createdat` `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `signatures` CHANGE COLUMN `updatedat` `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `signatures` CHANGE COLUMN `signedat` `signedAt` DATETIME;
ALTER TABLE `signatures` CHANGE COLUMN `contractid` `contractId` INT;
ALTER TABLE `signatures` CHANGE COLUMN `signerid` `signerId` INT;
ALTER TABLE `signatures` CHANGE COLUMN `signaturedata` `signatureData` LONGTEXT;
