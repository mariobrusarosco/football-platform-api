CREATE SCHEMA "almanac";
--> statement-breakpoint
CREATE TABLE "almanac"."edition_hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"nation_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "edition_hosts_position_check" CHECK ("almanac"."edition_hosts"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "almanac"."editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" smallint NOT NULL,
	"start_date" date,
	"end_date" date,
	"participant_count" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "editions_year_check" CHECK ("almanac"."editions"."year" >= 1930),
	CONSTRAINT "editions_date_range_check" CHECK ("almanac"."editions"."start_date" is null or "almanac"."editions"."end_date" is null or "almanac"."editions"."end_date" >= "almanac"."editions"."start_date"),
	CONSTRAINT "editions_participant_count_check" CHECK ("almanac"."editions"."participant_count" is null or "almanac"."editions"."participant_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "almanac"."nations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"canonical_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "almanac"."association_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"association_id" uuid NOT NULL,
	"edition_id" uuid NOT NULL,
	"result" text NOT NULL,
	"won_title" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "almanac"."association_statistics" (
	"association_id" uuid PRIMARY KEY NOT NULL,
	"appearances" smallint NOT NULL,
	"titles" smallint NOT NULL,
	"runners_up" smallint NOT NULL,
	"third_place" smallint NOT NULL,
	"fourth_place" smallint NOT NULL,
	"matches_played" smallint NOT NULL,
	"wins" smallint NOT NULL,
	"draws" smallint NOT NULL,
	"losses" smallint NOT NULL,
	"goals_for" smallint NOT NULL,
	"goals_against" smallint NOT NULL,
	"goal_difference" smallint NOT NULL,
	"points" smallint NOT NULL,
	CONSTRAINT "association_statistics_non_negative_check" CHECK ("almanac"."association_statistics"."appearances" >= 0
        and "almanac"."association_statistics"."titles" >= 0
        and "almanac"."association_statistics"."runners_up" >= 0
        and "almanac"."association_statistics"."third_place" >= 0
        and "almanac"."association_statistics"."fourth_place" >= 0
        and "almanac"."association_statistics"."matches_played" >= 0
        and "almanac"."association_statistics"."wins" >= 0
        and "almanac"."association_statistics"."draws" >= 0
        and "almanac"."association_statistics"."losses" >= 0
        and "almanac"."association_statistics"."goals_for" >= 0
        and "almanac"."association_statistics"."goals_against" >= 0
        and "almanac"."association_statistics"."points" >= 0),
	CONSTRAINT "association_statistics_goal_difference_check" CHECK ("almanac"."association_statistics"."goal_difference" = "almanac"."association_statistics"."goals_for" - "almanac"."association_statistics"."goals_against")
);
--> statement-breakpoint
CREATE TABLE "almanac"."associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"fifa_code" varchar(3) NOT NULL,
	"flag_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "associations_fifa_code_check" CHECK ("almanac"."associations"."fifa_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
ALTER TABLE "almanac"."edition_hosts" ADD CONSTRAINT "edition_hosts_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "almanac"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."edition_hosts" ADD CONSTRAINT "edition_hosts_nation_id_nations_id_fk" FOREIGN KEY ("nation_id") REFERENCES "almanac"."nations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD CONSTRAINT "association_editions_association_id_associations_id_fk" FOREIGN KEY ("association_id") REFERENCES "almanac"."associations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."association_editions" ADD CONSTRAINT "association_editions_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "almanac"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."association_statistics" ADD CONSTRAINT "association_statistics_association_id_associations_id_fk" FOREIGN KEY ("association_id") REFERENCES "almanac"."associations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "edition_hosts_edition_nation_unique" ON "almanac"."edition_hosts" USING btree ("edition_id","nation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "edition_hosts_edition_position_unique" ON "almanac"."edition_hosts" USING btree ("edition_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "editions_year_unique" ON "almanac"."editions" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "nations_slug_unique" ON "almanac"."nations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "association_editions_association_edition_unique" ON "almanac"."association_editions" USING btree ("association_id","edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "associations_source_id_unique" ON "almanac"."associations" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "associations_fifa_code_unique" ON "almanac"."associations" USING btree ("fifa_code");