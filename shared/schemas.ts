import { z } from "zod";
// ------------------ Step 1: Personal Details ------------------ //
export const personalDetailsSchema = z.object({
  salutation: z.string().min(1, "Required"),
  firstName: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  otherName: z.string().optional(),
  idPassportType: z.enum(["national_id", "passport", "alien_id"]),
  nationalId: z.string().min(5, "National ID required"),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(["Male", "Female"]),
  nationality: z.string().optional(),
  phoneNumber: z.string().min(10, "Phone required"),
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
  personalNumber: z.string().min(1, "Required"),
  designation: z.string().min(1, "Required"),
  dutyStation: z.string().min(1, "Required"),
  jg: z.string().min(1, "Required"),
  actingPosition: z.string().optional(),
  departmentId: z.number(),
  dofa: z.string().optional(),
  doca: z.string().optional(),
});

// ------------------ Step 2: Address ------------------ //
export const addressSchema = z.object({
  countyId: z.number().nullable(),
  constituencyId: z.number().nullable(),
  wardId: z.number().nullable(),
  address: z.string().optional(),
});

// ------------------ Step 3: Education ------------------ //
export const educationSchema = z.object({
  institution: z.string().min(1, "Institution required"),
  qualification: z.string().min(1, "Qualification required"),
  specializationId: z.number().optional(),
  certificateLevelId: z.number().optional(),
  studyArea:z.number(),
  courseId: z.number().optional(),
  grade: z.string().optional(),
  yearFrom: z.number().min(1950).max(new Date().getFullYear()),
  yearCompleted: z.number().min(1950).max(new Date().getFullYear()),
});

export const educationStepSchema = z.object({
  education: z.array(educationSchema).min(1, "At least one record required"),
});

// ------------------ Step 4: Short Courses ------------------ //
export const shortCourseSchema = z.object({
  course: z.string().min(1, "Course name required"),
  institutionName: z.string().min(1, "Institution required"),
  certificateNo: z.string().min(1, "Certificate number required"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
});

export const shortCoursesStepSchema = z.object({
  shortCourses: z.array(shortCourseSchema),
});

// ------------------ Step 5: Professional Qualifications ------------------ //
export const professionalQualificationSchema = z.object({
  institution: z.string().min(1, "Institution required"),
  studentNo:z.string().min(1, "Student Reg. Required"),
  areaOfStudyId:z.number().optional(),
  specialisationId:z.number().min(1, "Required"),
  course:z.string().min(1, "Required"),
  awardId:z.number().min(1, "Required"),
  gradeId:z.number().min(1, "Required"),
  examiner:z.string().min(1, "Required"),
  certificateNo:z.string().min(1, "Required"),
  startDate:z.string().min(1, "Required"),
  endDate:z.string().min(1, "Required"),
});

export const professionalQualificationsStepSchema = z.object({
  professionalQualifications: z.array(professionalQualificationSchema),
});

// ------------------ Step 6: Employment History ------------------ //
export const employmentSchema = z.object({
  employer: z.string().min(1, "Employer required"),
  position: z.string().min(1, "Position required"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  responsibilities: z.string().optional(),
});

export const employmentStepSchema = z.object({
  employmentHistory: z.array(employmentSchema),
});

// ------------------ Step 7: Referees ------------------ //
export const refereeSchema = z.object({
  name: z.string().min(1, "Name required"),
  position: z.string().min(1,'Position required'),
  organization: z.string().min(1,'Organization required'),
  relationship: z.string().min(1,'Work relation required'),
  email: z.string().email().min(1,'Valid email required'),
  phoneNumber: z.string().min(1,'Active mobile number required'),
});

export const refereesStepSchema = z.object({
  referees: z.array(refereeSchema),
});

// ------------------ Step 8: Documents ------------------ //
export const documentSchema = z.object({
  docType: z.string().min(1, "Document type required"),
  filePath: z.string().min(1, "File path required"),
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
