ALTER TABLE "almanac"."edition_hosts" ADD COLUMN "nation_source_id" text;--> statement-breakpoint
UPDATE "almanac"."edition_hosts" AS "edition_host"
SET "nation_source_id" = "nation"."slug"
FROM "almanac"."nations" AS "nation"
WHERE "edition_host"."nation_id" = "nation"."id";--> statement-breakpoint
ALTER TABLE "almanac"."edition_hosts" ALTER COLUMN "nation_source_id" SET NOT NULL;--> statement-breakpoint
DROP INDEX "almanac"."edition_hosts_edition_nation_unique";--> statement-breakpoint
ALTER TABLE "almanac"."edition_hosts" DROP CONSTRAINT "edition_hosts_nation_id_nations_id_fk";--> statement-breakpoint
CREATE UNIQUE INDEX "edition_hosts_edition_nation_source_unique" ON "almanac"."edition_hosts" USING btree ("edition_id","nation_source_id");--> statement-breakpoint
ALTER TABLE "almanac"."edition_hosts" DROP COLUMN "nation_id";--> statement-breakpoint
DROP TABLE "almanac"."nations";
