-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "matchConfirmationId" UUID;

-- CreateTable
CREATE TABLE "MatchConfirmation" (
    "id" UUID NOT NULL,
    "matchResultId" UUID NOT NULL,
    "confirmedById" UUID NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchConfirmation_matchResultId_key" ON "MatchConfirmation"("matchResultId");

-- CreateIndex
CREATE INDEX "MatchConfirmation_confirmedById_idx" ON "MatchConfirmation"("confirmedById");

-- AddForeignKey
ALTER TABLE "MatchConfirmation" ADD CONSTRAINT "MatchConfirmation_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_matchConfirmationId_fkey" FOREIGN KEY ("matchConfirmationId") REFERENCES "MatchConfirmation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
