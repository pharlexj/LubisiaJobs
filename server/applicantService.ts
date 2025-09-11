import { IStorage } from "./storage";

export class ApplicantService {
  constructor(private storage: IStorage) { }
  async updateStep(applicantId: number, step: number, data: any) {  
  await this.updateBasicInfo(applicantId, data);  

  // ✅ always return the fresh full profile
  return this.storage.getApplicantById(applicantId);
}
  async updateBasicInfo(applicantId: number, data: any) {
    return this.storage.updateApplicant(applicantId, { ...data }, data.step);
  }
async resolveApplicantId(userId: string): Promise<number> {
  let applicant = await this.storage.getApplicant(userId);
  const data:any = {userId, ...applicant}
  if (!applicant) {
    const newApplicant = await this.storage.createApplicant(data);
    return newApplicant.id;
  }
  return applicant.id;
}

}
