import { sql, relations, isNotNull } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  date,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  serial
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["applicant", "admin", "board","accountant","records","procurement","hod"]);

// Application status enum
export const applicationStatusEnum = pgEnum("application_status", [
  "draft", "submitted", "shortlisted", "interviewed", "rejected", "hired","interview_scheduled"
]);



// Counties
export const counties = pgTable("counties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Constituencies
export const constituencies = pgTable("constituencies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  countyId: integer("county_id").notNull().references(() => counties.id),
});

// Wards
export const wards = pgTable("wards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  constituencyId: integer("constituency_id").notNull().references(() => constituencies.id),
});

// Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 250 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Designations
export const designations = pgTable("designations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 250 }).notNull(),
  jobGroup: varchar("job_group", { length: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Awards (education levels)
export const awards = pgTable("awards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Specializations
export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  studyAreaId:integer('study_area_id').notNull().references(() => studyArea.id),
  createdAt: timestamp("created_at").defaultNow(),
},
  (table) => ({
    uniqueNameStudyArea: uniqueIndex("unique_specialization_name_studyarea").on(table.name, table.studyAreaId),
  }));

// Ethnicity
export const ethnicity = pgTable("ethnicity", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses offered
export const coursesOffered = pgTable("courses_offered", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  specializationId: integer("specialization_id").notNull().references(() => specializations.id),
  awardId: integer("award_id").notNull().references(() => awards.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Professions
export const professions = pgTable("professions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Institutions
export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Applicants
export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  salutation: varchar("salutation", { length: 8 }),
  firstName: varchar("first_name", { length: 100 }),
  surname: varchar("surname", { length: 100 }),
  otherName: varchar("other_name", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerifiedAt: date("phone_verified_at"),
  altPhoneNumber: varchar("alt_phone_number", { length: 20 }),
  nationalId: varchar("national_id", { length: 50 }).unique(),
  idPassportType: varchar("id_passport_type", { length: 20 }), // 'national_id', 'passport', 'alien_id'
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  nationality: varchar("nationality", { length: 100 }),
  countyId: integer("county_id").references(() => counties.id),
  constituencyId: integer("constituency_id").references(() => constituencies.id),
  wardId: integer("ward_id").references(() => wards.id),
  address: varchar("address", { length: 250 }),
  ethnicity: varchar("ethnicity", { length: 50 }),
  religion: varchar("religion", { length: 50 }),
  isPwd: boolean("is_pwd").default(false),
  pwdNumber: varchar("pwd_number", { length: 100 }).unique(),
  isEmployee: boolean("is_employee").default(false),
  kraPin: varchar("kra_pin", { length: 50 }).unique(),
  professionId: integer("profession_id").references(() => professions.id),
  profileCompletionPercentage: integer("profile_completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  surname: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  nationalId: varchar("national_id", { length: 11 }).unique(),
  idPassportType: varchar("id_passport_type", { length: 20 }),
  phoneNumber: varchar('phone_number').unique(),
  password: varchar("password"),
  passwordHash: varchar("password_hash").notNull(),
  role: userRoleEnum("role").default("applicant"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  advertNumb: varchar("code").unique(),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  designationId: integer("designation_id"),
  requirements: jsonb("requirements"), // ✅ structured rules
  isActive: boolean("is_active").notNull().default(true),
  jg: integer("jg_id").notNull().references(() => JG.id),
  category: varchar("category"),
  experience: varchar("experience"),
  posts: integer("posts"),
  venue: varchar("venue"),
  // ✅ new fields
  requiredSpecializationIds: jsonb("required_specialization_ids")
    .$type<number[]>()
    .default(sql`'[]'::jsonb`), // multi-select
  certificateLevel: integer("cert_level_id").references(() => certificateLevel.id),
  requiredStudyAreaId: integer("required_study_area_id").references(() => studyArea.id),
  progressionAllowed:boolean("is_progression_allowed").default(false),
  isReleased: integer("is_released"),
  advertType: varchar("advert_type"),
  status: varchar("status"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//Certificate Level
export const certificateLevel = pgTable("certificate_level", {
  id: serial('id').primaryKey(),
  name: varchar("name"),
  createdAt: timestamp("created_at").defaultNow(),
});
// Applications
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  status: applicationStatusEnum("status").default("draft"),
  submittedOn: date("submitted_on"),
  remarks: text("remarks"),
  interviewDate: date("interview_date"),
  interviewScore: integer("interview_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const education = pgTable("education_records", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  courseName: varchar("course_name", { length: 255 }),
  certificateLevelId: integer("certificate_level_id")
    .notNull()
    .references(() => certificateLevel.id),          // ✅ fix ref
  specializationId: integer("specialization_id")
    .notNull()
    .references(() => specializations.id),
  studyAreaId: integer("study_area_id")
    .notNull()
    .references(() => studyArea.id),                 // ✅ normalized instead of varchar
  institution: varchar("institution", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 50 }),
  yearFrom: integer("year_from").notNull(),
  yearCompleted: integer("year_completed").notNull(),
  certificatePath: varchar("certificate_path", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education records
export const educationz = pgTable("education_records", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  courseId: integer("course_id").references(() => coursesOffered.id),
  courseName: varchar("course_name", { length: 255 }),
  certificateLevelId: integer("certificate_level_id").notNull().references(() => awards.id),
  specializationId: integer("specialization_id").notNull().references(() => specializations.id),
  studyArea: varchar("study_area_id", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 50 }),
  yearFrom: integer("year_from").notNull(),
  yearCompleted: integer("year_completed").notNull(),
  certificatePath: varchar("certificate_path", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alias for backward compatibility
export const educationRecords = education;

export const studyArea = pgTable("study_area", {
  id: serial("id").primaryKey(),
  name: varchar('name',{ length: 250 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const JG = pgTable("jg", {
  id: serial("id").primaryKey(),
  name: varchar('name',{ length: 250 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const religion = pgTable("religions", {
  id: serial("id").primaryKey(),
  name: varchar('name',{ length: 250 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
//Payroll Employees
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  designation: varchar('designation', { length: 250 }).notNull(),
  personalNumber: varchar('personal_number', { length: 13 }).notNull().unique(),  
  idNumber: varchar('id_number', { length: 13 }).notNull().unique(),  
  createdAt: timestamp("created_at").defaultNow(),
});
// County employees table for verification
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").references(() => applicants.id),
  personalNumber: varchar("personal_number", { length: 50 }).notNull().unique(),
  designation: varchar("designation", { length: 150 }).notNull(),
  dutyStation: varchar("duty_station", { length: 200 }),
  jg: varchar("jg", { length: 4 }), // Job Group
  actingPosition: varchar("acting_position", { length: 150 }),
  departmentId: integer("department_id").references(() => departments.id),
  dofa: date("dofa"), // Date of First Appointment
  doca: date("doca"), // Date of Current Appointment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//Panel Scores
export const panelScores = pgTable("panel_scores", {
  scoreId: serial("score_id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  panelId: integer("panel_id").notNull(),
  academicScore: integer("academic_score").default(0),
  experienceScore: integer("experience_score").default(0),
  skillsScore: integer("skills_score").default(0),
  leadershipScore: integer("leadership_score").default(0),
  generalScore: integer("general_score").default(0),
  negativeScore: integer("negative_score").default(0),
  remarks: text("remarks"),
  scoredOn: timestamp("scored_on", { withTimezone: false }).defaultNow().notNull(),
  createAt: timestamp("create_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull(),
});
//Professional Qualifications
export const professionalQualifications = pgTable("professional_qualifications", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  studentNo: varchar("student_no", { length: 100 }),
  areaOfStudyId: integer("area_of_study_id").notNull(),
  specialisationId: integer("specialisation_id").notNull(),
  course: varchar("course", { length: 255 }).notNull(),
  awardId: integer("award_id").notNull(),
  gradeId: varchar("grade_id", { length: 10 }).notNull(),
  examiner: varchar("examiner", { length: 255 }),
  certificateNo: varchar("certificate_no", { length: 100 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

//Short Courses
export const shortCourse = pgTable("short_course", {
  id: serial("id").primaryKey(),
  institutionName: varchar("institution_name", { length: 255 }).notNull(),
  applicantId: integer("applicant_id").notNull(),
  course: varchar("course", { length: 255 }).notNull(),
  certificateNo: varchar("certificate_no", { length: 100 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});
// Employment history
export const employmentHistory = pgTable("employment_history", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  employer: varchar("employer", { length: 200 }).notNull(),
  position: varchar("position", { length: 150 }).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isCurrent: boolean("is_current").default(false),
  duties: text("duties"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faq = pgTable("faq", {
    id: serial("id").primaryKey(),
    category: varchar("category",{length:150}),
    question: varchar("question",{length:255}),
    answer: text("answer"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Referees
export const referees = pgTable("referees", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  name: varchar("name", { length: 150 }).notNull(),
  position: varchar("position", { length: 150 }),
  organization: varchar("organization", { length: 200 }),
  email: varchar("email", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  relationship: varchar("relationship", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document uploads
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => applicants.id),
  type: varchar("type", { length: 50 }).notNull(), // 'id', 'certificate', 'transcript', etc.
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notices
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 250 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("general"), // 'announcement', 'update', 'general'
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gallery items for photos and events
export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  eventDate: date("event_date"),
  isPublished: boolean("is_published").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Icon name enum for carousel slides
export const carouselIconEnum = pgEnum("carousel_icon", ["Building", "GraduationCap", "Users", "Award"]);

// Carousel slides for home page hero carousel
export const carouselSlides = pgTable("carousel_slides", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 250 }).notNull(),
  subtitle: text("subtitle").notNull(),
  bgGradient: varchar("bg_gradient", { length: 300 }), // Tailwind gradient classes (optional if using images)
  iconName: carouselIconEnum("icon_name").notNull(), // Enum for type safety
  accentColor: varchar("accent_color", { length: 9 }), // Hex color with optional alpha (#RRGGBBAA)
  // Image support for picture-based carousels
  imageUrl: varchar("image_url", { length: 500 }), // Desktop/main image
  mobileImageUrl: varchar("mobile_image_url", { length: 500 }), // Mobile-optimized image
  altText: varchar("alt_text", { length: 200 }), // Accessibility text
  // Navigation/CTA support
  linkHref: varchar("link_href", { length: 500 }), // Optional link destination
  ctaLabel: varchar("cta_label", { length: 100 }), // Call-to-action button text
  // Display control
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  activeOrderIdx: index("carousel_active_order_idx").on(table.isActive, table.displayOrder),
}));

// System configuration for admin customizable content
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  section: varchar("section", { length: 50 }).notNull(), // 'about', 'contact', 'general', etc.
  dataType: varchar("data_type", { length: 20 }).default("text"), // 'text', 'html', 'json', 'number'
  isPublic: boolean("is_public").default(false),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Board members for the about page leadership carousel
export const boardMembers = pgTable("board_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  position: varchar("position", { length: 150 }).notNull(),
  bio: text("bio"),
  photoUrl: varchar("photo_url", { length: 500 }),
  order: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notice subscriptions for email notifications
export const noticeSubscriptions = pgTable("notice_subscriptions", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  subscriptionToken: varchar("subscription_token", { length: 100 }).notNull().unique(),
  notificationTypes: varchar("notification_types", { length: 500 }).default("all"), // JSON array: ["announcement", "interview", "urgent"] or "all"
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  lastNotifiedAt: timestamp("last_notified_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Admin notifications for system alerts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 250 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'email', 'sms', 'system'
  targetAudience: varchar("target_audience", { length: 50 }).notNull(), // 'all', 'applicants', 'admins', 'board'
  priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'urgent'
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'scheduled', 'sent', 'failed'
  // Enhanced tracking fields
  totalRecipients: integer("total_recipients").default(0),
  queuedCount: integer("queued_count").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  failedCount: integer("failed_count").default(0),
  filterSnapshot: jsonb("filter_snapshot"), // For audit purposes
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationRecipients = pgTable("notification_recipients", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id),
  channel: varchar("channel", { length: 20 }).notNull(), // 'email', 'sms', 'in_app'
  status: varchar("status", { length: 20 }).notNull().default('queued'), // 'queued', 'sending', 'sent', 'delivered', 'opened', 'failed', 'bounced'
  attempts: integer("attempts").default(0),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  trackingToken: varchar("tracking_token", { length: 64 }).unique(),
  lastError: text("last_error"),
  queuedAt: timestamp("queued_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"),
}, (table) => ({
  notificationIdIdx: index("notification_recipients_notification_id_idx").on(table.notificationId),
  statusIdx: index("notification_recipients_status_idx").on(table.status),
  channelStatusIdx: index("notification_recipients_channel_status_idx").on(table.channel, table.status),
  trackingTokenIdx: uniqueIndex("notification_recipients_tracking_token_idx").on(table.trackingToken),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  applicant: one(applicants, {
    fields: [users.id],
    references: [applicants.userId],
  }),
  createdJobs: many(jobs),
  createdNotices: many(notices),
  createdGalleryItems: many(galleryItems),
  notificationRecipients: many(notificationRecipients),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
  recipients: many(notificationRecipients),
}));

export const notificationRecipientsRelations = relations(notificationRecipients, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationRecipients.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationRecipients.userId],
    references: [users.id],
  }),
}));

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
  user: one(users, {
    fields: [applicants.userId],
    references: [users.id],
  }),
  county: one(counties, {
    fields: [applicants.countyId],
    references: [counties.id],
  }),
  constituency: one(constituencies, {
    fields: [applicants.constituencyId],
    references: [constituencies.id],
  }),
  ward: one(wards, {
    fields: [applicants.wardId],
    references: [wards.id],
  }),
  profession: one(professions, {
    fields: [applicants.professionId],
    references: [professions.id],
  }),
  employee: one(employees, {
    fields: [applicants.id],
    references: [employees.applicantId],
  }),
  applications: many(applications),
  educationRecords: many(educationRecords),
  employmentHistory: many(employmentHistory),
  referees: many(referees),
  documents: many(documents),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  applicant: one(applicants, {
    fields: [employees.applicantId],
    references: [applicants.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
}));

export const countiesRelations = relations(counties, ({ many }) => ({
  constituencies: many(constituencies),
  applicants: many(applicants),
}));

export const constituenciesRelations = relations(constituencies, ({ one, many }) => ({
  county: one(counties, {
    fields: [constituencies.countyId],
    references: [counties.id],
  }),
  wards: many(wards),
  applicants: many(applicants),
}));

export const wardsRelations = relations(wards, ({ one, many }) => ({
  constituency: one(constituencies, {
    fields: [wards.constituencyId],
    references: [constituencies.id],
  }),
  applicants: many(applicants),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobs.departmentId],
    references: [departments.id],
  }),
  createdBy: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  applicant: one(applicants, {
    fields: [applications.applicantId],
    references: [applicants.id],
  }),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicantSchema = createInsertSchema(applicants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  phoneVerifiedAt:true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationRecipientSchema = createInsertSchema(notificationRecipients).omit({
  id: true,
  queuedAt: true,
});

// OTP verification table
export const otpVerification = pgTable("otp_verification", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for OTP
export const insertOtpSchema = createInsertSchema(otpVerification).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type OtpVerification = typeof otpVerification.$inferSelect;
export type User = typeof users.$inferSelect;
export type Applicant = typeof applicants.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type County = typeof counties.$inferSelect;
export type Constituency = typeof constituencies.$inferSelect;
export type Ward = typeof wards.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Designation = typeof designations.$inferSelect;
export type Award = typeof awards.$inferSelect;
export type Specialization = typeof specializations.$inferSelect;
export type CourseOffered = typeof coursesOffered.$inferSelect;
export type EducationRecord = typeof educationRecords.$inferSelect;
export type EmploymentHistory = typeof employmentHistory.$inferSelect;
export type Referee = typeof referees.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type StudyArea = typeof studyArea.$inferSelect;
export type Jg = typeof JG.$inferSelect;
export type Religion = typeof religion.$inferSelect;
export type Payroll = typeof payroll.$inferSelect;
export type PanelScores = typeof panelScores.$inferSelect;
export type ProfessionalQualification = typeof professionalQualifications.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
export type InsertNotificationRecipient = z.infer<typeof insertNotificationRecipientSchema>;
export type Institution = typeof institutions.$inferSelect;
export type CertificateLevel = typeof certificateLevel.$inferSelect;
export type ShortCourse = typeof shortCourse.$inferSelect;
export type Faq = typeof faq.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type BoardMember = typeof boardMembers.$inferSelect;
export type CarouselSlide = typeof carouselSlides.$inferSelect;
export type Ethnicity = typeof ethnicity.$inferInsert;

// Insert schemas for forms
export const insertGalleryItem = createInsertSchema(galleryItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGalleryItem = z.infer<typeof insertGalleryItem>;

export const insertSystemConfig = createInsertSchema(systemConfig).omit({ id: true, updatedAt: true });
export type InsertSystemConfig = z.infer<typeof insertSystemConfig>;

export const insertBoardMember = createInsertSchema(boardMembers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBoardMember = z.infer<typeof insertBoardMember>;

export const insertCarouselSlide = createInsertSchema(carouselSlides)
  .omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });
export type InsertCarouselSlide = z.infer<typeof insertCarouselSlide>;

export const insertPanelScore = createInsertSchema(panelScores).omit({ 
  scoreId: true, 
  createAt: true, 
  updatedAt: true, 
  scoredOn: true 
});
export type InsertPanelScore = z.infer<typeof insertPanelScore>;

export const insertNoticeSubscription = createInsertSchema(noticeSubscriptions).omit({ id: true, subscribedAt: true });
export type InsertNoticeSubscription = z.infer<typeof insertNoticeSubscription>;
export type NoticeSubscription = typeof noticeSubscriptions.$inferSelect;