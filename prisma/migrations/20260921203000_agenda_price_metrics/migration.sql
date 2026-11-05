-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('CONFIRMED', 'PENDING', 'OUTDATED');

-- CreateEnum
CREATE TYPE "EntryPriceType" AS ENUM ('FREE', 'COUVERT', 'TICKET', 'UP_TO', 'FROM');

-- CreateEnum
CREATE TYPE "ReportProblemType" AS ENUM ('WRONG_TIME', 'CANCELLED', 'WRONG_VENUE', 'WRONG_ARTIST', 'OTHER');

-- CreateEnum
CREATE TYPE "ClickTarget" AS ENUM ('ROUTE', 'WHATSAPP', 'PHONE', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "ClickEntityType" AS ENUM ('EVENT', 'ESTABLISHMENT', 'ARTIST');

-- AlterTable Artist
ALTER TABLE "Artist" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "Artist" ADD COLUMN "hireUrl" TEXT;

-- AlterTable Event
ALTER TABLE "Event" ADD COLUMN "agendaStatus" "AgendaStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Event" ADD COLUMN "entryPriceType" "EntryPriceType";
ALTER TABLE "Event" ADD COLUMN "entryPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "EventReport" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "problemType" "ReportProblemType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "EventReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickMetric" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "target" "ClickTarget" NOT NULL,
    "entityType" "ClickEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_agendaStatus_idx" ON "Event"("agendaStatus");

-- CreateIndex
CREATE INDEX "EventReport_eventId_idx" ON "EventReport"("eventId");

-- CreateIndex
CREATE INDEX "EventReport_createdAt_idx" ON "EventReport"("createdAt");

-- CreateIndex
CREATE INDEX "EventReport_resolvedAt_idx" ON "EventReport"("resolvedAt");

-- CreateIndex
CREATE INDEX "ClickMetric_target_createdAt_idx" ON "ClickMetric"("target", "createdAt");

-- CreateIndex
CREATE INDEX "ClickMetric_entityType_entityId_idx" ON "ClickMetric"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ClickMetric_createdAt_idx" ON "ClickMetric"("createdAt");

-- AddForeignKey
ALTER TABLE "EventReport" ADD CONSTRAINT "EventReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
