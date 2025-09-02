// client/src/hooks/usePublicConfig.ts
import { useQuery } from '@tanstack/react-query';

type Institution = {
  id: number | string;
  name: string;
};
type Designation = {
  id: number | string;
  name: string;
}
type Awards = {
  id: number | string;
  name: string;
};
type CertificateLevel = {
  id: number | string;
  name: string;
};
type Jg = {
  id: number;
  name: string;
}
type Department = {
  id: number | string;
  name: string;
};
type Jobs = {
  id: number | string;
  title: string;
  description: string;
  jg: string;
  departmentId: number;
  designationId: number;
  location: string;
  requirements: string;
  responsibilities: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange: string;
  postedDate: string;
}
type Applications = {
  id: number;
  jobId: number;
  applicantId: number;
  status: string;
  submittedOn: string;
  remarks: string;
  interviewDate: string;
}
type County = {
  id: number | string;
  name: string;
}
type PublicConfig = {
  institutions: Institution[];
  awards: Awards[];
  courses: string[];
  jg: Jg[];
  ethnicity: any[];
  certificatelevel: CertificateLevel[];
  jobs: Jobs[];
  departments: Department[];
  designations: Designation[];
  applications: Applications[];
  counties: County[];
};

export const usePublicConfig = () => {
  return useQuery<PublicConfig>({
    queryKey: ['/api/public/config'],
    queryFn: async () => {
      const res = await fetch('/api/public/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
  });
};
