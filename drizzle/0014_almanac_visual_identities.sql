CREATE TABLE "almanac"."edition_visual_identities" (
	"edition_id" uuid PRIMARY KEY NOT NULL,
	"logo_asset_key" text,
	"trophy_asset_key" text,
	"accent_color" text NOT NULL,
	"accent_text_color" text NOT NULL,
	"spine_color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "almanac"."association_visual_identities" (
	"association_id" uuid PRIMARY KEY NOT NULL,
	"badge_asset_key" text,
	"accent_color" text NOT NULL,
	"accent_text_color" text NOT NULL,
	"spine_color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "almanac"."edition_visual_identities" ADD CONSTRAINT "edition_visual_identities_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "almanac"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "almanac"."association_visual_identities" ADD CONSTRAINT "association_visual_identities_association_id_associations_id_fk" FOREIGN KEY ("association_id") REFERENCES "almanac"."associations"("id") ON DELETE cascade ON UPDATE no action;