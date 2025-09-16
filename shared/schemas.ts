import { z } from "zod";

// ------------------ Step 1: Personal Details ------------------ //
export const personalDetailsSchema = z.object({
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  otherName: z.string().optional(),
  idPassportType: z.enum(["national_id", "passport", "alien_id"], {
    errorMap: () => ({ message: "Please select a valid ID/Passport type" }),
  }),
  nationalId: z.string().min(5, "National ID is required"),
  dateOfBirth: z.coerce.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  nationality: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  altPhoneNumber: z.string().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  kraPin: z.string().optional(),
  isPwd: z.boolean().optional(),
  pwdNumber: z.string().optional(),
  isEmployee: z.boolean().optional(),
});

// ------------------ Step 1.5: Employee Details ------------------ //
export const employeeDetailsSchema = z.object({
  personalNumber: z.string().min(1, "Personal number is required"),
  designation: z.string().min(1, "Designation is required"),
  dutyStation: z.string().min(1, "Duty station is required"),
  jg: z.string().min(1, "Job group is required"),
  actingPosition: z.string().optional(),
  departmentId: z.number({ invalid_type_error: "Department is required" }),
  dofa: z.string().optional(),
  doca: z.string().optional(),
});

// ------------------ Step 2: Address ------------------ //
export const addressSchema = z.object({
  countyId: z.number().nullable().optional(),
  constituencyId: z.number().nullable().optional(),
  wardId: z.number().nullable().optional(),
  address: z.string().optional(),
});

// ------------------ Step 3: Education ------------------ //
export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  qualification: z.string().min(1, "Qualification is required"),
  specializationId: z.number().nullable().optional(),
  certificateLevelId: z.number().nullable().optional(),
  studyArea: z.number({ invalid_type_error: "Study area is required" }),
  courseId: z.number().nullable().optional(),
  grade: z.string().optional(),
  courseName: z.string().optional(),
  yearFrom: z
    .number({ invalid_type_error: "Year from is required" })
    .min(1950, "Invalid year")
    .max(new Date().getFullYear(), "Invalid year"),
  yearCompleted: z
    .number({ invalid_type_error: "Year completed is required" })
    .min(1950, "Invalid year")
    .max(new Date().getFullYear(), "Invalid year"),
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
  gradeId: z.number({ invalid_type_error: "Grade is required" }),
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
  employmentHistory: z.array(employmentSchema),
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
  referees: z.array(refereeSchema),
});

// ------------------ Step 8: Documents ------------------ //
export const documentSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  filePath: z.string().min(1, "File path is required"),
});

export const documentsStepSchema = z.object({
  documents: z.array(documentSchema),
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
    departmentId: 0,
  },
  2: { countyId: null, constituencyId: null, wardId: null, address: "" },
  3: {
    education: [
      {
        institution: "",
        qualification: "",
        specializationId: null,
        certificateLevelId: null,
        studyArea: 0,
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
        gradeId: 0,
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
    ],
  },
  8: { documents: [] },
};