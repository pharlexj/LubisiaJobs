import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Mail, 
  Phone, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Pin
} from 'lucide-react';

export default function AdminApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const { data: applications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin',
  });  

  const { data: jobs = [] } = useQuery<any[]>({
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      case 'interviewed':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'hired':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  const filteredApplications = applications.filter((app: any) => {
    const matchesSearch = 
      app.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJob = jobFilter === 'all' || app.job.id?.toString() === jobFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesJob && matchesStatus;
  });
 
  const statusCounts = applications.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex">
          <Sidebar userRole="admin" />
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
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Management</h1>
              <p className="text-gray-600">
                Review and manage job applications from candidates.
              </p>
            </div>

            {/* Application Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {applications.length}
                  </div>
                  <div className="text-gray-600">Total Applications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {statusCounts.submitted || 0}
                  </div>
                  <div className="text-gray-600">Submitted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {statusCounts.shortlisted || 0}
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
                        {jobs.map((job: any) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
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

                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Applications ({filteredApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {applications.length === 0 ? 'No Applications Yet' : 'No Applications Found'}
                    </h3>
                    <p className="text-gray-600">
                      {applications.length === 0 
                        ? 'Applications will appear here once candidates start applying.'
                        : 'No applications match your current filters.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Applicant</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Job Applied</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Applied Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((application: any) => (
                          <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                                  {application.firstName?.[0] || 'A'}
                                  {application.surname?.[0] || ''}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {application.fullName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {application.phoneNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{application.job.title}</div>
                              <div className="text-sm text-gray-600">
                                {application?.job?.department.name}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {application.submittedOn
                                ? new Date(application.submittedOn).toLocaleDateString()
                                : 'Draft'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(application.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(application.status)}
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </div>
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setSelectedApplication(application)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Application Details - {selectedApplication?.firstName} {selectedApplication?.surname}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-semibold mb-3">Applicant Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span>{selectedApplication?.firstName} {selectedApplication?.surname}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{selectedApplication?.phoneNumber}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Pin className="w-4 h-4 text-gray-400" />
                                            <span>{selectedApplication?.constituency}, {selectedApplication?.ward}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{selectedApplication?.email}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-3">Job Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <p><strong>Position:</strong> {selectedApplication?.job.title}</p>
                                          <p><strong>Department:</strong> {selectedApplication?.job?.department.name}</p>
                                          <p><strong>Job Group:</strong> {selectedApplication?.job.jobGroupName}</p>
                                          <p><strong>Applied Date:</strong> {selectedApplication?.submittedOn ? new Date(selectedApplication.submittedOn).toLocaleDateString() : 'Draft'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {selectedApplication?.remarks && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Remarks</h4>
                                        <p className="text-sm text-gray-600">{selectedApplication.remarks}</p>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                                
                                <Button variant="ghost" size="sm">
                                  <Mail className="w-4 h-4" />
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
          </div>
        </main>
      </div>
    </div>
  );
}
