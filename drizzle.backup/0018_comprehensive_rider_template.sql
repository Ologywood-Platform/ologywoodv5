-- Add comprehensive rider template fields
ALTER TABLE `rider_templates` ADD COLUMN `description` text;
ALTER TABLE `rider_templates` ADD COLUMN `genre` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `performanceType` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `performanceDuration` int;
ALTER TABLE `rider_templates` ADD COLUMN `setupTimeRequired` int;
ALTER TABLE `rider_templates` ADD COLUMN `soundcheckTimeRequired` int;
ALTER TABLE `rider_templates` ADD COLUMN `teardownTimeRequired` int;
ALTER TABLE `rider_templates` ADD COLUMN `numberOfPerformers` int;

-- Technical Requirements
ALTER TABLE `rider_templates` ADD COLUMN `paSystemRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `microphoneType` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `monitorMixRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `diBoxesNeeded` int;
ALTER TABLE `rider_templates` ADD COLUMN `audioInterface` varchar(255);
ALTER TABLE `rider_templates` ADD COLUMN `lightingRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `lightingType` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `specialEffects` text;
ALTER TABLE `rider_templates` ADD COLUMN `stageDimensions` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `stageHeight` decimal(5, 2);
ALTER TABLE `rider_templates` ADD COLUMN `backdropRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `backdropDetails` text;
ALTER TABLE `rider_templates` ADD COLUMN `bringingOwnEquipment` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `equipmentList` text;
ALTER TABLE `rider_templates` ADD COLUMN `powerRequirements` text;
ALTER TABLE `rider_templates` ADD COLUMN `backupEquipment` text;

-- Hospitality Requirements
ALTER TABLE `rider_templates` ADD COLUMN `dressingRoomRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `roomTemperature` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `furnitureNeeded` json;
ALTER TABLE `rider_templates` ADD COLUMN `amenities` json;
ALTER TABLE `rider_templates` ADD COLUMN `cateringProvided` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `dietaryRestrictions` json;
ALTER TABLE `rider_templates` ADD COLUMN `specificDietaryNeeds` text;
ALTER TABLE `rider_templates` ADD COLUMN `beverages` json;
ALTER TABLE `rider_templates` ADD COLUMN `mealTiming` text;
ALTER TABLE `rider_templates` ADD COLUMN `parkingRequired` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `parkingType` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `loadInAccess` text;
ALTER TABLE `rider_templates` ADD COLUMN `accessibleEntrance` boolean DEFAULT false;

-- Travel & Accommodation
ALTER TABLE `rider_templates` ADD COLUMN `travelProvided` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `travelMethod` varchar(100);
ALTER TABLE `rider_templates` ADD COLUMN `accommodationProvided` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `hotelRequirements` text;
ALTER TABLE `rider_templates` ADD COLUMN `numberOfRooms` int;
ALTER TABLE `rider_templates` ADD COLUMN `checkInCheckOut` text;
ALTER TABLE `rider_templates` ADD COLUMN `groundTransportation` text;

-- Merchandise & Promotion
ALTER TABLE `rider_templates` ADD COLUMN `merchandiseSales` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `merchandiseCut` decimal(5, 2);
ALTER TABLE `rider_templates` ADD COLUMN `photographyAllowed` boolean DEFAULT true;
ALTER TABLE `rider_templates` ADD COLUMN `videoRecordingAllowed` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `socialMediaPermission` boolean DEFAULT true;
ALTER TABLE `rider_templates` ADD COLUMN `broadcastingRights` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `promotionalMaterials` text;

-- Additional
ALTER TABLE `rider_templates` ADD COLUMN `specialRequests` text;
ALTER TABLE `rider_templates` ADD COLUMN `emergencyContact` varchar(255);
ALTER TABLE `rider_templates` ADD COLUMN `additionalNotes` text;

-- Metadata
ALTER TABLE `rider_templates` ADD COLUMN `isPublished` boolean DEFAULT false;
ALTER TABLE `rider_templates` ADD COLUMN `version` int DEFAULT 1;

-- Drop old columns if they exist
ALTER TABLE `rider_templates` DROP COLUMN IF EXISTS `technicalRequirements`;
ALTER TABLE `rider_templates` DROP COLUMN IF EXISTS `hospitalityRequirements`;
ALTER TABLE `rider_templates` DROP COLUMN IF EXISTS `financialTerms`;
