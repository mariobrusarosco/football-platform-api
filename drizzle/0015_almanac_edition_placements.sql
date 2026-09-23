ALTER TABLE "almanac"."association_editions" ADD COLUMN "placement" smallint;--> statement-breakpoint
CREATE UNIQUE INDEX "association_editions_edition_placement_unique" ON "almanac"."association_editions" USING btree ("edition_id","placement") WHERE "almanac"."association_editions"."placement" is not null;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD CONSTRAINT "association_editions_placement_check" CHECK ("almanac"."association_editions"."placement" is null or "almanac"."association_editions"."placement" between 1 and 4);
