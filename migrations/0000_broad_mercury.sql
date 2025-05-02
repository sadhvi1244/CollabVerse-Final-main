CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"project_id" integer NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"feedback" text,
	"resume_link" text,
	"linkedin_profile" text,
	"github_link" text,
	"weekly_availability" integer,
	"skills" text[],
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text,
	"datetime" timestamp NOT NULL,
	"created_by" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
	"sender_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);

CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"related_id" integer,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"skills_needed" text[],
	"timeline" text,
	"cover_image" text,
	"stage" text DEFAULT 'ideation',
	"focus" text,
	"website" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
	"assigned_to" integer REFERENCES "users" ("id") ON DELETE SET NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);

CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
	"user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now()
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"skills" text[],
	"interests" text[],
	"experience_level" text,
	"weekly_availability" integer,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

