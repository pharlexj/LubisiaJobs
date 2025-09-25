// shared/schemas.ts
import { z } from "zod";

// ------------------ Step 1: Personal Details ------------------ //
export const personalDetailsSchema = z.object({
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  otherName: z.string().nullable().optional(),
  idPassportType: z.enum(["national_id", "passport", "alien_id"], {
    errorMap: () => ({ message: "Please select a valid ID/Passport type" }),
  }),
  nationalId: z.string().min(5, "National ID is required"),
  dateOfBirth: z.coerce.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  nationality: z.string().min(1, "Nationality is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  altPhoneNumber: z.string().nullable().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().min(1, "Religion is required"),
  kraPin: z.string().nullable().optional(),
  isPwd: z.boolean().nullable().optional(),
  pwdNumber: z.string().nullable().optional(),
  isEmployee: z.boolean().nullable().optional(),
});

// ------------------ Step 1.5: Employee Details ------------------ //
export const employeeDetailsSchema = z.object({
  employee: z.object({
    personalNumber: z.string().min(1, "Personal number is required"),
    designation: z.string().min(1, "Designation is required"),
    dutyStation: z.string().min(1, "Duty station is required"),
    jg: z.string().min(1, "Job group is required"),
    departmentId: z.number({ invalid_type_error: "Department is required" }),
    dofa: z.string().min(1, "Date of first appointment is required"),
    doca: z.string().min(1, "Date of current appointment is required"),
    actingPosition: z.string().nullable().optional(),
  }),
});

// ------------------ Step 2: Address ------------------ //
export const addressSchema = z.object({
  countyId: z.number().min(1, "County is required"),
  constituencyId: z.number().min(1, "Sub County is required"),
  wardId: z.number().min(1, "Ward is required"),
  address: z.string().min(1, "Physical address is required"),
});

// ------------------ Step 3: Education ------------------ //
export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  specializationId: z.number().nullable().optional(),
  certificateLevelId: z.number().nullable().optional(),
  studyAreaId: z.coerce.number({ invalid_type_error: "Study area is required" }),
  courseId: z.number().nullable().optional(),
  grade: z.string().optional(),
  courseName: z.string().min(1, "Course name is required"),
  yearFrom: z
    .number({ invalid_type_error: "Year from is required" })
    .min(1950, "Invalid year, cannot be before 1950")
    .max(new Date().getFullYear(), "Invalid year, cannot be in the future"),
  yearCompleted: z
    .number({ invalid_type_error: "Year completed is required" })
    .min(1950, "Invalid year, cannot be before 1950")
    .max(new Date().getFullYear(), "Invalid year, cannot be in the future"),
});

export const educationStepSchema = z.object({
  education: z.array(educationSchema).min(1, "At least one education record is required"),
});

// ------------------ Step 4: Short Courses ------------------ //
export const shortCourseSchema = z.object({
  course: z.string().min(1, "Course name is required"),
  institutionName: z.string().min(1, "Institution name is required"),
  certificateNo: z.string().min(1, "Certificate number is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const shortCoursesStepSchema = z.object({
  shortCourses: z.array(shortCourseSchema),
});

// ------------------ Step 5: Professional Qualifications ------------------ //
export const professionalQualificationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  studentNo: z.string().min(1, "Student registration number is required"),
  areaOfStudyId: z.number().nullable().optional(),
  specialisationId: z.number({ invalid_type_error: "Specialisation is required" }),
  course: z.string().min(1, "Course is required"),
  awardId: z.number({ invalid_type_error: "Award is required" }),
  gradeId: z.string().min(1, "Grade is required"),
  examiner: z.string().min(1, "Examiner is required"),
  certificateNo: z.string().min(1, "Certificate number is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const professionalQualificationsStepSchema = z.object({
  professionalQualifications: z.array(professionalQualificationSchema),
});

// ------------------ Step 6: Employment History ------------------ //
export const employmentSchema = z.object({
  employer: z.string().min(1, "Employer is required"),
  position: z.string().min(1, "Position is required"),
  isCurrent: z.boolean().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duties: z.string().optional(),
});

export const employmentStepSchema = z.object({
  employmentHistory: z.array(employmentSchema).min(1, "At least one employment record is required"),
});

// ------------------ Step 7: Referees ------------------ //
export const refereeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  organization: z.string().min(1, "Organization is required"),
  relationship: z.string().min(1, "Relationship is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const refereesStepSchema = z.object({
  referees: z.array(refereeSchema)
    .min(3, "You must provide exactly 3 referees")
    .max(3, "You can only provide exactly 3 referees")
    .length(3, "Exactly 3 referees are required"),
});

// ------------------ Step 8: Documents ------------------ //
export const documentSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  filePath: z.string().min(1, "File path is required"),
});

export const documentsStepSchema = z.object({
  documents: z.array(documentSchema).optional().default([]),
});

// ------------------ Master Step Schemas ------------------ //
export const stepSchemas: Record<number, z.ZodTypeAny> = {
  1: personalDetailsSchema,
  1.5: employeeDetailsSchema,
  2: addressSchema,
  3: educationStepSchema,
  4: shortCoursesStepSchema,
  5: professionalQualificationsStepSchema,
  6: employmentStepSchema,
  7: refereesStepSchema,
  8: documentsStepSchema,
};


// ------------------ Step Defaults ------------------ //
export const stepDefaults: Record<number, any> = {
  1: {
    salutation: "",
    firstName: "",
    surname: "",
    otherName: "",
    phoneNumber: "",
  },
  1.5: {
    personalNumber: "",
    designation: "",
    dutyStation: "",
    jg: "",
    dofa:"",
    doca:"",
    departmentId: 0,
  },
  2: { countyId: null, constituencyId: null, wardId: null, address: "" },
  3: {
    education: [
      {
        institution: "",
        specializationId: null,
        certificateLevelId: null,
        studyAreaId: 0,
        courseId: null,
        grade: "",
        yearFrom: new Date().getFullYear(),
        yearCompleted: new Date().getFullYear(),
      },
    ],
  },
  4: {
    shortCourses: [
      {
        course: "",
        institutionName: "",
        certificateNo: "",
        startDate: "",
        endDate: "",
      },
    ],
  },
  5: {
    professionalQualifications: [
      {
        institution: "",
        studentNo: "",
        areaOfStudyId: null,
        specialisationId: 0,
        course: "",
        awardId: 0,
        gradeId: "",
        examiner: "",
        certificateNo: "",
        startDate: "",
        endDate: "",
      },
    ],
  },
  6: {
    employmentHistory: [
      {
        employer: "",
        position: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
      },
    ],
  },
  7: {
    referees: [
      {
        name: "",
        position: "",
        organization: "",
        relationship: "",
        email: "",
        phoneNumber: "",
      },
      {
        name: "",
        position: "",
        organization: "",
        relationship: "",
        email: "",
        phoneNumber: "",
      },
      {
        name: "",
        position: "",
        organization: "",
        relationship: "",
        email: "",
        phoneNumber: "",
      },
    ],
  },
};