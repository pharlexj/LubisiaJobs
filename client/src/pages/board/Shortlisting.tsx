import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getApplications } from "@/lib/queryFns";
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download,
  Eye,
  GraduationCap,
  Award,
  Briefcase,
  Star
} from 'lucide-react';
import { log } from 'console';

export default function BoardShortlisting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Set default filters to show all applications on load
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showShortlistDialog, setShowShortlistDialog] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [score, setScore] = useState('');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: [
      "/api/admin/applications",
      { status: statusFilter, jobId: jobFilter !== "all" ? jobFilter : undefined },
    ],
    queryFn: async ({ queryKey }) => {
      const [_key, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.jobId) searchParams.append('jobId', params.jobId);
      return await apiRequest('GET', `/api/admin/applications?${searchParams.toString()}`);
    },
    enabled: !!user && (user.role === 'board' || user.role === 'admin'),
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
        title: 'Application Updated',
        description: 'Application status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setSelectedApplication(null);
      setShowRemarks(false);
      setShowShortlistDialog(false);
      setRemarks('');
      setScore('');
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
        description: error.message || 'Failed to update application',
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = (applicationId: number, newStatus: string, additionalData: any = {}) => {
    updateApplicationMutation.mutate({
      id: applicationId,
      data: {
        status: newStatus,
        remarks: remarks || additionalData.remarks || '',
        ...additionalData
      }
    });
  };
  
    const filteredApplications = applications.filter((app: any) => {
    // Use correct field names and allow empty search to match all
    const matchesSearch =
      !searchTerm ||
      app.applicantFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantSurname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    // Use jobId (or jobIdRef) depending on backend response
    const matchesJob = jobFilter === 'all' || app.jobIdRef?.toString() === jobFilter || app.jobId?.toString() === jobFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesJob && matchesStatus;
  });

  const getQualificationMatch = (application: any) => {
    // Mock qualification matching logic - in real app this would check against job requirements
    const educationLevel = application.applicant?.educationRecords?.length || 0;
    const experience = application.applicant?.employmentHistory?.length || 0;
    
    if (educationLevel >= 3 && experience >= 2) return { percentage: 100, color: 'text-green-600' };
    if (educationLevel >= 2 && experience >= 1) return { percentage: 85, color: 'text-blue-600' };
    if (educationLevel >= 1) return { percentage: 70, color: 'text-yellow-600' };
    return { percentage: 50, color: 'text-red-600' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Shortlisting Panel</h1>
                <p className="text-gray-600">
                  Review applications and select candidates for interviews.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export List
                </Button>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Print Sheet
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search by applicant name or job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={jobFilter} onValueChange={setJobFilter}>
                      <SelectTrigger className="w-48">
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Applications for Review ({filteredApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Found</h3>
                    <p className="text-gray-600">
                      No applications match your current filters.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Applicant</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Qualification Match</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Documents</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((application: any) => {
                          const qualMatch = getQualificationMatch(application);
                          
                          return (
                            <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {application.applicantFirstName?.[0] || 'A'}
                                    {application.applicantSurname?.[0] || ''}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {application.applicantFirstName} {application.applicantSurname}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center">
                                      <GraduationCap className="w-3 h-3 mr-1" />
                                      {application.jobTitle}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${qualMatch.percentage >= 85 ? 'bg-green-500' : qualMatch.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${qualMatch.color}`}>
                                    {qualMatch.percentage}% Match
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Education, Experience verified
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  View PDF
                                </Button>
                              </td>
                              <td className="py-3 px-4">
                                <Input 
                                  type="number" 
                                  placeholder="0-100" 
                                  max="100"
                                  className="w-20 text-sm"
                                  value={score}
                                  onChange={(e) => setScore(e.target.value)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={getStatusColor(application.status)}>
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex space-x-2">
                                  {application.status === 'submitted' && (
                                    <Dialog open={showShortlistDialog} onOpenChange={setShowShortlistDialog}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          className="bg-secondary hover:bg-green-700"
                                          onClick={() => setSelectedApplication(application)}
                                          data-testid={`button-shortlist-${application.id}`}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Shortlist
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Shortlist Candidate</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Interview Date</Label>
                                            <Input type="date" className="mt-1" />
                                          </div>
                                          <div>
                                            <Label>Remarks</Label>
                                            <Textarea 
                                              placeholder="Add remarks about the candidate..."
                                              value={remarks}
                                              onChange={(e) => setRemarks(e.target.value)}
                                              className="mt-1"
                                            />
                                          </div>
                                          <div className="flex justify-end space-x-2">
                                            <Button variant="outline" onClick={() => setShowShortlistDialog(false)}>Cancel</Button>
                                            <Button 
                                              onClick={() => handleStatusUpdate(selectedApplication?.id, 'shortlisted', { interviewDate: new Date().toISOString().split('T')[0] })}
                                              disabled={updateApplicationMutation.isPending}
                                              data-testid="button-confirm-shortlist"
                                            >
                                              {updateApplicationMutation.isPending ? 'Processing...' : 'Shortlist'}
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  
                                  {application.status === 'shortlisted' && (
                                    <Button 
                                      asChild
                                      size="sm" 
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      data-testid={`button-score-${application.id}`}
                                    >
                                      <Link href="/board/scoring">
                                        <Star className="w-3 h-3 mr-1" />
                                        Score
                                      </Link>
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      setShowRemarks(true);
                                    }}
                                    data-testid={`button-view-profile-${application.id}`}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Profile
                                  </Button>
                                  
                                  {application.status !== 'rejected' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => handleStatusUpdate(application.id, 'rejected', { remarks: 'Did not meet requirements' })}
                                      data-testid={`button-reject-${application.id}`}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  )}
                                </div>
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

            {/* Profile View Dialog */}
            <Dialog open={showRemarks} onOpenChange={setShowRemarks}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Candidate Profile - {selectedApplication?.applicant?.firstName} {selectedApplication?.applicant?.surname}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Qualifications
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">Education</p>
                        <p className="text-gray-600">Bachelor's in Information Technology</p>
                        <p className="text-gray-500 text-xs">University of Nairobi, 2020</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">Professional Certification</p>
                        <p className="text-gray-600">CISCO Certified Network Associate</p>
                        <p className="text-gray-500 text-xs">Valid until 2025</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Experience
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">IT Support Specialist</p>
                        <p className="text-gray-600">TechCorp Ltd</p>
                        <p className="text-gray-500 text-xs">2021 - Present (3 years)</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">Junior Developer</p>
                        <p className="text-gray-600">StartupXYZ</p>
                        <p className="text-gray-500 text-xs">2020 - 2021 (1 year)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Assessment & Remarks</h4>
                  <Textarea 
                    placeholder="Add your assessment and remarks about this candidate..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setShowRemarks(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate(selectedApplication?.id, 'shortlisted')}
                    disabled={updateApplicationMutation.isPending}
                  >
                    Shortlist Candidate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
