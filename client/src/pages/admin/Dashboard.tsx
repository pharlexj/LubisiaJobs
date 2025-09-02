import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  FileText,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin',
  });

  // Calculate statistics
  const activeJobs = jobs.filter(job => job.isActive).length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'submitted').length;
  const shortlistedApplications = applications.filter(app => app.status === 'shortlisted').length;

  // Recent activity data
  const recentJobs = jobs.slice(0, 5);
  const recentApplications = applications.slice(0, 5);

  // Monthly stats (mock data for demonstration)
  const monthlyStats = [
    { month: 'Jan', applications: 45, hires: 12 },
    { month: 'Feb', applications: 52, hires: 15 },
    { month: 'Mar', applications: 38, hires: 8 },
    { month: 'Apr', applications: 61, hires: 18 },
    { month: 'May', applications: 44, hires: 11 },
    { month: 'Jun', applications: 58, hires: 16 },
  ];
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage job postings, review applications, and oversee the recruitment process.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{activeJobs}</p>
                      <p className="text-green-600 text-sm mt-1">+3 this month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Applications</p>
                      <p className="text-3xl font-bold text-gray-900">{totalApplications}</p>
                      <p className="text-green-600 text-sm mt-1">+12% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Review</p>
                      <p className="text-3xl font-bold text-gray-900">{pendingApplications}</p>
                      <p className="text-yellow-600 text-sm mt-1">Requires attention</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Shortlisted</p>
                      <p className="text-3xl font-bold text-gray-900">{shortlistedApplications}</p>
                      <p className="text-blue-600 text-sm mt-1">Ready for interviews</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="h-24 flex flex-col items-center justify-center">
                    <Briefcase className="w-6 h-6 mb-2" />
                    Post New Job
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <FileText className="w-6 h-6 mb-2" />
                    Review Applications
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <Calendar className="w-6 h-6 mb-2" />
                    Schedule Interviews
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <TrendingUp className="w-6 h-6 mb-2" />
                    Generate Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Jobs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Job Postings</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentJobs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No jobs posted yet</p>
                  ) : (
                    <div className="space-y-4">
                      {recentJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.department?.name}</p>
                            <p className="text-xs text-gray-500">
                              Deadline: {job.endDate 
                                ? new Date(job.endDate).toLocaleDateString()
                                : 'Open'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={job.isActive ? 'default' : 'secondary'}>
                              {job.isActive ? 'Active' : 'Closed'}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">
                              {applications.filter(app => app.jobId === job.id).length} applications
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Applications</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentApplications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No applications yet</p>
                  ) : (
                    <div className="space-y-4">
                      {recentApplications.map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {application.applicant?.firstName?.[0] || 'A'}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {application.applicant?.firstName} {application.applicant?.surname}
                              </h4>
                              <p className="text-sm text-gray-600">{application.job?.title}</p>
                              <p className="text-xs text-gray-500">
                                {application.submittedOn
                                  ? new Date(application.submittedOn).toLocaleDateString()
                                  : 'Draft'}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(application.status)}`}>
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recruitment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Completion Rate</h4>
                    <Progress value={85} className="mb-2" />
                    <p className="text-sm text-gray-600">85% of applications are complete</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Time to Hire (Average)</h4>
                    <div className="text-2xl font-bold text-primary mb-1">24 days</div>
                    <p className="text-sm text-gray-600">3 days faster than last month</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Candidate Satisfaction</h4>
                    <div className="text-2xl font-bold text-secondary mb-1">4.2/5</div>
                    <p className="text-sm text-gray-600">Based on post-process surveys</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'interviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
