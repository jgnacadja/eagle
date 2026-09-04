-- Enable unaccent to normalise accents in full-text search.
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- unaccent is STABLE, so generated columns cannot use it directly.
-- We wrap it in an IMMUTABLE SQL function for use in generated columns/indexes.
CREATE OR REPLACE FUNCTION "course_immutable_unaccent"(text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    AS $$ SELECT unaccent($1) $$;

-- Generated tsvector columns using the French dictionary and accent-stripping.
ALTER TABLE "public"."courses"
    ADD COLUMN "title_tsv" tsvector
        GENERATED ALWAYS AS (to_tsvector('french'::regconfig, "course_immutable_unaccent"(coalesce("title", '')))) STORED;

ALTER TABLE "public"."courses"
    ADD COLUMN "description_tsv" tsvector
        GENERATED ALWAYS AS (to_tsvector('french'::regconfig, "course_immutable_unaccent"(coalesce("description", '')))) STORED;

-- GIN indexes so the French full-text filter/order uses index access.
CREATE INDEX "courses_title_tsv_idx" ON "public"."courses" USING GIN ("title_tsv");
CREATE INDEX "courses_description_tsv_idx" ON "public"."courses" USING GIN ("description_tsv");
