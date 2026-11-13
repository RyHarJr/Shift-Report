-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(60) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_sessions_tokenHash_key`(`tokenHash`),
    INDEX `admin_sessions_userId_idx`(`userId`),
    INDEX `admin_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_reports` (
    `id` VARCHAR(191) NOT NULL,
    `customer` VARCHAR(150) NOT NULL DEFAULT 'PT Tanjung Enim Lestari',
    `reportDate` DATE NOT NULL,
    `inspectionBy` VARCHAR(150) NOT NULL,
    `chipperType` ENUM('HHQ_16', 'CAMURA_1', 'CAMURA_2') NOT NULL,
    `chipLengthSetUp` DOUBLE NOT NULL,
    `typeOfKnifeSystem` VARCHAR(100) NOT NULL,
    `typeOfInspection` VARCHAR(100) NOT NULL DEFAULT 'Daily Inspection',
    `adjustChipLengthFrom` DOUBLE NULL,
    `adjustChipLengthTo` DOUBLE NULL,
    `signature` TEXT NULL,
    `startChipperTime` VARCHAR(10) NOT NULL,
    `stopChipperTime` VARCHAR(10) NOT NULL,
    `shift` ENUM('I', 'II', 'III') NOT NULL,
    `samplingTime` VARCHAR(10) NOT NULL,
    `oversize` DOUBLE NOT NULL,
    `overthick` DOUBLE NOT NULL,
    `largeAccept` DOUBLE NOT NULL,
    `smallAccept` DOUBLE NOT NULL,
    `pin` DOUBLE NOT NULL,
    `fines` DOUBLE NOT NULL,
    `barkContent` DOUBLE NOT NULL,
    `moisture` DOUBLE NOT NULL,
    `dataSourceChipClassifier` BOOLEAN NOT NULL DEFAULT true,
    `samplingDoneByCostumer` BOOLEAN NOT NULL DEFAULT true,
    `totalAccept` DOUBLE NOT NULL,
    `pinPlusFines` DOUBLE NOT NULL,
    `chipQualityRemarks` TEXT NULL,
    `layerObservation` ENUM('SINGLE_LAYER', 'MULTI_LAYER') NULL,
    `logConditionDry` BOOLEAN NOT NULL DEFAULT false,
    `logConditionFresh` BOOLEAN NOT NULL DEFAULT false,
    `lotsOfBark` BOOLEAN NULL,
    `lotsOfSand` BOOLEAN NULL,
    `thereIsAStone` BOOLEAN NULL,
    `operationalPhotoUrl` VARCHAR(500) NULL,
    `tDimensionMm` DOUBLE NULL,
    `tDimensionLastSettingDate` DATE NULL,
    `clearanceAnvilMm` DOUBLE NULL,
    `clearanceAnvilLastSettingDate` DATE NULL,
    `geometryRemarks` TEXT NULL,
    `partKnife` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partClamps` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partHolder` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partKnifeBolt` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partWearPlate` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partFillerPiece` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partDiscCover` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partChipSlot` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partWings` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partBedKnife` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partSideWearPlateInner` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partSideWearPlateOuter` ENUM('GOOD', 'WORN_OUT', 'BROKEN') NULL,
    `partRemarks` TEXT NULL,
    `logYardNumber` VARCHAR(50) NULL,
    `logAgeYears` DOUBLE NULL,
    `logAgingMonths` DOUBLE NULL,
    `avgLogDiameterCm` DOUBLE NULL,
    `logMoisturePct` DOUBLE NULL,
    `diameterPct1` DOUBLE NULL,
    `diameterMm1` DOUBLE NULL,
    `diameterPct2` DOUBLE NULL,
    `diameterMm2` DOUBLE NULL,
    `rawMaterialRemarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `shift_reports_reportDate_idx`(`reportDate`),
    INDEX `shift_reports_chipperType_reportDate_idx`(`chipperType`, `reportDate`),
    INDEX `shift_reports_shift_idx`(`shift`),
    INDEX `shift_reports_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
