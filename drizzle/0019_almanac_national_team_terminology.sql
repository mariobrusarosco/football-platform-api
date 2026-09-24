ALTER TABLE "almanac"."association_statistics" RENAME TO "national_team_statistics";--> statement-breakpoint
ALTER TABLE "almanac"."association_visual_identities" RENAME TO "national_team_visual_identities";--> statement-breakpoint
ALTER TABLE "almanac"."associations" RENAME TO "national_teams";--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" RENAME TO "national_team_participations";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" RENAME COLUMN "association_id" TO "national_team_id";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" RENAME COLUMN "association_id" TO "national_team_id";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_visual_identities" RENAME COLUMN "association_id" TO "national_team_id";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" DROP CONSTRAINT "association_editions_placement_check";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" DROP CONSTRAINT "association_statistics_non_negative_check";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" DROP CONSTRAINT "association_statistics_goal_difference_check";--> statement-breakpoint
ALTER TABLE "almanac"."national_teams" DROP CONSTRAINT "associations_fifa_code_check";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" DROP CONSTRAINT "association_editions_association_id_associations_id_fk";
--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" DROP CONSTRAINT "association_editions_edition_id_editions_id_fk";
--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" DROP CONSTRAINT "association_statistics_association_id_associations_id_fk";
--> statement-breakpoint
ALTER TABLE "almanac"."national_team_visual_identities" DROP CONSTRAINT "association_visual_identities_association_id_associations_id_fk";
--> statement-breakpoint
DROP INDEX "almanac"."association_editions_association_edition_unique";--> statement-breakpoint
DROP INDEX "almanac"."associations_source_id_unique";--> statement-breakpoint
ALTER TABLE "almanac"."national_teams" ADD COLUMN "association_acronym" text;--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" ADD CONSTRAINT "national_team_participations_national_team_id_national_teams_id_fk" FOREIGN KEY ("national_team_id") REFERENCES "almanac"."national_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" ADD CONSTRAINT "national_team_participations_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "almanac"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" ADD CONSTRAINT "national_team_statistics_national_team_id_national_teams_id_fk" FOREIGN KEY ("national_team_id") REFERENCES "almanac"."national_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."national_team_visual_identities" ADD CONSTRAINT "national_team_visual_identities_national_team_id_national_teams_id_fk" FOREIGN KEY ("national_team_id") REFERENCES "almanac"."national_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "national_team_participations_team_edition_unique" ON "almanac"."national_team_participations" USING btree ("national_team_id","edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "national_teams_source_id_unique" ON "almanac"."national_teams" USING btree ("source_id");--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" ADD CONSTRAINT "national_team_participations_placement_check" CHECK ("almanac"."national_team_participations"."placement" > 0);--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" ADD CONSTRAINT "national_team_statistics_non_negative_check" CHECK ("almanac"."national_team_statistics"."appearances" >= 0
        and "almanac"."national_team_statistics"."titles" >= 0
        and "almanac"."national_team_statistics"."runners_up" >= 0
        and "almanac"."national_team_statistics"."third_place" >= 0
        and "almanac"."national_team_statistics"."fourth_place" >= 0
        and "almanac"."national_team_statistics"."matches_played" >= 0
        and "almanac"."national_team_statistics"."wins" >= 0
        and "almanac"."national_team_statistics"."draws" >= 0
        and "almanac"."national_team_statistics"."losses" >= 0
        and "almanac"."national_team_statistics"."goals_for" >= 0
        and "almanac"."national_team_statistics"."goals_against" >= 0
        and "almanac"."national_team_statistics"."points" >= 0);--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" ADD CONSTRAINT "national_team_statistics_goal_difference_check" CHECK ("almanac"."national_team_statistics"."goal_difference" = "almanac"."national_team_statistics"."goals_for" - "almanac"."national_team_statistics"."goals_against");--> statement-breakpoint
ALTER TABLE "almanac"."national_teams" ADD CONSTRAINT "national_teams_fifa_code_check" CHECK ("almanac"."national_teams"."fifa_code" ~ '^[A-Z]{3}$');--> statement-breakpoint
-- Rename primary-key constraints as well as tables so database inspection uses the current vocabulary.
ALTER TABLE "almanac"."national_teams" RENAME CONSTRAINT "associations_pkey" TO "national_teams_pkey";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_statistics" RENAME CONSTRAINT "association_statistics_pkey" TO "national_team_statistics_pkey";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_visual_identities" RENAME CONSTRAINT "association_visual_identities_pkey" TO "national_team_visual_identities_pkey";--> statement-breakpoint
ALTER TABLE "almanac"."national_team_participations" RENAME CONSTRAINT "association_editions_pkey" TO "national_team_participations_pkey";
