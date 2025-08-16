import {
  users,
  applicants,
  jobs,
  applications,
  counties,
  constituencies,
  wards,
  departments,
  designations,
  awards,
  specializations,
  coursesOffered,
  notices,
  educationRecords,
  employmentHistory,
  referees,
  documents,
  otpVerification,
  type User,
  type UpsertUser,
  type Applicant,
  type Job,
  type Application,
  type Notice,
  type County,
  type Constituency,
  type Ward,
  type Department,
  type Designation,
  type Award,
  type CourseOffered,
  type OtpVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Applicant operations
  getApplicant(userId: string): Promise<Applicant | undefined>;
  createApplicant(applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant>;
  updateApplicant(id: number, applicant: Partial<Applicant>): Promise<Applicant>;
  
  // Job operations
  getJobs(filters?: { isActive?: boolean; departmentId?: number }): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job>;
  
  // Application operations
  getApplications(filters?: { applicantId?: number; jobId?: number; status?: string }): Promise<Application[]>;
  createApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application>;
  
  // Location operations
  getCounties(): Promise<County[]>;
  getConstituenciesByCounty(countyId: number): Promise<Constituency[]>;
  getWardsByConstituency(constituencyId: number): Promise<Ward[]>;
  
  // System configuration operations
  getDepartments(): Promise<Department[]>;
  getDesignations(): Promise<Designation[]>;
  getAwards(): Promise<Award[]>;
  getCoursesOffered(): Promise<CourseOffered[]>;
  
  // Notice operations
  getNotices(isPublished?: boolean): Promise<Notice[]>;
  createNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notice>;
  updateNotice(id: number, notice: Partial<Notice>): Promise<Notice>;
  
  // OTP operations
  createOtp(phoneNumber: string, otp: string): Promise<OtpVerification>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
  cleanupExpiredOtps(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Applicant operations
  async getApplicant(userId: string): Promise<Applicant | undefined> {
    const [applicant] = await db
      .select()
      .from(applicants)
      .where(eq(applicants.userId, userId));
    return applicant;
  }

  async createApplicant(applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
    const [newApplicant] = await db
      .insert(applicants)
      .values(applicant)
      .returning();
    return newApplicant;
  }

  async updateApplicant(id: number, applicant: Partial<Applicant>): Promise<Applicant> {
    const [updatedApplicant] = await db
      .update(applicants)
      .set({ ...applicant, updatedAt: new Date() })
      .where(eq(applicants.id, id))
      .returning();
    return updatedApplicant;
  }

  // Job operations
  async getJobs(filters?: { isActive?: boolean; departmentId?: number }): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(jobs.isActive, filters.isActive));
    }
    
    if (filters?.departmentId) {
      query = query.where(eq(jobs.departmentId, filters.departmentId));
    }
    
    return query.orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<Job>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  // Application operations
  async getApplications(filters?: { applicantId?: number; jobId?: number; status?: string }): Promise<Application[]> {
    let query = db.select().from(applications);
    
    const conditions = [];
    if (filters?.applicantId) {
      conditions.push(eq(applications.applicantId, filters.applicantId));
    }
    if (filters?.jobId) {
      conditions.push(eq(applications.jobId, filters.jobId));
    }
    if (filters?.status) {
      conditions.push(eq(applications.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(applications.createdAt));
  }

  async createApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateApplication(id: number, application: Partial<Application>): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  // Location operations
  async getCounties(): Promise<County[]> {
    return db.select().from(counties).orderBy(counties.name);
  }

  async getConstituenciesByCounty(countyId: number): Promise<Constituency[]> {
    return db
      .select()
      .from(constituencies)
      .where(eq(constituencies.countyId, countyId))
      .orderBy(constituencies.name);
  }

  async getWardsByConstituency(constituencyId: number): Promise<Ward[]> {
    return db
      .select()
      .from(wards)
      .where(eq(wards.constituencyId, constituencyId))
      .orderBy(wards.name);
  }

  // System configuration operations
  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).orderBy(departments.name);
  }

  async getDesignations(): Promise<Designation[]> {
    return db.select().from(designations).orderBy(designations.name);
  }

  async getAwards(): Promise<Award[]> {
    return db.select().from(awards).orderBy(awards.name);
  }

  async getCoursesOffered(): Promise<CourseOffered[]> {
    return db.select().from(coursesOffered).orderBy(coursesOffered.name);
  }

  // Notice operations
  async getNotices(isPublished?: boolean): Promise<Notice[]> {
    let query = db.select().from(notices);
    
    if (isPublished !== undefined) {
      query = query.where(eq(notices.isPublished, isPublished));
    }
    
    return query.orderBy(desc(notices.createdAt));
  }

  async createNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notice> {
    const [newNotice] = await db.insert(notices).values(notice).returning();
    return newNotice;
  }

  async updateNotice(id: number, notice: Partial<Notice>): Promise<Notice> {
    const [updatedNotice] = await db
      .update(notices)
      .set({ ...notice, updatedAt: new Date() })
      .where(eq(notices.id, id))
      .returning();
    return updatedNotice;
  }
  // OTP operations
  async createOtp(phoneNumber: string, otp: string): Promise<OtpVerification> {
    // Clean up old OTPs for this phone number
    await db.delete(otpVerification).where(eq(otpVerification.phoneNumber, phoneNumber));
    
    // Create new OTP with 5-minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const [newOtp] = await db.insert(otpVerification).values({
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
    }).returning();
    
    return newOtp;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const [otpRecord] = await db
      .select()
      .from(otpVerification)
      .where(
        and(
          eq(otpVerification.phoneNumber, phoneNumber),
          eq(otpVerification.otp, otp),
          eq(otpVerification.verified, false)
        )
      )
      .orderBy(desc(otpVerification.createdAt))
      .limit(1);

    if (!otpRecord) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return false;
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 3) {
      return false;
    }

    // Increment attempts
    await db
      .update(otpVerification)
      .set({ 
        attempts: otpRecord.attempts + 1,
        verified: true 
      })
      .where(eq(otpVerification.id, otpRecord.id));

    return true;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpVerification)
      .where(sql`${otpVerification.expiresAt} < NOW()`);
  }
}

export const storage = new DatabaseStorage();
