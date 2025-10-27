import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText, CheckCircle } from "lucide-react";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import EmployeeVerificationDialog from "@/components/applicant/EmployeeVerificationDialog";
import LocationDropdowns from "@/components/common/LocationDropdowns";
import { sanitizeDate, filterEmptyFields } from "./../../lib/sanitizeDates";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { stepSchemas, stepDefaults, educationStepSchema, } from "../../../../shared/schemas";
import { renderErrors } from "../../lib/errors";
import { useFileUpload, uploadConfigs } from "@/hooks/useFileUpload";
import { capitalizeWords, createCapitalizeHandler } from "@/lib/utils";
import ApplicantDocument from "@/components/common/Documents"; 
// -------------------- Types -------------------- //
interface ProfileFormProps {
  step: number;
  profile: any;
  onSave: (data: any) => void;
  isLoading: boolean;
}
// -------------------- Component -------------------- //
export default function ProfileForm({
  step,
  profile,
  onSave,
  isLoading,
}: ProfileFormProps) {
  const { data: config } = usePublicConfig();

  const form = useForm({
  resolver: zodResolver(stepSchemas[step]),
  mode: "onTouched", // Prevent validation until user interacts with field
  defaultValues: profile
    ? {
        ...stepDefaults[step],
        // spread root profile fields
        ...profile,
        // ensure nested employee object exists
        employee: profile.employee || {},
      }
    : stepDefaults[step],
  });
  // ✅ Field Arrays for dynamic sections 
  
  const {
    fields: educationRecords,
    append: addEducation,
    remove: removeEducation,
  } = useFieldArray({ control: form.control, name: "education" });

  const {
    fields: employmentHistory,
    append: addEmployment,
    remove: removeEmployment,
  } = useFieldArray({ control: form.control, name: "employmentHistory" });

  const {
    fields: referees,
    append: addReferee,
    remove: removeReferee,
  } = useFieldArray({ control: form.control, name: "referees" });

  const {
    fields: shortCourses,
    append: addShortCourse,
    remove: removeShortCourse,
  } = useFieldArray({ control: form.control, name: "shortCourses" });

  const {
    fields: professionalQualifications,
    append: addQualification,
    remove: removeQualification,
  } = useFieldArray({
    control: form.control,
    name: "professionalQualifications",
  });
  const grades = ["Pass","Distinction","Credit","2nd Upper","2nd Lower","Refer"]

  // ✅ Employee verification
  const [showEmployeeVerification, setShowEmployeeVerification] =
    useState(false);
  const [isVerifiedEmployee, setIsVerifiedEmployee] = useState(false);
  const [verifiedEmployeeData, setVerifiedEmployeeData] = useState<any>(null);
  const [age, setAge] = useState<number | null>(null);

  // ✅ Dynamic file upload system
  const { state: uploadState } = useFileUpload((uploadConfigs as any).documents);  
  useEffect(() => {
  if (profile) {
    // Use setTimeout to ensure form validation doesn't run prematurely
    setTimeout(() => {
      form.reset({
        ...stepDefaults[step],
        ...profile,
        employee: profile.employee || {},
      });      
      // Clear all validation errors after reset
      form.clearErrors();
    }, 0);

    // ✅ Sync verified employee state
    setIsVerifiedEmployee(!!profile.isEmployee);
  }
}, [profile, step]);
  const [employeeLocked, setEmployeeLocked] = useState<boolean>(false);

  // When profile loads, check if employee data exists -> lock fields
  useEffect(() => {
    if (profile?.employee?.dofa) {
      setEmployeeLocked(true);
    }
  }, [profile]);
  useEffect(() => {
    const dob = profile?.dateOfBirth;
    if (!dob) {
      setAge(null);
      return;
    }

    // Accept either a Date object or an ISO/date string
    const d = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(d.getTime())) {
      setAge(null);
      return;
    }

    const today = new Date();
    let years = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      years--;
    }
    setAge(years >= 0 ? years : null);
  }, [profile?.dateOfBirth]);
  
  // ✅ Submit handler
  // helper: is this field locked?
const isFieldLocked = (field: keyof typeof profile.employee | string) => {
  return Boolean(profile?.employee?.[field] || profile?.[field]);
};

  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    setShowNext(!form.formState.isDirty);
  }, [form.formState.isDirty]);


  const handleSubmit = async (data: any) => {
    let stepData: any = {};
    try {
      switch (step) {
        case 1:
          stepData = {
            ...data,
            dateOfBirth: sanitizeDate(data.dateOfBirth),
            countyId: data.countyId ? parseInt(data.countyId) : null,
            constituencyId: data.constituencyId
              ? parseInt(data.constituencyId)
              : null,
            wardId: data.wardId ? parseInt(data.wardId) : null,
            isPwd: !!data.isPwd,
            isEmployee: !!data.isEmployee,
            pwdNumber: data.isPwd ? data.pwdNumber : null,
          };
          break;
        case 1.5:
          stepData = {
            isEmployee: true,
            applicantId: profile?.id,
            ...data, // data already contains { employee: { ... } }
            employee: {
              ...data.employee,
              dofa: sanitizeDate(data.employee.dofa),
              doca: sanitizeDate(data.employee.doca),
            },
          };
          break;  
        case 3:
          // validate education explicitly
          educationStepSchema.parse({ education: data.education });
          stepData = { education: data.education };
          break;

        case 4:
          stepData = {
            shortCourses: data.shortCourses.map((c: any) => ({
              ...c,
              applicantId: profile?.id,
              startDate: sanitizeDate(c.startDate),
              endDate: sanitizeDate(c.endDate),
            })),
          };
          break;

        case 5:
          stepData = {
            professionalQualifications: data.professionalQualifications.map(
              (q: any) => ({
                ...q,
                startDate: sanitizeDate(q.startDate),
                endDate: sanitizeDate(q.endDate),
              })
            ),
          };
          break;

        case 6:
          stepData = {
            employmentHistory: data.employmentHistory.map((job: any) => ({
              ...job,
              isCurrent: !!job.isCurrent,
              startDate: sanitizeDate(job.startDate),
              endDate: sanitizeDate(job.endDate),
            })),
          };          
          break;

        case 7:
          stepData = { referees: data.referees };
          break;

        case 8:
          // For step 8, documents are already uploaded to server via the upload hook
          // Just pass the uploaded file data or indicate completion
          stepData = { documents: uploadState.uploadedFiles };
          break;

        default:
          stepData = data;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please check your inputs.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if ([3, 4, 5].includes(step)) {
      const wantsToAddMore = window.confirm(
        "Do you want to add another record before continuing?"
      );
      if (wantsToAddMore) return; // stay on same step
    }
    await onSave({
        method: profile?.id ? "PATCH" : "POST",
        applicantId: profile?.id,
        step,
        data: filterEmptyFields(stepData),
      });

      if (step === 1.5) {
        setEmployeeLocked(true); // ✅ lock after successful save
      }
};
  // ✅ Employee verification success  
  const handleEmployeeVerificationSuccess = (employeeData: any) => {
    setIsVerifiedEmployee(true);
    setVerifiedEmployeeData(employeeData);
    form.setValue("isEmployee", true);
    // ✅ Populate employee details from verification response
  form.setValue("employee.personalNumber", employeeData.personalNumber || "");
  form.setValue("employee.designation", employeeData.designation || "");
  form.setValue("employee.dutyStation", employeeData.dutyStation || "");
  form.setValue("employee.jg", employeeData.jg || "");
  form.setValue("employee.departmentId", employeeData.departmentId || null);
  form.setValue("employee.actingPosition", employeeData.actingPosition || "");
  form.setValue("employee.dofa", employeeData.dofa || "");
  form.setValue("employee.doca", employeeData.doca || "");

  // ✅ Trigger validation so errors clear
  form.trigger("employee");
  };
  
  {Object.keys(form.formState.errors).length > 0 && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
    <div className="font-bold text-red-700 mb-2">Form Validation Errors:</div>
    <ul className="text-sm text-red-700">
      {renderErrors(form.formState.errors)}
    </ul>
  </div>
)}

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Errors */}        

        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="font-bold text-red-700 mb-2">Form Validation Errors:</div>
            <ul className="text-sm text-red-700">
              {renderErrors(form.formState.errors)}
            </ul>
          </div>
        )}

        {/* Step Renderer */}
        {/* ---------------- Step Renderer ---------------- */}
{(() => {
  switch (step) {
    case 1: // Personal Details
  return (
    <div className="space-y-6">
      {/* Names */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Salutation *</Label>
          <Select
            value={form.watch("salutation") || ""}
            onValueChange={(val) => {
              form.setValue("salutation", val);
              // Clear any validation error
              form.clearErrors("salutation");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select salutation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mr">Mr</SelectItem>
              <SelectItem value="Mrs">Mrs</SelectItem>
              <SelectItem value="Ms">Ms</SelectItem>
              <SelectItem value="Dr">Dr</SelectItem>
              <SelectItem value="Prof">Prof</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>First Name *</Label>
          <Input 
            {...form.register("firstName")} 
            defaultValue={profile?.firstName || ""}
            disabled={!!profile?.firstName}
            onChange={createCapitalizeHandler((value) => form.setValue("firstName", value, { shouldDirty: true, shouldValidate: true }))}
            data-testid="input-firstName"
          />
        </div>

        <div>
          <Label>Surname *</Label>
          <Input 
            {...form.register("surname")}
            defaultValue={profile?.surname || ""}
            disabled={!!profile?.surname}
            onChange={createCapitalizeHandler((value) => form.setValue("surname", value, { shouldDirty: true, shouldValidate: true }))}
            data-testid="input-surname"
          />
        </div>

        <div>
          <Label>Other Name</Label>
          <Input 
            {...form.register("otherName")}
            onChange={createCapitalizeHandler((value) => form.setValue("otherName", value, { shouldDirty: true, shouldValidate: true }))}
            data-testid="input-otherName"
          />
        </div>
      </div>

      {/* ID/Passport & DOB */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>ID/Passport Type *</Label>
          <Select
            value={form.watch("idPassportType") || ""}
            onValueChange={(val) => {
              form.setValue("idPassportType", val);
              // Clear any validation error
              form.clearErrors("idPassportType");
            }}
            disabled={!!profile?.idPassportType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national_id">National ID</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="alien_id">Alien ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ID / Passport No *</Label>
          <Input {...form.register("nationalId")} defaultValue={profile?.nationalId || ""}
                  disabled={!!profile?.nationalId} />
        </div>
      {/* Gender & Nationality */}
        <div>
          <Label>Gender *</Label>
          <Select
            value={form.watch("gender") || ""}
            onValueChange={(val) => {
              form.setValue("gender", val);
              // Clear any validation error
              form.clearErrors("gender");
            }}
            disabled={!!profile?.gender}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date of Birth * {age && `(${age})`}</Label>
          <Input type="date" {...form.register("dateOfBirth")} disabled={isFieldLocked("dateOfBirth")}/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Ethnicity & Religion from API */}
        <div>
          <Label>Ethnicity</Label>
          <Select
            value={form.watch("ethnicity") || ""}
            onValueChange={(val) => form.setValue("ethnicity", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ethnicity" />
            </SelectTrigger>
            <SelectContent>
              {config?.ethnicity?.map((e: any) => (
                <SelectItem key={e.id} value={e.name}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Religion</Label>
          <Select
            value={form.watch("religion") || ""}
            onValueChange={(val) => form.setValue("religion", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Christian">Christian</SelectItem>
              <SelectItem value="Muslim">Muslim</SelectItem>
              <SelectItem value="Hindu">Hindu</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          </div>
          {/* Phone Numbers */}
          <div>
            <Label>Phone Number *</Label>
            <Input {...form.register("phoneNumber")} />
          </div>
        <div>
          <Label>Nationality</Label>
          <Select value={form.watch("nationality") || ""} onValueChange={(val)=> form.setValue("nationality", val)} disabled={!!profile?.nationality}>
            <SelectTrigger>
              <SelectValue placeholder="Select Nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kenyan">Kenyan</SelectItem>
              <SelectItem value="Ugandan">Ugandan</SelectItem>
              <SelectItem value="Tanzanian">Tanzanian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* KRA Pin & Disability */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Alternate Phone</Label>
          <Input {...form.register("altPhoneNumber")} />
        </div>
        <div>
          <Label>KRA Pin</Label>
          <Input {...form.register("kraPin")} disabled={!!profile.kraPin} />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            checked={form.watch("isPwd") || false}
            onCheckedChange={(checked) =>
              form.setValue("isPwd", checked === true)              
            }
          />
          <Label>Person With Disability</Label>
        </div>
        {form.watch("isPwd") && (
          <div>
            <Label>PWD Number</Label>
            <Input {...form.register("pwdNumber")} disabled={!form.watch("isPwd")} />
          </div>
        )}
      </div>

      {/* Employee Verification */}
      <div className="flex items-center space-x-4">
  {!isVerifiedEmployee ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => setShowEmployeeVerification(true)}
    >
      Verify Employee Status
    </Button>
  ) : (
    <Badge variant="secondary">Verified Employee</Badge>
  )}
</div>

    </div>
  );
    case 1.5: // Employee Details
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Personal Number *</Label>
              <Input {...form.register("employee.personalNumber")} placeholder="e.g., 201400043000"
                disabled={form.watch(`employee.personalNumber`)} />
            </div>

            <div>
              <Label>Designation *</Label>
              <Input 
                {...form.register("employee.designation")}
                placeholder="e.g., Senior ICT Officer"
                onChange={createCapitalizeHandler((value) => form.setValue("employee.designation", value, { shouldDirty: true, shouldValidate: true }))}
                data-testid="input-designation"
              />
            </div>

            <div>
              <Label>Duty Station *</Label>
              <Input 
                {...form.register("employee.dutyStation")}
                placeholder="e.g., Kitale County Referral Hospital.."
                onChange={createCapitalizeHandler((value) => form.setValue("employee.dutyStation", value, { shouldDirty: true, shouldValidate: true }))}
                data-testid="input-dutyStation"
              />
            </div>

            <div>
              <Label>Job Group *</Label>
              <Select
                value={form.watch("employee.jg") || ""}
                onValueChange={(val) => form.setValue("employee.jg", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job group" />
                </SelectTrigger>
                <SelectContent>
                  {config?.jobGroups?.map((jg: any) => (
                    <SelectItem key={jg.id} value={jg.name}>
                      {`Job Group ${jg.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Department *</Label>
              <Select
                value={form.watch("employee.departmentId")?.toString() || ""}
                onValueChange={(val) => {
                  form.setValue("employee.departmentId", parseInt(val, 10));
                  // Clear any validation error
                  form.clearErrors("employee.departmentId");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {config?.departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Acting Position</Label>
              <Input {...form.register("employee.actingPosition")} />
            </div>

            <div>
              <Label>Date of First Appointment</Label>
              <Input type="date" {...form.register("employee.dofa")}
                disabled={isFieldLocked("dofa")}/>
            </div>

            <div>
              <Label>Date of Current Appointment</Label>
              <Input type="date" {...form.register("employee.doca")} />
            </div>
          </div>
        </div>
      );
    case 2: // Address Info
      return (
        <div className="space-y-6">
          <LocationDropdowns
            onLocationChange={(loc) => {
              form.setValue("countyId", loc.countyId);
              form.setValue("constituencyId", loc.constituencyId);
              form.setValue("wardId", loc.wardId);
            }}
            defaultValues={{
              countyId: profile?.countyId,
              constituencyId: profile?.constituencyId,
              wardId: profile?.wardId,
            }}
          />
          <Textarea {...form.register("address")} placeholder="Physical address" />
        </div>
      );
    case 3: // Education
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h4 className="font-medium">Educational Qualifications</h4>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            addEducation({
              institution: "",
              certificateLevelId: null,
              studyAreaId: 0,
              specializationId: null,
              courseId: null,
              grade: "",
              yearFrom: "",
              yearCompleted: "",
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>

      {educationRecords.map((field, index) => {
        const selectedStudyAreaId = form.watch(`education.${index}.studyAreaId`);
        const relatedSpecializations = config?.specializations?.filter(
            (s: any) => s.studyAreaId === Number(selectedStudyAreaId)
          ) || [];

        return (
          <Card key={field.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Education {index + 1}</h5>
                {educationRecords.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeEducation(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Institution */}
                <div>
                  <Label>Institution *</Label>
                  <Input {...form.register(`education.${index}.institution`)} placeholder="e.g., JKUAT, Main Campus, Juja" />
                </div>

                {/* Course (from API) */}
                <div>
                  <Label>Course</Label>
                  <Input {...form.register(`education.${index}.courseName`)} placeholder="e.g., Business Administration(Finance option)" />
                </div>

                {/* Certificate Level (from API) */}
                <div>
                  <Label>Certificate Level *</Label>
                  <Select
                    value={
                      form.watch(`education.${index}.certificateLevelId`)?.toString() ||
                      ""
                    }
                    onValueChange={(val) => {
                      form.setValue(
                        `education.${index}.certificateLevelId`,
                        parseInt(val, 10)
                      );
                      // Clear any validation error
                      form.clearErrors(`education.${index}.certificateLevelId`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select certificate level" />
                    </SelectTrigger>
                    <SelectContent>
                      {config?.certificateLevels?.map((level: any) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Study Area (from API) */}
                <div>
                  <Label>Study Area *</Label>
                  <Select
                    value={
                      form.watch(`education.${index}.studyAreaId`)?.toString() || ""
                    }
                    onValueChange={(val) => {
                      form.setValue(`education.${index}.studyAreaId`,parseInt(val, 10));
                      form.setValue(`education.${index}.specializationId`, null);
                      // Clear validation errors
                      form.clearErrors(`education.${index}.studyAreaId`);
                      form.clearErrors(`education.${index}.specializationId`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select study area" />
                    </SelectTrigger>
                    <SelectContent>
                      {config?.studyAreas?.map((area: any) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialization (depends on Study Area) */}
                <div>
                  <Label>Specialization</Label>
                  <Select
                    value={
                      form.watch(`education.${index}.specializationId`)?.toString() || ""
                    }
                    onValueChange={(val) =>
                      form.setValue(`education.${index}.specializationId`,parseInt(val, 10))
                    }
                    disabled={!selectedStudyAreaId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedStudyAreaId
                            ? "Select specialization"
                            : "Select study area first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {relatedSpecializations.map((spec: any) => (
                        <SelectItem key={spec.id} value={spec.id.toString()}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>                
              </div>

              {/* Grade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Grade</Label>
                  <Select
                    value={form.watch(`education.${index}.grade`)}
                    onValueChange={(v) => form.setValue(`education.${index}.grade`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(award => (
                      <SelectItem key={award} value={award}>
                        {award}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Year */}
                <div>
                  <Label>Year From *</Label>
                  <Input
                    type="number" placeholder="Enter year from"
                    {...form.register(`education.${index}.yearFrom`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label>Year Completed *</Label>
                  <Input
                    placeholder="Enter year completed"
                    type="number"
                    {...form.register(`education.${index}.yearCompleted`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
    case 4: // Short Courses
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h4 className="font-medium">Short Courses</h4>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            addShortCourse({
              courseName: "",
              institution: "",
              certificateNo: "",
              startDate: "",
              endDate: "",
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </Button>
      </div>

      {shortCourses.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium">Course {index + 1}</h5>
              {shortCourses.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeShortCourse(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">              
                  {/* Course Name */}
                  <div>
                    <Label>Course Name *</Label>
                    <Input
                      {...form.register(`shortCourses.${index}.course`)}
                      placeholder="e.g., Senior Management Course"
                    />
                  </div>                         

            {/* Certificate Number */}
            <div>
              <Label>Certificate No</Label>
              <Input
                {...form.register(`shortCourses.${index}.certificateNo`)}
                placeholder="Certificate number"
              />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Institution *</Label>
                <Input
                  {...form.register(`shortCourses.${index}.institutionName`)}
                  placeholder="e.g., Kenya School of Government, Nairobi, Lower Kabete"
                />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  {...form.register(`shortCourses.${index}.startDate`)}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  {...form.register(`shortCourses.${index}.endDate`)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
    case 5: // Professional Qualifications
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h4 className="font-medium">Professional Qualifications</h4>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              addQualification({
                institution: "",
                studentNo:"",
                areaOfStudyId:0,
                specialisationId:0,
                course:"",
                awardId:0,
                gradeId:0,
                examiner:"",
                certificateNo:"",
                startDate:"",
                endDate:"",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add Qualification
          </Button>
        </div>
        {professionalQualifications.map((key, index) => {
          const selectedStudyAreaId = form.watch(`professionalQualifications.${index}.areaOfStudyId`);
                
          const relatedSpecializations = config?.specializations?.filter(
              (s: any) => s.studyAreaId === Number(selectedStudyAreaId)
            ) || [];
          return (
          <Card key={key.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium">Professional Qualification {index + 1}</h5>
                {professionalQualifications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQualification(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Institution</Label>
                  <Input
                    {...form.register(`professionalQualifications.${index}.institution`)}
                    placeholder="Institution name"
                  />
                </div>

                <div>
                  <Label>Student Number</Label>
                  <Input
                    {...form.register(`professionalQualifications.${index}.studentNo`)}
                    placeholder="Student/Registration number"
                  />
                </div>

                <div>
                  <Label>Area of Study</Label>
                  <Select value={form.watch(`professionalQualifications.${index}.areaOfStudyId`)?.toString() || ""  }
                      onValueChange ={(val) => form.setValue(`professionalQualifications.${index}.areaOfStudyId`, parseInt(val, 10))
                      
                      }
                    > <SelectTrigger>
                      <SelectValue placeholder="Select area of study" />
                    </SelectTrigger>
                    <SelectContent>
                      {((config as any)?.studyAreas || []).map((area: any) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Specialisation</Label>
                  <Select value={form.watch(`professionalQualifications.${index}.specialisationId`)?.toString() || ""}
                      onValueChange={(val) => form.setValue(`professionalQualifications.${index}.specialisationId`, parseInt(val,10))}
                    disabled={!selectedStudyAreaId}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedStudyAreaId
                              ? "Select specialization"
                              : "Select study area first"
                          }
                        />
                      </SelectTrigger>
                    <SelectContent>
                      {(relatedSpecializations).map((spec: any) => (
                        <SelectItem key={spec.id} value={spec.id.toString()}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Course</Label>
                  <Input
                    {...form.register(`professionalQualifications.${index}.course`)}
                    placeholder="Course name"
                  />
                </div>

                <div>
                  <Label>Award</Label>
                  <Select value={form.watch(`professionalQualifications.${index}.awardId`)?.toString()} onValueChange={(value) => form.setValue(`professionalQualifications.${index}.awardId`, parseInt(value,10))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select award" />
                    </SelectTrigger>
                    <SelectContent>
                      {((config as any)?.awards)?.map((award: any) => (
                        <SelectItem key={award.id} value={award.id.toString()}>
                          {award.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Grade</Label>
                    <Select
                      value={form.watch(`professionalQualifications.${index}.gradeId`)}
                      onValueChange={(v) => form.setValue(`professionalQualifications.${index}.gradeId`, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map(award => (
                        <SelectItem key={award} value={award}>
                          {award}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                </div>

                <div>
                  <Label>Examiner</Label>
                  <Input
                    {...form.register(`professionalQualifications.${index}.examiner`)}
                    placeholder="e.g., KNEC, KASNEB, UoN, JKUAT, MKU, e.t.c."
                  />
                </div>

                <div>
                  <Label>Certificate Number</Label>
                  <Input
                    {...form.register(`professionalQualifications.${index}.certificateNo`)}
                    placeholder="Certificate number"
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    {...form.register(`professionalQualifications.${index}.startDate`)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    {...form.register(`professionalQualifications.${index}.endDate`)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    );
    case 6: // Employment History
      return (
        <div className="space-y-6">
          <div className="flex justify-between">
            <h4 className="font-medium">Employment History</h4>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                addEmployment({
                  employer: "",
                  position: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  responsibilities: "",
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" /> Add Employment
            </Button>
          </div>
          {employmentHistory.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium">Employment Record {index + 1}</h5>
                            {employmentHistory.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmployment(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
        
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Employer</Label>
                              <Input
                                {...form.register(`employmentHistory.${index}.employer`)}
                                placeholder="e.g., Ministry of Water, Nairobi City County, e.t.c"
                              />
                            </div>
        
                            <div>
                              <Label>Position</Label>
                              <Input
                                {...form.register(`employmentHistory.${index}.position`)} placeholder="e.g., Director ICT Officer"/>
                            </div>
        
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                type="date"
                                {...form.register(`employmentHistory.${index}.startDate`)}
                              />
                            </div>
        
                            <div>
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                {...form.register(`employmentHistory.${index}.endDate`)}
                                disabled={form.watch(`employmentHistory.${index}.isCurrent`)}
                              />
                            </div>
                          </div>
        
                          <div className="mt-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <Checkbox
                                checked={form.watch(`employmentHistory.${index}.isCurrent`) || false}
                                onCheckedChange={(checked) =>
                                  form.setValue(`employmentHistory.${index}.isCurrent`, checked === true, { shouldDirty: true, shouldValidate: true })
                                }
                              />
                              <Label>This is my current position</Label>
                            </div>
        
                            <div>
                              <Label>Key Duties and Responsibilities</Label>
                              <Textarea
                                {...form.register(`employmentHistory.${index}.duties`)}
                                placeholder="Describe your key duties and responsibilities..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
        ))}
      </div>
    );
    case 7: // Referees
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <h4 className="font-medium">Referees</h4>
            <p className="text-sm text-gray-600 mt-1">
              Exactly 3 referees are required ({referees.length}/3)
            </p>
          </div>
          {referees.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                addReferee({
                  name: "",
                  organization: "",
                  position: "",
                  phoneNumber: "",
                  email: "",
                  relationship: "",
                })
              }
              data-testid="button-add-referee"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Referee
            </Button>
          )}
        </div>

        {referees.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Referee {index + 1}</h5>
                {referees.length > 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeReferee(index)}
                    data-testid={`button-remove-referee-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Row 1: Name + Organization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input 
                    {...form.register(`referees.${index}.name`)}
                    placeholder="e.g., Mr. Moses Lubisia"
                    onChange={createCapitalizeHandler((value) => form.setValue(`referees.${index}.name`, value, { shouldDirty: true, shouldValidate: true }))}
                    data-testid={`input-referee-name-${index}`}
                  />
                </div>
                <div>
                  <Label>Organization *</Label>
                  <Input 
                    {...form.register(`referees.${index}.organization`)}
                    placeholder="e.g., Ministry of Health and Sanitation"
                    onChange={createCapitalizeHandler((value) => form.setValue(`referees.${index}.organization`, value, { shouldDirty: true, shouldValidate: true }))}
                    data-testid={`input-referee-organization-${index}`}
                  />
                </div>
              </div>

              {/* Row 2: Position + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Position</Label>
                  <Input 
                    {...form.register(`referees.${index}.position`)}
                    placeholder="e.g., Director of ICT"
                    onChange={createCapitalizeHandler((value) => form.setValue(`referees.${index}.position`, value, { shouldDirty: true, shouldValidate: true }))}
                    data-testid={`input-referee-position-${index}`}
                  />                
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input {...form.register(`referees.${index}.phoneNumber`)} placeholder="e.g., 0711293263"/>
                </div>
              </div>

              {/* Row 3: Email + Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                  placeholder="e.g.,mossesjuma@yahoo.com"
                    {...form.register(`referees.${index}.email`)}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input 
                    {...form.register(`referees.${index}.relationship`)}
                    placeholder="e.g., Supervisor, Director, Team Leader"
                    onChange={createCapitalizeHandler((value) => form.setValue(`referees.${index}.relationship`, value, { shouldDirty: true, shouldValidate: true }))}
                    data-testid={`input-referee-relationship-${index}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
    case 8:
  return (
    <ApplicantDocument
      columns="2"
      showNavigation={false}
      documentTypes={[
        { id: "national_id", label: "National ID", required: true },
        { id: "certificates", label: "Academic Certificates", required: true },
        { id: "transcripts", label: "Academic Transcripts", required: false },
        { id: "professional_certs", label: "Professional Certificates", required: false },
        { id: "kra_pin", label: "KRA PIN Certificate", required: true },
        { id: "good_conduct", label: "Certificate of Good Conduct", required: true },
        { id: "birth_certificate", label: "Birth Certificate", required: true },
      ]}
    />
  );

    default:
      return <p>No step found</p>;
  }
})()}

{/* ---------------- Submit Button ---------------- */}
      <div className="flex justify-end">
          <Button
            type={showNext ? "button" : "submit"}
            disabled={isLoading || step === 8}
            onClick={() => {
              if (showNext && typeof onSave === "function") {
                // 🚀 Trigger parent handler to move to next step
                onSave({ method: "SKIP", step });
              }
            }}
          >
            {isLoading ? "Saving..." : showNext ? "Next" : "Save & Continue"}
          </Button>
      </div>
      </form>

      <EmployeeVerificationDialog
        open={showEmployeeVerification}
        onOpenChange={setShowEmployeeVerification}
        applicantIdNumber={form.getValues("nationalId") || ""}
        onVerificationSuccess={handleEmployeeVerificationSuccess}
      />
      
    </>
  );
}