DELETE FROM "almanac"."association_editions";--> statement-breakpoint
UPDATE "almanac"."associations" AS "association"
SET "source_id" = "replacement"."source_id"
FROM (VALUES
  ('placement-tch', 'czechoslovakia'),
  ('placement-urs', 'soviet-union'),
  ('placement-yug', 'yugoslavia')
) AS "replacement"("placeholder_id", "source_id")
WHERE "association"."source_id" = "replacement"."placeholder_id"
  AND NOT EXISTS (
    SELECT 1
    FROM "almanac"."associations" AS "existing"
    WHERE "existing"."source_id" = "replacement"."source_id"
  );--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" DROP CONSTRAINT "association_editions_placement_check";--> statement-breakpoint
DROP INDEX "almanac"."association_editions_edition_placement_unique";--> statement-breakpoint
DROP INDEX "almanac"."associations_fifa_code_unique";--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ALTER COLUMN "placement" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD COLUMN "phase" text NOT NULL;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD COLUMN "placement_is_tied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" DROP COLUMN "result";--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD CONSTRAINT "association_editions_placement_check" CHECK ("almanac"."association_editions"."placement" > 0);
