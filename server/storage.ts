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
	adminDocuments,
	otpVerification,
	employees,
	payroll,
	JG,
	shortCourse,
	professionalQualifications,
	certificateLevel,
	faq,
	galleryItems,
	systemConfig,
	boardMembers,
	carouselSlides,
	panelScores,
	noticeSubscriptions,
	notifications,
	notificationRecipients,
	votes,
	voteAccounts,
	budgets,
	transactions,
	masterImprestRegister,
	rmsDocuments,
	rmsComments,
	rmsWorkflowLog,
	dialRecords,
	spouses,
	dependents,
	statementItems,
	uploadedFiles,
	auditLogs,
	type DialRecord,
	type InsertDialRecord,
	type Spouse,
	type InsertSpouse,
	type Dependent,
	type InsertDependent,
	type StatementItem,
	type InsertStatementItem,
	type UploadedFile,
	type InsertUploadedFile,
	type AuditLog,
	type InsertAuditLog,
	type DialRecordWithRelations,
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
	type NoticeSubscription,
	type InsertNoticeSubscription,
	type ProfessionalQualification,
	type Faq,
	type GalleryItem,
	type SystemConfig,
	type BoardMember,
	type CarouselSlide,
	type InsertCarouselSlide,
	type InsertGalleryItem,
	type InsertSystemConfig,
	type InsertBoardMember,
	type PanelScores,
	type InsertPanelScore,
	type Notification,
	type NotificationRecipient,
	type InsertNotificationRecipient,
	type InsertNotification,
	type Ethnicity,
	type AdminDocument,
	type InsertAdminDocument,
	type Vote,
	type VoteAccount,
	type Budget,
	type Transaction,
	type MasterImprestRegister,
	type RmsDocument,
	type InsertRmsDocument,
	type RmsComment,
	type InsertRmsComment,
	type RmsWorkflowLog,
	type InsertRmsWorkflowLog,
} from "@shared/schema";
import { db } from "./db";
import {
	eq,
	desc,
	and,
	like,
	sql,
	lt,
	PromiseOf,
	or,
	ne,
	isNull,
	not,
	isNotNull,
} from "drizzle-orm";
import { Fullscreen } from "lucide-react";
export interface IStorage {
	// User operations (mandatory for Replit Auth)
	getUser(id: string): Promise<User | undefined>;
	upsertUser(user: UpsertUser): Promise<User>;
	updateUserRole(
		userId: string,
		role: "applicant" | "admin" | "board"
	): Promise<User | undefined>;

	// Applicant operations
	getApplicant(userId: string): Promise<Applicant | undefined>;
	createApplicant(
		applicant: Omit<Applicant, "id" | "createdAt" | "updatedAt">
	): Promise<Applicant>;
	updateApplicant(
		id: number,
		applicant: Partial<Applicant>,
		step: number
	): Promise<Applicant>;
	getApplicantById(id: number): Promise<any | undefined>;
	// Job operations
	getJobs(filters?: {
		isActive?: boolean;
		departmentId?: number;
	}): Promise<Job[]>;
	getJob(id?: number): Promise<any | undefined>;
	createJob(job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job>;
	updateJob(id: number, job: Partial<Job>): Promise<Job>;
	getStudyAreaByName(name: string): Promise<StudyArea | undefined>;
	getCertLevel(): Promise<CertificateLevel[]>;

	// Application operations
	getApplications(filters?: {
		applicantId?: number;
		jobId?: number;
		status?: string;
	}): Promise<Application[]>;
	createApplication(
		application: Omit<Application, "id" | "createdAt" | "updatedAt">
	): Promise<Application>;
	updateApplication(
		id: number,
		application: Partial<Application>
	): Promise<Application>;

	// Location operations
	getCounties(): Promise<County[]>;
	getConstituencies(): Promise<Constituency[]>;
	getWards(): Promise<Ward[]>;
	getConstituenciesByCounty(countyId: number): Promise<Constituency[]>;
	getCountyByCountyName(countyName: string): Promise<County | undefined>;
	getConstituencyByName(name: string): Promise<Constituency | undefined>;
	getWardsByConstituency(constituencyId: number): Promise<Ward[]>;

	// System configuration operations
	getDepartments(): Promise<Department[]>;
	getDesignations(): Promise<Designation[]>;
	getAwards(): Promise<Award[]>;
	getCoursesOffered(): Promise<CourseOffered[]>;

	// Notice operations
	getNotices(isPublished?: boolean): Promise<Notice[]>;
	createNotice(
		notice: Omit<Notice, "id" | "createdAt" | "updatedAt">
	): Promise<Notice>;
	updateNotice(id: number, notice: Partial<Notice>): Promise<Notice>;

	// Subscription operations
	createSubscription(
		subscription: InsertNoticeSubscription
	): Promise<NoticeSubscription>;
	getSubscription(email: string): Promise<NoticeSubscription | undefined>;
	unsubscribeEmail(token: string): Promise<boolean>;
	getActiveSubscriptions(): Promise<NoticeSubscription[]>;

	// Employee operations
	verifyEmployee(
		personalNumber: string,
		idNumber: string
	): Promise<Payroll | undefined>;
	upsertEmployeeDetails(
		applicantId: number,
		employeeData: Partial<InsertEmployee>
	): Promise<Employee>;

	// L
	// OTP operations
	createOtp(phoneNumber: string, otp: string): Promise<OtpVerification>;
	comparePasswords(password: string): Promise<boolean>;
	verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
	getUserByEmail(email: string): Promise<User>;
	verifyEmail(email: string): Promise<boolean>;
	cleanupExpiredOtps(): Promise<void>;
	// Seed operations
	seedJobGroup(jobGroup: Omit<Jg, "id">): Promise<Jg>;
	seedCounties(county: Omit<County, "id">): Promise<County>;
	seedSubCounties(subCounty: Omit<Constituency, "id">): Promise<Constituency>;
	seedWard(ward: Omit<Ward, "id">): Promise<Ward>;
	seedAward(award: Omit<Award, "id">): Promise<Award>;
	seedInstitutions(institute: Omit<Institution, "id">): Promise<Institution>;
	seedDesignation(designation: Omit<Designation, "id">): Promise<Designation>;
	seedDepartment(department: Omit<Department, "id">): Promise<Department>;
	//Truncate tables
	truncateAll(): Promise<void>;

	// Report operations
	getApplicationsReport(startDate?: string, endDate?: string): Promise<any>;
	getJobsReport(startDate?: string, endDate?: string): Promise<any>;
	getUsersReport(startDate?: string, endDate?: string): Promise<any>;
	getPerformanceReport(startDate?: string, endDate?: string): Promise<any>;
	getAllUsersForRoleAssignment(): Promise<any[]>;

	// Notification operations
	getNotifications(): Promise<Notification[]>;
	createNotification(data: InsertNotification): Promise<Notification>;
	updateNotification(
		id: number,
		data: Partial<InsertNotification>
	): Promise<Notification>;
	getNotificationStats(): Promise<{
		totalSent: number;
		openRate: number;
		activeUsers: number;
		pending: number;
	}>;
	// Enhanced recipient tracking
	createNotificationRecipients(
		notificationId: number,
		recipients: InsertNotificationRecipient[]
	): Promise<void>;
	updateRecipientStatus(
		recipientId: number,
		status: string,
		lastError?: string
	): Promise<void>;
	getNotificationRecipients(
		notificationId: number,
		status?: string
	): Promise<NotificationRecipient[]>;
	retryFailedRecipients(notificationId: number): Promise<void>;
	trackNotificationOpen(trackingToken: string): Promise<boolean>;
	getNotificationRecipientsForAudience(
		notificationId: number,
		audience: string
	): Promise<any[]>;

	// Board member operations
	getBoardMembers(): Promise<BoardMember[]>;
	createBoardMember(member: InsertBoardMember): Promise<BoardMember>;
	updateBoardMember(
		id: number,
		member: Partial<InsertBoardMember>
	): Promise<BoardMember>;
	deleteBoardMember(id: number): Promise<BoardMember>;

	// Panel scoring operations
	createPanelScore(score: InsertPanelScore): Promise<PanelScores>;
	getPanelScores(applicationId: number): Promise<PanelScores[]>;
	updatePanelScore(
		scoreId: number,
		score: Partial<InsertPanelScore>
	): Promise<PanelScores>;
	getPanelScore(
		applicationId: number,
		panelId: number
	): Promise<PanelScores | undefined>;
	getAverageScores(applicationId: number): Promise<{
		avgAcademicScore: number;
		avgExperienceScore: number;
		avgSkillsScore: number;
		avgLeadershipScore: number;
		avgGeneralScore: number;
		totalPanelMembers: number;
	}>;

	// Job archiving operations
	archiveExpiredJobs(): Promise<number>;
	getArchivedJobs(): Promise<Job[]>;

	// Admin documents operations
	createAdminDocument(doc: InsertAdminDocument): Promise<AdminDocument>;
	getAdminDocuments(filters?: {
		type?: string;
		jobId?: number;
	}): Promise<AdminDocument[]>;
	updateAdminDocument(
		id: number,
		doc: Partial<InsertAdminDocument>
	): Promise<AdminDocument>;
	deleteAdminDocument(id: number): Promise<void>;
	// Applicant document uploads
	createApplicantDocument(doc: any): Promise<any>;
	// Payroll bulk upsert (for importing employee lists)
	bulkUpsertPayroll(
		rows: Array<{
			personalNumber: string;
			idNumber: string;
			designation?: string;
		}>
	): Promise<number>;

	// Interview scheduling operations
	scheduleInterview(
		applicationId: number,
		interviewDate: string,
		interviewTime: string,
		duration: number
	): Promise<Application>;
	bulkScheduleInterviews(
		schedules: Array<{
			applicationId: number;
			interviewDate: string;
			interviewTime: string;
			duration: number;
		}>
	): Promise<void>;

	// SMS-triggered status update operations
	shortlistApplicationWithSMS(applicationId: number): Promise<Application>;
	hireApplicationWithSMS(applicationId: number): Promise<Application>;

	// Accounting module operations
	getAllVoteAccounts(): Promise<any[]>;
	getAllVote(): Promise<any[]>;
	createVoteAccount(data: any): Promise<any>;
	getAllBudgets(): Promise<any[]>;
	createBudget(data: any): Promise<any>;
	getTransactions(filters?: { type?: any; status?: any }): Promise<any[]>;
	createClaim(data: any): Promise<any>;
	createPayment(data: any): Promise<any>;
	approveTransaction(id: number, approvedBy: string): Promise<any>;
	rejectTransaction(
		id: number,
		rejectedBy: string,
		reason: string
	): Promise<any>;
	getAllMIREntries(): Promise<any[]>;
	createMIREntry(data: any): Promise<any>;
	retireMIREntry(
		id: number,
		retirementAmount: number,
		retirementDate: string,
		retirementVoucherNo: string
	): Promise<any>;
	getAllEmployees(): Promise<any[]>;
	// DIAL Records
	getDialRecord(id: number): Promise<DialRecordWithRelations | undefined>;
	getDialRecordsByUserId(userId: string): Promise<DialRecordWithRelations[]>;
	getDialRecordsByStatus(status: string): Promise<DialRecordWithRelations[]>;
	getAllDialRecords(): Promise<DialRecordWithRelations[]>;
	createDialRecord(dialRecord: InsertDialRecord): Promise<DialRecord>;
	updateDialRecord(
		id: number,
		dialRecord: Partial<InsertDialRecord>
	): Promise<DialRecord | undefined>;
	deleteDialRecord(id: number): Promise<boolean>;

	// Spouses
	createSpouse(spouse: InsertSpouse): Promise<Spouse>;
	updateSpouse(
		id: number,
		spouse: Partial<InsertSpouse>
	): Promise<Spouse | undefined>;
	deleteSpouse(id: number): Promise<boolean>;
	deleteSpousesByDialRecordId(dialRecordId: number): Promise<boolean>;

	// Dependents
	createDependent(dependent: InsertDependent): Promise<Dependent>;
	updateDependent(
		id: number,
		dependent: Partial<InsertDependent>
	): Promise<Dependent | undefined>;
	deleteDependent(id: number): Promise<boolean>;
	deleteDependentsByDialRecordId(dialRecordId: number): Promise<boolean>;

	// Statement Items
	createStatementItem(item: InsertStatementItem): Promise<StatementItem>;
	updateStatementItem(
		id: number,
		item: Partial<InsertStatementItem>
	): Promise<StatementItem | undefined>;
	deleteStatementItem(id: number): Promise<boolean>;
	deleteStatementItemsByDialRecordId(dialRecordId: number): Promise<boolean>;

	// Audit Logs
	createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
	getAuditLogsByDialRecordId(dialRecordId: number): Promise<AuditLog[]>;

	// Files
	createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
	getUploadedFilesByDialRecordId(dialRecordId: number): Promise<UploadedFile[]>;
	deleteUploadedFile(id: number): Promise<boolean>;

	// Stats
	getDialStats(userId?: string): Promise<{
		total: number;
		draft: number;
		submitted: number;
		approved: number;
	}>;
}
export class DatabaseStorage implements IStorage {
	// User operations
	// Stub for IStorage interface compliance. Does nothing to prevent accidental data loss.
	async truncateAll(): Promise<void> {
		// Intentionally left blank. No truncation performed.
	}
	async getUser(id: string): Promise<User | undefined> {
		const [user] = await db.select().from(users).where(eq(users.id, id));
		return user;
	}
	async getUsers(): Promise<any[]> {
		const user = await db
			.select({
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.surname})`,
				email: users.email,
			})
			.from(users)
			.where(or(eq(users.role, "admin"), eq(users.role, "board")));
		return user;
	}

	async getAllUsersForRoleAssignment(): Promise<any[]> {
		const allUsers = await db
			.select({
				id: users.id,
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.surname})`,
				email: users.email,
				role: users.role,
			})
			.from(users)
			.orderBy(users.firstName);
		return allUsers;
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

	async updateUserRole(
		userId: string,
		role: "applicant" | "admin" | "board"
	): Promise<User | undefined> {
		const [user] = await db
			.update(users)
			.set({
				role,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))
			.returning();
		return user;
	}
	// Applicant operations
	async getApplicant(userId: string): Promise<any> {
		// First fetch applicant + employee
		const [applicant] = await db
			.select()
			.from(applicants)
			.leftJoin(users, eq(applicants.userId, users.id))
			.leftJoin(payroll, eq(payroll.idNumber, users.nationalId))
			.leftJoin(employees, eq(applicants.id, employees.applicantId))
			.where(eq(applicants.userId, userId));

		if (!applicant) {
			const [applicant] = await db
				.select({
					firstName: users.firstName,
					surname: users.surname,
					nationalId: users.nationalId,
					idPassportType: users.idPassportType,
					phoneNumber: users.phoneNumber,
				})
				.from(users)
				.where(eq(users.id, userId));
			return applicant;
		}

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
			db
				.select()
				.from(educationRecords)
				.where(eq(educationRecords.applicantId, applicantId)),
			db
				.select()
				.from(shortCourse)
				.where(eq(shortCourse.applicantId, applicantId)),
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
			employee: applicant.employees || applicant.payroll,
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
			db
				.select()
				.from(educationRecords)
				.where(eq(educationRecords.applicantId, applicantId)),
			db
				.select()
				.from(shortCourse)
				.where(eq(shortCourse.applicantId, applicantId)),
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
			employee: applicant.employees || undefined,
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
			console.log(
				`Progress updated to step ${step} for applicant ${applicantId}`
			);
		} else {
			console.log(`Step ${step} ignored (already at ${current.progress})`);
		}
	}

	async updateApplicant(applicantId: number, data: any, step: number) {
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
				dateOfBirth: data.dateOfBirth,
				gender: data.gender,
				nationality: data.nationality,
				phoneNumber: data.phoneNumber,
				altPhoneNumber: data.altPhoneNumber,
				kraPin: data.kraPin,
				ethnicity: data.ethnicity,
				religion: data.religion,
				...(data.isEmployee !== undefined
					? { isEmployee: data.isEmployee }
					: {}),
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
		if (data.employee?.dofa) {
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
		const replaceArray = async (
			table: any,
			rows: any[],
			stepNumber: number
		) => {
			await db.delete(table).where(eq(table.applicantId, applicantId));
			if (rows?.length > 0) {
				await db.insert(table).values(rows.map((r) => ({ ...r, applicantId })));
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
			await replaceArray(
				professionalQualifications,
				data.professionalQualifications,
				5
			);
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

	async createApplicant(
		applicant: Omit<Applicant, "id" | "createdAt" | "updatedAt">
	): Promise<Applicant> {
		const [newApplicant] = await db
			.insert(applicants)
			.values(applicant)
			.returning();
		return newApplicant;
	}
	async upsertEmploymentHistory(applicantId: number, jobs: any[]) {
		await db
			.delete(employmentHistory)
			.where(eq(employmentHistory.applicantId, applicantId));
		if (jobs.length > 0) {
			await db
				.insert(employmentHistory)
				.values(jobs.map((j) => ({ ...j, applicantId })));
		}
	}
	// Job operations
	async getJobs(filters?: {
		isActive?: boolean;
		departmentId?: number;
	}): Promise<Job[]> {
		const conditions = [];

		if (filters?.isActive !== undefined) {
			conditions.push(eq(jobs.isActive, filters.isActive));
		}

		if (filters?.departmentId) {
			conditions.push(eq(jobs.departmentId, filters.departmentId));
		}

		const job = await db
			.select({
				id: jobs.id,
				advertNumb: jobs.advertNumb,
				title: jobs.title,
				description: jobs.description,
				departmentId: jobs.departmentId,
				designationId: jobs.designationId,
				requirements: jobs.requirements,
				isActive: jobs.isActive,
				category: jobs.category,
				experience: jobs.experience,
				posts: jobs.posts,
				venue: jobs.venue,
				requiredSpecializationIds: jobs.requiredSpecializationIds,
				certificateLevel: jobs.certificateLevel,
				requiredStudyAreaId: jobs.requiredStudyAreaId,
				progressionAllowed: jobs.progressionAllowed,
				isReleased: jobs.isReleased,
				advertType: jobs.advertType,
				status: jobs.status,
				startDate: jobs.startDate,
				endDate: jobs.endDate,
				archivedAt: jobs.archivedAt,
				jg: jobs.jg,
				jgName: JG.name, // Include only the name from JG
			})
			.from(jobs)
			.leftJoin(JG, eq(jobs.jg, JG.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(jobs.createdAt));
		return job as any;
	}
	// Fetch Jobs
	async getJob(id: number): Promise<any | undefined> {
		const [job] = await db
			.select({
				id: jobs.id,
				advertNumb: jobs.advertNumb,
				title: jobs.title,
				description: jobs.description,
				departmentId: jobs.departmentId,
				designationId: jobs.designationId,
				requirements: jobs.requirements,
				isActive: jobs.isActive,
				category: jobs.category,
				experience: jobs.experience,
				posts: jobs.posts,
				venue: jobs.venue,
				requiredSpecializationIds: jobs.requiredSpecializationIds,
				certificateLevel: jobs.certificateLevel,
				requiredStudyAreaId: jobs.requiredStudyAreaId,
				progressionAllowed: jobs.progressionAllowed,
				isReleased: jobs.isReleased,
				advertType: jobs.advertType,
				status: jobs.status,
				startDate: jobs.startDate,
				endDate: jobs.endDate,
				archivedAt: jobs.archivedAt,
				jgName: JG.name, // Include only the name from JG
			})
			.from(jobs)
			.leftJoin(JG, eq(jobs.jg, JG.id))
			.where(eq(jobs.id, id));
		return job;
	}
	// Create Jobs
	async createJob(
		job: Omit<Job, "id" | "createdAt" | "updatedAt">
	): Promise<Job> {
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
	async getApplications(filters?: {
		applicantId?: number | null;
		jobId?: number | null;
		status?: string | null;
	}): Promise<any[]> {
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

		// Step 1: Get the applications with basic joins
		const rawApplications = await db
			.select({
				id: applications.id,
				status: applications.status,
				submittedOn: applications.submittedOn,
				// remarks: applications.remarks,
				interviewDate: applications.interviewDate,
				interviewScore: applications.interviewScore,
				interviewTime: applications.interviewTime,
				interviewVenue: applications.interviewVenue,
				interviewDuration: applications.interviewDuration,

				createdAt: applications.createdAt,
				updatedAt: applications.updatedAt,
				applicantId: applicants.id,
				applicantUserId: applicants.userId,
				firstName: applicants.firstName,
				surname: applicants.surname,
				lastName: applicants.otherName,
				nationalId: applicants.nationalId,
				dateOfBirth: applicants.dateOfBirth,
				gender: applicants.gender,
				ward: wards.name,
				constituency: constituencies.name,
				county: counties.name,
				email: users.email,
				phoneNumber: users.phoneNumber,
				ethnicity: applicants.ethnicity,
				age: sql<number>`date_part('year', age(current_date, ${applicants.dateOfBirth}))`,
				jobId: jobs.id,
				jobTitle: jobs.title,
				jobDescription: jobs.description,
				jgId: jobs.jg,
				jobGroupName: JG.name,

				departmentId: departments.id,
				departmentName: departments.name,

				scoreId: panelScores.scoreId,
				panelId: panelScores.panelId,
				academicScore: panelScores.academicScore,
				experienceScore: panelScores.experienceScore,
				skillsScore: panelScores.skillsScore,
				leadershipScore: panelScores.leadershipScore,
				generalScore: panelScores.generalScore,
				negativeScore: panelScores.negativeScore,
				remarks: panelScores.remarks,
			})
			.from(applications)
			.leftJoin(jobs, eq(applications.jobId, jobs.id))
			.leftJoin(departments, eq(jobs.departmentId, departments.id))
			.leftJoin(applicants, eq(applications.applicantId, applicants.id))
			.leftJoin(users, eq(users.id, applicants.userId))
			.leftJoin(JG, eq(JG.id, jobs.jg))
			.leftJoin(wards, eq(wards.id, applicants.wardId))
			.leftJoin(counties, eq(counties.id, applicants.countyId))
			.leftJoin(
				constituencies,
				eq(constituencies.id, applicants.constituencyId)
			)
			.leftJoin(panelScores, eq(applications.id, panelScores.applicationId))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(applications.createdAt));

		// Step 2: Group rows by application id to avoid duplicate application entries
		// when there are multiple panel score rows (one per panel member).
		const appMap = new Map<number, any>();

		for (const row of rawApplications) {
			const appId = row.id as number;
			if (!appMap.has(appId)) {
				// clone base row fields (these are the repeated fields across panel rows)
				appMap.set(appId, {
					id: row.id,
					status: row.status,
					submittedOn: row.submittedOn,
					remarks: row.remarks,
					interviewDate: row.interviewDate,
					interviewScore: row.interviewScore,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					jobId: row.jobId,
					jobTitle: row.jobTitle,
					jobDescription: row.jobDescription,
					jgId: row.jgId,
					jobGroupName: row.jobGroupName,
					departmentId: row.departmentId,
					departmentName: row.departmentName,
					applicantId: row.applicantId,
					applicantUserId: row.applicantUserId,
					firstName: row.firstName,
					surname: row.surname,
					lastName: row.lastName,
					nationalId: row.nationalId,
					dateOfBirth: row.dateOfBirth,
					gender: row.gender,
					ward: row.ward,
					constituency: row.constituency,
					county: row.county,
					email: row.email,
					phoneNumber: row.phoneNumber,
					ethnicity: row.ethnicity,
					age: row.age,
					interviewTime: row.interviewTime,
					interviewVenue: row.interviewVenue,
					interviewDuration: row.interviewDuration,
					// container for panel scores per application
					panelScores: [],
				});
			}

			// push panel score row if present
			if (row.scoreId) {
				const entry = appMap.get(appId);
				entry.panelScores.push({
					scoreId: row.scoreId,
					panelId: row.panelId,
					academicScore: row.academicScore,
					experienceScore: row.experienceScore,
					skillsScore: row.skillsScore,
					leadershipScore: row.leadershipScore,
					generalScore: row.generalScore,
					negativeScore: row.negativeScore,
					remarks: row.remarks,
				});
			}
		}

		// Build final unique application list and fetch applicant-related arrays
		const uniqueApps = Array.from(appMap.values());

		const applicationsWithFullApplicant = await Promise.all(
			uniqueApps.map(async (app) => {
				const applicantId = app.applicantId as number | null;
				const userId = app.applicantUserId;

				// Get employee or payroll
				let employeeRecord: any = null;
				if (applicantId != null) {
					const [rec] = await db
						.select()
						.from(employees)
						.where(eq(employees.applicantId, applicantId));
					employeeRecord = rec;
				}

				// Get all arrays related to the applicant
				let educationRecordsArr: any[] = [];
				let shortCourseRecords: any[] = [];
				let qualificationRecords: any[] = [];
				let employmentRecords: any[] = [];
				let refereeRecords: any[] = [];
				let documentRecords: any[] = [];

				if (applicantId != null) {
					[
						educationRecordsArr,
						shortCourseRecords,
						qualificationRecords,
						employmentRecords,
						refereeRecords,
						documentRecords,
					] = await Promise.all([
						db
							.select()
							.from(educationRecords)
							.where(eq(educationRecords.applicantId, applicantId)),
						db
							.select()
							.from(shortCourse)
							.where(eq(shortCourse.applicantId, applicantId)),
						db
							.select()
							.from(professionalQualifications)
							.where(eq(professionalQualifications.applicantId, applicantId)),
						db
							.select()
							.from(employmentHistory)
							.where(eq(employmentHistory.applicantId, applicantId)),
						db
							.select()
							.from(referees)
							.where(eq(referees.applicantId, applicantId)),
						db
							.select()
							.from(documents)
							.where(eq(documents.applicantId, applicantId)),
					]);
				}

				// compute average scores across panel members for this application
				const scores = app.panelScores || [];
				const totalPanelMembers = scores.length;

				const avg = (arrKey: string) => {
					if (totalPanelMembers === 0) return 0;
					const sum = scores.reduce(
						(s: number, r: any) => s + (Number(r[arrKey]) || 0),
						0
					);
					return Math.round((sum / totalPanelMembers) * 100) / 100; // two-decimal
				};

				const avgAcademicScore = avg("academicScore");
				const avgExperienceScore = avg("experienceScore");
				const avgSkillsScore = avg("skillsScore");
				const avgLeadershipScore = avg("leadershipScore");
				const avgGeneralScore = avg("generalScore");

				const fullApplicant = {
					id: applicantId,
					userId: userId,
					firstName: app.firstName,
					surname: app.surname,
					fullName: ` ${app.surname}, ${app.firstName} ${app.lastName}`,
					nationalId: app.nationalId,
					gender: app.gender,
					dateOfBirth: app.dateOfBirth,
					email: app.email,
					ethnicity: app.ethnicity,
					phoneNumber: app.phoneNumber,
					age: app.age,
					ward: app.ward,
					county: app.county,
					constituency: app.constituency,
					employee: employeeRecord || null,
					education: educationRecordsArr,
					shortCourses: shortCourseRecords,
					professionalQualifications: qualificationRecords,
					employmentHistory: employmentRecords,
					referees: refereeRecords,
					documents: documentRecords,
					interviewTime: app.interviewTime,
					interviewVenue: app.interviewVenue,
					interviewDuration: app.interviewDuration,
					// aggregated scores
					avgAcademicScore,
					avgExperienceScore,
					avgSkillsScore,
					avgLeadershipScore,
					avgGeneralScore,
					totalPanelMembers,
				};

				return {
					status: app.status,
					submittedOn: app.submittedOn,
					remarks: app.remarks,
					interviewDate: app.interviewDate,
					interviewScore: app.interviewScore,
					createdAt: app.createdAt,
					updatedAt: app.updatedAt,
					job: {
						id: app.jobId,
						title: app.jobTitle,
						description: app.jobDescription,
						jgId: app.jgId,
						jobGroupName: app.jobGroupName,
						department: {
							id: app.departmentId,
							name: app.departmentName,
						},
					},
					...fullApplicant,
				};
			})
		);

		return applicationsWithFullApplicant;
	}
	async createApplication(
		application: Omit<Application, "id" | "createdAt" | "updatedAt">
	): Promise<Application> {
		const [newApplication] = await db
			.insert(applications)
			.values(application)
			.returning();
		return newApplication;
	}
	// Update Applications
	async updateApplication(
		id: number,
		application: Partial<Application>
	): Promise<Application> {
		// Normalize date/time fields coming from the client. The client often
		// sends ISO strings (e.g. new Date().toISOString()). Drizzle's PG
		// timestamp mapper expects a JS Date object and will call
		// value.toISOString(). Coerce known timestamp fields here to Date
		// objects to avoid TypeError: value.toISOString is not a function.
		const data: any = { ...application };

		if (data.shortlistedAt && typeof data.shortlistedAt === "string") {
			data.shortlistedAt = new Date(data.shortlistedAt);
		}
		if (data.hiredAt && typeof data.hiredAt === "string") {
			data.hiredAt = new Date(data.hiredAt);
		}

		// Prevent client from overriding server-managed timestamps
		if ("createdAt" in data) delete data.createdAt;
		if ("updatedAt" in data) delete data.updatedAt;

		const [updatedApplication] = await db
			.update(applications)
			.set({ ...data, updatedAt: new Date() })
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
		return await db.select().from(notices).orderBy(desc(notices.createdAt));
	}
	async getFaq() {
		return await db
			.select()
			.from(faq)
			// .groupBy(faq.category)
			.orderBy(desc(faq.category));
	}

	async updateFaq(id: number, faqData: Partial<any>) {
		const [updatedFaq] = await db
			.update(faq)
			.set({ ...faqData })
			.where(eq(faq.id, id))
			.returning();
		return updatedFaq;
	}

	async deleteFaq(id: number) {
		const [deletedFaq] = await db.delete(faq).where(eq(faq.id, id)).returning();
		return deletedFaq;
	}

	// Gallery operations
	async getGalleryItems() {
		return await db
			.select()
			.from(galleryItems)
			.where(eq(galleryItems.isPublished, true))
			.orderBy(desc(galleryItems.eventDate));
	}

	async createGalleryItem(item: InsertGalleryItem) {
		const [galleryItem] = await db
			.insert(galleryItems)
			.values(item)
			.returning();
		return galleryItem;
	}

	async updateGalleryItem(id: number, item: Partial<InsertGalleryItem>) {
		const [galleryItem] = await db
			.update(galleryItems)
			.set({ ...item, updatedAt: sql`now()` })
			.where(eq(galleryItems.id, id))
			.returning();
		return galleryItem;
	}

	async deleteGalleryItem(id: number) {
		const [galleryItem] = await db
			.update(galleryItems)
			.set({ isPublished: false, updatedAt: sql`now()` })
			.where(eq(galleryItems.id, id))
			.returning();
		return galleryItem;
	}

	// System configuration operations
	async getSystemConfig(key?: string, section?: string) {
		if (key) {
			return await db
				.select()
				.from(systemConfig)
				.where(eq(systemConfig.key, key))
				.orderBy(systemConfig.key);
		} else if (section) {
			return await db
				.select()
				.from(systemConfig)
				.where(eq(systemConfig.section, section))
				.orderBy(systemConfig.key);
		} else {
			return await db.select().from(systemConfig).orderBy(systemConfig.key);
		}
	}

	async upsertSystemConfig(config: InsertSystemConfig) {
		const [configItem] = await db
			.insert(systemConfig)
			.values(config)
			.onConflictDoUpdate({
				target: systemConfig.key,
				set: {
					value: config.value,
					updatedBy: config.updatedBy,
					updatedAt: sql`now()`,
				},
			})
			.returning();
		return configItem;
	}

	async deleteSystemConfig(
		section: string,
		key: string
	): Promise<SystemConfig> {
		const [configItem] = await db
			.delete(systemConfig)
			.where(and(eq(systemConfig.section, section), eq(systemConfig.key, key)))
			.returning();
		return configItem;
	}

	// Board members operations
	async getBoardMembers() {
		return await db
			.select()
			.from(boardMembers)
			.where(eq(boardMembers.isActive, true))
			.orderBy(boardMembers.order, boardMembers.name);
	}

	async createBoardMember(member: InsertBoardMember) {
		const [boardMember] = await db
			.insert(boardMembers)
			.values(member)
			.returning();
		return boardMember;
	}

	async updateBoardMember(id: number, member: Partial<InsertBoardMember>) {
		const [boardMember] = await db
			.update(boardMembers)
			.set({ ...member, updatedAt: sql`now()` })
			.where(eq(boardMembers.id, id))
			.returning();
		return boardMember;
	}

	async deleteBoardMember(id: number) {
		// Soft delete by setting isActive to false
		const [boardMember] = await db
			.update(boardMembers)
			.set({ isActive: false, updatedAt: sql`now()` })
			.where(eq(boardMembers.id, id))
			.returning();
		return boardMember;
	}

	// Panel scoring operations
	async createPanelScore(score: InsertPanelScore): Promise<PanelScores> {
		const [panelScore] = await db
			.insert(panelScores)
			.values({
				...score,
				updatedAt: sql`now()`,
			})
			.returning();
		return panelScore;
	}

	async getPanelScores(applicationId: number): Promise<PanelScores[]> {
		return await db
			.select()
			.from(panelScores)
			.where(eq(panelScores.applicationId, applicationId))
			.orderBy(panelScores.scoredOn);
	}

	async updatePanelScore(
		scoreId: number,
		score: Partial<InsertPanelScore>
	): Promise<PanelScores> {
		const [panelScore] = await db
			.update(panelScores)
			.set({
				...score,
				updatedAt: sql`now()`,
			})
			.where(eq(panelScores.scoreId, scoreId))
			.returning();
		return panelScore;
	}

	async getPanelScore(
		applicationId: number,
		panelId: number
	): Promise<PanelScores | undefined> {
		const [panelScore] = await db
			.select()
			.from(panelScores)
			.where(
				and(
					eq(panelScores.applicationId, applicationId),
					eq(panelScores.panelId, panelId)
				)
			);
		return panelScore;
	}

	async getAverageScores(applicationId: number): Promise<{
		avgAcademicScore: number;
		avgExperienceScore: number;
		avgSkillsScore: number;
		avgLeadershipScore: number;
		avgGeneralScore: number;
		totalPanelMembers: number;
	}> {
		const scores = await db
			.select({
				avgAcademicScore: sql<number>`COALESCE(AVG(${panelScores.academicScore}), 0)`,
				avgExperienceScore: sql<number>`COALESCE(AVG(${panelScores.experienceScore}), 0)`,
				avgSkillsScore: sql<number>`COALESCE(AVG(${panelScores.skillsScore}), 0)`,
				avgLeadershipScore: sql<number>`COALESCE(AVG(${panelScores.leadershipScore}), 0)`,
				avgGeneralScore: sql<number>`COALESCE(AVG(${panelScores.generalScore}), 0)`,
				totalPanelMembers: sql<number>`COUNT(*)`,
			})
			.from(panelScores)
			.where(eq(panelScores.applicationId, applicationId));

		const result = scores[0] || {
			avgAcademicScore: 0,
			avgExperienceScore: 0,
			avgSkillsScore: 0,
			avgLeadershipScore: 0,
			avgGeneralScore: 0,
			totalPanelMembers: 0,
		};

		return result;
	}

	// Job archiving operations
	async archiveExpiredJobs(): Promise<number> {
		const oneMonthAgo = new Date();
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

		const result = await db
			.update(jobs)
			.set({ archivedAt: sql`now()` })
			.where(
				and(
					lt(jobs.endDate, oneMonthAgo.toISOString().split("T")[0]),
					isNull(jobs.archivedAt)
				)
			)
			.returning({ id: jobs.id });

		return result.length;
	}

	async getArchivedJobs(): Promise<Job[]> {
		return await db
			.select()
			.from(jobs)
			.where(isNotNull(jobs.archivedAt))
			.orderBy(desc(jobs.archivedAt));
	}

	// Admin documents operations
	async createAdminDocument(doc: InsertAdminDocument): Promise<AdminDocument> {
		const [adminDoc] = await db.insert(adminDocuments).values(doc).returning();
		return adminDoc;
	}

	async getAdminDocuments(filters?: {
		type?: string;
		jobId?: number;
	}): Promise<AdminDocument[]> {
		const conditions = [eq(adminDocuments.isPublished, true)];

		if (filters?.type) {
			conditions.push(eq(adminDocuments.type, filters.type as any));
		}
		if (filters?.jobId) {
			conditions.push(eq(adminDocuments.jobId, filters.jobId));
		}

		return await db
			.select()
			.from(adminDocuments)
			.where(and(...conditions))
			.orderBy(desc(adminDocuments.createdAt));
	}

	async updateAdminDocument(
		id: number,
		doc: Partial<InsertAdminDocument>
	): Promise<AdminDocument> {
		const [adminDoc] = await db
			.update(adminDocuments)
			.set({ ...doc, updatedAt: sql`now()` })
			.where(eq(adminDocuments.id, id))
			.returning();
		return adminDoc;
	}

	async deleteAdminDocument(id: number): Promise<void> {
		await db
			.update(adminDocuments)
			.set({ isPublished: false, updatedAt: sql`now()` })
			.where(eq(adminDocuments.id, id));
	}

	// Applicant documents
	async createApplicantDocument(doc: any): Promise<any> {
		const [created] = await db.insert(documents).values(doc).returning();
		return created;
	}

	// Bulk upsert payroll rows - used by employee Excel import
	async bulkUpsertPayroll(
		rows: Array<{
			personalNumber: string;
			idNumber: string;
			designation?: string;
			dofa?: string;
			doca?: string;
		}>
	): Promise<number> {
		if (!rows || rows.length === 0) return 0;
		// Use simple upsert based on unique personalNumber
		const inserted: any[] = [];
		for (const r of rows) {
			try {
				const insertQuery: any = db
					.insert(payroll)
					.values({
						personalNumber: r.personalNumber,
						idNumber: r.idNumber,
						designation: r.designation ?? "",
						dofa: r.dofa,
						doca: r.doca,
					} as any)
					.onConflictDoUpdate({
						target: payroll.personalNumber,
						set: {
							idNumber: r.idNumber,
							designation: r.designation,
							dofa: r.dofa,
							doca: r.doca,
						},
					})
					.returning();
				const [rec] = await insertQuery;
				inserted.push(rec);
			} catch (e) {
				// ignore row-level errors but continue
				console.error("Failed to upsert payroll row", r, e);
			}
		}
		return inserted.length;
	}

	// Interview scheduling operations
	async scheduleInterview(
		applicationId: number,
		interviewDate: string,
		interviewTime: string,
		duration: number
	): Promise<Application> {
		const [application] = await db
			.update(applications)
			.set({
				interviewDate,
				interviewTime,
				interviewDuration: duration,
				status: "interview_scheduled",
				updatedAt: sql`now()`,
			})
			.where(eq(applications.id, applicationId))
			.returning();
		return application;
	}

	async bulkScheduleInterviews(
		schedules: Array<{
			applicationId: number;
			interviewDate: string;
			interviewTime: string;
			duration: number;
		}>
	): Promise<void> {
		for (const schedule of schedules) {
			await this.scheduleInterview(
				schedule.applicationId,
				schedule.interviewDate,
				schedule.interviewTime,
				schedule.duration
			);
		}
	}

	// SMS-triggered status update operations
	async shortlistApplicationWithSMS(
		applicationId: number
	): Promise<Application> {
		const [application] = await db
			.update(applications)
			.set({
				status: "shortlisted",
				shortlistedAt: sql`now()`,
				shortlistSmsSent: true,
				updatedAt: sql`now()`,
			})
			.where(eq(applications.id, applicationId))
			.returning();
		return application;
	}

	async hireApplicationWithSMS(applicationId: number): Promise<Application> {
		const [application] = await db
			.update(applications)
			.set({
				status: "hired",
				hiredAt: sql`now()`,
				hireSmsSent: true,
				updatedAt: sql`now()`,
			})
			.where(eq(applications.id, applicationId))
			.returning();
		return application;
	}

	// Carousel slides operations
	async getCarouselSlides() {
		return await db
			.select()
			.from(carouselSlides)
			.where(eq(carouselSlides.isActive, true))
			.orderBy(carouselSlides.displayOrder, carouselSlides.id);
	}

	async createCarouselSlide(slide: InsertCarouselSlide) {
		const [carouselSlide] = await db
			.insert(carouselSlides)
			.values(slide)
			.returning();
		return carouselSlide;
	}

	async updateCarouselSlide(id: number, slide: Partial<InsertCarouselSlide>) {
		const [carouselSlide] = await db
			.update(carouselSlides)
			.set({ ...slide, updatedAt: sql`now()` })
			.where(eq(carouselSlides.id, id))
			.returning();
		return carouselSlide;
	}

	async deleteCarouselSlide(id: number) {
		// Soft delete by setting isActive to false
		const [carouselSlide] = await db
			.update(carouselSlides)
			.set({ isActive: false, updatedAt: sql`now()` })
			.where(eq(carouselSlides.id, id))
			.returning();
		return carouselSlide;
	}

	// Notification operations
	async getNotifications(): Promise<Notification[]> {
		return await db
			.select()
			.from(notifications)
			.orderBy(desc(notifications.createdAt));
	}

	async createNotification(data: InsertNotification): Promise<Notification> {
		const [notification] = await db
			.insert(notifications)
			.values(data)
			.returning();
		return notification;
	}

	async updateNotification(
		id: number,
		data: Partial<InsertNotification>
	): Promise<Notification> {
		const [notification] = await db
			.update(notifications)
			.set({ ...data, updatedAt: sql`now()` })
			.where(eq(notifications.id, id))
			.returning();
		return notification;
	}

	async getNotificationRecipientsForAudience(
		notificationId: number,
		audience: string
	): Promise<any[]> {
		// Return users based on audience filter
		let recipients: any[] = [];

		if (audience === "all") {
			recipients = await db
				.select({
					id: users.id,
					email: users.email,
					phoneNumber: users.phoneNumber,
					firstName: users.firstName,
					surname: users.surname,
				})
				.from(users);
		} else if (audience === "applicants") {
			recipients = await db
				.select({
					id: users.id,
					email: users.email,
					phoneNumber: users.phoneNumber,
					firstName: users.firstName,
					surname: users.surname,
				})
				.from(users)
				.where(eq(users.role, "applicant"));
		} else if (audience === "admins") {
			recipients = await db
				.select({
					id: users.id,
					email: users.email,
					phoneNumber: users.phoneNumber,
					firstName: users.firstName,
					surname: users.surname,
				})
				.from(users)
				.where(eq(users.role, "admin"));
		} else if (audience === "board") {
			recipients = await db
				.select({
					id: users.id,
					email: users.email,
					phoneNumber: users.phoneNumber,
					firstName: users.firstName,
					surname: users.surname,
				})
				.from(users)
				.where(eq(users.role, "board"));
		}

		return recipients;
	}

	async getNotificationStats(): Promise<{
		totalSent: number;
		openRate: number;
		activeUsers: number;
		pending: number;
	}> {
		// For now return mock data - can be enhanced later
		const totalSent = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(eq(notifications.status, "sent"))
			.then((rows) => rows[0]?.count || 0);

		const pending = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(eq(notifications.status, "scheduled"))
			.then((rows) => rows[0]?.count || 0);

		const activeUsers = await db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.then((rows) => rows[0]?.count || 0);

		return {
			totalSent,
			openRate: 85, // Mock data for now
			activeUsers,
			pending,
		};
	}

	// Enhanced recipient tracking methods
	async createNotificationRecipients(
		notificationId: number,
		recipients: InsertNotificationRecipient[]
	): Promise<void> {
		if (recipients.length > 0) {
			// Ensure all recipients have the correct notificationId, trackingToken, and defaults
			const recipientsWithDefaults = recipients.map((recipient) => ({
				...recipient,
				notificationId,
				trackingToken: recipient.trackingToken || this.generateTrackingToken(),
				status: recipient.status || "queued",
				attempts: recipient.attempts || 0,
			}));
			await db.insert(notificationRecipients).values(recipientsWithDefaults);
		}
	}

	private generateTrackingToken(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	async updateRecipientStatus(
		recipientId: number,
		status: string,
		lastError?: string
	): Promise<void> {
		const updates: any = { status };

		// Set appropriate timestamp based on status
		if (status === "sent") updates.sentAt = new Date();
		if (status === "delivered") updates.deliveredAt = new Date();
		if (status === "opened") updates.openedAt = new Date();
		if (lastError) updates.lastError = lastError;

		await db
			.update(notificationRecipients)
			.set(updates)
			.where(eq(notificationRecipients.id, recipientId));
	}

	async getNotificationRecipients(
		notificationId: number,
		status?: string
	): Promise<NotificationRecipient[]> {
		const conditions = [
			eq(notificationRecipients.notificationId, notificationId),
		];

		if (status) {
			conditions.push(eq(notificationRecipients.status, status));
		}

		const whereClause =
			conditions.length === 1 ? conditions[0] : and(...conditions);

		return await db
			.select()
			.from(notificationRecipients)
			.where(whereClause)
			.orderBy(desc(notificationRecipients.queuedAt));
	}

	async retryFailedRecipients(notificationId: number): Promise<void> {
		await db
			.update(notificationRecipients)
			.set({
				status: "queued",
				attempts: sql`attempts + 1`,
				lastError: null,
			})
			.where(
				and(
					eq(notificationRecipients.notificationId, notificationId),
					eq(notificationRecipients.status, "failed")
				)
			);
	}

	async trackNotificationOpen(trackingToken: string): Promise<boolean> {
		const result = await db
			.update(notificationRecipients)
			.set({
				status: "opened",
				openedAt: new Date(),
			})
			.where(
				and(
					eq(notificationRecipients.trackingToken, trackingToken),
					ne(notificationRecipients.status, "opened") // Only update if not already opened
				)
			)
			.returning({ id: notificationRecipients.id });

		return result.length > 0;
	}
	async createNotice(
		notice: Omit<Notice, "id" | "createdAt" | "updatedAt">
	): Promise<Notice> {
		const [newNotice] = await db.insert(notices).values(notice).returning();
		return newNotice;
	}

	async createFaqs(faqs: Omit<Faq, "id" | "createdAt">) {
		const [newFaqs] = await db.insert(faq).values(faqs).returning();
		return newFaqs;
	}
	async updateNotice(id: number, notice: Partial<Notice>): Promise<Notice> {
		const [updatedNotice] = await db
			.update(notices)
			.set({ ...notice, updatedAt: new Date() })
			.where(eq(notices.id, id))
			.returning();
		return updatedNotice;
	}

	async deleteNotice(id: number) {
		const [deletedNotice] = await db
			.update(notices)
			.set({ isPublished: false, updatedAt: new Date() })
			.where(eq(notices.id, id))
			.returning();
		return deletedNotice;
	}
	async deleteJg(id: number) {
		const [deleteJg] = await db.delete(JG).where(eq(JG.id, id)).returning();
		return deleteJg;
	}
	async deleteDept(id: number) {
		const [deleteDept] = await db
			.delete(departments)
			.where(eq(departments.id, id))
			.returning();
		return deleteDept;
	}

	// Subscription operations
	async createSubscription(
		subscription: InsertNoticeSubscription
	): Promise<NoticeSubscription> {
		const [newSubscription] = await db
			.insert(noticeSubscriptions)
			.values(subscription)
			.returning();
		return newSubscription;
	}

	async getSubscription(
		email: string
	): Promise<NoticeSubscription | undefined> {
		const [subscription] = await db
			.select()
			.from(noticeSubscriptions)
			.where(eq(noticeSubscriptions.email, email))
			.limit(1);
		return subscription;
	}

	async unsubscribeEmail(token: string): Promise<boolean> {
		const [unsubscribed] = await db
			.update(noticeSubscriptions)
			.set({
				isActive: false,
				unsubscribedAt: new Date(),
			})
			.where(eq(noticeSubscriptions.subscriptionToken, token))
			.returning();
		return !!unsubscribed;
	}

	async getActiveSubscriptions(): Promise<NoticeSubscription[]> {
		return await db
			.select()
			.from(noticeSubscriptions)
			.where(eq(noticeSubscriptions.isActive, true));
	}
	// OTP operations
	async createOtp(phoneNumber: string, otp: string): Promise<OtpVerification> {
		// Clean up old OTPs for this phone number
		await db
			.delete(otpVerification)
			.where(eq(otpVerification.phoneNumber, phoneNumber));

		// Create new OTP with 5-minute expiration
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		const [newOtp] = await db
			.insert(otpVerification)
			.values({
				phoneNumber,
				otp,
				expiresAt,
				verified: false,
				attempts: 0,
			})
			.returning();

		return newOtp;
	}
	// ✅ Get user record by phone (for rehydrating session)

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
	async progressCompletion(step: number): Promise<boolean> {
		const [res] = await db
			.select({ res: applicants.profileCompletionPercentage })
			.from(applicants)
			.where(lt(applicants.profileCompletionPercentage, step))
			.limit(1); //<=
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
				required: true,
				completed: applicant.referees?.length === 3,
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
		if (
			applicant.isEmployee &&
			applicant.employee &&
			applicant.employee.personalNumber &&
			applicant.employee.designation &&
			applicant.employee.dutyStation &&
			applicant.employee.jg &&
			applicant.employee.departmentId
		) {
			steps.push(1.5); // Employee Details - all required fields present
		}
		if (applicant.countyId && applicant.constituencyId && applicant.wardId) {
			steps.push(2); // Address - all location selections required
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
		if (applicant.referees?.length === 3) {
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
	async getUserByEmail(email: string): Promise<User> {
		const [user] = await db.select().from(users).where(eq(users.email, email));
		return user;
	}
	async getVerifiedPhone(phoneNumber: string) {
		const [phone] = await db
			.select()
			.from(otpVerification)
			.where(eq(otpVerification.phoneNumber, phoneNumber));
		return phone;
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
		await db
			.update(otpVerification)
			.set({
				attempts: (otpRecord.attempts || 0) + 1,
				verified: true,
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
	async verifyEmployee(
		personalNumber: string,
		idNumber: string
	): Promise<Payroll | undefined> {
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

	async upsertEmployeeDetails(
		applicantId: number,
		employeeData: Partial<InsertEmployee>
	): Promise<Employee> {
		const dataEmployee: any = { ...employeeData };
		// Fix date-only fields
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
			.then((rows) => rows[0]);

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
	async seedJobGroup(jobGroup: Omit<Jg, "id" | "createdAt">): Promise<Jg> {
		const [upserted] = await db
			.insert(JG)
			.values(jobGroup)
			.onConflictDoUpdate({
				target: JG.name,
				set: { ...jobGroup },
			})
			.returning();
		return upserted;
	}
	// Ethnicity
	async seedEthnicity(
		Ethnic: Omit<Ethnicity, "id" | "createdAt">
	): Promise<Ethnicity> {
		const [upserted] = await db
			.insert(ethnicity)
			.values(Ethnic)
			.onConflictDoUpdate({
				target: ethnicity.name,
				set: { ...Ethnic },
			})
			.returning();
		return upserted;
	}
	//Seed Counties
	async seedCounties(
		county: Omit<County, "id" | "createdAt">
	): Promise<County> {
		const [upserted] = await db
			.insert(counties)
			.values(county)
			.onConflictDoUpdate({
				target: counties.name,
				set: { ...county },
			})
			.returning();
		return upserted;
	}

	async updateCounty(id: number, countyData: Partial<any>) {
		const [updatedCounty] = await db
			.update(counties)
			.set({ ...countyData })
			.where(eq(counties.id, id))
			.returning();
		return updatedCounty;
	}

	async deleteCounty(id: number) {
		const [deletedCounty] = await db
			.delete(counties)
			.where(eq(counties.id, id))
			.returning();
		return deletedCounty;
	}
	// Seed a single ward
	async seedWard(ward: Omit<Ward, "id">): Promise<Ward> {
		const [upserted] = await db
			.insert(wards)
			.values(ward)
			.onConflictDoUpdate({
				target: [wards.name, wards.constituencyId],
				set: { ...ward },
			})
			.returning();
		return upserted;
	}
	// Seed a single Award
	async seedAward(award: Omit<Award, "id">): Promise<Award> {
		const [upserted] = await db
			.insert(awards)
			.values(award)
			.onConflictDoUpdate({
				target: [awards.name],
				set: { ...award },
			})
			.returning();
		return upserted;
	}
	// Seed a single Cert level
	async seedCertLevel(
		cert: Omit<CertificateLevel, "id">
	): Promise<CertificateLevel> {
		const [upserted] = await db
			.insert(certificateLevel)
			.values(cert)
			.onConflictDoUpdate({
				target: certificateLevel.name,
				set: { ...cert },
			})
			.returning();
		return upserted;
	}
	// Seed a single Specialize
	async seedSpecialize(
		specialize: Omit<Specialization, "id">
	): Promise<Specialization> {
		const [upserted] = await db
			.insert(specializations)
			.values(specialize)
			.onConflictDoUpdate({
				target: [specializations.name, specializations.studyAreaId],
				set: { ...specialize },
			})
			.returning();
		return upserted;
	}
	// Seed a single Study Area
	async seedStudy(studyA: Omit<StudyArea, "id">): Promise<StudyArea> {
		const [upserted] = await db
			.insert(studyArea)
			.values(studyA)
			.onConflictDoUpdate({
				target: studyArea.name,
				set: { ...studyA },
			})
			.returning();
		return upserted;
	}
	// Seed Constituencies
	async seedSubCounties(
		subCounty: Omit<Constituency, "id">
	): Promise<Constituency> {
		const [upserted] = await db
			.insert(constituencies)
			.values(subCounty)
			.onConflictDoUpdate({
				target: [constituencies.name, constituencies.countyId],
				set: { ...subCounty },
			})
			.returning();
		return upserted;
	}

	async updateConstituency(id: number, constituencyData: Partial<any>) {
		const [updatedConstituency] = await db
			.update(constituencies)
			.set({ ...constituencyData })
			.where(eq(constituencies.id, id))
			.returning();
		return updatedConstituency;
	}

	async deleteConstituency(id: number) {
		const [deletedConstituency] = await db
			.delete(constituencies)
			.where(eq(constituencies.id, id))
			.returning();
		return deletedConstituency;
	}

	// Ward CRUD operations
	async updateWard(id: number, wardData: Partial<any>) {
		const [updatedWard] = await db
			.update(wards)
			.set({ ...wardData })
			.where(eq(wards.id, id))
			.returning();
		return updatedWard;
	}

	async deleteWard(id: number) {
		const [deletedWard] = await db
			.delete(wards)
			.where(eq(wards.id, id))
			.returning();
		return deletedWard;
	}

	// Study Area CRUD operations
	async updateStudyArea(id: number, studyAreaData: Partial<any>) {
		const [updatedStudyArea] = await db
			.update(studyArea)
			.set({ ...studyAreaData })
			.where(eq(studyArea.id, id))
			.returning();
		return updatedStudyArea;
	}

	async deleteStudyArea(id: number) {
		const [deletedStudyArea] = await db
			.delete(studyArea)
			.where(eq(studyArea.id, id))
			.returning();
		return deletedStudyArea;
	}

	// Specialization CRUD operations
	async updateSpecialization(id: number, specializationData: Partial<any>) {
		const [updatedSpecialization] = await db
			.update(specializations)
			.set({ ...specializationData })
			.where(eq(specializations.id, id))
			.returning();
		return updatedSpecialization;
	}

	async deleteSpecialization(id: number) {
		const [deletedSpecialization] = await db
			.delete(specializations)
			.where(eq(specializations.id, id))
			.returning();
		return deletedSpecialization;
	}

	// SMS related methods
	async getApplicantsByJobAndType(
		jobId: number,
		applicantType: string
	): Promise<any[]> {
		let statusFilter;

		switch (applicantType) {
			case "shortlisted":
				statusFilter = "shortlisted";
				break;
			case "successful":
			case "hired":
				statusFilter = "hired";
				break;
			case "unsuccessful":
			case "rejected":
				statusFilter = "rejected";
				break;
			default:
				statusFilter = "submitted";
		}

		const applicantData = await db
			.select({
				id: applicants.id,
				userId: applicants.userId,
				firstName: applicants.firstName,
				surname: applicants.surname,
				otherName: applicants.otherName,
				phoneNumber: applicants.phoneNumber,
				nationalId: applicants.nationalId,
				gender: applicants.gender,
				countyName: counties.name,
				wardId: applicants.wardId,
				applicationStatus: applications.status,
				jobTitle: jobs.title,
				jobId: applications.jobId,
				applicationId: applications.id,
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(jobs, eq(applications.jobId, jobs.id))
			.leftJoin(counties, eq(applicants.countyId, counties.id))
			.where(
				and(
					eq(applications.jobId, jobId),
					eq(applications.status, statusFilter as any)
				)
			)
			.orderBy(desc(applications.createdAt));

		return applicantData;
	}

	async sendSMSToApplicants(
		applicantIds: number[],
		message: string,
		jobId: number,
		applicantType: string
	): Promise<any> {
		const { sendSms } = await import("./lib/africastalking-sms");

		// Get applicant phone numbers
		// Ensure IDs are numbers and build a safe IN-list
		const ids = (applicantIds || [])
			.map((v: any) => parseInt(String(v)))
			.filter((n: number) => !isNaN(n));
		if (ids.length === 0) {
			return {
				totalRecipients: 0,
				successCount: 0,
				failureCount: 0,
				results: [],
				jobId,
				applicantType,
				message,
			};
		}

		const applicantsData = await db
			.select({
				id: applicants.id,
				phoneNumber: applicants.phoneNumber,
				firstName: applicants.firstName,
				surname: applicants.surname,
			})
			.from(applicants)
			.where(sql`${applicants.id} IN (${ids.join(",")})`);

		const results = [];
		let successCount = 0;
		let failureCount = 0;

		for (const applicant of applicantsData) {
			try {
				if (applicant.phoneNumber) {
					await sendSms({
						to: applicant.phoneNumber,
						message: message,
					});

					results.push({
						applicantId: applicant.id,
						name: `${applicant.firstName} ${applicant.surname}`,
						phoneNumber: applicant.phoneNumber,
						status: "sent",
						error: null,
					});
					successCount++;
				} else {
					results.push({
						applicantId: applicant.id,
						name: `${applicant.firstName} ${applicant.surname}`,
						phoneNumber: "N/A",
						status: "failed",
						error: "No phone number",
					});
					failureCount++;
				}
			} catch (error: any) {
				results.push({
					applicantId: applicant.id,
					name: `${applicant.firstName} ${applicant.surname}`,
					phoneNumber: applicant.phoneNumber || "N/A",
					status: "failed",
					error: error.message || "Unknown error",
				});
				failureCount++;
			}
		}

		return {
			totalRecipients: applicantIds.length,
			successCount,
			failureCount,
			results,
			jobId,
			applicantType,
			message,
		};
	}

	async getStaffForSMS(): Promise<any[]> {
		// Get all non-applicant users (staff members)
		const staffData = await db
			.select({
				id: users.id,
				email: users.email,
				firstName: users.firstName,
				surname: users.surname,
				phoneNumber: users.phoneNumber,
				role: users.role,
			})
			.from(users)
			.where(sql`${users.role} != 'applicant'`)
			.orderBy(users.firstName);

		return staffData;
	}

	async sendSMSToStaff(staffIds: string[], message: string): Promise<any> {
		const { sendSms } = await import("./lib/africastalking-sms");

		// Get staff phone numbers
		const staffData = await db
			.select({
				id: users.id,
				phoneNumber: users.phoneNumber,
				firstName: users.firstName,
				surname: users.surname,
				email: users.email,
			})
			.from(users)
			.where(sql`${users.id} = ANY(${staffIds})`);

		const results = [];
		let successCount = 0;
		let failureCount = 0;

		for (const staff of staffData) {
			try {
				if (staff.phoneNumber) {
					await sendSms({
						to: staff.phoneNumber,
						message: message,
					});

					results.push({
						staffId: staff.id,
						name: `${staff.firstName} ${staff.surname}`,
						email: staff.email,
						phoneNumber: staff.phoneNumber,
						status: "sent",
						error: null,
					});
					successCount++;
				} else {
					results.push({
						staffId: staff.id,
						name: `${staff.firstName} ${staff.surname}`,
						email: staff.email,
						phoneNumber: "N/A",
						status: "failed",
						error: "No phone number",
					});
					failureCount++;
				}
			} catch (error: any) {
				results.push({
					staffId: staff.id,
					name: `${staff.firstName} ${staff.surname}`,
					email: staff.email,
					phoneNumber: staff.phoneNumber || "N/A",
					status: "failed",
					error: error.message || "Unknown error",
				});
				failureCount++;
			}
		}

		return {
			totalRecipients: staffIds.length,
			successCount,
			failureCount,
			results,
			message,
		};
	}

	async seedInstitutions(
		institute: Omit<Institution, "id">
	): Promise<Institution> {
		const [newInstitution] = await db
			.insert(institutions)
			.values(institute)
			.returning();
		return newInstitution;
	}
	async seedDesignation(
		designation: Omit<Designation, "id">
	): Promise<Designation> {
		const [newDesignation] = await db
			.insert(designations)
			.values(designation)
			.returning();
		return newDesignation;
	}
	// Seed a single Department
	async seedDepartment(
		department: Omit<Department, "id">
	): Promise<Department> {
		const [newDepartment] = await db
			.insert(departments)
			.values(department)
			.returning();
		return newDepartment;
	}
	// Dependencies on dropdowns
	async getCountyByCountyName(countyName: string): Promise<County> {
		const [countyID] = await db
			.select()
			.from(counties)
			.where(eq(counties.name, countyName));
		return countyID;
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
	async getApplicationsReport(
		startDate?: string,
		endDate?: string
	): Promise<any> {
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
			dateRange: { startDate, endDate },
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
			dateRange: { startDate, endDate },
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
				lastName: users.surname,
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
			dateRange: { startDate, endDate },
		};
	}

	async getPerformanceReport(
		startDate?: string,
		endDate?: string
	): Promise<any> {
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
			dateRange: { startDate, endDate },
		};
	}
	// Document operations
	async saveDocument(documentData: {
		applicantId: number;
		type: string;
		fileName: string;
		filePath: string;
		fileSize?: number;
		mimeType?: string;
	}) {
		const [document] = await db
			.insert(documents)
			.values({
				applicantId: documentData.applicantId,
				type: documentData.type,
				fileName: documentData.fileName,
				filePath: documentData.filePath,
				fileSize: documentData.fileSize,
				mimeType: documentData.mimeType,
			})
			.returning();

		return document;
	}

	// ========================================
	// ACCOUNTING MODULE METHODS
	// ========================================

	async getAllVoteAccounts(): Promise<VoteAccount[]> {
		return await db.select().from(voteAccounts);
	}
	async getAllVote(): Promise<Vote[]> {
		return await db.select().from(votes);
	}

	async createVoteAccount(data: any): Promise<VoteAccount> {
		const [voteAccount] = await db
			.insert(voteAccounts)
			.values(data)
			.returning();
		return voteAccount;
	}
	async createVote(data: any): Promise<Vote> {
		const [voteAccount] = await db.insert(votes).values(data).returning();
		return voteAccount;
	}

	async deleteVoteAccount(id: number): Promise<VoteAccount | null> {
		const [deleted] = await db
			.delete(voteAccounts)
			.where(eq(voteAccounts.id, id))
			.returning();
		return deleted || null;
	}

	async getAllBudgets(): Promise<Budget[]> {
		return await db.select().from(budgets).orderBy(desc(budgets.createdAt));
	}

	async createBudget(data: any): Promise<Budget> {
		const [budget] = await db.insert(budgets).values(data).returning();
		return budget;
	}

	async getTransactions(filters?: {
		type?: any;
		status?: any;
	}): Promise<Transaction[]> {
		let query = db.select().from(transactions);

		if (filters?.type) {
			query = query.where(
				eq(transactions.transactionType, filters.type)
			) as any;
		}
		if (filters?.status) {
			query = query.where(eq(transactions.state, filters.status)) as any;
		}

		return await query.orderBy(desc(transactions.createdAt));
	}

	async createClaim(data: any): Promise<Transaction> {
		const [transaction] = await db
			.insert(transactions)
			.values({
				...data,
				state: data.state || "pending",
			})
			.returning();
		return transaction;
	}

	async createPayment(data: any): Promise<Transaction> {
		const [transaction] = await db
			.insert(transactions)
			.values({
				...data,
				state: data.state || "pending",
			})
			.returning();
		return transaction;
	}

	async approveTransaction(
		id: number,
		approvedBy: string
	): Promise<Transaction> {
		const [transaction] = await db
			.update(transactions)
			.set({
				state: "approved",
				updatedAt: sql`NOW()`,
			})
			.where(eq(transactions.id, id))
			.returning();
		return transaction;
	}

	async rejectTransaction(
		id: number,
		rejectedBy: string,
		reason: string
	): Promise<Transaction> {
		const [transaction] = await db
			.update(transactions)
			.set({
				state: "rejected",
				updatedAt: sql`NOW()`,
			})
			.where(eq(transactions.id, id))
			.returning();
		return transaction;
	}

	async getAllMIREntries(): Promise<MasterImprestRegister[]> {
		return await db
			.select()
			.from(masterImprestRegister)
			.orderBy(desc(masterImprestRegister.createdAt));
	}

	async createMIREntry(data: any): Promise<MasterImprestRegister> {
		const [mirEntry] = await db
			.insert(masterImprestRegister)
			.values(data)
			.returning();
		return mirEntry;
	}

	async retireMIREntry(
		id: number,
		retirementAmount: number,
		retirementDate: string,
		retirementVoucherNo: string
	): Promise<MasterImprestRegister> {
		const [mirEntry] = await db
			.update(masterImprestRegister)
			.set({
				status: "retired",
				updatedAt: sql`NOW()`,
			})
			.where(eq(masterImprestRegister.id, id))
			.returning();

		return mirEntry;
	}

	async getAllEmployees(): Promise<any[]> {
		// Return users with accountant or applicant role as "employees"
		const employeeUsers = await db
			.select({
				id: users.id,
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.surname})`,
				email: users.email,
				phoneNumber: users.phoneNumber,
				personalNumber: payroll.personalNumber,
				jg: employees.jg,
				role: users.role,
			})
			.from(employees)
			.leftJoin(payroll, eq(payroll.personalNumber, employees.personalNumber))
			.leftJoin(users, eq(users.nationalId, payroll.idNumber));
		return employeeUsers;
	}

	async getAllUserEmployees(): Promise<any[]> {
		// Return users with accountant or applicant role as "employees"
		const employeeUsers = await db
			.select({
				id: users.id,
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.surname})`,
				email: users.email,
				phoneNumber: users.phoneNumber,
				role: users.role,
			})
			.from(users)
			.where(or(eq(users.role, "applicant"), eq(users.role, "accountant")));

		return employeeUsers;
	}

	// ========================================
	// RECORDS MANAGEMENT SYSTEM (RMS) METHODS
	// ========================================

	async createRmsDocument(data: InsertRmsDocument): Promise<RmsDocument> {
		const [document] = await db.insert(rmsDocuments).values(data).returning();
		return document;
	}

	async getRmsDocuments(
		status?: string | null,
		priority?: string | null
	): Promise<RmsDocument[]> {
		let query = db
			.select()
			.from(rmsDocuments)
			.where(isNull(rmsDocuments.deletedAt));

		if (status) {
			// add status condition without narrowing the inferred query type
			query = (query as any).where(
				eq(rmsDocuments.status, status as any)
			) as any;
		}
		if (priority) {
			query = (query as any).where(eq(rmsDocuments.priority, priority)) as any;
		}

		return await query.orderBy(desc(rmsDocuments.receivedDate));
	}

	async getRmsDocument(id: number): Promise<RmsDocument> {
		const [document] = await db
			.select()
			.from(rmsDocuments)
			.where(and(eq(rmsDocuments.id, id), isNull(rmsDocuments.deletedAt)));

		if (!document) {
			throw new Error("Document not found");
		}

		return document;
	}

	async updateRmsDocument(
		id: number,
		updates: Partial<RmsDocument>
	): Promise<RmsDocument> {
		// Validate status values to avoid Postgres enum errors when code and DB enums drift.
		if (updates && (updates as any).status) {
			const s = (updates as any).status as string;
			const allowed = new Set([
				"received",
				"forwarded_to_secretary",
				"sent_to_chair",
				"commented_by_chair",
				"returned_to_secretary_from_chair",
				"sent_to_hr",
				"sent_to_committee",
				"returned_to_hr_from_committee",
				"returned_to_secretary_from_hr",
				"agenda_set",
				"board_meeting",
				"decision_made",
				"sent_to_records",
				"sent_to_records_to_file",
				"dispatched",
				"filed",
			]);
			if (!allowed.has(s)) {
				// Map a known code-side value to a safe DB enum if possible
				if (s === "returned_to_secretary_from_chair") {
					(updates as any).status = "forwarded_to_secretary";
				} else {
					// For unknown values, throw a clear error rather than letting Postgres return a 500 with an obscure enum error
					throw new Error(`Invalid document status: ${s}`);
				}
			}
		}

		const [updated] = await db
			.update(rmsDocuments)
			.set(updates)
			.where(eq(rmsDocuments.id, id))
			.returning();

		return updated;
	}

	async createRmsComment(data: InsertRmsComment): Promise<RmsComment> {
		const [comment] = await db.insert(rmsComments).values(data).returning();
		return comment;
	}

	async getRmsComments(documentId: number): Promise<RmsComment[]> {
		return await db
			.select()
			.from(rmsComments)
			.where(eq(rmsComments.documentId, documentId))
			.orderBy(rmsComments.createdAt);
	}

	async createRmsWorkflowLog(
		data: InsertRmsWorkflowLog
	): Promise<RmsWorkflowLog> {
		const [log] = await db.insert(rmsWorkflowLog).values(data).returning();
		return log;
	}

	async getRmsWorkflowLog(documentId: number): Promise<RmsWorkflowLog[]> {
		return await db
			.select()
			.from(rmsWorkflowLog)
			.where(eq(rmsWorkflowLog.documentId, documentId))
			.orderBy(rmsWorkflowLog.createdAt);
	}
	// DIAL Records
	async getDialRecord(
		id: number
	): Promise<DialRecordWithRelations | undefined> {
		const [record] = await db.query.dialRecords.findMany({
			where: eq(dialRecords.id, id),
			with: {
				user: true,
				employee: true,
				spouses: true,
				dependents: true,
				statementItems: true,
				uploadedFiles: true,
				auditLogs: {
					orderBy: desc(auditLogs.createdAt),
				},
			},
		});

		if (!record) return undefined;

		// Normalize null related fields to undefined to satisfy DialRecordWithRelations types
		const normalized: any = {
			...record,
			employee: record.employee ?? undefined,
		};

		return normalized as DialRecordWithRelations;
	}

	async getDialRecordsByUserId(
		userId: string
	): Promise<DialRecordWithRelations[]> {
		return await db.query.dialRecords.findMany({
			where: eq(dialRecords.userId, userId),
			with: {
				user: true,
				employee: true,
				spouses: true,
				dependents: true,
				statementItems: true,
				uploadedFiles: true,
			},
			orderBy: desc(dialRecords.createdAt),
		});
	}

	async getDialRecordsByStatus(
		status: string
	): Promise<DialRecordWithRelations[]> {
		return await db.query.dialRecords.findMany({
			where: eq(dialRecords.status, status as any),
			with: {
				user: true,
				employee: true,
				spouses: true,
				dependents: true,
				statementItems: true,
				uploadedFiles: true,
			},
			orderBy: desc(dialRecords.submittedAt),
		});
	}

	async getAllDialRecords(): Promise<DialRecordWithRelations[]> {
		return await db.query.dialRecords.findMany({
			with: {
				user: true,
				employee: true,
				spouses: true,
				dependents: true,
				statementItems: true,
				uploadedFiles: true,
			},
			orderBy: desc(dialRecords.createdAt),
		});
	}

	async createDialRecord(
		insertDialRecord: InsertDialRecord
	): Promise<DialRecord> {
		const [record] = await db
			.insert(dialRecords)
			.values(insertDialRecord)
			.returning();
		return record;
	}

	async updateDialRecord(
		id: number,
		updateData: Partial<InsertDialRecord>
	): Promise<DialRecord | undefined> {
		const [record] = await db
			.update(dialRecords)
			.set({ ...updateData, updatedAt: new Date() })
			.where(eq(dialRecords.id, id))
			.returning();
		return record || undefined;
	}

	async deleteDialRecord(id: number): Promise<boolean> {
		const result = await db.delete(dialRecords).where(eq(dialRecords.id, id));
		return !!result;
	}

	// Spouses
	async createSpouse(insertSpouse: InsertSpouse): Promise<Spouse> {
		const [spouse] = await db.insert(spouses).values(insertSpouse).returning();
		return spouse;
	}

	async updateSpouse(
		id: number,
		updateData: Partial<InsertSpouse>
	): Promise<Spouse | undefined> {
		const [spouse] = await db
			.update(spouses)
			.set(updateData)
			.where(eq(spouses.id, id))
			.returning();
		return spouse || undefined;
	}

	async deleteSpouse(id: number): Promise<boolean> {
		const result = await db.delete(spouses).where(eq(spouses.id, id));
		return !!result;
	}

	async deleteSpousesByDialRecordId(dialRecordId: number): Promise<boolean> {
		const result = await db
			.delete(spouses)
			.where(eq(spouses.dialRecordId, dialRecordId));
		return !!result;
	}

	// Dependents
	async createDependent(insertDependent: InsertDependent): Promise<Dependent> {
		const [dependent] = await db
			.insert(dependents)
			.values(insertDependent)
			.returning();
		return dependent;
	}

	async updateDependent(
		id: number,
		updateData: Partial<InsertDependent>
	): Promise<Dependent | undefined> {
		const [dependent] = await db
			.update(dependents)
			.set(updateData)
			.where(eq(dependents.id, id))
			.returning();
		return dependent || undefined;
	}

	async deleteDependent(id: number): Promise<boolean> {
		const result = await db.delete(dependents).where(eq(dependents.id, id));
		return !!result;
	}

	async deleteDependentsByDialRecordId(dialRecordId: number): Promise<boolean> {
		const result = await db
			.delete(dependents)
			.where(eq(dependents.dialRecordId, dialRecordId));
		return !!result;
	}

	// Statement Items
	async createStatementItem(
		insertItem: InsertStatementItem
	): Promise<StatementItem> {
		const [item] = await db
			.insert(statementItems)
			.values(insertItem)
			.returning();
		return item;
	}

	async updateStatementItem(
		id: number,
		updateData: Partial<InsertStatementItem>
	): Promise<StatementItem | undefined> {
		const [item] = await db
			.update(statementItems)
			.set(updateData)
			.where(eq(statementItems.id, id))
			.returning();
		return item || undefined;
	}

	async deleteStatementItem(id: number): Promise<boolean> {
		const result = await db
			.delete(statementItems)
			.where(eq(statementItems.id, id));
		return !!result;
	}

	async deleteStatementItemsByDialRecordId(
		dialRecordId: number
	): Promise<boolean> {
		const result = await db
			.delete(statementItems)
			.where(eq(statementItems.dialRecordId, dialRecordId));
		return !!result;
	}

	// Audit Logs
	async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
		const [log] = await db.insert(auditLogs).values(insertLog).returning();
		return log;
	}

	async getAuditLogsByDialRecordId(dialRecordId: number): Promise<AuditLog[]> {
		return await db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.dialRecordId, dialRecordId))
			.orderBy(desc(auditLogs.createdAt));
	}

	// Files
	async createUploadedFile(
		insertFile: InsertUploadedFile
	): Promise<UploadedFile> {
		const [file] = await db
			.insert(uploadedFiles)
			.values(insertFile)
			.returning();
		return file;
	}

	async getUploadedFilesByDialRecordId(
		dialRecordId: number
	): Promise<UploadedFile[]> {
		return await db
			.select()
			.from(uploadedFiles)
			.where(eq(uploadedFiles.dialRecordId, dialRecordId));
	}

	async deleteUploadedFile(id: number): Promise<boolean> {
		const result = await db
			.delete(uploadedFiles)
			.where(eq(uploadedFiles.id, id));
		return !!result;
	}

	// Stats
	async getDialStats(userId?: string): Promise<{
		total: number;
		draft: number;
		submitted: number;
		approved: number;
	}> {
		let records: DialRecord[];

		if (userId) {
			records = await db
				.select()
				.from(dialRecords)
				.where(eq(dialRecords.userId, userId));
		} else {
			records = await db.select().from(dialRecords);
		}

		return {
			total: records.length,
			draft: records.filter((r) => r.status === "draft").length,
			submitted: records.filter(
				(r) => r.status === "submitted" || r.status === "under_review"
			).length,
			approved: records.filter(
				(r) => r.status === "approved" || r.status === "locked"
			).length,
		};
	}
}
export const storage = new DatabaseStorage();
