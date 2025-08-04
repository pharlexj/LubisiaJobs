import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  Calendar, 
  UserCheck, 
  Users, 
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';

export default function BoardDashboard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/board/applications'],
    enabled: !!user && user.role === 'board',
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  // Calculate statistics
  const pendingReview = applications.filter(app => app.status === 'submitted').length;
  const shortlisted = applications.filter(app => app.status === 'shortlisted').length;
  const interviewed = applications.filter(app => app.status === 'interviewed').length;
  const appointed = applications.filter(app => app.status === 'hired').length;

  // Recent activity
  const recentApplications = applications
    .filter(app => app.status === 'submitted')
    .slice(0, 5);

  const upcomingInterviews = applications
    .filter(app => app.status === 'shortlisted' && app.interviewDate)
    .slice(0, 3);

  const getStatusColor = (status: string) => {
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
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="board" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Board Committee Dashboard
              </h1>
              <p className="text-gray-600">
                Review applications, conduct interviews, and manage the selection process.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Review</p>
                      <p className="text-3xl font-bold text-gray-900">{pendingReview}</p>
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
                      <p className="text-3xl font-bold text-gray-900">{shortlisted}</p>
                      <p className="text-green-600 text-sm mt-1">Ready for interviews</p>
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
                      <p className="text-gray-600 text-sm">Interviews Scheduled</p>
                      <p className="text-3xl font-bold text-gray-900">{interviewed}</p>
                      <p className="text-blue-600 text-sm mt-1">In progress</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Appointed</p>
                      <p className="text-3xl font-bold text-gray-900">{appointed}</p>
                      <p className="text-purple-600 text-sm mt-1">This month</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-purple-600" />
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
                    <Users className="w-6 h-6 mb-2" />
                    Review Applications
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <CheckCircle className="w-6 h-6 mb-2" />
                    Shortlist Candidates
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
              {/* Applications Requiring Review */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Applications for Review</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentApplications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No applications pending review</p>
                  ) : (
                    <div className="space-y-4">
                      {recentApplications.map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {application.applicant?.firstName?.[0] || 'A'}
                              {application.applicant?.surname?.[0] || ''}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {application.applicant?.firstName} {application.applicant?.surname}
                              </h4>
                              <p className="text-sm text-gray-600">{application.job?.title}</p>
                              <p className="text-xs text-gray-500">
                                Applied: {application.submittedOn
                                  ? new Date(application.submittedOn).toLocaleDateString()
                                  : 'Draft'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(application.status)}>
                              {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                            </Badge>
                            <div className="mt-2 flex space-x-1">
                              <Button size="sm" variant="outline">
                                Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Interviews */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Upcoming Interviews</CardTitle>
                    <Button variant="outline" size="sm">Schedule New</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingInterviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No interviews scheduled</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingInterviews.map((application) => (
                        <div key={application.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {application.job?.title}
                            </h4>
                            <Badge variant="outline">
                              {application.interviewDate 
                                ? new Date(application.interviewDate).toLocaleDateString()
                                : 'TBD'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Candidate: {application.applicant?.firstName} {application.applicant?.surname}
                          </p>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                            <Button size="sm" variant="outline">
                              Reschedule
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Selection Progress Overview */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Selection Process Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Review Progress</h4>
                    <Progress value={75} className="mb-2" />
                    <p className="text-sm text-gray-600">75% of applications reviewed</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Average Interview Score</h4>
                    <div className="text-2xl font-bold text-primary mb-1">82/100</div>
                    <p className="text-sm text-gray-600">Based on completed interviews</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Time to Complete Process</h4>
                    <div className="text-2xl font-bold text-secondary mb-1">18 days</div>
                    <p className="text-sm text-gray-600">Average processing time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">New applications received</p>
                      <p className="text-xs text-gray-600">5 new applications for ICT Officer position</p>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Candidates shortlisted</p>
                      <p className="text-xs text-gray-600">3 candidates shortlisted for Administrative Officer</p>
                    </div>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Interview completed</p>
                      <p className="text-xs text-gray-600">Moses Wafula interviewed for ICT Officer position</p>
                    </div>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Candidate appointed</p>
                      <p className="text-xs text-gray-600">Sarah Kemunto appointed as Health Records Officer</p>
                    </div>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
