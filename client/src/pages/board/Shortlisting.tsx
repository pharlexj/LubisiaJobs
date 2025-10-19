import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function BoardShortlisting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [kcseMeanGrade, setKcseMeanGrade] = useState('');
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set());
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [showFiltered, setShowFiltered] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['/api/board/applications'],
    enabled: !!user && user.role === 'board',
  });

  const { data: constituencies = [] } = useQuery({
    queryKey: ['/api/constituencies'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationIds, status }: { applicationIds: number[]; status: string }) => {
      return await apiRequest('POST', '/api/board/applications/bulk-update', {
        applicationIds,
        status,
        shortlistedAt: status === 'shortlisted' ? new Date().toISOString() : undefined
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Applications updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setSelectedApplicants(new Set());
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update applications',
        variant: 'destructive',
      });
    },
  });

  const handleGetList = () => {
    if (!selectedJob) {
      toast({
        title: 'Select a job',
        description: 'Please select a job to filter applicants.',
        variant: 'destructive',
      });
      return;
    }

    let filtered = (allApplications as any[]).filter((app: any) => 
      app.jobId?.toString() === selectedJob && app.status === 'submitted'
    );

    if (subCounty) {
      filtered = filtered.filter((app: any) => 
        app.subCountyName?.toLowerCase().includes(subCounty.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
    setShowFiltered(true);
  };

  const handleClearFilters = () => {
    setSelectedJob('');
    setYearsOfExperience('');
    setSubCounty('');
    setKcseMeanGrade('');
    setFilteredApplications([]);
    setShowFiltered(false);
    setSelectedApplicants(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredApplications.map((app: any) => app.id));
      setSelectedApplicants(allIds);
    } else {
      setSelectedApplicants(new Set());
    }
  };

  const handleSelectApplicant = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedApplicants);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedApplicants(newSelected);
  };

  const handleBulkShortlist = () => {
    if (selectedApplicants.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select applicants to shortlist.',
        variant: 'destructive',
      });
      return;
    }
    updateStatusMutation.mutate({
      applicationIds: Array.from(selectedApplicants),
      status: 'shortlisted'
    });
  };

  const handleBulkReject = () => {
    if (selectedApplicants.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select applicants to reject.',
        variant: 'destructive',
      });
      return;
    }
    updateStatusMutation.mutate({
      applicationIds: Array.from(selectedApplicants),
      status: 'rejected'
    });
  };

  const applicationsToDisplay = showFiltered ? filteredApplications : [];

  const shortlistedCount = (allApplications as any[]).filter((app: any) => 
    app.status === 'shortlisted' && app.jobId?.toString() === selectedJob
  ).length;

  const notShortlistedCount = (allApplications as any[]).filter((app: any) => 
    app.status === 'rejected' && app.jobId?.toString() === selectedJob
  ).length;

  const pendingCount = (allApplications as any[]).filter((app: any) => 
    app.status === 'submitted' && app.jobId?.toString() === selectedJob
  ).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole="board" />
        <main className="flex-1 p-6">
          <div className="container mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Shortlisting Panel</h1>

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Job Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select a job here:</Label>
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger data-testid="select-job">
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      {(jobs as any[]).map((job: any) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.advertNumb} - {job.title} [Job Group '{job.jgName}'] {job.posts} Post
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Years of Experience */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Choose the Required Years of Experience</Label>
                  <RadioGroup value={yearsOfExperience} onValueChange={setYearsOfExperience}>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0-3" id="exp-0-3" data-testid="radio-exp-0-3" />
                        <Label htmlFor="exp-0-3" className="font-normal cursor-pointer">0-3 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4-6" id="exp-4-6" data-testid="radio-exp-4-6" />
                        <Label htmlFor="exp-4-6" className="font-normal cursor-pointer">4-6 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7-10" id="exp-7-10" data-testid="radio-exp-7-10" />
                        <Label htmlFor="exp-7-10" className="font-normal cursor-pointer">7-10 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10+" id="exp-10plus" data-testid="radio-exp-10plus" />
                        <Label htmlFor="exp-10plus" className="font-normal cursor-pointer">Over 10 Yrs</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sub-County */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Sub-County</Label>
                    <Select value={subCounty} onValueChange={setSubCounty}>
                      <SelectTrigger data-testid="select-subcounty">
                        <SelectValue placeholder="Select sub-county" />
                      </SelectTrigger>
                      <SelectContent>
                        {(constituencies as any[]).map((constituency: any) => (
                          <SelectItem key={constituency.id} value={constituency.name}>
                            {constituency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* KCSE Mean Grade */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Choose the Required KCSE Mean Grade</Label>
                    <Select value={kcseMeanGrade} onValueChange={setKcseMeanGrade}>
                      <SelectTrigger data-testid="select-kcse-grade">
                        <SelectValue placeholder="--Select Required Mean Grade--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="C+">C+</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="C-">C-</SelectItem>
                        <SelectItem value="D+">D+</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="D-">D-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleGetList}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-get-list"
                  >
                    Get List
                  </Button>
                  <Button 
                    onClick={handleClearFilters}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {showFiltered && selectedJob && (
              <>
                {/* Job Title and Stats */}
                <div className="bg-white border rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-teal-700 mb-3" data-testid="text-job-title">
                    {(jobs as any[]).find((j: any) => j.id.toString() === selectedJob)?.advertNumb} {(jobs as any[]).find((j: any) => j.id.toString() === selectedJob)?.title} Job Group 'J' 1 Post
                  </h2>
                  <div className="flex gap-3">
                    <span className="text-sm">Total number of Applicants</span>
                    <Badge className="bg-teal-600 hover:bg-teal-700" data-testid="badge-shortlisted">
                      {shortlistedCount} Shortlisted
                    </Badge>
                    <Badge className="bg-red-600 hover:bg-red-700" data-testid="badge-not-shortlisted">
                      {notShortlistedCount} Not Shortlisted
                    </Badge>
                    <Badge className="bg-orange-600 hover:bg-orange-700" data-testid="badge-pending">
                      {pendingCount} Pending
                    </Badge>
                  </div>
                </div>

                {/* Applications Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                              <Checkbox
                                checked={selectedApplicants.size === filteredApplications.length && filteredApplications.length > 0}
                                onCheckedChange={handleSelectAll}
                                data-testid="checkbox-select-all"
                              />
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">#</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Full Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ID Number</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Contacts</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Location</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Ward</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">SubCounty</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">ShortListed?</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applicationsToDisplay.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="text-center py-8 text-gray-500">
                                No applications found for selected filters
                              </td>
                            </tr>
                          ) : (
                            applicationsToDisplay.map((app: any, index: number) => (
                              <tr key={app.id} className="border-b hover:bg-gray-50" data-testid={`row-applicant-${app.id}`}>
                                <td className="py-3 px-4">
                                  <Checkbox
                                    checked={selectedApplicants.has(app.id)}
                                    onCheckedChange={(checked) => handleSelectApplicant(app.id, checked as boolean)}
                                    data-testid={`checkbox-applicant-${app.id}`}
                                  />
                                </td>
                                <td className="py-3 px-4 text-sm">{index + 1}</td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-name-${app.id}`}>
                                  {app.fullName || `${app.firstName || ''} ${app.surname || ''}`}
                                </td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-id-${app.id}`}>
                                  {app.nationalId || app.idNumber}
                                </td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-contacts-${app.id}`}>
                                  {app.email || app.phoneNumber || 'N/A'}
                                  {app.phoneNumber && <div className="text-xs text-gray-500">{app.phoneNumber}</div>}
                                </td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-location-${app.id}`}>
                                  {app.countyName || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-ward-${app.id}`}>
                                  {app.wardName || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-sm" data-testid={`text-subcounty-${app.id}`}>
                                  {app.subCountyName || app.constituencyName || 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    className={app.status === 'shortlisted' ? 'bg-green-600' : 'bg-gray-400'}
                                    data-testid={`badge-status-${app.id}`}
                                  >
                                    {app.status === 'shortlisted' ? 'Yes' : 'No'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                    data-testid={`button-more-${app.id}`}
                                  >
                                    More
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Action Buttons */}
                {applicationsToDisplay.length > 0 && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleBulkShortlist}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={selectedApplicants.size === 0 || updateStatusMutation.isPending}
                      data-testid="button-bulk-shortlist"
                    >
                      ✓ AUTO SHORTLIST SELECTED
                    </Button>
                    <Button 
                      onClick={handleBulkReject}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={selectedApplicants.size === 0 || updateStatusMutation.isPending}
                      data-testid="button-bulk-reject"
                    >
                      ✗ AUTO NOT SHORTLIST SELECTED
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
