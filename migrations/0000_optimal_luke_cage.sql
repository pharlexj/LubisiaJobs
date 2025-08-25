CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'shortlisted', 'interviewed', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('applicant', 'admin', 'board');--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"salutation" varchar(8),
	"first_name" varchar(100),
	"surname" varchar(100),
	"other_name" varchar(100),
	"phone_number" varchar(20),
	"alt_phone_number" varchar(20),
	"national_id" varchar(50),
	"date_of_birth" date,
	"gender" varchar(10),
	"nationality" varchar(100),
	"county_id" integer,
	"constituency_id" integer,
	"ward_id" integer,
	"address" varchar(250),
	"ethnicity" varchar(50),
	"religion" varchar(50),
	"is_pwd" boolean,
	"pwd_number" varchar(100),
	"is_employee" boolean,
	"kra_pin" varchar(50),
	"profession_id" integer,
	"profile_completion_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"applicant_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'draft',
	"submitted_on" date,
	"remarks" text,
	"interview_date" date,
	"interview_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "constituencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(11) NOT NULL,
	"name" varchar(100) NOT NULL,
	"county_id" integer NOT NULL,
	CONSTRAINT "constituencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "counties" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(11) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "counties_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "courses_offered" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"specialization_id" integer NOT NULL,
	"award_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"job_group" varchar(4) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" integer NOT NULL,
	"institution_id" integer NOT NULL,
	"course_id" integer,
	"award_id" integer NOT NULL,
	"year_completed" integer,
	"grade" varchar(10),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" integer NOT NULL,
	"employer" varchar(200) NOT NULL,
	"position" varchar(150) NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_current" boolean DEFAULT false,
	"duties" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text,
	"department_id" integer NOT NULL,
	"designation_id" integer NOT NULL,
	"requirements" jsonb,
	"application_deadline" date,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(250) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'general',
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "professions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referees" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"position" varchar(150),
	"organization" varchar(200),
	"email" varchar(100),
	"phone_number" varchar(20),
	"relationship" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'applicant',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(11) NOT NULL,
	"name" varchar(100) NOT NULL,
	"constituency_id" integer NOT NULL,
	CONSTRAINT "wards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_profession_id_professions_id_fk" FOREIGN KEY ("profession_id") REFERENCES "public"."professions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constituencies" ADD CONSTRAINT "constituencies_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_offered" ADD CONSTRAINT "courses_offered_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_offered" ADD CONSTRAINT "courses_offered_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_records" ADD CONSTRAINT "education_records_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_records" ADD CONSTRAINT "education_records_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_records" ADD CONSTRAINT "education_records_course_id_courses_offered_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses_offered"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_records" ADD CONSTRAINT "education_records_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referees" ADD CONSTRAINT "referees_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");