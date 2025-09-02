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
  institutions,
  studyArea,
  specializations,
  ethnicity,
  coursesOffered,
  notices,
  educationRecords,
  employmentHistory,
  referees,
  documents,
  otpVerification,
  employees,
  payroll,
  JG,
  certificateLevel,
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
  type Institution,
  type StudyArea,
  type Specialization,
  type Employee,
  type CourseOffered,
  type OtpVerification,
  type InsertEmployee,
  type Payroll,
  type Jg,
  type CertificateLevel,
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
  getStudyAreaByName(name: string): Promise<StudyArea | undefined>
  getCertLevel(): Promise<CertificateLevel[]>

  // Application operations
  getApplications(filters?: { applicantId?: number; jobId?: number; status?: string }): Promise<Application[]>;
  createApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application>;
  
  // Location operations
  getCounties(): Promise<County[]>;
  getConstituenciesByCounty(countyId: number): Promise<Constituency[]>;
  getCountyByCountyName(countyName: string): Promise<County | undefined>;
  getConstituencyByName(name: string): Promise<Constituency | undefined>
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

   // Employee operations
  verifyEmployee(personalNumber: string, idNumber: string): Promise<Payroll | undefined>;
  upsertEmployeeDetails(applicantId: number, employeeData: Partial<InsertEmployee>): Promise<Employee>;

  // L
  // OTP operations
  createOtp(phoneNumber: string, otp: string): Promise<OtpVerification>;
  comparePasswords(password: string): Promise<boolean>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<User>;
  verifyEmail(email: string): Promise<boolean>;
  cleanupExpiredOtps(): Promise<void>;  
  // Seed operations
  seedJobGroup(jobGroup: Omit<Jg, 'id'>): Promise<Jg>;
  seedCounties(county: Omit<County, 'id'>): Promise<County>;
  seedSubCounties(subCounty: Omit<Constituency, 'id'>): Promise<Constituency>;
  seedWard(ward: Omit<Ward, 'id'>): Promise<Ward>;
  seedAward(award: Omit<Award, 'id'>): Promise<Award>;
  seedInstitutions(institute: Omit<Institution, 'id'>): Promise<Institution>;
  seedDesignation(designation: Omit<Designation, 'id'>): Promise<Designation>;
  seedDepartment(department: Omit<Department, 'id'>): Promise<Department>;

  //Truncate tables
  truncateAll(): Promise<void>;
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
    // Handle date fields properly
    const processedApplicant = { ...applicant };        
    const [updatedApplicant] = await db
      .update(applicants)
      .set({ ...processedApplicant, updatedAt: new Date() })
      .where(eq(applicants.id, id))
      .returning();
    console.log(`On storage file `,updatedApplicant);
    
    return updatedApplicant;
    
  }

  // Job operations
  async getJobs(filters?: { isActive?: boolean; departmentId?: number }): Promise<Job[]> {
    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(jobs.isActive, filters.isActive));
    }
    
    if (filters?.departmentId) {
      conditions.push(eq(jobs.departmentId, filters.departmentId));
    }
    
    let query = db.select().from(jobs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(jobs.createdAt));
  }
// Fetch Jobs
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
// Create Jobs
  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }
// Update Jobs
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
    
    return await query.orderBy(desc(applications.createdAt));
  }

  async createApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values(application)
      .returning();
    return newApplication;
  }

  // Update Applications
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

  async getInstitutions(): Promise<Institution[]> {
    return db.select().from(institutions).orderBy(institutions.name);
  }

  async getStudyArea(): Promise<StudyArea[]> {
    return db.select().from(studyArea).orderBy(studyArea.name);
  }

  async getSpecializations(): Promise<Specialization[]> {
    return db.select().from(specializations).orderBy(specializations.name);
  }

  async getEthnicity(): Promise<any[]> {
    return db.select().from(ethnicity).orderBy(ethnicity.name);
  }
  async getJobGroups(): Promise<any[]> {    
    return db.select().from(JG).orderBy(JG.name);
  }
  async getCertLevel(): Promise<CertificateLevel[]> {    
    return db.select().from(certificateLevel).orderBy(certificateLevel.name);
  }
  // Notice operations
  async getNotices(isPublished?: boolean): Promise<Notice[]> {
    if (isPublished !== undefined) {
      return await db
        .select()
        .from(notices)
        .where(eq(notices.isPublished, isPublished))
        .orderBy(desc(notices.createdAt));
    }
    return await db
      .select()
      .from(notices)
      .orderBy(desc(notices.createdAt));
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

  async verifyEmail(email: string): Promise<boolean> {
    const [emailRet] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email)))
      .limit(1);
    if (!emailRet) {
      return false;
    }
    
    return true;
  }
  async comparePasswords(password: string): Promise<boolean> {
    const [passwordRes] = await db
      .select()
      .from(users)
      .where(and(eq(users.passwordHash, password)))
      .limit(1);
    if (!passwordRes) {
      return false;
    }
    return true;
  }
  async getUserByEmail(email: string):Promise<User> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
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
    if ((otpRecord.attempts || 0) >= 3) {
      return false;
    }

    // Increment attempts
    await db.update(otpVerification)
      .set({ 
        attempts: (otpRecord.attempts || 0) + 1,
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
  // Employee operations
  async verifyEmployee(personalNumber: string, idNumber: string): Promise<Payroll | undefined> {
    const [payrol] = await db
      .select()
      .from(payroll)
      .where(
        and(
          eq(payroll.personalNumber, personalNumber),
          eq(payroll.idNumber, idNumber)
        )
      );
    return payrol;
  }

  async upsertEmployeeDetails(applicantId: number, employeeData: Partial<InsertEmployee>): Promise<Employee> {
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.applicantId, applicantId))
      .then(rows => rows[0]);

    if (existingEmployee) {
      const [updatedEmployee] = await db
        .update(employees)
        .set({ ...employeeData, updatedAt: new Date() })
        .where(eq(employees.id, existingEmployee.id))
        .returning();
      return updatedEmployee;
    } else {
      const [newEmployee] = await db
        .insert(employees)
        .values({
          applicantId,
          ...employeeData,
        } as InsertEmployee)
        .returning();
      return newEmployee;
    }
  }
  // Job Groups
  async seedJobGroup(jobGroup: Omit<Jg, 'id' | 'createdAt'>): Promise<Jg> {
  const [newJobGroup] = await db
    .insert(JG)
    .values(jobGroup)
    .returning();
  return newJobGroup;
}
  //Seed Counties
  async seedCounties(county: Omit<County, 'id' | 'createdAt'>): Promise<County> {
  const [newCounties] = await db
    .insert(counties)
    .values(county)
    .returning();
  return newCounties;
  }
// Seed a single ward
async seedWard(ward: Omit<Ward, 'id'>): Promise<Ward> {
  const [newWard] = await db
    .insert(wards)
    .values(ward)
    .returning();
  return newWard;
}
// Seed a single Award
async seedAward(award: Omit<Award, 'id'>): Promise<Award> {
  const [newAward] = await db
    .insert(awards)
    .values(award)
    .returning();
  return newAward;
}
// Seed a single Cert level
async seedCertLevel(cert: Omit<CertificateLevel, 'id'>): Promise<CertificateLevel> {
  const [newCertLevel] = await db
    .insert(certificateLevel)
    .values(cert)
    .returning();
  return newCertLevel;
}
// Seed a single Specialize
async seedSpecialize(specialize: Omit<Specialization, 'id'>): Promise<Specialization> {
  const [newSpecial] = await db
    .insert(specializations)
    .values(specialize)
    .returning();
  return newSpecial;
}
// Seed a single Study Area
async seedStudy(studyA: Omit<StudyArea, 'id'>): Promise<StudyArea> {
  const [newStudyArea] = await db
    .insert(studyArea)
    .values(studyA)
    .returning();
  return newStudyArea;
}
  // Seed Constituencies
  async seedSubCounties(
    subCounty: Omit<Constituency, 'id'>    
  ): Promise<Constituency> {
    const [newSub] = await db
      .insert(constituencies)
      .values(subCounty)
      .returning();
    return newSub;
  }

  async seedInstitutions(institute: Omit<Institution, 'id'>): Promise<Institution> {
    const [newInstitution] = await db
      .insert(institutions)
      .values(institute)
      .returning();
    return newInstitution;
  }
  async seedDesignation(designation: Omit<Designation, 'id'>): Promise<Designation> {
    const [newDesignation] = await db
      .insert(designations)
      .values(designation)
      .returning();
    return newDesignation;
  }
// Seed a single Department
async seedDepartment(department: Omit<Department, 'id'>): Promise<Department> {
  const [newDepartment] = await db
    .insert(departments)
    .values(department)
    .returning();
return newDepartment;
}
  // Dependencies on dropdowns
  async getCountyByCountyName(countyName: string): Promise<County>{
    const [countyID] = await db
      .select()
      .from(counties)
      .where(eq(counties.name, countyName));
    return countyID
  }
async getConstituencyByName(name: string): Promise<Constituency | undefined> {
  const [constituency] = await db
    .select()
    .from(constituencies)
    .where(eq(constituencies.name, name))
    .limit(1);

  return constituency;
}
async getStudyAreaByName(name: string): Promise<StudyArea | undefined> {
  const [studyareas] = await db
    .select()
    .from(studyArea)
    .where(eq(studyArea.name, name))
    .limit(1);

  return studyareas;
}
  // Truncate all tables
  async truncateAll(): Promise<void> {
  // Truncate child tables first to avoid FK constraint errors
  await db.execute(sql`TRUNCATE TABLE wards RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE constituencies RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE counties RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE jg RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE awards RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE certificate_level RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE specializations RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE study_area RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE departments RESTART IDENTITY CASCADE`);

}


}

export const storage = new DatabaseStorage();
