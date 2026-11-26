-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'EXPERT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('REJECTED_QUALITY', 'LOW_CONFIDENCE', 'CONFIDENT', 'PENDING_REVIEW', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('WEATHER', 'DISEASE', 'PEST', 'PLANTING', 'HARVEST', 'HEALTH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "languages" TEXT[],
    "seasons" JSONB NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localNames" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "growingDaysMin" INTEGER NOT NULL,
    "growingDaysMax" INTEGER NOT NULL,
    "waterNeed" TEXT NOT NULL,
    "tempMinC" DOUBLE PRECISION NOT NULL,
    "tempMaxC" DOUBLE PRECISION NOT NULL,
    "rainfallMinMm" DOUBLE PRECISION NOT NULL,
    "rainfallMaxMm" DOUBLE PRECISION NOT NULL,
    "phMin" DOUBLE PRECISION NOT NULL,
    "phMax" DOUBLE PRECISION NOT NULL,
    "soilTypes" TEXT[],
    "pestRisks" TEXT[],

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CropCalendar" (
    "id" TEXT NOT NULL,
    "cropKey" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regionId" TEXT,
    "plantMonths" INTEGER[],
    "harvestMonths" INTEGER[],
    "notes" TEXT,

    CONSTRAINT "CropCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "key" TEXT NOT NULL,
    "cropKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localNames" JSONB NOT NULL DEFAULT '{}',
    "isHealthy" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "symptoms" TEXT[],
    "causes" TEXT[],
    "treatment" TEXT[],
    "prevention" TEXT[],
    "monitoring" TEXT[],
    "conditions" TEXT[],
    "regions" TEXT[],
    "similarKeys" TEXT[],
    "imageUrls" TEXT[],

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT,
    "sizeHa" DOUBLE PRECISION,
    "soilType" TEXT,
    "soil" JSONB,
    "imageUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmCrop" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropKey" TEXT NOT NULL,
    "plantedAt" TIMESTAMP(3),
    "expectedHarvestAt" TIMESTAMP(3),

    CONSTRAINT "FarmCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "version" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT,
    "cropKey" TEXT,
    "imageUrl" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "description" TEXT,
    "status" "ScanStatus" NOT NULL,
    "predictedLabel" TEXT,
    "confidence" DOUBLE PRECISION,
    "severity" TEXT,
    "candidates" JSONB NOT NULL,
    "quality" JSONB NOT NULL,
    "modelVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanFeedback" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "correctedLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertReview" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "confirmedLabel" TEXT,
    "notes" TEXT,
    "recommendations" TEXT[],
    "useForTraining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ExpertReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT,
    "type" "AlertType" NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryCode_name_key" ON "Region"("countryCode", "name");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "Scan"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScanFeedback_scanId_key" ON "ScanFeedback"("scanId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertReview_scanId_key" ON "ExpertReview"("scanId");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_dedupeKey_key" ON "Alert"("userId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCalendar" ADD CONSTRAINT "CropCalendar_cropKey_fkey" FOREIGN KEY ("cropKey") REFERENCES "Crop"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCalendar" ADD CONSTRAINT "CropCalendar_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCalendar" ADD CONSTRAINT "CropCalendar_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disease" ADD CONSTRAINT "Disease_cropKey_fkey" FOREIGN KEY ("cropKey") REFERENCES "Crop"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_cropKey_fkey" FOREIGN KEY ("cropKey") REFERENCES "Crop"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("version") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanFeedback" ADD CONSTRAINT "ScanFeedback_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
