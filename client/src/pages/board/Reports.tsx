import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  PieChart, 
  Users, 
  Award, 
  FileText, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BoardReports() {
  const { user } = useAuth();
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Get applications data
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/board/applications'],
    enabled: !!user && user.role === 'board',
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  // Get scoring statistics
  const { data: scoringStats } = useQuery({
    queryKey: ['/api/board/scoring-statistics'],
    enabled: !!user && user.role === 'board',
  });

  // Get interview statistics
  const { data: interviewStats } = useQuery({
    queryKey: ['/api/board/interview-statistics'],
    enabled: !!user && user.role === 'board',
  });

  if (applicationsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const applicationsData = applications as any[];
  const jobsData = jobs as any[];
  const scoringData = scoringStats as any;
  const interviewData = interviewStats as any;

  // Calculate statistics
  const totalApplications = applicationsData.length;
  const shortlistedCount = applicationsData.filter((app: any) => app.status === 'shortlisted').length;
  const interviewedCount = applicationsData.filter((app: any) => app.interviewDate).length;
  const finalizedCount = applicationsData.filter((app: any) => app.status === 'hired' || app.status === 'rejected').length;

  // Filter applications based on selected filters
  const filteredApplications = applicationsData.filter((app: any) => {
    if (selectedJobFilter !== 'all' && app.jobId?.toString() !== selectedJobFilter) return false;
    if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;
    return true;
  });

  // Application status distribution
  const statusDistribution = applicationsData.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  // Job-wise application distribution
  const jobDistribution = applicationsData.reduce((acc: any, app: any) => {
    const job = jobsData.find((j: any) => j.id === app.jobId);
    const jobTitle = job?.title || 'Unknown';
    acc[jobTitle] = (acc[jobTitle] || 0) + 1;
    return acc;
  }, {});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'interviewed': return 'bg-indigo-100 text-indigo-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive reporting and statistics for board decision-making
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
              <SelectTrigger className="w-48" data-testid="select-job-filter">
                <SelectValue placeholder="Select job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobsData.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
                  <p className="text-xs text-gray-500">Across all positions</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                  <p className="text-2xl font-bold text-green-600">{shortlistedCount}</p>
                  <p className="text-xs text-gray-500">
                    {totalApplications > 0 ? Math.round((shortlistedCount / totalApplications) * 100) : 0}% of total
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviewed</p>
                  <p className="text-2xl font-bold text-purple-600">{interviewedCount}</p>
                  <p className="text-xs text-gray-500">
                    {shortlistedCount > 0 ? Math.round((interviewedCount / shortlistedCount) * 100) : 0}% of shortlisted
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalized</p>
                  <p className="text-2xl font-bold text-indigo-600">{finalizedCount}</p>
                  <p className="text-xs text-gray-500">Hired or rejected</p>
                </div>
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Analysis</TabsTrigger>
            <TabsTrigger value="interviews">Interview Reports</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Application Status Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of applications by current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(status)}>
                            {status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{count as number}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({Math.round(((count as number) / totalApplications) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Job Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Applications by Position
                  </CardTitle>
                  <CardDescription>
                    Distribution of applications across job positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(jobDistribution).map(([job, count]) => (
                      <div key={job} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium truncate">{job}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{count as number}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({Math.round(((count as number) / totalApplications) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity Summary
                </CardTitle>
                <CardDescription>
                  Latest updates and changes in the application process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Applications shortlisted today</span>
                    </div>
                    <span className="font-semibold">
                      {applicationsData.filter((app: any) => 
                        app.status === 'shortlisted' && 
                        new Date(app.updatedAt || app.createdAt).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Interviews scheduled</span>
                    </div>
                    <span className="font-semibold">{interviewedCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Pending review</span>
                    </div>
                    <span className="font-semibold">
                      {applicationsData.filter((app: any) => app.status === 'under_review').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scoring Analysis Tab */}
          <TabsContent value="scoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Scoring Statistics
                  </CardTitle>
                  <CardDescription>
                    Panel scoring analysis and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scoringData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {scoringData.totalScoredApplications || 0}
                          </p>
                          <p className="text-sm text-gray-600">Applications Scored</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {scoringData.averageScore?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-sm text-gray-600">Average Score</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Panel members who have completed scoring: {scoringData.activeScorers || 0}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No scoring data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Score Distribution
                  </CardTitle>
                  <CardDescription>
                    How scores are distributed across applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Scores (80-100)</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {scoringData?.highScores || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Scores (60-79)</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        {scoringData?.mediumScores || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Scores (0-59)</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {scoringData?.lowScores || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interview Reports Tab */}
          <TabsContent value="interviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Management
                </CardTitle>
                <CardDescription>
                  Interview scheduling and completion statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{interviewedCount}</p>
                    <p className="text-sm text-gray-600">Total Interviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {applicationsData.filter((app: any) => app.status === 'interviewed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {applicationsData.filter((app: any) => app.status === 'interview_scheduled').length}
                    </p>
                    <p className="text-sm text-gray-600">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Reports Tab */}
          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detailed Application Report
                </CardTitle>
                <CardDescription>
                  Complete list of applications with current status ({filteredApplications.length} of {totalApplications} applications)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredApplications.map((application: any) => {
                    const job = jobsData.find((j: any) => j.id === application.jobId);
                    return (
                      <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{application.fullName}</p>
                              <p className="text-sm text-gray-600">{job?.title || 'Unknown Position'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getStatusColor(application.status)}>
                            {application.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                  {filteredApplications.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No applications match the selected filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}