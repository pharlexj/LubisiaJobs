import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Download,
  FileText,
  GraduationCap,
  Award,
  Briefcase,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

export default function BoardShortlisting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [kcseMeanGrade, setKcseMeanGrade] = useState('');
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set());
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
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
      setShowApplicantDetails(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update applications',
        variant: 'destructive',
      });
    },
  });

  const handleIndividualShortlist = () => {
    if (!selectedApplicant) return;
    updateStatusMutation.mutate({
      applicationIds: [selectedApplicant.id],
      status: 'shortlisted'
    });
  };

  const handleIndividualReject = () => {
    if (!selectedApplicant) return;
    updateStatusMutation.mutate({
      applicationIds: [selectedApplicant.id],
      status: 'rejected'
    });
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

  const handleViewDetails = (applicant: any) => {
    setSelectedApplicant(applicant);
    setShowApplicantDetails(true);
  };

  let filteredApplications = (allApplications as any[]).filter((app: any) => {
    const matchesSearch = !searchTerm ||
      app.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJob = !selectedJob || selectedJob === 'all' || app.jobId?.toString() === selectedJob;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSubCounty = !subCounty || subCounty === 'all' || app.constituencyName?.toLowerCase().includes(subCounty.toLowerCase());

    return matchesSearch && matchesJob && matchesStatus && matchesSubCounty;
  });

  const shortlistedCount = filteredApplications.filter((app: any) => app.status === 'shortlisted').length;
  const notShortlistedCount = filteredApplications.filter((app: any) => app.status === 'rejected').length;
  const pendingCount = filteredApplications.filter((app: any) => app.status === 'submitted').length;

  const isLoading = jobsLoading || appsLoading;

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
          <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg p-4 md:p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
                    SHORTLISTING PANEL
                  </h1>
                  <p className="text-teal-100 text-xs md:text-base">
                    Review applications and select candidates for interviews.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" data-testid="button-export" className="flex-1 md:flex-initial bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export List</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                  <Button size="sm" data-testid="button-print" className="flex-1 md:flex-initial bg-white text-teal-700 hover:bg-white/90">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Print Sheet</span>
                    <span className="sm:hidden">Print</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters Card */}
            <Card className="border-teal-200 shadow-md">
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gradient-to-b from-teal-50 to-white">
                {/* Search and Job Selection */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search by applicant name or job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                      <SelectTrigger className="w-full sm:w-64 border-teal-300 focus:border-teal-500" data-testid="select-job">
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {(jobs as any[]).map((job: any) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.advertNumb} - {job.title} [{job.jgName}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40" data-testid="select-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <Label className="text-sm md:text-base font-semibold mb-3 block">Choose the Required Years of Experience</Label>
                  <RadioGroup value={yearsOfExperience} onValueChange={setYearsOfExperience}>
                    <div className="flex flex-wrap gap-4 md:gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0-3" id="exp-0-3" data-testid="radio-exp-0-3" />
                        <Label htmlFor="exp-0-3" className="font-normal cursor-pointer text-sm md:text-base">0-3 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4-6" id="exp-4-6" data-testid="radio-exp-4-6" />
                        <Label htmlFor="exp-4-6" className="font-normal cursor-pointer text-sm md:text-base">4-6 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7-10" id="exp-7-10" data-testid="radio-exp-7-10" />
                        <Label htmlFor="exp-7-10" className="font-normal cursor-pointer text-sm md:text-base">7-10 Yrs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10+" id="exp-10plus" data-testid="radio-exp-10plus" />
                        <Label htmlFor="exp-10plus" className="font-normal cursor-pointer text-sm md:text-base">Over 10 Yrs</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sub-County */}
                  <div>
                    <Label className="text-sm md:text-base font-semibold mb-2 block">Sub-County</Label>
                    <Select value={subCounty} onValueChange={setSubCounty}>
                      <SelectTrigger data-testid="select-subcounty">
                        <SelectValue placeholder="Select sub-county" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sub-Counties</SelectItem>
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
                    <Label className="text-sm md:text-base font-semibold mb-2 block">KCSE Mean Grade</Label>
                    <Select value={kcseMeanGrade} onValueChange={setKcseMeanGrade}>
                      <SelectTrigger data-testid="select-kcse-grade">
                        <SelectValue placeholder="--Select Required Mean Grade--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
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
                <div className="flex gap-3 items-center">
                  <Button variant="outline" data-testid="button-more-filters">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Overview */}
            {selectedJob && (
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-base md:text-lg font-semibold text-teal-700 mb-3" data-testid="text-job-title">
                  {(jobs as any[]).find((j: any) => j.id.toString() === selectedJob)?.advertNumb} {(jobs as any[]).find((j: any) => j.id.toString() === selectedJob)?.title}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs md:text-sm">Total: {filteredApplications.length}</span>
                  <Badge className="bg-teal-600 hover:bg-teal-700 text-xs md:text-sm" data-testid="badge-shortlisted">
                    {shortlistedCount} Shortlisted
                  </Badge>
                  <Badge className="bg-red-600 hover:bg-red-700 text-xs md:text-sm" data-testid="badge-not-shortlisted">
                    {notShortlistedCount} Not Shortlisted
                  </Badge>
                  <Badge className="bg-orange-600 hover:bg-orange-700 text-xs md:text-sm" data-testid="badge-pending">
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
            )}

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Applications for Review ({filteredApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Applications Found</h3>
                    <p className="text-sm md:text-base text-gray-600">
                      No applications match your current filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                      <table className="w-full min-w-[800px]">
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
                          {filteredApplications.map((app: any, index: number) => (
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
                                {app.email || 'N/A'}
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
                                  onClick={() => handleViewDetails(app)}
                                  data-testid={`button-more-${app.id}`}
                                >
                                  More
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bulk Action Buttons */}
                    {filteredApplications.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button 
                          onClick={handleBulkShortlist}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          size="sm"
                          disabled={selectedApplicants.size === 0 || updateStatusMutation.isPending}
                          data-testid="button-bulk-shortlist"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="hidden md:inline">AUTO SHORTLIST SELECTED</span>
                          <span className="md:hidden">SHORTLIST ({selectedApplicants.size})</span>
                        </Button>
                        <Button 
                          onClick={handleBulkReject}
                          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                          size="sm"
                          disabled={selectedApplicants.size === 0 || updateStatusMutation.isPending}
                          data-testid="button-bulk-reject"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          <span className="hidden md:inline">AUTO NOT SHORTLIST SELECTED</span>
                          <span className="md:hidden">REJECT ({selectedApplicants.size})</span>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Applicant Details Modal */}
      <Dialog open={showApplicantDetails} onOpenChange={setShowApplicantDetails}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-2xl">
              Candidate Profile: {selectedApplicant?.fullName || `${selectedApplicant?.firstName} ${selectedApplicant?.surname}`}
            </DialogTitle>
          </DialogHeader>

          {selectedApplicant && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <p className="mt-1 text-lg">{selectedApplicant.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <p className="mt-1">{selectedApplicant.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <p className="mt-1">{selectedApplicant.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </Label>
                        <p className="mt-1">{selectedApplicant.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">National ID</Label>
                        <p className="mt-1">{selectedApplicant.nationalId || selectedApplicant.idNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Gender</Label>
                        <p className="mt-1">{selectedApplicant.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <p className="mt-1">
                          {selectedApplicant.countyName && `${selectedApplicant.countyName}, `}
                          {selectedApplicant.constituencyName && `${selectedApplicant.constituencyName}, `}
                          {selectedApplicant.wardName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Application Status</Label>
                        <Badge className={`mt-1 ${selectedApplicant.status === 'shortlisted' ? 'bg-green-600' : selectedApplicant.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'}`}>
                          {selectedApplicant.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplicant?.education?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedApplicant.education.map((edu: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{edu.courseName}</h4>
                                <p className="text-gray-600 mt-1">{edu.institution}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {edu.yearFrom} - {edu.yearCompleted}
                                  </span>
                                  {edu.grade && (
                                    <Badge variant="outline" className="font-semibold">
                                      Grade: {edu.grade}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Award className="h-8 w-8 text-blue-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No education records available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="employment" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Employment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplicant?.employmentHistory?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedApplicant.employmentHistory.map((emp: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{emp.position}</h4>
                                <p className="text-gray-600 mt-1">{emp.employer}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {emp.startDate} - {emp.endDate || 'Present'}
                                  </span>
                                </div>
                                {emp.responsibilities && (
                                  <p className="text-sm text-gray-600 mt-2">{emp.responsibilities}</p>
                                )}
                              </div>
                              <Briefcase className="h-8 w-8 text-green-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No employment records available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Supporting Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplicant?.documents?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplicant.documents.map((doc: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="font-medium">{doc.type}</p>
                                <p className="text-sm text-gray-500">{doc.fileName}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">View</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No documents uploaded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons at Bottom of Modal */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            {selectedApplicant?.status !== 'shortlisted' && (
              <Button
                onClick={handleIndividualShortlist}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={updateStatusMutation.isPending}
                data-testid="button-modal-shortlist"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{updateStatusMutation.isPending ? 'Processing...' : 'Shortlist Candidate'}</span>
                <span className="sm:hidden">{updateStatusMutation.isPending ? 'Processing...' : 'Shortlist'}</span>
              </Button>
            )}
            {selectedApplicant?.status !== 'rejected' && (
              <Button
                onClick={handleIndividualReject}
                className="flex-1 bg-red-600 hover:bg-red-700"
                size="sm"
                disabled={updateStatusMutation.isPending}
                data-testid="button-modal-reject"
              >
                <XCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{updateStatusMutation.isPending ? 'Processing...' : 'Reject Candidate'}</span>
                <span className="sm:hidden">{updateStatusMutation.isPending ? 'Processing...' : 'Reject'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowApplicantDetails(false)}
              className="flex-1"
              size="sm"
              data-testid="button-modal-close"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
