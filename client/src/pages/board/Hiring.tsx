import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Award, X, Users, TrendingUp, CheckCircle } from 'lucide-react';

export default function BoardHiring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState('');
  const [passmark, setPassmark] = useState(0);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/board/applications', { status: 'interviewed', jobId: selectedJob || undefined }],
    enabled: !!user && user.role === 'board' && showResults && !!selectedJob,
  });

  // Filter applications by passmark
  const filteredApplications = useMemo(() => {
    if (!showResults) return [];
    return (applications as any[]).filter(app => {
      const score = app.interviewScore || 0;
      return score >= passmark;
    });
  }, [applications, passmark, showResults]);

  // Calculate statistics
  const stats = useMemo(() => {
    const awarded = filteredApplications.filter(app => app.status === 'hired').length;
    const notAwarded = filteredApplications.filter(app => app.status === 'rejected').length;
    const pending = filteredApplications.filter(app => app.status === 'interviewed').length;
    
    return {
      total: filteredApplications.length,
      awarded,
      notAwarded,
      pending
    };
  }, [filteredApplications]);

  const handleGetList = () => {
    if (!selectedJob) {
      toast({
        title: 'No Job Selected',
        description: 'Please select a job first',
        variant: 'destructive',
      });
      return;
    }
    setShowResults(true);
    setSelectedApplications([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(filteredApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (applicationId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, applicationId]);
    } else {
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
    }
  };

  // Award job mutation
  const awardJobMutation = useMutation({
    mutationFn: async () => {
      if (selectedApplications.length === 0) {
        throw new Error('No applications selected');
      }
      return await apiRequest('POST', '/api/board/applications/bulk-update', {
        applicationIds: selectedApplications,
        updates: {
          status: 'hired',
          hiredAt: new Date()
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Jobs Awarded',
        description: `Successfully awarded ${selectedApplications.length} candidate(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setSelectedApplications([]);
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
        description: error.message || 'Failed to award jobs',
        variant: 'destructive',
      });
    },
  });

  // Not award job mutation
  const notAwardJobMutation = useMutation({
    mutationFn: async () => {
      if (selectedApplications.length === 0) {
        throw new Error('No applications selected');
      }
      return await apiRequest('POST', '/api/board/applications/bulk-update', {
        applicationIds: selectedApplications,
        updates: {
          status: 'rejected'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Jobs Not Awarded',
        description: `Successfully marked ${selectedApplications.length} candidate(s) as not awarded`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setSelectedApplications([]);
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
        description: error.message || 'Failed to process request',
        variant: 'destructive',
      });
    },
  });

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'applicant'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-hiring-title">
                Selection of Suitable Applicants
              </h1>
            </div>

            {/* Selection Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="job-select">Select a Job here:</Label>
                    <Select value={selectedJob} onValueChange={(value) => {
                      setSelectedJob(value);
                      setShowResults(false);
                      setSelectedApplications([]);
                    }}>
                      <SelectTrigger id="job-select" data-testid="select-job-hiring">
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                      <SelectContent>
                        {(jobs as any[]).map((job: any) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.refNumber} = {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="passmark">Passmark</Label>
                    <Input
                      id="passmark"
                      type="number"
                      value={passmark}
                      onChange={(e) => setPassmark(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      max="100"
                      data-testid="input-passmark"
                    />
                  </div>

                  <Button
                    onClick={handleGetList}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
                    data-testid="button-get-list"
                  >
                    Get List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {showResults && (
              <>
                {/* Job Title and Stats */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-teal-700 mb-4 text-center" data-testid="text-selected-job">
                    {(jobs as any[]).find(j => j.id.toString() === selectedJob)?.refNumber} {(jobs as any[]).find(j => j.id.toString() === selectedJob)?.title}
                  </h2>
                  <div className="flex justify-center items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total:</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200" data-testid="badge-total">
                        {stats.total}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Awarded:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid="badge-awarded">
                        {stats.awarded}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Not Awarded:</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" data-testid="badge-not-awarded">
                        {stats.notAwarded}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Pending:</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200" data-testid="badge-pending">
                        {stats.pending}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Applications Table */}
                <Card>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : filteredApplications.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No candidates found meeting the passmark criteria</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full" data-testid="table-hiring">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4">#</th>
                                <th className="text-left py-3 px-4">
                                  <Checkbox
                                    checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    data-testid="checkbox-select-all"
                                  />
                                </th>
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">ID Number</th>
                                <th className="text-left py-3 px-4">Gender</th>
                                <th className="text-left py-3 px-4">Age</th>
                                <th className="text-left py-3 px-4">Ethnicity</th>
                                <th className="text-left py-3 px-4">County</th>
                                <th className="text-left py-3 px-4">Ward</th>
                                <th className="text-left py-3 px-4">Phone Number</th>
                                <th className="text-left py-3 px-4">Total Marks</th>
                                <th className="text-left py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredApplications.map((application: any, index: number) => (
                                <tr
                                  key={application.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                  data-testid={`row-hiring-${application.id}`}
                                >
                                  <td className="py-3 px-4">{index + 1}</td>
                                  <td className="py-3 px-4">
                                    <Checkbox
                                      checked={selectedApplications.includes(application.id)}
                                      onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                                      data-testid={`checkbox-select-${application.id}`}
                                    />
                                  </td>
                                  <td className="py-3 px-4">{application.fullName}</td>
                                  <td className="py-3 px-4">{application.nationalId}</td>
                                  <td className="py-3 px-4">{application.gender}</td>
                                  <td className="py-3 px-4">{calculateAge(application.dateOfBirth)}</td>
                                  <td className="py-3 px-4">{application.ethnicityName || 'N/A'}</td>
                                  <td className="py-3 px-4">{application.countyName || 'N/A'}</td>
                                  <td className="py-3 px-4">{application.wardName || 'N/A'}</td>
                                  <td className="py-3 px-4">{application.phoneNumber}</td>
                                  <td className="py-3 px-4 font-semibold">{application.interviewScore || 0}</td>
                                  <td className="py-3 px-4">
                                    {application.status === 'hired' && (
                                      <Badge className="bg-green-500 text-white" data-testid={`status-hired-${application.id}`}>
                                        AwardedJob
                                      </Badge>
                                    )}
                                    {application.status === 'rejected' && (
                                      <Badge className="bg-red-500 text-white" data-testid={`status-rejected-${application.id}`}>
                                        NotAwardedJob
                                      </Badge>
                                    )}
                                    {application.status === 'interviewed' && (
                                      <Badge variant="secondary" data-testid={`status-pending-${application.id}`}>
                                        Pending
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                          <Button
                            onClick={() => awardJobMutation.mutate()}
                            disabled={selectedApplications.length === 0 || awardJobMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="button-award-job"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Award Job
                          </Button>
                          <Button
                            onClick={() => notAwardJobMutation.mutate()}
                            disabled={selectedApplications.length === 0 || notAwardJobMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            data-testid="button-not-award-job"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Not Award Job
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
