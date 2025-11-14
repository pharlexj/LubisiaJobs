import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["applicant", "officer", "reviewer", "admin", "auditor"]);
export const dialStatusEnum = pgEnum("dial_status", ["draft", "submitted", "under_review", "approved", "locked"]);
export const statementItemCategoryEnum = pgEnum("statement_item_category", ["income", "asset", "liability"]);
export const auditActionEnum = pgEnum("audit_action", ["created", "updated", "submitted", "approved", "rejected", "locked", "printed", "exported"]);
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"]);

// Users table (from existing system)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  surname: varchar("surname"),
  profileImageUrl: varchar("profile_image_url"),
  nationalId: varchar("national_id", { length: 11 }).unique(),
  idPassportType: varchar("id_passport_type", { length: 20 }),
  phoneNumber: varchar("phone_number").unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: userRoleEnum("role").default("applicant"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments table (referenced by employees)
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table (from existing system)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  personalNumber: varchar("personal_number", { length: 50 }).notNull().unique(),
  designation: varchar("designation", { length: 150 }).notNull(),
  dutyStation: varchar("duty_station", { length: 200 }),
  jg: varchar("jg", { length: 4 }),
  actingPosition: varchar("acting_position", { length: 150 }),
  departmentId: integer("department_id").references(() => departments.id),
  dofa: date("dofa"),
  doca: date("doca"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// DIAL Records
export const dialRecords = pgTable("dial_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  employeeId: integer("employee_id").references(() => employees.id),
  status: dialStatusEnum("status").default("draft").notNull(),
  
  // Officer personal details
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: varchar("place_of_birth", { length: 200 }),
  maritalStatus: maritalStatusEnum("marital_status"),
  postalAddress: text("postal_address"),
  physicalAddress: text("physical_address"),
  
  // Employment details (duplicated for version control)
  employmentNumber: varchar("employment_number", { length: 50 }),
  employerName: varchar("employer_name", { length: 200 }),
  employmentNature: varchar("employment_nature", { length: 100 }),
  
  // Statement metadata
  statementDate: date("statement_date"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  
  // Other information
  otherInformation: text("other_information"),
  
  // Officer signature
  officerSignatureData: text("officer_signature_data"),
  officerSignatureDate: date("officer_signature_date"),
  
  // Witness details
  witnessSignatureData: text("witness_signature_data"),
  witnessName: varchar("witness_name", { length: 200 }),
  witnessAddress: text("witness_address"),
  witnessSignatureDate: date("witness_signature_date"),
  
  // System fields
  acknowledgmentNumber: varchar("acknowledgment_number", { length: 50 }).unique(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  lockedAt: timestamp("locked_at"),
  
  // Version control
  versionNumber: integer("version_number").default(1).notNull(),
  previousVersionId: integer("previous_version_id").references((): any => dialRecords.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Spouses
export const spouses = pgTable("spouses", {
  id: serial("id").primaryKey(),
  dialRecordId: integer("dial_record_id").notNull().references(() => dialRecords.id, { onDelete: "cascade" }),
  surname: varchar("surname", { length: 100 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  otherNames: varchar("other_names", { length: 100 }),
  sequenceOrder: integer("sequence_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dependents
export const dependents = pgTable("dependents", {
  id: serial("id").primaryKey(),
  dialRecordId: integer("dial_record_id").notNull().references(() => dialRecords.id, { onDelete: "cascade" }),
  surname: varchar("surname", { length: 100 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  otherNames: varchar("other_names", { length: 100 }),
  sequenceOrder: integer("sequence_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Statement Items (Income, Assets, Liabilities)
export const statementItems = pgTable("statement_items", {
  id: serial("id").primaryKey(),
  dialRecordId: integer("dial_record_id").notNull().references(() => dialRecords.id, { onDelete: "cascade" }),
  category: statementItemCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 300 }),
  approximateAmount: integer("approximate_amount").notNull(),
  sequenceOrder: integer("sequence_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Uploaded Files
export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  dialRecordId: integer("dial_record_id").notNull().references(() => dialRecords.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  fileHash: varchar("file_hash", { length: 64 }).notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  dialRecordId: integer("dial_record_id").references(() => dialRecords.id, { onDelete: "cascade" }),
  action: auditActionEnum("action").notNull(),
  actorId: varchar("actor_id").notNull().references(() => users.id),
  actorName: varchar("actor_name", { length: 200 }),
  changes: text("changes"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  dialRecords: many(dialRecords),
  employees: many(employees),
  auditLogs: many(auditLogs),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  dialRecords: many(dialRecords),
}));

export const dialRecordsRelations = relations(dialRecords, ({ one, many }) => ({
  user: one(users, {
    fields: [dialRecords.userId],
    references: [users.id],
  }),
  employee: one(employees, {
    fields: [dialRecords.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [dialRecords.approvedBy],
    references: [users.id],
  }),
  previousVersion: one(dialRecords, {
    fields: [dialRecords.previousVersionId],
    references: [dialRecords.id],
  }),
  spouses: many(spouses),
  dependents: many(dependents),
  statementItems: many(statementItems),
  uploadedFiles: many(uploadedFiles),
  auditLogs: many(auditLogs),
}));

export const spousesRelations = relations(spouses, ({ one }) => ({
  dialRecord: one(dialRecords, {
    fields: [spouses.dialRecordId],
    references: [dialRecords.id],
  }),
}));

export const dependentsRelations = relations(dependents, ({ one }) => ({
  dialRecord: one(dialRecords, {
    fields: [dependents.dialRecordId],
    references: [dialRecords.id],
  }),
}));

export const statementItemsRelations = relations(statementItems, ({ one }) => ({
  dialRecord: one(dialRecords, {
    fields: [statementItems.dialRecordId],
    references: [dialRecords.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDialRecordSchema = createInsertSchema(dialRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acknowledgmentNumber: true,
  submittedAt: true,
  approvedAt: true,
  approvedBy: true,
  lockedAt: true,
  versionNumber: true,
});

export const insertSpouseSchema = createInsertSchema(spouses).omit({
  id: true,
  createdAt: true,
});

export const insertDependentSchema = createInsertSchema(dependents).omit({
  id: true,
  createdAt: true,
});

export const insertStatementItemSchema = createInsertSchema(statementItems).omit({
  id: true,
  createdAt: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertDialRecord = z.infer<typeof insertDialRecordSchema>;
export type DialRecord = typeof dialRecords.$inferSelect;

export type InsertSpouse = z.infer<typeof insertSpouseSchema>;
export type Spouse = typeof spouses.$inferSelect;

export type InsertDependent = z.infer<typeof insertDependentSchema>;
export type Dependent = typeof dependents.$inferSelect;

export type InsertStatementItem = z.infer<typeof insertStatementItemSchema>;
export type StatementItem = typeof statementItems.$inferSelect;

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Extended types for frontend use
export type DialRecordWithRelations = DialRecord & {
  user?: User;
  employee?: Employee;
  spouses?: Spouse[];
  dependents?: Dependent[];
  statementItems?: StatementItem[];
  uploadedFiles?: UploadedFile[];
  auditLogs?: AuditLog[];
};
