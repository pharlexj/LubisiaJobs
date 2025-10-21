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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Award, X, Users, TrendingUp, CheckCircle, FileSpreadsheet, Download, Upload } from 'lucide-react';

export default function BoardHiring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState('');
  const [passmark, setPassmark] = useState(0);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showBulkAppointDialog, setShowBulkAppointDialog] = useState(false);
  const [appointExcelFile, setAppointExcelFile] = useState<File | null>(null);

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

  // Bulk Appointment via Excel
  const bulkAppointExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/board/bulk-appointments-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload Excel file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Bulk Appointment Complete',
        description: `Successfully appointed ${data.success} out of ${data.total} candidates.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setShowBulkAppointDialog(false);
      setAppointExcelFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process Excel file',
        variant: 'destructive',
      });
    },
  });

  const handleBulkAppointUpload = () => {
    if (!appointExcelFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to upload',
        variant: 'destructive',
      });
      return;
    }
    bulkAppointExcelMutation.mutate(appointExcelFile);
  };

  const handleDownloadAppointmentTemplate = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedJob) {
        queryParams.append('jobId', selectedJob);
      }
      queryParams.append('status', 'interviewed');
      
      const response = await fetch(`/api/board/download-appointment-template?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment-template-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

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
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-hiring-title">
                Selection of Suitable Applicants
              </h1>
              <Dialog open={showBulkAppointDialog} onOpenChange={setShowBulkAppointDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
                    data-testid="button-bulk-appoint"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Bulk Appointment
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* Selection Card */}
            <Card className="mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="job-select" className="text-sm font-medium">Select a Job here:</Label>
                      <Select value={selectedJob} onValueChange={(value) => {
                        setSelectedJob(value);
                        setShowResults(false);
                        setSelectedApplications([]);
                      }}>
                        <SelectTrigger id="job-select" data-testid="select-job-hiring" className="mt-1.5 w-full">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="passmark" className="text-sm font-medium">Passmark</Label>
                      <Input
                        id="passmark"
                        type="number"
                        value={passmark}
                        onChange={(e) => setPassmark(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="mt-1.5 w-full"
                        data-testid="input-passmark"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleGetList}
                        className="bg-gradient-to-r from-teal-600 to-teal-700 text-white w-full hover:from-teal-700 hover:to-teal-800"
                        data-testid="button-get-list"
                      >
                        Get List
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {showResults && (
              <>
                {/* Job Title and Stats */}
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-teal-700 mb-4 text-center break-words px-2" data-testid="text-selected-job">
                    {(jobs as any[]).find(j => j.id.toString() === selectedJob)?.refNumber} {(jobs as any[]).find(j => j.id.toString() === selectedJob)?.title}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                    <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="font-medium text-sm text-gray-700">Total</span>
                      <Badge variant="outline" className="bg-white text-blue-700 border-blue-300 text-lg font-bold" data-testid="badge-total">
                        {stats.total}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                      <span className="font-medium text-sm text-gray-700">Awarded</span>
                      <Badge variant="outline" className="bg-white text-green-700 border-green-300 text-lg font-bold" data-testid="badge-awarded">
                        {stats.awarded}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                      <span className="font-medium text-sm text-gray-700">Not Awarded</span>
                      <Badge variant="outline" className="bg-white text-red-700 border-red-300 text-lg font-bold" data-testid="badge-not-awarded">
                        {stats.notAwarded}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <span className="font-medium text-sm text-gray-700">Pending</span>
                      <Badge variant="outline" className="bg-white text-yellow-700 border-yellow-300 text-lg font-bold" data-testid="badge-pending">
                        {stats.pending}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Applications Table */}
                <Card>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {isLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : filteredApplications.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No candidates found meeting the passmark criteria</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
                          <table className="w-full min-w-[900px]" data-testid="table-hiring">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">#</th>
                                <th className="text-left py-3 px-2 sm:px-4">
                                  <Checkbox
                                    checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    data-testid="checkbox-select-all"
                                  />
                                </th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Name</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">ID Number</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Gender</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Age</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Ethnicity</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">County</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Ward</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Phone Number</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Total Marks</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredApplications.map((application: any, index: number) => (
                                <tr
                                  key={application.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                  data-testid={`row-hiring-${application.id}`}
                                >
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{index + 1}</td>
                                  <td className="py-3 px-2 sm:px-4">
                                    <Checkbox
                                      checked={selectedApplications.includes(application.id)}
                                      onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                                      data-testid={`checkbox-select-${application.id}`}
                                    />
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.fullName}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.nationalId}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.gender}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{calculateAge(application.dateOfBirth)}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.ethnicityName || 'N/A'}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.countyName || 'N/A'}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.wardName || 'N/A'}</td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{application.phoneNumber}</td>
                                  <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">{application.interviewScore || 0}</td>
                                  <td className="py-3 px-2 sm:px-4">
                                    {application.status === 'hired' && (
                                      <Badge className="bg-green-500 text-white text-xs" data-testid={`status-hired-${application.id}`}>
                                        AwardedJob
                                      </Badge>
                                    )}
                                    {application.status === 'rejected' && (
                                      <Badge className="bg-red-500 text-white text-xs" data-testid={`status-rejected-${application.id}`}>
                                        NotAwardedJob
                                      </Badge>
                                    )}
                                    {application.status === 'interviewed' && (
                                      <Badge variant="secondary" className="text-xs" data-testid={`status-pending-${application.id}`}>
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
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                          <Button
                            onClick={() => awardJobMutation.mutate()}
                            disabled={selectedApplications.length === 0 || awardJobMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            data-testid="button-award-job"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Award Job {selectedApplications.length > 0 && `(${selectedApplications.length})`}
                          </Button>
                          <Button
                            onClick={() => notAwardJobMutation.mutate()}
                            disabled={selectedApplications.length === 0 || notAwardJobMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            data-testid="button-not-award-job"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Not Award Job {selectedApplications.length > 0 && `(${selectedApplications.length})`}
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

      {/* Bulk Appointment via Excel Dialog */}
      <Dialog open={showBulkAppointDialog} onOpenChange={setShowBulkAppointDialog}>
        <DialogContent data-testid="dialog-bulk-appoint">
          <DialogHeader>
            <DialogTitle>Bulk Appointments via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="font-medium text-teal-900 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-teal-800">
                <li>Download the Excel template with interviewed candidates</li>
                <li>Fill in InterviewScore and Remarks columns</li>
                <li>Save the file and upload it to appoint candidates</li>
              </ol>
            </div>
            
            <Button 
              onClick={handleDownloadAppointmentTemplate}
              variant="outline"
              className="w-full"
              data-testid="button-download-appoint-template-in-dialog"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template with Interviewed Candidates
            </Button>
            
            <div>
              <Label htmlFor="appoint-excel-file">Upload Completed Excel File</Label>
              <Input 
                id="appoint-excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setAppointExcelFile(e.target.files?.[0] || null)}
                data-testid="input-appoint-excel-file"
              />
              {appointExcelFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {appointExcelFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBulkAppointDialog(false);
                setAppointExcelFile(null);
              }}
              data-testid="button-cancel-bulk-appoint"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAppointUpload}
              disabled={bulkAppointExcelMutation.isPending || !appointExcelFile}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              data-testid="button-upload-appoint-excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {bulkAppointExcelMutation.isPending ? 'Uploading...' : 'Upload & Appoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
