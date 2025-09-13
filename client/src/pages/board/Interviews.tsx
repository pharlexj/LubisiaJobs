import { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
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
  Save
} from 'lucide-react';

interface InterviewScore {
  technicalKnowledge: number;
  communicationSkills: number;
  problemSolving: number;
  leadershipPotential: number;
  comments: string;
}

export default function BoardInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState('all');
  const [showScoring, setShowScoring] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [interviewScore, setInterviewScore] = useState<InterviewScore>({
    technicalKnowledge: 0,
    communicationSkills: 0,
    problemSolving: 0,
    leadershipPotential: 0,
    comments: ''
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/board/applications', { status: 'shortlisted' }],
    enabled: !!user && user.role === 'board',
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/board/applications/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Interview Score Saved',
        description: 'Interview score and comments have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setShowScoring(false);
      resetScoreForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to save interview score',
        variant: 'destructive',
      });
    },
  });

  const resetScoreForm = () => {
    setInterviewScore({
      technicalKnowledge: 0,
      communicationSkills: 0,
      problemSolving: 0,
      leadershipPotential: 0,
      comments: ''
    });
    setSelectedCandidate(null);
  };

  const calculateTotalScore = () => {
    return interviewScore.technicalKnowledge + 
           interviewScore.communicationSkills + 
           interviewScore.problemSolving + 
           interviewScore.leadershipPotential;
  };

  const handleSaveScore = () => {
    const totalScore = calculateTotalScore();
    updateApplicationMutation.mutate({
      id: selectedCandidate.id,
      data: {
        status: 'interviewed',
        interviewScore: totalScore,
        remarks: interviewScore.comments
      }
    });
  };

  const groupedInterviews = (applications as any).reduce((groups: any, app:any) => {
    const jobTitle = app.job?.title || 'Unknown Position';
    if (!groups[jobTitle]) {
      groups[jobTitle] = [];
    }
    groups[jobTitle].push(app);
    return groups;
  }, {});

  const upcomingInterviews = [
    {
      id: 1,
      jobTitle: 'ICT Officer',
      date: '2024-12-20',
      time: '09:00 AM',
      candidates: 8,
      venue: 'Conference Room A'
    },
    {
      id: 2,
      jobTitle: 'Administrative Officer',
      date: '2024-12-22',
      time: '10:00 AM',
      candidates: 5,
      venue: 'Conference Room B'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex">
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
      
      <div className="flex">
        <Sidebar userRole="board" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Management</h1>
                <p className="text-gray-600">
                  Schedule interviews, conduct assessments, and score candidates.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Interview</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Job Position</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job position" />
                          </SelectTrigger>
                          <SelectContent>
                            {(jobs as any).map((job:any) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Interview Date</Label>
                          <Input type="date" />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input type="time" />
                        </div>
                      </div>
                      <div>
                        <Label>Venue</Label>
                        <Input placeholder="e.g., Conference Room A" />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Schedule Interview</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Scheduled Interviews */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Upcoming Interviews</CardTitle>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Calendar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{interview.jobTitle}</h4>
                          <Badge variant="outline">
                            {interview.candidates} candidates
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(interview.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {interview.time}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">Venue: {interview.venue}</p>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            View List
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="w-3 h-3 mr-1" />
                            Print Sheets
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Scoring */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Scoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Interview Session</Label>
                      <Select value={selectedSession} onValueChange={setSelectedSession}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interview session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {upcomingInterviews.map((interview) => (
                            <SelectItem key={interview.id} value={interview.id.toString()}>
                              {interview.jobTitle} - {new Date(interview.date).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scoring Parameters */}
                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Scoring Parameters</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Technical Knowledge</span>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              placeholder="0-30" 
                              max="30"
                              className="w-16 text-sm"
                              value={interviewScore.technicalKnowledge}
                              onChange={(e) => setInterviewScore(prev => ({
                                ...prev,
                                technicalKnowledge: parseInt(e.target.value) || 0
                              }))}
                            />
                            <span className="text-xs text-gray-500">/30</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Communication Skills</span>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              placeholder="0-25" 
                              max="25"
                              className="w-16 text-sm"
                              value={interviewScore.communicationSkills}
                              onChange={(e) => setInterviewScore(prev => ({
                                ...prev,
                                communicationSkills: parseInt(e.target.value) || 0
                              }))}
                            />
                            <span className="text-xs text-gray-500">/25</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Problem Solving</span>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              placeholder="0-25" 
                              max="25"
                              className="w-16 text-sm"
                              value={interviewScore.problemSolving}
                              onChange={(e) => setInterviewScore(prev => ({
                                ...prev,
                                problemSolving: parseInt(e.target.value) || 0
                              }))}
                            />
                            <span className="text-xs text-gray-500">/25</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Leadership Potential</span>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              placeholder="0-20" 
                              max="20"
                              className="w-16 text-sm"
                              value={interviewScore.leadershipPotential}
                              onChange={(e) => setInterviewScore(prev => ({
                                ...prev,
                                leadershipPotential: parseInt(e.target.value) || 0
                              }))}
                            />
                            <span className="text-xs text-gray-500">/20</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900">Total Score:</span>
                          <span className="text-lg font-bold text-primary">
                            {calculateTotalScore()}/100
                          </span>
                        </div>
                        
                        <div>
                          <Label>Interview Comments</Label>
                          <Textarea 
                            placeholder="Interview comments and remarks..."
                            rows={3}
                            value={interviewScore.comments}
                            onChange={(e) => setInterviewScore(prev => ({
                              ...prev,
                              comments: e.target.value
                            }))}
                          />
                        </div>
                        
                        <Button 
                          className="w-full mt-3" 
                          onClick={handleSaveScore}
                          disabled={updateApplicationMutation.isPending || !selectedCandidate}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateApplicationMutation.isPending ? 'Saving...' : 'Save Score & Comments'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidates List */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Interview Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                {(applications as any).length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Shortlisted</h3>
                    <p className="text-gray-600">Shortlisted candidates will appear here for interview scheduling.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Candidate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Interview Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(applications as any).map((application:any) => (
                          <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {application.applicant?.firstName?.[0] || 'A'}
                                  {application.applicant?.surname?.[0] || ''}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {application.applicant?.firstName} {application.applicant?.surname}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {application.applicant?.phoneNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{application.job?.title}</div>
                              <div className="text-sm text-gray-600">Job Group {application.job?.designation?.jobGroup}</div>
                            </td>
                            <td className="py-3 px-4">
                              {application.interviewDate ? (
                                <div className="flex items-center text-sm">
                                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                  {new Date(application.interviewDate).toLocaleDateString()}
                                </div>
                              ) : (
                                <Badge variant="secondary">Not Scheduled</Badge>
                              )}
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
                              <Badge className={
                                application.status === 'interviewed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {application.status === 'interviewed' ? 'Completed' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCandidate(application);
                                    setShowScoring(true);
                                  }}
                                >
                                  <Award className="w-3 h-3 mr-1" />
                                  Score
                                </Button>
                                <Button size="sm" variant="outline">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Profile
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Results Summary */}
            {(applications as any).some((app:any) => app.interviewScore) && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Interview Results Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {Math.round(
                          (applications as any)
                            .filter((app:any) => app.interviewScore)
                            .reduce((sum:any, app:any) => sum + (app.interviewScore || 0), 0) / 
                          (applications as any).filter((app:any) => app.interviewScore).length || 0
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Average Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary mb-1">
                        {Math.max(...(applications as any).map((app:any) => app.interviewScore || 0))}
                      </div>
                      <p className="text-sm text-gray-600">Highest Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(applications as any).filter((app:any) => app.interviewScore).length}
                      </div>
                      <p className="text-sm text-gray-600">Interviewed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
