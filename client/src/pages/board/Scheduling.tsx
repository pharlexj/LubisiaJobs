import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  MessageSquare,
  Send,
  Calendar,
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Filter
} from 'lucide-react';

export default function BoardScheduling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState('');
  const [shortlistedFilter, setShortlistedFilter] = useState('yes');
  const [smsStatusFilter, setSmsStatusFilter] = useState('all');
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set());
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewVenue, setInterviewVenue] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['/api/board/applications'],
    enabled: !!user && user.role === 'board',
  });

  const selectedJobData = (jobs as any[]).find((j: any) => j.id.toString() === selectedJob);

  useEffect(() => {
    let message = 'We are pleased to invite you to an interview for the position of ';
    
    if (selectedJobData) {
      message += `${selectedJobData.title}, JOB GROUP '${selectedJobData.jgName}'`;
    } else {
      message += '[Position]';
    }
    
    message += ' you applied for with the County Public Service Board, Trans Nzoia. ';
    
    if (interviewDate && interviewVenue) {
      const formattedDate = new Date(interviewDate).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      message += `The interview is scheduled for ${formattedDate} at ${interviewVenue}. `;
    } else {
      message += 'Kindly select the interview date and venue to complete this message. ';
    }
    
    message += 'Kindly refer to the shortlist for the details regarding the requirements. For more details, login to your account to track your application.';
    
    setSmsMessage(message);
  }, [selectedJob, selectedJobData, interviewDate, interviewVenue]);

  const sendSMSMutation = useMutation({
    mutationFn: async (data: { applicationIds: number[]; message: string; interviewDate: string; interviewVenue: string }) => {
      return await apiRequest('POST', '/api/board/send-interview-sms', data);
    },
    onSuccess: () => {
      toast({
        title: 'SMS Sent',
        description: 'Interview invitations sent successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/board/applications'] });
      setSelectedApplicants(new Set());
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS',
        variant: 'destructive',
      });
    },
  });

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

  const handleSendSMS = () => {
    if (selectedApplicants.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select applicants to send SMS to.',
        variant: 'destructive',
      });
      return;
    }

    if (!interviewDate || !interviewVenue) {
      toast({
        title: 'Missing information',
        description: 'Please provide interview date and venue.',
        variant: 'destructive',
      });
      return;
    }

    sendSMSMutation.mutate({
      applicationIds: Array.from(selectedApplicants),
      message: smsMessage,
      interviewDate,
      interviewVenue
    });
  };

  let filteredApplications = (allApplications as any[]).filter((app: any) => {
    const matchesJob = !selectedJob || selectedJob === 'all' || app.jobId?.toString() === selectedJob;
    const matchesShortlisted = shortlistedFilter === 'all' || 
      (shortlistedFilter === 'yes' && app.status === 'shortlisted') ||
      (shortlistedFilter === 'no' && app.status !== 'shortlisted');
    const matchesSmsStatus = smsStatusFilter === 'all' || 
      (smsStatusFilter === 'sent' && app.smsSent) ||
      (smsStatusFilter === 'pending' && !app.smsSent);

    return matchesJob && matchesShortlisted && matchesSmsStatus;
  });

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
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg p-4 md:p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
                    SEND SMS TO INTERNAL SHORTLISTED APPLICANTS
                  </h1>
                  <p className="text-teal-100 text-xs md:text-base">
                    Send interview invitations via SMS to selected candidates
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/30 self-start">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">Current Balance:</span>
                  </div>
                  <div className="text-lg md:text-2xl font-bold mt-1">KES 2,429.9999</div>
                </div>
              </div>
            </div>

            {/* Filters Card */}
            <Card className="border-teal-200 shadow-md">
              <CardContent className="p-4 md:p-6 space-y-4 bg-gradient-to-b from-teal-50 to-white">
                {/* Job Selection */}
                <div>
                  <Label className="text-sm md:text-base font-semibold mb-2 block text-gray-700">Advert :</Label>
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger className="w-full bg-white border-teal-300 focus:border-teal-500" data-testid="select-job">
                      <SelectValue placeholder="Select a job advert" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      {(jobs as any[]).map((job: any) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.advertNumb} =&gt; {job.title} [II] Job Group {job.jgName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm md:text-base font-semibold mb-2 block text-gray-700">Shortlisted?</Label>
                    <Select value={shortlistedFilter} onValueChange={setShortlistedFilter}>
                      <SelectTrigger className="bg-white border-teal-300 focus:border-teal-500" data-testid="select-shortlisted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm md:text-base font-semibold mb-2 block text-gray-700">SMS Status?</Label>
                    <Select value={smsStatusFilter} onValueChange={setSmsStatusFilter}>
                      <SelectTrigger className="bg-white border-teal-300 focus:border-teal-500" data-testid="select-sms-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      data-testid="button-get-list"
                    >
                      Get List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applicants Table */}
            <Card className="shadow-md">
              <CardContent className="p-0">
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">
                          #
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">
                          <Checkbox
                            checked={selectedApplicants.size === filteredApplications.length && filteredApplications.length > 0}
                            onCheckedChange={handleSelectAll}
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Full Name</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Phone Number</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Personal No.</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Ward</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Interview Date</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Interview Venue & Time</th>
                        <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">SMS status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12">
                            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-sm md:text-base text-gray-600">No applications match your current filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app: any, index: number) => (
                          <tr 
                            key={app.id} 
                            className={`border-b hover:bg-gray-50 transition-colors ${selectedApplicants.has(app.id) ? 'bg-teal-50' : ''}`}
                            data-testid={`row-applicant-${app.id}`}
                          >
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm font-medium">{index + 1}</td>
                            <td className="py-3 px-3 md:px-4">
                              <Checkbox
                                checked={selectedApplicants.has(app.id)}
                                onCheckedChange={(checked) => handleSelectApplicant(app.id, checked as boolean)}
                                data-testid={`checkbox-applicant-${app.id}`}
                              />
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm" data-testid={`text-name-${app.id}`}>
                              <div className="font-medium">{app.fullName || `${app.firstName || ''} ${app.surname || ''}`}</div>
                              {app.email && (
                                <div className="text-xs text-gray-500 mt-1">{app.email}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm" data-testid={`text-phone-${app.id}`}>
                              {app.phoneNumber || 'N/A'}
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm font-mono" data-testid={`text-id-${app.id}`}>
                              {app.nationalId || app.idNumber || 'N/A'}
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm" data-testid={`text-ward-${app.id}`}>
                              {app.wardName || 'N/A'}
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm" data-testid={`text-interview-date-${app.id}`}>
                              {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-3 md:px-4 text-xs md:text-sm" data-testid={`text-interview-venue-${app.id}`}>
                              <span className="line-clamp-2">{app.interviewVenue || '-'}</span>
                            </td>
                            <td className="py-3 px-3 md:px-4">
                              {app.smsSent ? (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1 w-fit" data-testid={`badge-sms-${app.id}`}>
                                  SMS sent
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600 text-xs w-fit" data-testid={`badge-sms-${app.id}`}>
                                  Pending
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Interview Details & SMS Form */}
            <Card className="border-teal-200 shadow-md">
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Interview Date & Venue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interview-date" className="text-sm font-semibold mb-2 block">
                      Scheduled Interview Date
                    </Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="border-teal-300 focus:border-teal-500"
                      data-testid="input-interview-date"
                      placeholder="dd---yyyy"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview-venue" className="text-sm font-semibold mb-2 block">
                      Interview Venue & time
                    </Label>
                    <Input
                      id="interview-venue"
                      type="text"
                      value={interviewVenue}
                      onChange={(e) => setInterviewVenue(e.target.value)}
                      placeholder="Type the interview venue and time..."
                      className="border-teal-300 focus:border-teal-500"
                      data-testid="input-interview-venue"
                    />
                  </div>
                </div>

                {/* SMS Message */}
                <div>
                  <Textarea
                    id="sms-message"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={8}
                    className="border-teal-300 focus:border-teal-500 font-sans text-sm"
                    placeholder="Enter the SMS message to send to applicants..."
                    data-testid="textarea-sms-message"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                    <p className="text-xs text-gray-500">
                      Characters: {smsMessage.length} | Estimated SMS: {Math.ceil(smsMessage.length / 160)} | Recipients: {selectedApplicants.size}
                    </p>
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleSendSMS}
                    disabled={selectedApplicants.size === 0 || sendSMSMutation.isPending || !interviewDate || !interviewVenue}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    data-testid="button-send-sms"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                    {sendSMSMutation.isPending ? 'Sending SMS...' : 'Send SMS'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
