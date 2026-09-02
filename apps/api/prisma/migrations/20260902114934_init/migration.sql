-- CreateTable
CREATE TABLE "public"."formations" (
    "id" SERIAL NOT NULL,
    "digiforma_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration_days" INTEGER,
    "duration_hours" INTEGER,
    "price" DECIMAL(10,2),
    "cpf" BOOLEAN,
    "cpf_code" TEXT,
    "certification" TEXT,
    "certifier_name" TEXT,
    "category" TEXT,
    "family_slug" TEXT,
    "center_slug" TEXT,
    "blocks" JSONB,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_canonical" TEXT,
    "raw" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_runs" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formations_digiforma_id_key" ON "public"."formations"("digiforma_id");

-- CreateIndex
CREATE INDEX "formations_family_slug_idx" ON "public"."formations"("family_slug");

-- CreateIndex
CREATE INDEX "formations_status_idx" ON "public"."formations"("status");

-- CreateIndex
CREATE INDEX "formations_slug_idx" ON "public"."formations"("slug");

-- CreateIndex
CREATE INDEX "formations_category_idx" ON "public"."formations"("category");

-- CreateIndex
CREATE INDEX "sync_runs_status_idx" ON "public"."sync_runs"("status");

-- CreateIndex
CREATE INDEX "sync_runs_started_at_idx" ON "public"."sync_runs"("started_at");
