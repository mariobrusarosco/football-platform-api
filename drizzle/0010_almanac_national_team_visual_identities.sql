CREATE TABLE "almanac"."national_team_visual_identities" (
	"team_id" uuid PRIMARY KEY NOT NULL,
	"badge_asset_key" text,
	"accent_color" text NOT NULL,
	"accent_text_color" text NOT NULL,
	"spine_color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "almanac"."national_team_visual_identities" ADD CONSTRAINT "national_team_visual_identities_team_id_national_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "almanac"."national_teams"("id") ON DELETE cascade ON UPDATE no action;