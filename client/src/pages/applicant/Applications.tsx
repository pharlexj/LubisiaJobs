import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { formatJobText } from "@/lib/date-utils";
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Award
} from 'lucide-react';

export default function ApplicantApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applicant/applications'],
    enabled: !!user && user.role === 'applicant',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'interview_scheduled':
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'interview_scheduled':
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'hired':
        return <Award className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  const { data: config } = usePublicConfig();
  const filteredApplications = (applications as any).filter((app:any) => {
    const matchesSearch = app.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job?.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = (applications as any).reduce((acc:any, app:any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex">
          <Sidebar userRole="applicant" />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
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
        <Sidebar userRole="applicant" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
              <p className="text-gray-600">
                Track the status of your job applications and manage your submissions.
              </p>
            </div>

            {/* Application Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {(applications as any).length}
                  </div>
                  <div className="text-gray-600">Total Applications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {statusCounts.shortlisted || statusCounts.interview_scheduled || 0}
                  </div>
                  <div className="text-gray-600">Shortlisted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {statusCounts.interviewed || 0}
                  </div>
                  <div className="text-gray-600">Interviewed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {statusCounts.hired || 0}
                  </div>
                  <div className="text-gray-600">Hired</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="outline"
                      onClick={() => toast({ title: 'Advanced Filters', description: 'More filtering options coming soon!' })}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {(applications as any).length === 0 ? 'No Applications Yet' : 'No Applications Found'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {(applications as any).length === 0 
                      ? 'Start browsing and applying for jobs to see them here.'
                      : 'No applications match your current filters. Try adjusting your search criteria.'}
                  </p>
                  {(applications as any).length === 0 ? (
                    <Button onClick={() => setLocation('/jobs')}>Browse Jobs</Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application:any) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.job?.title}
                            </h3>
                            <Badge className={getStatusColor(application.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(application.status)}
                                {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                              </div>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Department:</span>
                              <br />
                              {application.job?.department?.name}
                            </div>
                            <div>
                              <span className="font-medium">Job Group:</span>
                              <br />
                              {application?.job?.jobGroupName}
                            </div>
                            <div>
                              <span className="font-medium">Applied:</span>
                              <br />
                              {application.submittedOn
                                ? new Date(application.submittedOn).toLocaleDateString()
                                : 'Draft'}
                            </div>
                          </div>
                          
                          {application.status==="shortlisted" && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 text-yellow-800">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                  Interview scheduled for {new Date(application.interviewDate).toLocaleDateString()} - {application.interviewTime} at {application.interviewVenue}
                                </span>
                              </div>
                            </div>
                          )}
                          {application.status==="hired" && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-800">
                                <Award className="w-4 h-4" />
                                <span className="font-medium">
                                  Congratulations — you were selected for this position!
                                </span>
                              </div>
                            </div>
                          )}
                          {application.status==="rejected" && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-red-800">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">
                                  <span>
                                    Although you were not selected for this opportunity, we encourage you to apply for future openings that match your skills and experience.
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}

                          {application.status==="shortlisted" && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">                              
                                {application.remarks && <p className="text-blue-800 text-sm"> <span className="font-medium">Remarks:</span> {application.remarks}</p>}                              
                            </div>
                          )}
                        </div>

                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedApplication(application)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className='max-w-4xl max-h-[85vh] overflow-hidden flex flex-col'>
                              <DialogHeader className="flex-shrink-0">
                                <DialogTitle>{selectedApplication?.job?.title}</DialogTitle>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="font-medium">Status:</span>
                                    <Badge className={`ml-2 ${getStatusColor(selectedApplication?.status)}`}>
                                      {selectedApplication?.status?.charAt(0).toUpperCase() + selectedApplication?.status?.slice(1)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="font-medium">Application Date:</span>
                                    <span className="ml-2">
                                      {selectedApplication?.submittedOn 
                                        ? new Date(selectedApplication.submittedOn).toLocaleDateString()
                                        : 'Not submitted'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="font-medium">Job Description:</span>
                                <div
                                  className="text-gray-600"
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      formatJobText(selectedApplication?.job?.description) ||
                                      "Detailed job description will be provided upon application.",
                                  }}
                                />                                  
                                </div>
                                {selectedApplication?.status==="hired" && (
                                  <div>
                                    <span className="font-medium">Feedback:</span>
                                    <p className="mt-1 text-gray-600">You were selected for this position!</p>
                                  </div>
                                )}
                                {selectedApplication?.status==="shortlisted" && (
                                  <div>
                                    <span className="font-medium">Feedback:</span>
                                    <p className="mt-1 text-gray-600">Interview scheduled for {new Date(selectedApplication.interviewDate).toLocaleDateString()} - {selectedApplication.interviewTime} at {selectedApplication.interviewVenue}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
