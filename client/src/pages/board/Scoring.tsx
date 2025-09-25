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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  Star,
  Trophy,
  Users,
  FileText,
  GraduationCap,
  Award,
  Briefcase,
  Eye,
  Save,
  Calculator,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface PanelScore {
  scoreId: number;
  applicationId: number;
  panelId: number;
  academicScore: number;
  experienceScore: number;
  skillsScore: number;
  leadershipScore: number;
  generalScore: number;
  negativeScore: number;
  remarks: string;
  scoredOn: string;
}

interface ScoringFormData {
  academicScore: number;
  experienceScore: number;
  skillsScore: number;
  leadershipScore: number;
  generalScore: number;
  negativeScore: number;
  remarks: string;
}

export default function BoardScoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showScoring, setShowScoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedJobFilter, setSelectedJobFilter] = useState('all');
  const [scoringData, setScoringData] = useState<ScoringFormData>({
    academicScore: 0,
    experienceScore: 0,
    skillsScore: 0,
    leadershipScore: 0,
    generalScore: 0,
    negativeScore: 0,
    remarks: ''
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/board/applications', { status: 'shortlisted' }],
    enabled: !!user && user.role === 'board',
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  // Get current user's score for selected application
  const { data: myScore } = useQuery({
    queryKey: ['/api/board/my-score', selectedApplication?.id],
    enabled: !!selectedApplication?.id,
    refetchOnWindowFocus: false,
  });

  // Get all panel scores for selected application
  const { data: panelScoresData } = useQuery({
    queryKey: ['/api/board/panel-scores', selectedApplication?.id],
    enabled: !!selectedApplication?.id,
    refetchOnWindowFocus: false,
  });

  const scoringMutation = useMutation({
    mutationFn: async (data: ScoringFormData & { applicationId: number }) => {
      return await apiRequest('POST', '/api/board/panel-scores', data);
    },
    onSuccess: (response) => {
      toast({
        title: 'Score Saved',
        description: 'Your scoring has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/my-score'] });
      queryClient.invalidateQueries({ queryKey: ['/api/board/panel-scores'] });
      setShowScoring(false);
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
        description: error.message || 'Failed to save scoring',
        variant: 'destructive',
      });
    },
  });

  // Load user's existing score when application is selected
  useEffect(() => {
    if ((myScore as any)?.score) {
      const score = (myScore as any).score;
      setScoringData({
        academicScore: score.academicScore || 0,
        experienceScore: score.experienceScore || 0,
        skillsScore: score.skillsScore || 0,
        leadershipScore: score.leadershipScore || 0,
        generalScore: score.generalScore || 0,
        negativeScore: score.negativeScore || 0,
        remarks: score.remarks || ''
      });
    } else if (selectedApplication) {
      // Reset form for new scoring
      setScoringData({
        academicScore: 0,
        experienceScore: 0,
        skillsScore: 0,
        leadershipScore: 0,
        generalScore: 0,
        negativeScore: 0,
        remarks: ''
      });
    }
  }, [myScore, selectedApplication]);

  const handleScoreSubmit = () => {
    if (!selectedApplication) return;
    
    scoringMutation.mutate({
      ...scoringData,
      applicationId: selectedApplication.id
    });
  };

  const calculateTotal = () => {
    return scoringData.academicScore + 
           scoringData.experienceScore + 
           scoringData.skillsScore + 
           scoringData.leadershipScore + 
           scoringData.generalScore - 
           scoringData.negativeScore;
  };

  const getScoreColor = (score: number, maxScore: number = 20) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const filteredApplications = (applications as any[]).filter((app: any) => {
    if (selectedJobFilter === 'all') return true;
    return app.jobId?.toString() === selectedJobFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Collaborative Scoring
              </h1>
              <p className="text-gray-600">
                Score candidates independently. The system calculates average scores across all board members.
              </p>
            </div>

            {/* Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="job-filter">Filter by Job</Label>
                <Select 
                  value={selectedJobFilter} 
                  onValueChange={setSelectedJobFilter}
                >
                  <SelectTrigger className="w-64" data-testid="select-job-filter">
                    <SelectValue placeholder="Select job..." />
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
            </div>

            {/* Applications Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApplications.map((application: any) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {application.applicant?.firstName} {application.applicant?.surname}
                        </CardTitle>
                        <p className="text-sm text-gray-600" data-testid={`text-job-${application.id}`}>
                          {application.job?.title}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Shortlisted
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Average Scores Display */}
                      {(panelScoresData as any)?.averageScores?.totalPanelMembers > 0 && selectedApplication?.id === application.id && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">Average Scores</span>
                            <Badge variant="outline" className="text-xs">
                              {(panelScoresData as any).averageScores.totalPanelMembers} scorers
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Academic: {(panelScoresData as any).averageScores.avgAcademicScore?.toFixed(1) || '0.0'}</div>
                            <div>Experience: {(panelScoresData as any).averageScores.avgExperienceScore?.toFixed(1) || '0.0'}</div>
                            <div>Skills: {(panelScoresData as any).averageScores.avgSkillsScore?.toFixed(1) || '0.0'}</div>
                            <div>Leadership: {(panelScoresData as any).averageScores.avgLeadershipScore?.toFixed(1) || '0.0'}</div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="font-semibold">
                              Total Average: {(
                                ((panelScoresData as any).averageScores.avgAcademicScore || 0) +
                                ((panelScoresData as any).averageScores.avgExperienceScore || 0) +
                                ((panelScoresData as any).averageScores.avgSkillsScore || 0) +
                                ((panelScoresData as any).averageScores.avgLeadershipScore || 0) +
                                ((panelScoresData as any).averageScores.avgGeneralScore || 0)
                              ).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetails(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          data-testid={`button-view-details-${application.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowScoring(true);
                          }}
                          size="sm"
                          className="flex-1"
                          data-testid={`button-score-${application.id}`}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {myScore?.score ? 'Update Score' : 'Score'}
                        </Button>
                      </div>

                      {/* User's Current Score */}
                      {(myScore as any)?.score && selectedApplication?.id === application.id && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <div className="font-medium">Your Score: {
                            ((myScore as any).score.academicScore || 0) + 
                            ((myScore as any).score.experienceScore || 0) + 
                            ((myScore as any).score.skillsScore || 0) + 
                            ((myScore as any).score.leadershipScore || 0) + 
                            ((myScore as any).score.generalScore || 0) - 
                            ((myScore as any).score.negativeScore || 0)
                          } points</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No applications to score
                  </h3>
                  <p className="text-gray-600">
                    There are no shortlisted applications available for scoring at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Scoring Dialog */}
      <Dialog open={showScoring} onOpenChange={setShowScoring}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Score Candidate: {selectedApplication?.applicant?.firstName} {selectedApplication?.applicant?.surname}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Scoring Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Academic Score: Rate qualification relevance (0-20 points)</li>
                <li>• Experience Score: Rate work experience relevance (0-20 points)</li>
                <li>• Skills Score: Rate technical and soft skills (0-20 points)</li>
                <li>• Leadership Score: Rate leadership potential (0-20 points)</li>
                <li>• General Score: Overall impression (0-20 points)</li>
                <li>• Negative Score: Deduct points for concerns (0-10 points)</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academic-score">Academic Score (0-20)</Label>
                <Input
                  id="academic-score"
                  type="number"
                  min="0"
                  max="20"
                  value={scoringData.academicScore}
                  onChange={(e) => setScoringData({ ...scoringData, academicScore: Number(e.target.value) })}
                  data-testid="input-academic-score"
                />
              </div>

              <div>
                <Label htmlFor="experience-score">Experience Score (0-20)</Label>
                <Input
                  id="experience-score"
                  type="number"
                  min="0"
                  max="20"
                  value={scoringData.experienceScore}
                  onChange={(e) => setScoringData({ ...scoringData, experienceScore: Number(e.target.value) })}
                  data-testid="input-experience-score"
                />
              </div>

              <div>
                <Label htmlFor="skills-score">Skills Score (0-20)</Label>
                <Input
                  id="skills-score"
                  type="number"
                  min="0"
                  max="20"
                  value={scoringData.skillsScore}
                  onChange={(e) => setScoringData({ ...scoringData, skillsScore: Number(e.target.value) })}
                  data-testid="input-skills-score"
                />
              </div>

              <div>
                <Label htmlFor="leadership-score">Leadership Score (0-20)</Label>
                <Input
                  id="leadership-score"
                  type="number"
                  min="0"
                  max="20"
                  value={scoringData.leadershipScore}
                  onChange={(e) => setScoringData({ ...scoringData, leadershipScore: Number(e.target.value) })}
                  data-testid="input-leadership-score"
                />
              </div>

              <div>
                <Label htmlFor="general-score">General Score (0-20)</Label>
                <Input
                  id="general-score"
                  type="number"
                  min="0"
                  max="20"
                  value={scoringData.generalScore}
                  onChange={(e) => setScoringData({ ...scoringData, generalScore: Number(e.target.value) })}
                  data-testid="input-general-score"
                />
              </div>

              <div>
                <Label htmlFor="negative-score">Negative Score (0-10)</Label>
                <Input
                  id="negative-score"
                  type="number"
                  min="0"
                  max="10"
                  value={scoringData.negativeScore}
                  onChange={(e) => setScoringData({ ...scoringData, negativeScore: Number(e.target.value) })}
                  data-testid="input-negative-score"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add your comments about this candidate..."
                value={scoringData.remarks}
                onChange={(e) => setScoringData({ ...scoringData, remarks: e.target.value })}
                rows={4}
                data-testid="textarea-remarks"
              />
            </div>

            {/* Total Score Display */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-900">Total Score:</span>
                <span className={`text-2xl font-bold px-3 py-1 rounded ${getScoreColor(calculateTotal(), 90)}`}>
                  {calculateTotal()} / 90
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleScoreSubmit}
                disabled={scoringMutation.isPending}
                className="flex-1"
                data-testid="button-save-score"
              >
                <Save className="h-4 w-4 mr-2" />
                {scoringMutation.isPending ? 'Saving...' : 'Save Score'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScoring(false)}
                data-testid="button-cancel-scoring"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Candidate Details: {selectedApplication?.applicant?.firstName} {selectedApplication?.applicant?.surname}
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Full Name</Label>
                        <p>{selectedApplication.applicant?.firstName} {selectedApplication.applicant?.surname}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Email</Label>
                        <p>{selectedApplication.applicant?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Phone Number</Label>
                        <p>{selectedApplication.applicant?.phoneNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Date of Birth</Label>
                        <p>{selectedApplication.applicant?.dateOfBirth || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.applicant?.educationRecords?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedApplication.applicant.educationRecords.map((edu: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold">{edu.courseName}</h4>
                            <p className="text-gray-600">{edu.institution}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">{edu.yearFrom} - {edu.yearCompleted}</span>
                              {edu.grade && <Badge variant="outline">{edu.grade}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No education records available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Employment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.applicant?.employmentHistory?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedApplication.applicant.employmentHistory.map((emp: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold">{emp.position}</h4>
                            <p className="text-gray-600">{emp.employer}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">
                                {emp.startDate} - {emp.isCurrent ? 'Present' : emp.endDate}
                              </span>
                              {emp.isCurrent && <Badge>Current</Badge>}
                            </div>
                            {emp.duties && (
                              <p className="text-sm text-gray-600 mt-2">{emp.duties}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No employment history available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.applicant?.documents?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplication.applicant.documents.map((doc: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold capitalize">{doc.type}</h4>
                            <p className="text-sm text-gray-600">{doc.fileName}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.open(doc.filePath, '_blank')}
                              data-testid={`button-view-document-${index}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No documents available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}