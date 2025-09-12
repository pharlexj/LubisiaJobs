
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
  shortCourse,
  professionalQualifications,
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
  type ProfessionalQualification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql,lt, PromiseOf } from "drizzle-orm";
import { any, number } from "zod";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Applicant operations
  getApplicant(userId: string): Promise<Applicant | undefined>;
  createApplicant(applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant>;
  updateApplicant(id: number, applicant: Partial<Applicant>,step:number): Promise<Applicant>;
  getApplicantById(id: number): Promise<any | undefined>;
  // Job operations
  getJobs(filters?: { isActive?: boolean; departmentId?: number }): Promise<Job[]>;
  getJob(id?: number): Promise<any | undefined>;
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
  getConstituencies(): Promise<Constituency[]>;
  getWards(): Promise<Ward[]>;
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
  
  // Report operations
  getApplicationsReport(startDate?: string, endDate?: string): Promise<any>;
  getJobsReport(startDate?: string, endDate?: string): Promise<any>;
  getUsersReport(startDate?: string, endDate?: string): Promise<any>;
  getPerformanceReport(startDate?: string, endDate?: string): Promise<any>;
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
async getApplicant(userId: string): Promise<any> {
  // First fetch applicant + employee
  const [applicant] = await db
    .select()
    .from(applicants)
    .leftJoin(employees, eq(applicants.id, employees.applicantId))
    .where(eq(applicants.userId, userId));

  if (!applicant) return undefined;

  const applicantId = applicant.applicants.id;

  // Fetch related records (arrays)
  const [
    educationRecordsArr,
    shortCourseRecords,
    qualificationRecords,
    employmentRecords,
    refereeRecords,
    documentRecords,
  ] = await Promise.all([
    db.select().from(educationRecords).where(eq(educationRecords.applicantId, applicantId)),
    db.select().from(shortCourse).where(eq(shortCourse.applicantId, applicantId)),
    db
      .select()
      .from(professionalQualifications)
      .where(eq(professionalQualifications.applicantId, applicantId)),
    db
      .select()
      .from(employmentHistory)
      .where(eq(employmentHistory.applicantId, applicantId)),
    db.select().from(referees).where(eq(referees.applicantId, applicantId)),
    db.select().from(documents).where(eq(documents.applicantId, applicantId)),
  ]);
  // Build the full applicant object
  const fullApplicant = {
    ...applicant.applicants,
    employee: applicant.employees || null,
    education: educationRecordsArr,
    shortCourses: shortCourseRecords,
    professionalQualifications: qualificationRecords,
    employmentHistory: employmentRecords,
    referees: refereeRecords,
    documents: documentRecords,
  };
// ✅ Now compute completion
  const completedSteps = this.computeCompletedSteps(fullApplicant);
  const totalSteps = 8;
  const profileCompletionPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100
  );
  // Return nested structure
  return {
    ...fullApplicant,
    completedSteps,
    profileCompletionPercentage,
  };
}
async getApplicantById(id: number): Promise<any | undefined> {
  // Base applicant + employee
  const [applicant] = await db
    .select()
    .from(applicants)
    .leftJoin(employees, eq(applicants.id, employees.applicantId))
    .where(eq(applicants.id, id));

  if (!applicant) return undefined;
  const applicantId = applicant.applicants.id;

  // Fetch related arrays in parallel
  const [
    educationRecordsArr,
    shortCourseRecords,
    qualificationRecords,
    employmentRecords,
    refereeRecords,
    documentRecords,
  ] = await Promise.all([
    db.select().from(educationRecords).where(eq(educationRecords.applicantId, applicantId)),
    db.select().from(shortCourse).where(eq(shortCourse.applicantId, applicantId)),
    db
      .select()
      .from(professionalQualifications)
      .where(eq(professionalQualifications.applicantId, applicantId)),
    db.select().from(employmentHistory).where(eq(employmentHistory.applicantId, applicantId)),
    db.select().from(referees).where(eq(referees.applicantId, applicantId)),
    db.select().from(documents).where(eq(documents.applicantId, applicantId)),
  ]);

  // Build the full applicant object
  const fullApplicant = {
    ...applicant.applicants,
    employee: applicant.employees || null,
    education: educationRecordsArr,
    shortCourses: shortCourseRecords,
    professionalQualifications: qualificationRecords,
    employmentHistory: employmentRecords,
    referees: refereeRecords,
    documents: documentRecords,
  };

  // ✅ Now compute completion
  const completedSteps = this.computeCompletedSteps(fullApplicant);
  const totalSteps = 8;
  const profileCompletionPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100
  );

  return {
    ...fullApplicant,
    completedSteps,
    profileCompletionPercentage,
  };
}

  async updateProgress(step: number, applicantId: number) {
  // Only fetch this applicant’s current progress
  const [current] = await db
    .select({ progress: applicants.profileCompletionPercentage })
    .from(applicants)
    .where(eq(applicants.id, applicantId))
    .limit(1);

  // Update only if the new step is ahead of current
  if (!current || step > (current.progress ?? 0)) {
    await db
      .update(applicants)
      .set({ profileCompletionPercentage: step })
      .where(eq(applicants.id, applicantId));
    console.log(`✅ Progress updated to step ${step} for applicant ${applicantId}`);
  } else {
    console.log(`ℹ️ Step ${step} ignored (already at ${current.progress})`);
  }
}

async updateApplicant(applicantId: number, data: any, step:number) {
  // ✅ Update base applicant row
  await db
    .update(applicants)
    .set({
      firstName: data.firstName,
      surname: data.surname,
      otherName: data.otherName,
      salutation: data.salutation,
      idPassportType: data.idPassportType,
      nationalId: data.nationalId,
      idPassportNumber: data.idPassportNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      phoneNumber: data.phoneNumber,
      altPhoneNumber: data.altPhoneNumber,
      kraPin: data.kraPin,
      ethnicity: data.ethnicity,
      religion: data.religion,
       ...(data.isEmployee !== undefined ? { isEmployee: data.isEmployee } : {}),
      ...(data.isPwd !== undefined ? { isPwd: data.isPwd } : {}),
      pwdNumber: data.pwdNumber,
      countyId: data.countyId,
      constituencyId: data.constituencyId,
      wardId: data.wardId,
      address: data.address,
      updatedAt: new Date(),
    })
    .where(eq(applicants.id, applicantId));

  // ✅ Upsert employee (if exists in payload)
  if (data.employee) {
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.applicantId, applicantId));

    if (existingEmployee.length > 0) {
      await db
        .update(employees)
        .set({
          personalNumber: data.employee.personalNumber,
          designation: data.employee.designation,
          dutyStation: data.employee.dutyStation,
          jg: data.employee.jg,
          departmentId: data.employee.departmentId,
          actingPosition: data.employee.actingPosition,
          dofa: data.employee.dofa,
          doca: data.employee.doca,
        })
        .where(eq(employees.applicantId, applicantId));
    } else {
      await db.insert(employees).values({
        ...data.employee,
        applicantId,
      });
      this.updateProgress(2, applicantId);
    }
  }

// ✅ Array-based sections
  const replaceArray = async (table: any, rows: any[], stepNumber: number) => {
    await db.delete(table).where(eq(table.applicantId, applicantId));
    if (rows?.length > 0) {
      await db.insert(table).values(rows.map(r => ({ ...r, applicantId })));
    }
    await this.updateProgress(stepNumber, applicantId);
  };

  if (step === 3 && data.education) {
    await replaceArray(educationRecords, data.education, 3);
  }
  if (step === 4 && data.shortCourses) {
    await replaceArray(shortCourse, data.shortCourses, 4);
  }
  if (step === 5 && data.professionalQualifications) {
    await replaceArray(professionalQualifications, data.professionalQualifications, 5);
  }
  if (step === 6 && data.employmentHistory) {
    await replaceArray(employmentHistory, data.employmentHistory, 6);
  }
  if (step === 7 && data.referees) {
    await replaceArray(referees, data.referees, 7);
  }
  if (step === 8 && data.documents) {
    await replaceArray(documents, data.documents, 8);
  }
  
  // ✅ Return updated applicant profile
  return await this.getApplicantById(applicantId); // reuse your nested fetcher
}  
// 🔑 New: get by numeric ID instead of userId

  async createApplicant(applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
    const [newApplicant] = await db
      .insert(applicants)
      .values(applicant)
      .returning();
    return newApplicant;
  } 
async upsertEmploymentHistory(applicantId: number, jobs: any[]) {
  await db.delete(employmentHistory).where(eq(employmentHistory.applicantId, applicantId));
  if (jobs.length > 0) {
    await db.insert(employmentHistory).values(jobs.map(j => ({ ...j, applicantId })));
  }
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

  return await db
    .select()
    .from(jobs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobs.createdAt));
}
// Fetch Jobs
  async getJob(id: number): Promise<any | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .leftJoin(JG, eq(jobs.jg,JG.id))
      .where(eq(jobs.id, id));
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
  async getApplications(
  filters?: { applicantId?: number; jobId?: number; status?: string }
): Promise<Application[]> {
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

  const application = await db
    .select()
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    // .leftJoin(jobs,eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt));

    return application;
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
  
  async getConstituencies(): Promise<Constituency[]> {
    return db.select().from(constituencies).orderBy(constituencies.name);
  }

  async getWards(): Promise<Ward[]> {
    return db.select().from(wards).orderBy(wards.name);
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
  async progressCompletion(step: number):Promise<boolean> {
  const[res] = await db.select({res: applicants.profileCompletionPercentage}).from(applicants).where(lt(applicants.profileCompletionPercentage, step)).limit(1); //<=
  console.log(`"Progress data for ${step} is `, res?.res);
  
    if (!res) {
    return false;
  }
    return true;
  }
   /**
   * Compute applicant progress dynamically
   */
  async getProgress(applicantId: number) {
    const applicant = await this.getApplicantById(applicantId);
    if (!applicant) return { percentage: 0, completedSteps: 0, steps: [] };

    const steps = [
      {
        id: 1,
        name: "Personal Info",
        required: true,
        completed: !!(
          applicant.firstName &&
          applicant.surname &&
          applicant.phoneNumber
        ),
      },
      {
        id: 1.5,
        name: "Employee Details",
        required: false,
        completed: !!applicant.isEmployee,
      },
      {
        id: 2,
        name: "Address",
        required: true,
        completed: !!applicant.countyId,
      },
      {
        id: 3,
        name: "Education",
        required: true,
        completed: applicant.education?.length > 0,
      },
      {
        id: 4,
        name: "Short Courses",
        required: false,
        completed: applicant.shortCourses?.length > 0,
      },
      {
        id: 5,
        name: "Professional Qualifications",
        required: false,
        completed: applicant.professionalQualifications?.length > 0,
      },
      {
        id: 6,
        name: "Employment History",
        required: false,
        completed: applicant.employmentHistory?.length > 0,
      },
      {
        id: 7,
        name: "Referees",
        required: false,
        completed: applicant.referees?.length > 0,
      },
      {
        id: 8,
        name: "Documents",
        required: true,
        completed: applicant.documents?.length > 0,
      },
    ];

    const completedSteps = steps.filter((s) => s.completed).length;
    const percentage = Math.round((completedSteps / steps.length) * 100);

    return {
      percentage,
      completedSteps,
      steps,
    };
  }
  private computeCompletedSteps(applicant: any) {
  const steps: number[] = [];

  if (applicant.firstName && applicant.surname && applicant.phoneNumber) {
    steps.push(1); // Personal Details
  }
  if (applicant.isEmployee && applicant.employee) {
    steps.push(1.5); // Employee Details
  }
  if (applicant.address) {
    steps.push(2); // Address
  }
  if (applicant.education?.length > 0) {
    steps.push(3); // Education
  }
  if (applicant.shortCourses?.length > 0) {
    steps.push(4); // Short Courses
  }
  if (applicant.professionalQualifications?.length > 0) {
    steps.push(5); // Professional Qualifications
  }
  if (applicant.employmentHistory?.length > 0) {
    steps.push(6); // Employment History
  }
  if (applicant.referees?.length > 0) {
    steps.push(7); // Referees
  }
  if (applicant.documents?.length > 0) {
    steps.push(8); // Documents
  }

  return steps;
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
    const dataEmployee: any = { ...employeeData }
    // Fix date-only fields
    console.log("AT EMPLOYEE END", dataEmployee);
    
  if (dataEmployee.dofa) {
    dataEmployee.dofa = new Date(dataEmployee.dofa);
  }
  if (dataEmployee.doca) {
    dataEmployee.doca = new Date(dataEmployee.doca);
  }

  // Never let the client override createdAt
  if ("createdAt" in dataEmployee) {
    delete dataEmployee.createdAt;
  }
  if ("updatedAt" in dataEmployee) {
    delete dataEmployee.updatedAt;
  }

  // Always set updatedAt on the server
  dataEmployee.updatedAt = new Date();
    // dataEmployee.doca = this.handleDates(dataEmployee.doca);
    // dataEmployee.dofa = this.handleDates(dataEmployee.dofa);
    
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.applicantId, applicantId))
      .then(rows => rows[0]);

    if (existingEmployee) {
      const [updatedEmployee] = await db
        .update(employees)
        .set({ ...dataEmployee, updatedAt: new Date() })
        .where(eq(employees.id, existingEmployee.id))
        .returning();
      return updatedEmployee;
    } else {
      const [newEmployee] = await db
        .insert(employees)
        .values({
          applicantId,
          ...dataEmployee,
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

  // Report operations
  async getApplicationsReport(startDate?: string, endDate?: string): Promise<any> {
    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = sql`${applications.createdAt} >= ${startDate} AND ${applications.createdAt} <= ${endDate}`;
    } else if (startDate) {
      dateFilter = sql`${applications.createdAt} >= ${startDate}`;
    } else if (endDate) {
      dateFilter = sql`${applications.createdAt} <= ${endDate}`;
    }

    const applicationsData = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        jobTitle: jobs.title,
        applicantId: applications.applicantId,
        applicantName: sql<string>`CONCAT(${applicants.firstName}, ' ', ${applicants.surname})`,
        status: applications.status,
        submittedOn: applications.submittedOn,
        department: departments.name,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .innerJoin(departments, eq(jobs.departmentId, departments.id))
      .where(dateFilter)
      .orderBy(desc(applications.createdAt));

    const summary = await db
      .select({
        total: sql<number>`COUNT(*)`,
        submitted: sql<number>`COUNT(CASE WHEN ${applications.status} = 'submitted' THEN 1 END)`,
        shortlisted: sql<number>`COUNT(CASE WHEN ${applications.status} = 'shortlisted' THEN 1 END)`,
        interviewed: sql<number>`COUNT(CASE WHEN ${applications.status} = 'interviewed' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${applications.status} = 'rejected' THEN 1 END)`,
        hired: sql<number>`COUNT(CASE WHEN ${applications.status} = 'hired' THEN 1 END)`,
      })
      .from(applications)
      .where(dateFilter);

    return {
      data: applicationsData,
      summary: summary[0],
      dateRange: { startDate, endDate }
    };
  }

  async getJobsReport(startDate?: string, endDate?: string): Promise<any> {
    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = sql`${jobs.createdAt} >= ${startDate} AND ${jobs.createdAt} <= ${endDate}`;
    } else if (startDate) {
      dateFilter = sql`${jobs.createdAt} >= ${startDate}`;
    } else if (endDate) {
      dateFilter = sql`${jobs.createdAt} <= ${endDate}`;
    }

    const jobsData = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        department: departments.name,
        isActive: jobs.isActive,
        posts: jobs.posts,
        startDate: jobs.startDate,
        endDate: jobs.endDate,
        createdAt: jobs.createdAt,
        totalApplications: sql<number>`COUNT(${applications.id})`,
      })
      .from(jobs)
      .innerJoin(departments, eq(jobs.departmentId, departments.id))
      .leftJoin(applications, eq(jobs.id, applications.jobId))
      .where(dateFilter)
      .groupBy(jobs.id, departments.name)
      .orderBy(desc(jobs.createdAt));

    const summary = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(CASE WHEN ${jobs.isActive} = true THEN 1 END)`,
        inactive: sql<number>`COUNT(CASE WHEN ${jobs.isActive} = false THEN 1 END)`,
        totalPosts: sql<number>`COALESCE(SUM(${jobs.posts}), 0)`,
      })
      .from(jobs)
      .where(dateFilter);

    return {
      data: jobsData,
      summary: summary[0],
      dateRange: { startDate, endDate }
    };
  }

  async getUsersReport(startDate?: string, endDate?: string): Promise<any> {
    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = sql`${users.createdAt} >= ${startDate} AND ${users.createdAt} <= ${endDate}`;
    } else if (startDate) {
      dateFilter = sql`${users.createdAt} >= ${startDate}`;
    } else if (endDate) {
      dateFilter = sql`${users.createdAt} <= ${endDate}`;
    }

    const usersData = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        profileCompleted: applicants.profileCompletionPercentage,
        county: counties.name,
      })
      .from(users)
      .leftJoin(applicants, eq(users.id, applicants.userId))
      .leftJoin(counties, eq(applicants.countyId, counties.id))
      .where(dateFilter)
      .orderBy(desc(users.createdAt));

    const summary = await db
      .select({
        total: sql<number>`COUNT(*)`,
        applicants: sql<number>`COUNT(CASE WHEN ${users.role} = 'applicant' THEN 1 END)`,
        admins: sql<number>`COUNT(CASE WHEN ${users.role} = 'admin' THEN 1 END)`,
        board: sql<number>`COUNT(CASE WHEN ${users.role} = 'board' THEN 1 END)`,
      })
      .from(users)
      .where(dateFilter);

    return {
      data: usersData,
      summary: summary[0],
      dateRange: { startDate, endDate }
    };
  }

  async getPerformanceReport(startDate?: string, endDate?: string): Promise<any> {
    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = sql`${applications.createdAt} >= ${startDate} AND ${applications.createdAt} <= ${endDate}`;
    } else if (startDate) {
      dateFilter = sql`${applications.createdAt} >= ${startDate}`;
    } else if (endDate) {
      dateFilter = sql`${applications.createdAt} <= ${endDate}`;
    }

    // Department-wise performance
    const departmentStats = await db
      .select({
        department: departments.name,
        totalJobs: sql<number>`COUNT(DISTINCT ${jobs.id})`,
        totalApplications: sql<number>`COUNT(${applications.id})`,
        hired: sql<number>`COUNT(CASE WHEN ${applications.status} = 'hired' THEN 1 END)`,
        avgApplicationsPerJob: sql<number>`ROUND(COUNT(${applications.id})::numeric / NULLIF(COUNT(DISTINCT ${jobs.id}), 0), 2)`,
        hireRate: sql<number>`ROUND((COUNT(CASE WHEN ${applications.status} = 'hired' THEN 1 END)::numeric / NULLIF(COUNT(${applications.id}), 0)) * 100, 2)`,
      })
      .from(departments)
      .leftJoin(jobs, eq(departments.id, jobs.departmentId))
      .leftJoin(applications, eq(jobs.id, applications.jobId))
      .where(dateFilter)
      .groupBy(departments.id, departments.name)
      .orderBy(departments.name);

    // Overall metrics
    const overallMetrics = await db
      .select({
        totalApplications: sql<number>`COUNT(*)`,
        totalJobs: sql<number>`COUNT(DISTINCT ${applications.jobId})`,
        totalHired: sql<number>`COUNT(CASE WHEN ${applications.status} = 'hired' THEN 1 END)`,
        avgProcessingDays: sql<number>`ROUND(AVG(EXTRACT(epoch FROM (${applications.updatedAt} - ${applications.createdAt})) / 86400), 1)`,
        hireRate: sql<number>`ROUND((COUNT(CASE WHEN ${applications.status} = 'hired' THEN 1 END)::numeric / COUNT(*)) * 100, 2)`,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(dateFilter);

    return {
      departmentStats,
      overallMetrics: overallMetrics[0],
      dateRange: { startDate, endDate }
    };
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
