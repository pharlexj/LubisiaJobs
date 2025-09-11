import { useState } from 'react';

export function useProfileFormState(step: number, isVerifiedEmployee: boolean) {
  const [educationRecords, setEducationRecords] = useState([]);
  const [employeeData, setEmployeeData] = useState({
    personalNumber: '',
    designation: '',
    dutyStation: '',
    jg: '',
  });
  const [professionalQualifications, setProfessionalQualifications] = useState([
    { institution: '', studentNo: '', areaOfStudyId: 0, specialisationId: 0, course: '', awardId: 0, gradeId: '', examiner: '', certificateNo: '', startDate: '', endDate: '' }
  ]);
  const [shortCourses, setShortCourses] = useState([
    { institutionName: '', course: '', certificateNo: '', startDate: '', endDate: '' }
  ]);
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [referees, setReferees] = useState([
    { name: '', position: '', organization: '', email: '', phoneNumber: '', relationship: '' }
  ]);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: File | null }>({
    national_id: null,
    certificates: null,
    transcripts: null,
    professional_certs: null,
    kra_pin: null,
    good_conduct: null,
  });

  const getStepData = () => ({
    ...(step === 1 && { isVerifiedEmployee }),
    ...(step === 1.5 && { employee: employeeData }),
    ...(step === 3 && { education: educationRecords }),
    ...(step === 4 && { shortCourses }),
    ...(step === 5 && { professionalQualifications }),
    ...(step === 6 && { employmentHistory }),
    ...(step === 7 && { referees }),
    ...(step === 8 && { documents: uploadedDocuments }),
  });

  return {
    educationRecords,
    setEducationRecords,
    employeeData,
    setEmployeeData,
    professionalQualifications,
    setProfessionalQualifications,
    shortCourses,
    setShortCourses,
    employmentHistory,
    setEmploymentHistory,
    referees,
    setReferees,
    uploadedDocuments,
    setUploadedDocuments,
    getStepData,
  };
}
