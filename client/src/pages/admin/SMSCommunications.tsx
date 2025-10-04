import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageCircle, Users, Briefcase, CheckCircle, XCircle, Phone, User } from 'lucide-react';

interface Applicant {
  id: number;
  userId: string;
  firstName: string;
  surname: string;
  otherName?: string;
  phoneNumber?: string;
  nationalId: string;
  gender: string;
  countyName?: string;
  wardId?: number;
  applicationStatus: string;
  jobTitle: string;
  jobId: number;
  applicationId: number;
}

interface Staff {
  id: string;
  email: string;
  firstName: string;
  surname: string;
  phoneNumber?: string;
  role: string;
}

export default function SMSCommunications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedApplicantType, setSelectedApplicantType] = useState('');
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [applicantMessage, setApplicantMessage] = useState('');
  const [staffMessage, setStaffMessage] = useState('');

  // Fetch jobs for dropdown
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch applicants based on job and type selection
  const { data: applicants = [], isLoading: applicantsLoading } = useQuery({
    queryKey: ['/api/admin/sms-applicants', selectedJobId, selectedApplicantType],
    enabled: !!user && user.role === 'admin' && !!selectedJobId && !!selectedApplicantType,
  });

  // Fetch staff list
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ['/api/admin/staff-list'],
    enabled: !!user && user.role === 'admin',
  });

  // SMS mutation for applicants
  const sendApplicantSMSMutation = useMutation({
    mutationFn: async (data: { applicantIds: number[]; message: string; jobId: number; applicantType: string }) => {
      return await apiRequest('POST', '/api/admin/send-sms', data);
    },
    onSuccess: (result: any) => {
      toast({
        title: 'SMS Sent Successfully',
        description: `${result.successCount} messages sent successfully. ${result.failureCount} failed.`,
      });
      setSelectedApplicants([]);
      setApplicantMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS',
        variant: 'destructive',
      });
    },
  });

  // SMS mutation for staff
  const sendStaffSMSMutation = useMutation({
    mutationFn: async (data: { staffIds: string[]; message: string }) => {
      return await apiRequest('POST', '/api/admin/send-staff-sms', data);
    },
    onSuccess: (result: any) => {
      toast({
        title: 'SMS Sent Successfully',
        description: `${result.successCount} messages sent successfully. ${result.failureCount} failed.`,
      });
      setSelectedStaff([]);
      setStaffMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS to staff',
        variant: 'destructive',
      });
    },
  });

  const handleApplicantSelection = (applicantId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplicants([...selectedApplicants, applicantId]);
    } else {
      setSelectedApplicants(selectedApplicants.filter(id => id !== applicantId));
    }
  };

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    if (checked) {
      setSelectedStaff([...selectedStaff, staffId]);
    } else {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    }
  };

  const handleSelectAllApplicants = (checked: boolean) => {
    if (checked) {
      setSelectedApplicants(applicants.map((app: Applicant) => app.id));
    } else {
      setSelectedApplicants([]);
    }
  };

  const handleSelectAllStaff = (checked: boolean) => {
    if (checked) {
      setSelectedStaff(staff.map((s: Staff) => s.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSendApplicantSMS = () => {
    if (selectedApplicants.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one applicant',
        variant: 'destructive',
      });
      return;
    }

    if (!applicantMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    sendApplicantSMSMutation.mutate({
      applicantIds: selectedApplicants,
      message: applicantMessage,
      jobId: parseInt(selectedJobId),
      applicantType: selectedApplicantType
    });
  };

  const handleSendStaffSMS = () => {
    if (selectedStaff.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one staff member',
        variant: 'destructive',
      });
      return;
    }

    if (!staffMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    sendStaffSMSMutation.mutate({
      staffIds: selectedStaff,
      message: staffMessage
    });
  };

  const generateApplicantMessage = () => {
    if (!selectedJobId || !selectedApplicantType) return;
    
    const selectedJob = jobs.find((job: any) => job.id === parseInt(selectedJobId));
    const jobTitle = selectedJob?.title || 'the position';

    let messageTemplate = '';
    
    switch (selectedApplicantType) {
      case 'shortlisted':
        messageTemplate = `Trans-Nzoia County Public Service Board: Congratulations! You have been shortlisted for the interview for the position of ${jobTitle}. You will receive a call with further details. Thank you.`;
        break;
      case 'successful':
      case 'hired':
        messageTemplate = `Trans-Nzoia County Public Service Board: Congratulations on your successful interview for the position of ${jobTitle}. You will receive a call from the Department of PSM with details on when to collect your Offer of Appointment. Thank you.`;
        break;
      case 'unsuccessful':
      case 'rejected':
        messageTemplate = `Trans-Nzoia County Public Service Board regrets to inform you that you were unsuccessful in your interview for the position of ${jobTitle}. Please try again next time. Thank you.`;
        break;
      default:
        messageTemplate = `Trans-Nzoia County Public Service Board: Update regarding your application for the position of ${jobTitle}. Thank you.`;
    }

    setApplicantMessage(messageTemplate);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navigation />
        <main className="p-6 pt-20">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  SMS Communications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Send SMS notifications to applicants and staff members
                </p>
              </div>
            </div>

            <Tabs defaultValue="applicants" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="applicants" data-testid="tab-applicants">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Applicant Communications
                </TabsTrigger>
                <TabsTrigger value="staff" data-testid="tab-staff">
                  <Users className="w-4 h-4 mr-2" />
                  Staff Communications
                </TabsTrigger>
              </TabsList>

              {/* Applicant SMS Tab */}
              <TabsContent value="applicants" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Send SMS to Applicants</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Job and Type Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="job-select">Select Job</Label>
                        <Select onValueChange={setSelectedJobId} data-testid="select-job">
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job position" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job: any) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.advertNumb} - {job.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="applicant-type">Applicant Type</Label>
                        <Select onValueChange={setSelectedApplicantType} data-testid="select-applicant-type">
                          <SelectTrigger>
                            <SelectValue placeholder="Select applicant type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shortlisted">Shortlisted Candidates</SelectItem>
                            <SelectItem value="successful">Successful Candidates</SelectItem>
                            <SelectItem value="unsuccessful">Unsuccessful Candidates</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button 
                          onClick={generateApplicantMessage}
                          disabled={!selectedJobId || !selectedApplicantType}
                          data-testid="button-generate-template"
                        >
                          Generate Message Template
                        </Button>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <Label htmlFor="applicant-message">Message</Label>
                      <Textarea
                        id="applicant-message"
                        value={applicantMessage}
                        onChange={(e) => setApplicantMessage(e.target.value)}
                        placeholder="Enter your SMS message here..."
                        rows={4}
                        data-testid="textarea-applicant-message"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {applicantMessage.length}/160 characters
                      </p>
                    </div>

                    {/* Applicants List */}
                    {applicants.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Select Applicants ({applicants.length} found)
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-applicants"
                              checked={selectedApplicants.length === applicants.length}
                              onCheckedChange={handleSelectAllApplicants}
                              data-testid="checkbox-select-all-applicants"
                            />
                            <Label htmlFor="select-all-applicants">Select All</Label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {applicants.map((applicant: Applicant) => (
                            <Card key={applicant.id} className="p-4">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`applicant-${applicant.id}`}
                                  checked={selectedApplicants.includes(applicant.id)}
                                  onCheckedChange={(checked) => 
                                    handleApplicantSelection(applicant.id, checked as boolean)
                                  }
                                  data-testid={`checkbox-applicant-${applicant.id}`}
                                />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">
                                    {applicant.firstName} {applicant.surname}
                                  </h4>
                                  <p className="text-xs text-gray-600">{applicant.nationalId}</p>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    <span className="text-xs">
                                      {applicant.phoneNumber || 'No phone'}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {applicant.applicationStatus}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            {selectedApplicants.length} applicant(s) selected
                          </p>
                          <Button 
                            onClick={handleSendApplicantSMS}
                            disabled={selectedApplicants.length === 0 || !applicantMessage.trim() || sendApplicantSMSMutation.isPending}
                            data-testid="button-send-applicant-sms"
                          >
                            {sendApplicantSMSMutation.isPending ? 'Sending...' : 'Send SMS'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {applicantsLoading && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading applicants...</p>
                      </div>
                    )}

                    {applicants.length === 0 && selectedJobId && selectedApplicantType && !applicantsLoading && (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No applicants found for the selected job and type.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff SMS Tab */}
              <TabsContent value="staff" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Send SMS to Staff</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Message Input */}
                    <div>
                      <Label htmlFor="staff-message">Message</Label>
                      <Textarea
                        id="staff-message"
                        value={staffMessage}
                        onChange={(e) => setStaffMessage(e.target.value)}
                        placeholder="Enter your SMS message for staff..."
                        rows={4}
                        data-testid="textarea-staff-message"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {staffMessage.length}/160 characters
                      </p>
                    </div>

                    {/* Staff List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Select Staff Members ({staff.length} found)
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="select-all-staff"
                            checked={selectedStaff.length === staff.length}
                            onCheckedChange={handleSelectAllStaff}
                            data-testid="checkbox-select-all-staff"
                          />
                          <Label htmlFor="select-all-staff">Select All</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {staff.map((staffMember: Staff) => (
                          <Card key={staffMember.id} className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`staff-${staffMember.id}`}
                                checked={selectedStaff.includes(staffMember.id)}
                                onCheckedChange={(checked) => 
                                  handleStaffSelection(staffMember.id, checked as boolean)
                                }
                                data-testid={`checkbox-staff-${staffMember.id}`}
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">
                                  {staffMember.firstName} {staffMember.surname}
                                </h4>
                                <p className="text-xs text-gray-600">{staffMember.email}</p>
                                <div className="flex items-center space-x-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  <span className="text-xs">
                                    {staffMember.phoneNumber || 'No phone'}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {staffMember.role}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {selectedStaff.length} staff member(s) selected
                        </p>
                        <Button 
                          onClick={handleSendStaffSMS}
                          disabled={selectedStaff.length === 0 || !staffMessage.trim() || sendStaffSMSMutation.isPending}
                          data-testid="button-send-staff-sms"
                        >
                          {sendStaffSMSMutation.isPending ? 'Sending...' : 'Send SMS'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}