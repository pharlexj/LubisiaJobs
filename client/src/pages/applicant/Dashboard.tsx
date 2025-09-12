import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Calendar } from "lucide-react";
import ProgressIndicator from "@/components/applicant/ProgressIndicator";
import type { Application } from "@shared/schema";
import { usePublicConfig } from "@/hooks/usePublicConfig";

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: config } = usePublicConfig();
  const jobs = config?.jobs || [];

  // ✅ Fetch applications
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applicant/applications"],
  });

  // ✅ Fetch applicant profile (progress lives here)
  type ProfileResponse = {
    applicantProfile?: {
      id: number;
      isEmployee?: boolean;
      profileCompletionPercentage?: number;
      completedSteps?: number[];
    };
  };

  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const steps = [
    { id: 1, name: "Personal Details", required: true },
    { id: 1.5, name: "Employee Details", required: true, conditional: true },
    { id: 2, name: "Address Information", required: true },
    { id: 3, name: "Educational Background", required: true },
    { id: 4, name: "Short Courses", required: false },
    { id: 5, name: "Professional Qualifications", required: false },
    { id: 6, name: "Employment History", required: true },
    { id: 7, name: "Referees", required: true },
    { id: 8, name: "Document Uploads", required: true },
  ].map((step) => ({
    ...step,
    completed:
      profile?.applicantProfile?.completedSteps?.includes(step.id as number) ??
      false,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-green-100 text-green-800";
      case "interviewed":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "hired":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Applicant"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your job applications and complete your profile
          </p>
        </div>

        {/* ✅ Profile Completion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressIndicator
              steps={steps}
              currentStep={0}
              completedSteps={profile?.applicantProfile?.completedSteps?.length || 0}
            />
            <div className="mt-6">
              <Button
                onClick={() => {
                  const completed = profile?.applicantProfile?.completedSteps || [];
                  const lastStep = completed.length > 0 ? completed[completed.length - 1] : 1;

                  const isEmployeeVerified = profile?.applicantProfile?.isEmployee;

                  // Logic to decide next step
                  let nextStep: number | 1.5 = lastStep < 8 ? lastStep + 1 : 8;
                  if (lastStep === 1 && isEmployeeVerified) nextStep = 1.5;
                  if (lastStep === 1 && !isEmployeeVerified) nextStep = 2;

                  navigate(`/profile?step=${nextStep}`);
                }}
              >
                Continue Profile Setup
              </Button>

            </div>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Applications Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Shortlisted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter((app) => app.status === "shortlisted").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Interview Invites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter((app) => app.status === "interviewed").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/applications")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start browsing and applying for jobs to see them here.
                </p>
                <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Job Title
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Applied Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 5).map((application: any) => {
                      const jobMatch = jobs.find((j: any) => j.id === application.jobId);
                      return (
                        <tr
                          key={application.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {jobMatch?.title || "—"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {application?.job?.designation?.jobGroup || ""}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                            {(() => {
                            const jobMatch = jobs.find((j) => j.id === application.jobId);
                            
                            return jobMatch ? jobMatch.title : "—";
                            })()}
                            </div>
                            <div className="text-sm text-gray-600">
                            {(() => {
                            const jobMatch = jobs.find((j) => j.id === application.jobId);
                            const departments = config?.departments || [];
                            const department = departments.find((d: any) => d.id === jobMatch?.departmentId);
                            return department ? department.name : "—";
                            })()}
                            </div>
                            </td>
                          <td className="py-3 px-4 text-gray-600">
                            {application.submittedOn
                              ? new Date(application.submittedOn).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(application.status || "")}> 
                              {application.status
                                ? application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)
                                : "Draft"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/applications?id=${application.id}`)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
