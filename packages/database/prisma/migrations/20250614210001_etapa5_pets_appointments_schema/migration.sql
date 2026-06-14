-- CreateEnum
CREATE TYPE "PartnerServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ServiceModality" AS ENUM ('IN_PERSON', 'HOME', 'ONLINE', 'PICKUP_DELIVERY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Allergy" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "partnerId" TEXT,
ADD COLUMN IF NOT EXISTS "serviceId" TEXT;

ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "modality" "ServiceModality",
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "speciesTarget" "PetSpecies",
ADD COLUMN IF NOT EXISTS "status" "PartnerServiceStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE IF NOT EXISTS "PetReminder" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PetDocument" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentDate" TIMESTAMP(3),
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PartnerAvailability" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PartnerBlockedSlot" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerBlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PetReminder_petId_dueAt_idx" ON "PetReminder"("petId", "dueAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PetReminder_status_idx" ON "PetReminder"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PetDocument_petId_idx" ON "PetDocument"("petId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PetDocument_ownerId_idx" ON "PetDocument"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerAvailability_partnerId_weekday_idx" ON "PartnerAvailability"("partnerId", "weekday");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerBlockedSlot_partnerId_startAt_idx" ON "PartnerBlockedSlot"("partnerId", "startAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_partnerId_status_idx" ON "Appointment"("partnerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Pet_deletedAt_idx" ON "Pet"("deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_providerId_status_idx" ON "Service"("providerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_deletedAt_idx" ON "Service"("deletedAt");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "PetReminder" ADD CONSTRAINT "PetReminder_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "PetDocument" ADD CONSTRAINT "PetDocument_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "PetDocument" ADD CONSTRAINT "PetDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "PartnerAvailability" ADD CONSTRAINT "PartnerAvailability_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "PartnerBlockedSlot" ADD CONSTRAINT "PartnerBlockedSlot_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
