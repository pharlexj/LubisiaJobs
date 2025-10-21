import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { getApplications } from "@/lib/queryFns";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  Award,
  Printer,
  Plus,
  Edit,
  Save,
  Download,
  X,
  Users,
  TrendingUp,
  Eye,
  Upload,
  FileSpreadsheet
} from 'lucide-react';

interface InterviewScheduleForm {
  jobId: string;
  interviewDate: string;
  interviewTime: string;
  interviewVenue: string;
  duration: number;
}

interface PanelScore {
  academicScore: number;
  experienceScore: number;
  skillsScore: number;
  leadershipScore: number;
  generalScore: number;
  negativeScore: number;
  remarks: string;
}

export default function BoardInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  
  const [scheduleForm, setScheduleForm] = useState<InterviewScheduleForm>({
    jobId: '',
    interviewDate: '',
    interviewTime: '',
    interviewVenue: '',
    duration: 30
  });

  const [panelScore, setPanelScore] = useState<PanelScore>({
    academicScore: 0,
    experienceScore: 0,
    skillsScore: 0,
    leadershipScore: 0,
    generalScore: 0,
    negativeScore: 0,
    remarks: ''
  });

  const [jobFilter, setJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('shortlisted');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: [
      "/api/board/applications",
      { status: statusFilter, jobId: jobFilter !== "all" ? jobFilter : undefined },
    ],
    queryFn: getApplications,
    enabled: !!user && user.role === "board",
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  // Get current user's score for selected candidate
  const { data: myScore } = useQuery<any>({
    queryKey: ['/api/board/my-score', selectedCandidate?.id],
    enabled: !!selectedCandidate,
  });

  // Get average scores for selected candidate
  const { data: averageScores } = useQuery<any>({
    queryKey: ['/api/board/average-scores', selectedCandidate?.id],
    enabled: !!selectedCandidate,
  });

  // Load existing score when candidate is selected
  useEffect(() => {
    if (myScore?.score) {
      setPanelScore({
        academicScore: myScore.score.academicScore || 0,
        experienceScore: myScore.score.experienceScore || 0,
        skillsScore: myScore.score.skillsScore || 0,
        leadershipScore: myScore.score.leadershipScore || 0,
        generalScore: myScore.score.generalScore || 0,
        negativeScore: myScore.score.negativeScore || 0,
        remarks: myScore.score.remarks || ''
      });
    } else {
      resetScoreForm();
    }
  }, [myScore]);


  // Update interview mutation
  const updateInterviewMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get all applications for this interview session
      const sessionApplications = (applications as any[]).filter(
        app => app.jobId === data.targetJobId && 
               app.interviewDate === selectedInterview?.date
      );

      return await apiRequest('POST', '/api/board/applications/bulk-update', {
        applicationIds: sessionApplications.map(app => app.id),
        updates: {
          interviewDate: data.interviewDate,
          interviewTime: data.interviewTime,
          interviewVenue: data.interviewVenue,
          interviewDuration: data.duration,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Interview Updated',
        description: 'Interview details have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setShowEditDialog(false);
      setSelectedInterview(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update interview',
        variant: 'destructive',
      });
    },
  });

  // Save panel score mutation
  const savePanelScoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/board/panel-scores', {
        applicationId: selectedCandidate.id,
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: 'Score Saved',
        description: 'Your interview score has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/board/my-score'] });
      queryClient.invalidateQueries({ queryKey: ['/api/board/average-scores'] });
      setShowScoringDialog(false);
      resetScoreForm();
      setSelectedCandidate(null);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => window.location.href = '/', 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to save score',
        variant: 'destructive',
      });
    },
  });


  const resetScoreForm = () => {
    setPanelScore({
      academicScore: 0,
      experienceScore: 0,
      skillsScore: 0,
      leadershipScore: 0,
      generalScore: 0,
      negativeScore: 0,
      remarks: ''
    });
  };

  const calculateTotalScore = () => {
    return (
      panelScore.academicScore +
      panelScore.experienceScore +
      panelScore.skillsScore +
      panelScore.leadershipScore +
      panelScore.generalScore -
      panelScore.negativeScore
    );
  };

  const handleUpdateInterview = () => {
    if (!scheduleForm.interviewDate || !scheduleForm.interviewTime || !scheduleForm.interviewVenue) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    updateInterviewMutation.mutate({
      targetJobId: selectedInterview.jobId,
      ...scheduleForm
    });
  };

  const handleSaveScore = () => {
    savePanelScoreMutation.mutate(panelScore);
  };

  const handleEditInterview = (interview: any) => {
    setSelectedInterview(interview);
    setScheduleForm({
      jobId: interview.jobId?.toString() || '',
      interviewDate: interview.date || '',
      interviewTime: interview.time || '',
      interviewVenue: interview.venue || '',
      duration: 30
    });
    setShowEditDialog(true);
  };

  const handlePrintSheets = (interview: any) => {
    // Get candidates for this interview
    const candidates = (applications as any[]).filter(
      app => app.interviewDate === interview.date && 
             app.job.title === interview.jobTitle
    );

    // Create printable content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Interview Score Sheet - ${interview.jobTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 10px; }
              .info { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
              .score-section { margin-top: 20px; page-break-inside: avoid; }
              @media print { 
                .score-section { page-break-after: always; }
                .score-section:last-child { page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            <h1>Trans Nzoia County Public Service Board</h1>
            <h2 style="text-align: center;">Interview Score Sheet</h2>
            <div class="info">
              <p><strong>Position:</strong> ${interview.jobTitle}</p>
              <p><strong>Date:</strong> ${new Date(interview.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${interview.time}</p>
              <p><strong>Venue:</strong> ${interview.venue}</p>
              <p><strong>Total Candidates:</strong> ${candidates.length}</p>
            </div>

            ${candidates.map((candidate, index) => `
              <div class="score-section">
                <h3>Candidate ${index + 1}: ${candidate.fullName}</h3>
                <p><strong>Application ID:</strong> ${candidate.id}</p>
                <p><strong>Phone:</strong> ${candidate.phoneNumber}</p>
                
                <table>
                  <thead>
                    <tr>
                      <th>Scoring Criteria</th>
                      <th>Max Score</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Academic Qualifications</td>
                      <td>20</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Work Experience</td>
                      <td>20</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Technical Skills & Knowledge</td>
                      <td>30</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Leadership & Management</td>
                      <td>20</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>General Suitability</td>
                      <td>10</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Negative Marks (if any)</td>
                      <td>-</td>
                      <td></td>
                    </tr>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                      <td>Total Score</td>
                      <td>100</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                
                <div style="margin-top: 20px;">
                  <p><strong>Panel Member's Remarks:</strong></p>
                  <p style="border: 1px solid #000; min-height: 60px; padding: 10px;"></p>
                </div>
                
                <div style="margin-top: 30px;">
                  <p><strong>Panel Member Name:</strong> _______________________________</p>
                  <p><strong>Signature:</strong> _______________________________</p>
                  <p><strong>Date:</strong> _______________________________</p>
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleViewCandidateList = (interview: any) => {
    // Get candidates for this interview
    const candidates = (applications as any[]).filter(
      app => app.interviewDate === interview.date && 
             app.job.title === interview.jobTitle
    );

    // Create printable candidate list
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Candidate List - ${interview.jobTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2 { text-align: center; }
              .info { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #0d9488; color: white; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Trans Nzoia County Public Service Board</h1>
            <h2>Interview Candidate List</h2>
            <div class="info">
              <p><strong>Position:</strong> ${interview.jobTitle}</p>
              <p><strong>Date:</strong> ${new Date(interview.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${interview.time}</p>
              <p><strong>Venue:</strong> ${interview.venue}</p>
              <p><strong>Total Candidates:</strong> ${candidates.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Application ID</th>
                  <th>Full Name</th>
                  <th>Phone Number</th>
                  <th>National ID</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                ${candidates.map((candidate, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${candidate.id}</td>
                    <td>${candidate.fullName}</td>
                    <td>${candidate.phoneNumber}</td>
                    <td>${candidate.nationalId || 'N/A'}</td>
                    <td></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Group applications by job and interview date for upcoming interviews
  const upcomingInterviews = (applications as any[])
    .filter(app => app.interviewDate)
    .reduce((acc: any, app: any) => {
      const key = `${app.jobId}_${app.interviewDate}`;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          jobId: app.jobId,
          jobTitle: app.job.title || 'Unknown Position',
          date: app.interviewDate,
          time: app.interviewTime || '',
          candidates: 0,
          venue: app.interviewVenue || '',
        };
      }
      acc[key].candidates += 1;
      return acc;
    }, {});
  const upcomingInterviewList = Object.values(upcomingInterviews);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex flex-col md:flex-row">
          <Sidebar userRole="board" />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex flex-col md:flex-row">
        <Sidebar userRole="board" />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with Teal Gradient */}
            <div 
              className="rounded-lg p-6 mb-8 text-white"
              style={{
                background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(15, 118, 110))'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                    Interview Management
                  </h1>
                  <p className="opacity-90">
                    Schedule interviews, conduct assessments, and score candidates.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Filter by Job</Label>
                    <Select value={jobFilter} onValueChange={setJobFilter}>
                      <SelectTrigger data-testid="select-filter-job">
                        <SelectValue placeholder="All Jobs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {(jobs as any[]).map((job: any) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Scheduled Interviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                    Upcoming Interviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingInterviewList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No upcoming interviews scheduled.</p>
                      </div>
                    ) : (
                      upcomingInterviewList.map((interview: any) => (
                        <div 
                          key={interview.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          data-testid={`card-interview-${interview.id}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{interview.jobTitle}</h4>
                            <Badge 
                              variant="outline" 
                              className="bg-teal-50 text-teal-700 border-teal-200"
                              data-testid={`badge-candidates-${interview.id}`}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              {interview.candidates} candidates
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                              {new Date(interview.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-teal-600" />
                              {interview.time}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 flex items-center">
                            <span className="font-medium mr-2">Venue:</span> {interview.venue}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewCandidateList(interview)}
                              data-testid={`button-view-list-${interview.id}`}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View List
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePrintSheets(interview)}
                              data-testid={`button-print-sheets-${interview.id}`}
                            >
                              <Printer className="w-3 h-3 mr-1" />
                              Print Sheets
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditInterview(interview)}
                              data-testid={`button-edit-interview-${interview.id}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
                    Interview Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="p-4 rounded-lg text-white"
                      style={{
                        background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(15, 118, 110))'
                      }}
                    >
                      <div className="text-sm opacity-90 mb-1">Total Scheduled</div>
                      <div className="text-3xl font-bold" data-testid="stat-total-scheduled">
                        {upcomingInterviewList.length}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700 mb-1">Candidates</div>
                        <div className="text-2xl font-bold text-blue-900" data-testid="stat-total-candidates">
                          {(applications as any[]).filter(app => app.interviewDate).length}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-green-700 mb-1">Completed</div>
                        <div className="text-2xl font-bold text-green-900" data-testid="stat-completed-interviews">
                          {(applications as any[]).filter(app => app.status === 'interviewed').length}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Scoring Instructions</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Academic: 20 points</p>
                        <p>• Experience: 20 points</p>
                        <p>• Skills: 30 points</p>
                        <p>• Leadership: 20 points</p>
                        <p>• General: 10 points</p>
                        <p className="text-red-600">• Negative marks deducted</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidates Table */}
            <Card className="mt-6 md:mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-teal-600" />
                  Interview Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(applications as any).length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Found</h3>
                    <p className="text-gray-600">
                      {statusFilter === 'shortlisted' 
                        ? 'Shortlisted candidates will appear here for interview scheduling.'
                        : 'No candidates match the selected filters.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-candidates">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Candidate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Interview Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">My Score</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Score</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(applications as any).map((application: any) => (
                          <tr 
                            key={application.id} 
                            className="border-b border-gray-100 hover:bg-gray-50"
                            data-testid={`row-candidate-${application.id}`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {application?.firstName?.[0] || 'A'}
                                  {application?.surname?.[0] || ''}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {application?.fullName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {application?.phoneNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{application.job.title}</div>
                              <div className="text-sm text-gray-600">Job Group {application?.job.jobGroupName}</div>
                            </td>
                            <td className="py-3 px-4">
                              {application.interviewDate ? (
                                <div>
                                  <div className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {new Date(application.interviewDate).toLocaleDateString()}
                                  </div>
                                  {application.interviewTime && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {application.interviewTime}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">Not Scheduled</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-400">-</span>
                            </td>
                            <td className="py-3 px-4">
                              {application.interviewScore ? (
                                <div className="flex items-center">
                                  <Award className="w-4 h-4 mr-1 text-yellow-600" />
                                  <span className="font-medium">{application.interviewScore}/100</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not scored</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                className={
                                  application.status === 'interviewed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : application.status === 'interview_scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                                data-testid={`badge-status-${application.id}`}
                              >
                                {application.status === 'interviewed' 
                                  ? 'Completed' 
                                  : application.status === 'interview_scheduled'
                                  ? 'Scheduled'
                                  : 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCandidate(application);
                                  setShowScoringDialog(true);
                                }}
                                className="hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                                data-testid={`button-score-${application.id}`}
                              >
                                <Award className="w-3 h-3 mr-1" />
                                Score
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Interview Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="dialog-edit-interview">
          <DialogHeader>
            <DialogTitle>Edit Interview Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-800 font-medium">
                {selectedInterview?.jobTitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-interview-date">Interview Date *</Label>
                <Input 
                  id="edit-interview-date"
                  type="date" 
                  value={scheduleForm.interviewDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                  data-testid="input-edit-date"
                />
              </div>
              <div>
                <Label htmlFor="edit-interview-time">Time *</Label>
                <Input 
                  id="edit-interview-time"
                  type="time" 
                  value={scheduleForm.interviewTime}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewTime: e.target.value }))}
                  data-testid="input-edit-time"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-interview-venue">Venue *</Label>
              <Input 
                id="edit-interview-venue"
                placeholder="e.g., CPSB Boardroom" 
                value={scheduleForm.interviewVenue}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewVenue: e.target.value }))}
                data-testid="input-edit-venue"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setSelectedInterview(null);
              }}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateInterview}
              disabled={updateInterviewMutation.isPending}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              data-testid="button-confirm-edit"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateInterviewMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Panel Scoring Dialog */}
      <Dialog open={showScoringDialog} onOpenChange={setShowScoringDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-panel-scoring">
          <DialogHeader>
            <DialogTitle>Panel Interview Scoring</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div 
                className="p-4 rounded-lg text-white"
                style={{
                  background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(15, 118, 110))'
                }}
              >
                <div className="font-semibold text-lg mb-1">{selectedCandidate.fullName}</div>
                <div className="text-sm opacity-90">
                  {selectedCandidate.job.title} • Application #{selectedCandidate.id}
                </div>
              </div>

              {/* Average Scores Display */}
              {averageScores && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Panel Average Score</span>
                    <span className="text-lg font-bold text-blue-900">
                      {averageScores.totalAverage?.toFixed(1) || 0}/100
                    </span>
                  </div>
                </div>
              )}

              {/* Scoring Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academic-score">Academic Qualifications (Max: 20)</Label>
                    <Input 
                      id="academic-score"
                      type="number" 
                      min="0"
                      max="20"
                      value={panelScore.academicScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        academicScore: Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      data-testid="input-academic-score"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience-score">Work Experience (Max: 20)</Label>
                    <Input 
                      id="experience-score"
                      type="number" 
                      min="0"
                      max="20"
                      value={panelScore.experienceScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        experienceScore: Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      data-testid="input-experience-score"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="skills-score">Technical Skills & Knowledge (Max: 30)</Label>
                    <Input 
                      id="skills-score"
                      type="number" 
                      min="0"
                      max="30"
                      value={panelScore.skillsScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        skillsScore: Math.min(30, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      data-testid="input-skills-score"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="leadership-score">Leadership & Management (Max: 20)</Label>
                    <Input 
                      id="leadership-score"
                      type="number" 
                      min="0"
                      max="20"
                      value={panelScore.leadershipScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        leadershipScore: Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      data-testid="input-leadership-score"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="general-score">General Suitability (Max: 10)</Label>
                    <Input 
                      id="general-score"
                      type="number" 
                      min="0"
                      max="10"
                      value={panelScore.generalScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        generalScore: Math.min(10, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      data-testid="input-general-score"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="negative-score">Negative Marks</Label>
                    <Input 
                      id="negative-score"
                      type="number" 
                      min="0"
                      value={panelScore.negativeScore}
                      onChange={(e) => setPanelScore(prev => ({
                        ...prev,
                        negativeScore: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                      data-testid="input-negative-score"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="remarks">Panel Member's Remarks</Label>
                  <Textarea 
                    id="remarks"
                    placeholder="Interview comments and observations..."
                    rows={4}
                    value={panelScore.remarks}
                    onChange={(e) => setPanelScore(prev => ({
                      ...prev,
                      remarks: e.target.value
                    }))}
                    data-testid="textarea-remarks"
                  />
                </div>

                {/* Total Score Display */}
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-teal-900">Your Total Score:</span>
                    <span className="text-2xl font-bold text-teal-900" data-testid="text-total-score">
                      {calculateTotalScore()}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowScoringDialog(false);
                setSelectedCandidate(null);
                resetScoreForm();
              }}
              data-testid="button-cancel-scoring"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveScore}
              disabled={savePanelScoreMutation.isPending || !selectedCandidate}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              data-testid="button-save-score"
            >
              <Save className="w-4 h-4 mr-2" />
              {savePanelScoreMutation.isPending ? 'Saving...' : 'Save My Score'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
