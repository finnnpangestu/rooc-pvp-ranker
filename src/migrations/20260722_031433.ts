import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'guild_master');
  CREATE TYPE "public"."enum_characters_job" AS ENUM('lord_knight', 'paladin', 'high_priest', 'champion', 'assassin_cross', 'stalker', 'high_wizard', 'professor', 'sniper', 'minstrell', 'gypsy', 'mastersmith', 'biochemist', 'summoner', 'adept_novice', 'rebellion');
  CREATE TYPE "public"."enum_party_setups_elite_parties_slots_required_job" AS ENUM('lord_knight', 'paladin', 'high_priest', 'champion', 'assassin_cross', 'stalker', 'high_wizard', 'professor', 'sniper', 'minstrell', 'gypsy', 'mastersmith', 'biochemist', 'summoner', 'adept_novice', 'rebellion', 'any');
  CREATE TYPE "public"."enum_party_setups_sub_parties_slots_required_job" AS ENUM('lord_knight', 'paladin', 'high_priest', 'champion', 'assassin_cross', 'stalker', 'high_wizard', 'professor', 'sniper', 'minstrell', 'gypsy', 'mastersmith', 'biochemist', 'summoner', 'adept_novice', 'rebellion', 'any');
  CREATE TYPE "public"."enum_reports_gl_match_status" AS ENUM('win', 'loss');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'guild_master' NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "characters_gl_reports" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"report_id" varchar,
  	"is_present" boolean,
  	"actual_score" numeric,
  	"party_assigned" varchar
  );
  
  CREATE TABLE "characters" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"job" "enum_characters_job" NOT NULL,
  	"guild_id_id" varchar NOT NULL,
  	"is_verified" boolean DEFAULT false,
  	"max_hp" numeric NOT NULL,
  	"patk" numeric,
  	"matk" numeric,
  	"pdef" numeric,
  	"mdef" numeric,
  	"refine_patk" numeric,
  	"refine_matk" numeric,
  	"refine_pdef" numeric,
  	"refine_mdef" numeric,
  	"hit" numeric,
  	"flee" numeric,
  	"aspd" numeric,
  	"mspd" numeric,
  	"variable_cast" numeric,
  	"fixed_cast" numeric,
  	"healing_done" numeric,
  	"healing_taken" numeric,
  	"critical" numeric,
  	"critical_damage" numeric,
  	"critical_reduction" numeric,
  	"critical_damage_reduction" numeric,
  	"pdmg" numeric,
  	"mdmg" numeric,
  	"pdmg_reduction" numeric,
  	"mdmg_reduction" numeric,
  	"ignore_pdef" numeric,
  	"ignore_mdef" numeric,
  	"pdmg_bonus" numeric,
  	"mdmg_bonus" numeric,
  	"pvp_dmg_bonus" numeric,
  	"pvp_dmg_reduction" numeric,
  	"max_hp_percentage" numeric,
  	"equipment_patk_percentage" numeric,
  	"equipment_matk_percentage" numeric,
  	"equipment_pdef_percentage" numeric,
  	"equipment_mdef_percentage" numeric,
  	"dmg_vs_demi_human" numeric,
  	"dmg_reduction_demi_human" numeric,
  	"dmg_vs_medium" numeric,
  	"dmg_reduction_medium" numeric,
  	"neutral_dmg_bonus" numeric,
  	"neutral_dmg_reduction" numeric,
  	"fire_dmg_bonus" numeric,
  	"water_dmg_bonus" numeric,
  	"wind_dmg_bonus" numeric,
  	"earth_dmg_bonus" numeric,
  	"ghost_dmg_bonus" numeric,
  	"holy_dmg_bonus" numeric,
  	"fire_dmg_reduction" numeric,
  	"water_dmg_reduction" numeric,
  	"wind_dmg_reduction" numeric,
  	"earth_dmg_reduction" numeric,
  	"ghost_dmg_reduction" numeric,
  	"holy_dmg_reduction" numeric,
  	"poison_dmg_bonus" numeric,
  	"poison_dmg_reduction" numeric,
  	"pvp_score" numeric,
  	"gl_total_score" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guilds" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"guild_master_id" varchar NOT NULL,
  	"total_characters" numeric,
  	"total_pvp_score" numeric,
  	"gl_wins" numeric,
  	"gl_losses" numeric,
  	"gl_trends" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "party_setups_elite_parties_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"required_job" "enum_party_setups_elite_parties_slots_required_job" DEFAULT 'any' NOT NULL,
  	"assigned_character_id" varchar
  );
  
  CREATE TABLE "party_setups_elite_parties" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"party_name" varchar DEFAULT 'Elite Party' NOT NULL
  );
  
  CREATE TABLE "party_setups_sub_parties_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"required_job" "enum_party_setups_sub_parties_slots_required_job" DEFAULT 'any' NOT NULL,
  	"assigned_character_id" varchar
  );
  
  CREATE TABLE "party_setups_sub_parties" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"party_name" varchar DEFAULT 'Sub Party' NOT NULL
  );
  
  CREATE TABLE "party_setups" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"guild_id_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reports_gl_member_reports" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"character_id_id" varchar NOT NULL,
  	"is_present" boolean DEFAULT false,
  	"actual_score" numeric DEFAULT 0,
  	"party_assigned" varchar
  );
  
  CREATE TABLE "reports_gl" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"guild_id_id" varchar NOT NULL,
  	"report_name" varchar NOT NULL,
  	"match_status" "enum_reports_gl_match_status" NOT NULL,
  	"match_score" numeric,
  	"match_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" varchar,
  	"media_id" varchar,
  	"characters_id" varchar,
  	"guilds_id" varchar,
  	"party_setups_id" varchar,
  	"reports_gl_id" varchar
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" varchar
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_gl_reports" ADD CONSTRAINT "characters_gl_reports_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_guild_id_id_guilds_id_fk" FOREIGN KEY ("guild_id_id") REFERENCES "public"."guilds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guilds" ADD CONSTRAINT "guilds_guild_master_id_users_id_fk" FOREIGN KEY ("guild_master_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "party_setups_elite_parties_slots" ADD CONSTRAINT "party_setups_elite_parties_slots_assigned_character_id_characters_id_fk" FOREIGN KEY ("assigned_character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "party_setups_elite_parties_slots" ADD CONSTRAINT "party_setups_elite_parties_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."party_setups_elite_parties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "party_setups_elite_parties" ADD CONSTRAINT "party_setups_elite_parties_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."party_setups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "party_setups_sub_parties_slots" ADD CONSTRAINT "party_setups_sub_parties_slots_assigned_character_id_characters_id_fk" FOREIGN KEY ("assigned_character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "party_setups_sub_parties_slots" ADD CONSTRAINT "party_setups_sub_parties_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."party_setups_sub_parties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "party_setups_sub_parties" ADD CONSTRAINT "party_setups_sub_parties_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."party_setups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "party_setups" ADD CONSTRAINT "party_setups_guild_id_id_guilds_id_fk" FOREIGN KEY ("guild_id_id") REFERENCES "public"."guilds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports_gl_member_reports" ADD CONSTRAINT "reports_gl_member_reports_character_id_id_characters_id_fk" FOREIGN KEY ("character_id_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports_gl_member_reports" ADD CONSTRAINT "reports_gl_member_reports_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reports_gl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_gl" ADD CONSTRAINT "reports_gl_guild_id_id_guilds_id_fk" FOREIGN KEY ("guild_id_id") REFERENCES "public"."guilds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_characters_fk" FOREIGN KEY ("characters_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guilds_fk" FOREIGN KEY ("guilds_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_party_setups_fk" FOREIGN KEY ("party_setups_id") REFERENCES "public"."party_setups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_gl_fk" FOREIGN KEY ("reports_gl_id") REFERENCES "public"."reports_gl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "characters_gl_reports_order_idx" ON "characters_gl_reports" USING btree ("_order");
  CREATE INDEX "characters_gl_reports_parent_id_idx" ON "characters_gl_reports" USING btree ("_parent_id");
  CREATE INDEX "characters_guild_id_idx" ON "characters" USING btree ("guild_id_id");
  CREATE INDEX "characters_updated_at_idx" ON "characters" USING btree ("updated_at");
  CREATE INDEX "characters_created_at_idx" ON "characters" USING btree ("created_at");
  CREATE UNIQUE INDEX "guilds_name_idx" ON "guilds" USING btree ("name");
  CREATE INDEX "guilds_guild_master_idx" ON "guilds" USING btree ("guild_master_id");
  CREATE INDEX "guilds_updated_at_idx" ON "guilds" USING btree ("updated_at");
  CREATE INDEX "guilds_created_at_idx" ON "guilds" USING btree ("created_at");
  CREATE INDEX "party_setups_elite_parties_slots_order_idx" ON "party_setups_elite_parties_slots" USING btree ("_order");
  CREATE INDEX "party_setups_elite_parties_slots_parent_id_idx" ON "party_setups_elite_parties_slots" USING btree ("_parent_id");
  CREATE INDEX "party_setups_elite_parties_slots_assigned_character_idx" ON "party_setups_elite_parties_slots" USING btree ("assigned_character_id");
  CREATE INDEX "party_setups_elite_parties_order_idx" ON "party_setups_elite_parties" USING btree ("_order");
  CREATE INDEX "party_setups_elite_parties_parent_id_idx" ON "party_setups_elite_parties" USING btree ("_parent_id");
  CREATE INDEX "party_setups_sub_parties_slots_order_idx" ON "party_setups_sub_parties_slots" USING btree ("_order");
  CREATE INDEX "party_setups_sub_parties_slots_parent_id_idx" ON "party_setups_sub_parties_slots" USING btree ("_parent_id");
  CREATE INDEX "party_setups_sub_parties_slots_assigned_character_idx" ON "party_setups_sub_parties_slots" USING btree ("assigned_character_id");
  CREATE INDEX "party_setups_sub_parties_order_idx" ON "party_setups_sub_parties" USING btree ("_order");
  CREATE INDEX "party_setups_sub_parties_parent_id_idx" ON "party_setups_sub_parties" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "party_setups_guild_id_idx" ON "party_setups" USING btree ("guild_id_id");
  CREATE INDEX "party_setups_updated_at_idx" ON "party_setups" USING btree ("updated_at");
  CREATE INDEX "party_setups_created_at_idx" ON "party_setups" USING btree ("created_at");
  CREATE INDEX "reports_gl_member_reports_order_idx" ON "reports_gl_member_reports" USING btree ("_order");
  CREATE INDEX "reports_gl_member_reports_parent_id_idx" ON "reports_gl_member_reports" USING btree ("_parent_id");
  CREATE INDEX "reports_gl_member_reports_character_id_idx" ON "reports_gl_member_reports" USING btree ("character_id_id");
  CREATE INDEX "reports_gl_guild_id_idx" ON "reports_gl" USING btree ("guild_id_id");
  CREATE INDEX "reports_gl_updated_at_idx" ON "reports_gl" USING btree ("updated_at");
  CREATE INDEX "reports_gl_created_at_idx" ON "reports_gl" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_characters_id_idx" ON "payload_locked_documents_rels" USING btree ("characters_id");
  CREATE INDEX "payload_locked_documents_rels_guilds_id_idx" ON "payload_locked_documents_rels" USING btree ("guilds_id");
  CREATE INDEX "payload_locked_documents_rels_party_setups_id_idx" ON "payload_locked_documents_rels" USING btree ("party_setups_id");
  CREATE INDEX "payload_locked_documents_rels_reports_gl_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_gl_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "characters_gl_reports" CASCADE;
  DROP TABLE "characters" CASCADE;
  DROP TABLE "guilds" CASCADE;
  DROP TABLE "party_setups_elite_parties_slots" CASCADE;
  DROP TABLE "party_setups_elite_parties" CASCADE;
  DROP TABLE "party_setups_sub_parties_slots" CASCADE;
  DROP TABLE "party_setups_sub_parties" CASCADE;
  DROP TABLE "party_setups" CASCADE;
  DROP TABLE "reports_gl_member_reports" CASCADE;
  DROP TABLE "reports_gl" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_characters_job";
  DROP TYPE "public"."enum_party_setups_elite_parties_slots_required_job";
  DROP TYPE "public"."enum_party_setups_sub_parties_slots_required_job";
  DROP TYPE "public"."enum_reports_gl_match_status";`)
}
