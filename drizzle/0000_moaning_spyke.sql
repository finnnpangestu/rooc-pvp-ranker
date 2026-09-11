CREATE TYPE "public"."enum_characters_job" AS ENUM('lord_knight', 'paladin', 'high_priest', 'champion', 'assassin_cross', 'stalker', 'high_wizard', 'professor', 'sniper', 'minstrell', 'gypsy', 'mastersmith', 'biochemist', 'summoner', 'adept_novice', 'rebellion');--> statement-breakpoint
CREATE TYPE "public"."enum_reports_gl_match_status" AS ENUM('win', 'loss');--> statement-breakpoint
CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'guild_master');--> statement-breakpoint
CREATE TABLE "characters" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"job" "enum_characters_job" NOT NULL,
	"guild_id" varchar NOT NULL,
	"is_verified" boolean DEFAULT false,
	"max_hp" numeric DEFAULT '0' NOT NULL,
	"patk" numeric DEFAULT '0',
	"matk" numeric DEFAULT '0',
	"pdef" numeric DEFAULT '0',
	"mdef" numeric DEFAULT '0',
	"refine_patk" numeric DEFAULT '0',
	"refine_matk" numeric DEFAULT '0',
	"refine_pdef" numeric DEFAULT '0',
	"refine_mdef" numeric DEFAULT '0',
	"hit" numeric DEFAULT '0',
	"flee" numeric DEFAULT '0',
	"aspd" numeric DEFAULT '0',
	"mspd" numeric DEFAULT '0',
	"variable_cast" numeric DEFAULT '0',
	"fixed_cast" numeric DEFAULT '0',
	"healing_done" numeric DEFAULT '0',
	"healing_taken" numeric DEFAULT '0',
	"critical" numeric DEFAULT '0',
	"critical_damage" numeric DEFAULT '0',
	"critical_reduction" numeric DEFAULT '0',
	"critical_damage_reduction" numeric DEFAULT '0',
	"pdmg" numeric DEFAULT '0',
	"mdmg" numeric DEFAULT '0',
	"pdmg_reduction" numeric DEFAULT '0',
	"mdmg_reduction" numeric DEFAULT '0',
	"ignore_pdef" numeric DEFAULT '0',
	"ignore_mdef" numeric DEFAULT '0',
	"pdmg_bonus" numeric DEFAULT '0',
	"mdmg_bonus" numeric DEFAULT '0',
	"pvp_dmg_bonus" numeric DEFAULT '0',
	"pvp_dmg_reduction" numeric DEFAULT '0',
	"max_hp_percentage" numeric DEFAULT '0',
	"equipment_patk_percentage" numeric DEFAULT '0',
	"equipment_matk_percentage" numeric DEFAULT '0',
	"equipment_pdef_percentage" numeric DEFAULT '0',
	"equipment_mdef_percentage" numeric DEFAULT '0',
	"dmg_vs_demi_human" numeric DEFAULT '0',
	"dmg_reduction_demi_human" numeric DEFAULT '0',
	"dmg_vs_medium" numeric DEFAULT '0',
	"dmg_reduction_medium" numeric DEFAULT '0',
	"neutral_dmg_bonus" numeric DEFAULT '0',
	"neutral_dmg_reduction" numeric DEFAULT '0',
	"fire_dmg_bonus" numeric DEFAULT '0',
	"fire_dmg_reduction" numeric DEFAULT '0',
	"water_dmg_bonus" numeric DEFAULT '0',
	"water_dmg_reduction" numeric DEFAULT '0',
	"wind_dmg_bonus" numeric DEFAULT '0',
	"wind_dmg_reduction" numeric DEFAULT '0',
	"earth_dmg_bonus" numeric DEFAULT '0',
	"earth_dmg_reduction" numeric DEFAULT '0',
	"ghost_dmg_bonus" numeric DEFAULT '0',
	"ghost_dmg_reduction" numeric DEFAULT '0',
	"holy_dmg_bonus" numeric DEFAULT '0',
	"holy_dmg_reduction" numeric DEFAULT '0',
	"poison_dmg_bonus" numeric DEFAULT '0',
	"poison_dmg_reduction" numeric DEFAULT '0',
	"pvp_score" numeric DEFAULT '0',
	"gl_total_score" numeric DEFAULT '0',
	"gl_reports" jsonb DEFAULT '[]'::jsonb,
	"woe_present_count" numeric DEFAULT '0',
	"woe_absent_count" numeric DEFAULT '0',
	"gl_present_count" numeric DEFAULT '0',
	"gl_absent_count" numeric DEFAULT '0',
	"total_resources" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"guild_master_id" varchar NOT NULL,
	"total_characters" numeric DEFAULT '0',
	"total_pvp_score" numeric DEFAULT '0',
	"gl_wins" numeric DEFAULT '0',
	"gl_losses" numeric DEFAULT '0',
	"gl_trends" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" varchar PRIMARY KEY NOT NULL,
	"alt" varchar NOT NULL,
	"url" varchar,
	"thumbnail_url" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_setups" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"elite_parties" jsonb DEFAULT '[]'::jsonb,
	"sub_parties" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "party_setups_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE "reports_gl" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"report_name" varchar NOT NULL,
	"match_status" "enum_reports_gl_match_status" NOT NULL,
	"match_score" numeric DEFAULT '0',
	"match_date" timestamp with time zone,
	"member_reports" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports_woe" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"report_name" varchar NOT NULL,
	"match_rank" numeric,
	"match_date" timestamp with time zone,
	"member_reports" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_distributions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"resource_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"quantity" numeric NOT NULL,
	"bid_date" timestamp with time zone,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"notes" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"total_quantity" numeric NOT NULL,
	"remaining_quantity" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"role" "enum_users_role" DEFAULT 'guild_master' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "woe_setups" (
	"id" varchar PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"raids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "woe_setups_guild_id_unique" UNIQUE("guild_id")
);
