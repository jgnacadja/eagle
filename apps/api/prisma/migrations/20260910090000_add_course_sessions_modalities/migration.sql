-- AlterTable
ALTER TABLE "courses" ADD COLUMN "center_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "modalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "sessions" JSONB,
ADD COLUMN "locations_text" TEXT;

CREATE INDEX "courses_center_slugs_idx" ON "courses" USING GIN ("center_slugs");
CREATE INDEX "courses_modalities_idx" ON "courses" USING GIN ("modalities");
