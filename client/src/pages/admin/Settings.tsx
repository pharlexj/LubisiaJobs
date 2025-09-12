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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  MapPin, 
  Users, 
  Award, 
  HelpCircle,
  Settings as SettingsIcon,
  Building,
  GraduationCap,
  Briefcase
} from 'lucide-react';

// Form schemas
const noticeSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.string().optional(),
  priority: z.string().default('medium'),
  isActive: z.boolean().default(true),
});

const countySchema = z.object({
  name: z.string().min(2, "County name must be at least 2 characters"),
});

const constituencySchema = z.object({
  name: z.string().min(2, "Constituency name must be at least 2 characters"),
  countyId: z.string().min(1, "Please select a county"),
});

const wardSchema = z.object({
  name: z.string().min(2, "Ward name must be at least 2 characters"),
  constituencyId: z.string().min(1, "Please select a constituency"),
});

const studyAreaSchema = z.object({
  name: z.string().min(2, "Study area name must be at least 2 characters"),
});

const specializationSchema = z.object({
  name: z.string().min(2, "Specialization name must be at least 2 characters"),
  studyAreaId: z.string().min(1, "Please select a study area"),
});

const jobGroupSchema = z.object({
  name: z.string().min(1, "Job group name is required"),
  description: z.string().optional(),
});

const awardSchema = z.object({
  name: z.string().min(2, "Award name must be at least 2 characters"),
  description: z.string().optional(),
});

const ethnicitySchema = z.object({
  name: z.string().min(2, "Ethnicity name must be at least 2 characters"),
});

const faqSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  order: z.number().optional(),
});

const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.string().min(1, "Please select a role"),
  assignedBy: z.string().optional(),
});

type NoticeFormData = z.infer<typeof noticeSchema>;
type CountyFormData = z.infer<typeof countySchema>;
type ConstituencyFormData = z.infer<typeof constituencySchema>;
type WardFormData = z.infer<typeof wardSchema>;
type StudyAreaFormData = z.infer<typeof studyAreaSchema>;
type SpecializationFormData = z.infer<typeof specializationSchema>;
type JobGroupFormData = z.infer<typeof jobGroupSchema>;
type AwardFormData = z.infer<typeof awardSchema>;
type EthnicityFormData = z.infer<typeof ethnicitySchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>;

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [activeTab, setActiveTab] = useState('notices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedStudyArea, setSelectedStudyArea] = useState('');

  // Fetch configuration data
  const { data: config } = useQuery({
    queryKey: ['/api/public/config'],
    enabled: !!user && user.role === 'admin',
  });

  const configData = config || {} as any;
  const counties = configData.counties || [];
  const constituencies = configData.constituencies || [];
  const wards = configData.wards || [];
  const studyAreas = configData.studyAreas || [];
  const specializations = configData.specializations || [];
  const jobGroups = configData.jobGroups || [];
  const awards = configData.awards || [];

  // Forms
  const noticeForm = useForm<NoticeFormData>({ resolver: zodResolver(noticeSchema) });
  const countyForm = useForm<CountyFormData>({ resolver: zodResolver(countySchema) });
  const constituencyForm = useForm<ConstituencyFormData>({ resolver: zodResolver(constituencySchema) });
  const wardForm = useForm<WardFormData>({ resolver: zodResolver(wardSchema) });
  const studyAreaForm = useForm<StudyAreaFormData>({ resolver: zodResolver(studyAreaSchema) });
  const specializationForm = useForm<SpecializationFormData>({ resolver: zodResolver(specializationSchema) });
  const jobGroupForm = useForm<JobGroupFormData>({ resolver: zodResolver(jobGroupSchema) });
  const awardForm = useForm<AwardFormData>({ resolver: zodResolver(awardSchema) });
  const ethnicityForm = useForm<EthnicityFormData>({ resolver: zodResolver(ethnicitySchema) });
  const faqForm = useForm<FaqFormData>({ resolver: zodResolver(faqSchema) });
  const roleAssignmentForm = useForm<RoleAssignmentFormData>({ resolver: zodResolver(roleAssignmentSchema) });

  // Generic mutation handler
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return await apiRequest('POST', endpoint, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: 'Item created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      setIsModalOpen(false);
      // Reset appropriate form based on endpoint
      if (variables.endpoint.includes('notices')) noticeForm.reset();
      else if (variables.endpoint.includes('counties')) countyForm.reset();
      else if (variables.endpoint.includes('constituencies')) constituencyForm.reset();
      else if (variables.endpoint.includes('wards')) wardForm.reset();
      else if (variables.endpoint.includes('study-areas')) studyAreaForm.reset();
      else if (variables.endpoint.includes('specializations')) specializationForm.reset();
      else if (variables.endpoint.includes('job-groups')) jobGroupForm.reset();
      else if (variables.endpoint.includes('awards')) awardForm.reset();
      else if (variables.endpoint.includes('ethnicity')) ethnicityForm.reset();
      else if (variables.endpoint.includes('faqs')) faqForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create item',
        variant: 'destructive',
      });
    },
  });

  // Tab configurations
  const tabs = [
    { 
      id: 'notices', 
      label: 'Notices', 
      icon: FileText,
      description: 'Manage system notices and announcements'
    },
    { 
      id: 'geography', 
      label: 'Geography', 
      icon: MapPin,
      description: 'Manage counties, constituencies, and wards'
    },
    { 
      id: 'education', 
      label: 'Education', 
      icon: GraduationCap,
      description: 'Manage study areas and specializations'
    },
    { 
      id: 'job-management', 
      label: 'Job System', 
      icon: Briefcase,
      description: 'Manage job groups and related data'
    },
    { 
      id: 'awards', 
      label: 'Awards', 
      icon: Award,
      description: 'Manage awards and recognitions'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      description: 'Manage user roles and ethnicity data'
    },
    { 
      id: 'roles', 
      label: 'Role Assignments', 
      icon: SettingsIcon,
      description: 'Assign roles to users'
    },
    { 
      id: 'faqs', 
      label: 'FAQs', 
      icon: HelpCircle,
      description: 'Manage frequently asked questions'
    },
  ];

  const handleCreateNotice = (data: NoticeFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/notices', data });
  };

  const handleCreateCounty = (data: CountyFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/counties', data });
  };

  const handleCreateConstituency = (data: ConstituencyFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/constituencies', 
      data: { ...data, countyId: parseInt(data.countyId) }
    });
  };

  const handleCreateWard = (data: WardFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/wards', 
      data: { ...data, constituencyId: parseInt(data.constituencyId) }
    });
  };

  const handleCreateStudyArea = (data: StudyAreaFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/study-areas', data });
  };

  const handleCreateSpecialization = (data: SpecializationFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/specializations', 
      data: { ...data, studyAreaId: parseInt(data.studyAreaId) }
    });
  };

  const handleCreateJobGroup = (data: JobGroupFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/job-groups', data });
  };

  const handleCreateAward = (data: AwardFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/awards', data });
  };

  const handleCreateEthnicity = (data: EthnicityFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/ethnicity', data });
  };

  const handleCreateFaq = (data: FaqFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/faqs', data });
  };

  const handleCreateRoleAssignment = (data: RoleAssignmentFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/role-assignments', 
      data: { ...data, assignedBy: user?.id }
    });
  };

  const filteredConstituencies = selectedCounty 
    ? constituencies.filter((c: any) => c.countyId === parseInt(selectedCounty))
    : [];

  const filteredWards = selectedConstituency 
    ? wards.filter((w: any) => w.constituencyId === parseInt(selectedConstituency))
    : [];

  const filteredSpecializations = selectedStudyArea 
    ? specializations.filter((s: any) => s.studyAreaId === parseInt(selectedStudyArea))
    : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
              <p className="text-gray-600">
                Manage system data, lookup tables, and configuration settings
              </p>
            </div>

            {/* Configuration Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 mb-8">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Notices Tab */}
              <TabsContent value="notices">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notices Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Create and manage system notices</p>
                    </div>
                    <Dialog open={isModalOpen && activeTab === 'notices'} onOpenChange={setIsModalOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setActiveTab('notices')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Notice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Notice</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={noticeForm.handleSubmit(handleCreateNotice)} className="space-y-4">
                          <div>
                            <Label htmlFor="notice-title">Title</Label>
                            <Input 
                              id="notice-title" 
                              {...noticeForm.register('title')} 
                              placeholder="Notice title"
                            />
                            {noticeForm.formState.errors.title && (
                              <p className="text-sm text-red-600 mt-1">
                                {noticeForm.formState.errors.title.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="notice-content">Content</Label>
                            <Textarea 
                              id="notice-content" 
                              {...noticeForm.register('content')} 
                              placeholder="Notice content"
                              rows={4}
                            />
                            {noticeForm.formState.errors.content && (
                              <p className="text-sm text-red-600 mt-1">
                                {noticeForm.formState.errors.content.message}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="notice-type">Type</Label>
                              <Select onValueChange={(value) => noticeForm.setValue('type', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="notice-priority">Priority</Label>
                              <Select onValueChange={(value) => noticeForm.setValue('priority', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Notice</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Click "Add Notice" to create your first notice</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Geography Tab */}
              <TabsContent value="geography">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Counties */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Counties</CardTitle>
                        <p className="text-sm text-gray-600">{counties.length} counties</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New County</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={countyForm.handleSubmit(handleCreateCounty)} className="space-y-4">
                            <div>
                              <Label htmlFor="county-name">County Name</Label>
                              <Input 
                                id="county-name" 
                                {...countyForm.register('name')} 
                                placeholder="Enter county name"
                              />
                              {countyForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {countyForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add County</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {counties.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No counties yet</p>
                        ) : (
                          counties.map((county: any) => (
                            <div key={county.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{county.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedCounty(county.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Constituencies */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Constituencies</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedCounty ? filteredConstituencies.length : constituencies.length} constituencies
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedCounty}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Constituency</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={constituencyForm.handleSubmit(handleCreateConstituency)} className="space-y-4">
                            <div>
                              <Label htmlFor="constituency-county">County</Label>
                              <Select 
                                value={selectedCounty}
                                onValueChange={(value) => {
                                  setSelectedCounty(value);
                                  constituencyForm.setValue('countyId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                                <SelectContent>
                                  {counties.map((county: any) => (
                                    <SelectItem key={county.id} value={county.id.toString()}>
                                      {county.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="constituency-name">Constituency Name</Label>
                              <Input 
                                id="constituency-name" 
                                {...constituencyForm.register('name')} 
                                placeholder="Enter constituency name"
                              />
                              {constituencyForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {constituencyForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Constituency</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedCounty ? filteredConstituencies : constituencies).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedCounty ? 'No constituencies in selected county' : 'Select a county first'}
                          </p>
                        ) : (
                          (selectedCounty ? filteredConstituencies : constituencies).map((constituency: any) => (
                            <div key={constituency.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{constituency.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedConstituency(constituency.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wards */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Wards</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedConstituency ? filteredWards.length : wards.length} wards
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedConstituency}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Ward</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={wardForm.handleSubmit(handleCreateWard)} className="space-y-4">
                            <div>
                              <Label htmlFor="ward-constituency">Constituency</Label>
                              <Select 
                                value={selectedConstituency}
                                onValueChange={(value) => {
                                  setSelectedConstituency(value);
                                  wardForm.setValue('constituencyId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select constituency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredConstituencies.map((constituency: any) => (
                                    <SelectItem key={constituency.id} value={constituency.id.toString()}>
                                      {constituency.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="ward-name">Ward Name</Label>
                              <Input 
                                id="ward-name" 
                                {...wardForm.register('name')} 
                                placeholder="Enter ward name"
                              />
                              {wardForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {wardForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Ward</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedConstituency ? filteredWards : wards).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedConstituency ? 'No wards in selected constituency' : 'Select a constituency first'}
                          </p>
                        ) : (
                          (selectedConstituency ? filteredWards : wards).map((ward: any) => (
                            <div key={ward.id} className="p-2 border rounded">
                              <span className="text-sm">{ward.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Study Areas */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Study Areas</CardTitle>
                        <p className="text-sm text-gray-600">{studyAreas.length} study areas</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Study Area
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Study Area</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={studyAreaForm.handleSubmit(handleCreateStudyArea)} className="space-y-4">
                            <div>
                              <Label htmlFor="study-area-name">Study Area Name</Label>
                              <Input 
                                id="study-area-name" 
                                {...studyAreaForm.register('name')} 
                                placeholder="e.g., Computer Science, Engineering"
                              />
                              {studyAreaForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {studyAreaForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Study Area</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studyAreas.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No study areas yet</p>
                        ) : (
                          studyAreas.map((area: any) => (
                            <div key={area.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{area.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedStudyArea(area.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specializations */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Specializations</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedStudyArea ? filteredSpecializations.length : specializations.length} specializations
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedStudyArea}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Specialization
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Specialization</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={specializationForm.handleSubmit(handleCreateSpecialization)} className="space-y-4">
                            <div>
                              <Label htmlFor="specialization-study-area">Study Area</Label>
                              <Select 
                                value={selectedStudyArea}
                                onValueChange={(value) => {
                                  setSelectedStudyArea(value);
                                  specializationForm.setValue('studyAreaId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select study area" />
                                </SelectTrigger>
                                <SelectContent>
                                  {studyAreas.map((area: any) => (
                                    <SelectItem key={area.id} value={area.id.toString()}>
                                      {area.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="specialization-name">Specialization Name</Label>
                              <Input 
                                id="specialization-name" 
                                {...specializationForm.register('name')} 
                                placeholder="e.g., Software Engineering, Web Development"
                              />
                              {specializationForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {specializationForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Specialization</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedStudyArea ? filteredSpecializations : specializations).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedStudyArea ? 'No specializations in selected study area' : 'Select a study area first'}
                          </p>
                        ) : (
                          (selectedStudyArea ? filteredSpecializations : specializations).map((spec: any) => (
                            <div key={spec.id} className="p-2 border rounded">
                              <span className="text-sm">{spec.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Job Management Tab */}
              <TabsContent value="job-management">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Job Groups Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage job groups and classifications</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Job Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Job Group</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={jobGroupForm.handleSubmit(handleCreateJobGroup)} className="space-y-4">
                          <div>
                            <Label htmlFor="job-group-name">Job Group Name</Label>
                            <Input 
                              id="job-group-name" 
                              {...jobGroupForm.register('name')} 
                              placeholder="e.g., A, B, C, D..."
                            />
                            {jobGroupForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {jobGroupForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="job-group-description">Description (Optional)</Label>
                            <Textarea 
                              id="job-group-description" 
                              {...jobGroupForm.register('description')} 
                              placeholder="Description of the job group"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Job Group</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {jobGroups.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No job groups yet. Click "Add Job Group" to get started.</p>
                        </div>
                      ) : (
                        jobGroups.map((group: any) => (
                          <Card key={group.id}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">Job Group {group.name}</h4>
                              {group.description && (
                                <p className="text-sm text-gray-600">{group.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Awards Tab */}
              <TabsContent value="awards">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Awards Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage awards and recognitions</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Award
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Award</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={awardForm.handleSubmit(handleCreateAward)} className="space-y-4">
                          <div>
                            <Label htmlFor="award-name">Award Name</Label>
                            <Input 
                              id="award-name" 
                              {...awardForm.register('name')} 
                              placeholder="e.g., Best Employee, Outstanding Service"
                            />
                            {awardForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {awardForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="award-description">Description (Optional)</Label>
                            <Textarea 
                              id="award-description" 
                              {...awardForm.register('description')} 
                              placeholder="Description of the award"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Award</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {awards.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No awards yet. Click "Add Award" to get started.</p>
                        </div>
                      ) : (
                        awards.map((award: any) => (
                          <Card key={award.id}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{award.name}</h4>
                              {award.description && (
                                <p className="text-sm text-gray-600">{award.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage ethnicity data and user roles</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ethnicity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Ethnicity</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={ethnicityForm.handleSubmit(handleCreateEthnicity)} className="space-y-4">
                          <div>
                            <Label htmlFor="ethnicity-name">Ethnicity Name</Label>
                            <Input 
                              id="ethnicity-name" 
                              {...ethnicityForm.register('name')} 
                              placeholder="e.g., Kikuyu, Luo, Kalenjin"
                            />
                            {ethnicityForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {ethnicityForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Ethnicity</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Click "Add Ethnicity" to manage ethnicity data</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQs Tab */}
              <TabsContent value="faqs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>FAQ Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage frequently asked questions</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add FAQ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New FAQ</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={faqForm.handleSubmit(handleCreateFaq)} className="space-y-4">
                          <div>
                            <Label htmlFor="faq-category">Category</Label>
                            <Select onValueChange={(value) => faqForm.setValue('category', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="application">Application Process</SelectItem>
                                <SelectItem value="requirements">Requirements</SelectItem>
                                <SelectItem value="selection">Selection Process</SelectItem>
                                <SelectItem value="account">Account Management</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                            {faqForm.formState.errors.category && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.category.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="faq-question">Question</Label>
                            <Input 
                              id="faq-question" 
                              {...faqForm.register('question')} 
                              placeholder="Enter the question"
                            />
                            {faqForm.formState.errors.question && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.question.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="faq-answer">Answer</Label>
                            <Textarea 
                              id="faq-answer" 
                              {...faqForm.register('answer')} 
                              placeholder="Enter the answer"
                              rows={5}
                            />
                            {faqForm.formState.errors.answer && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.answer.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add FAQ</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Click "Add FAQ" to create your first FAQ entry</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Role Assignments Tab */}
              <TabsContent value="roles">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Role Assignments</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Assign roles to users in the system</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Assign Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Role to User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={roleAssignmentForm.handleSubmit(handleCreateRoleAssignment)} className="space-y-4">
                          <div>
                            <Label htmlFor="role-user">User</Label>
                            <Select onValueChange={(value) => roleAssignmentForm.setValue('userId', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">John Doe (john@example.com)</SelectItem>
                                <SelectItem value="2">Jane Smith (jane@example.com)</SelectItem>
                                <SelectItem value="3">Bob Johnson (bob@example.com)</SelectItem>
                              </SelectContent>
                            </Select>
                            {roleAssignmentForm.formState.errors.userId && (
                              <p className="text-sm text-red-600 mt-1">
                                {roleAssignmentForm.formState.errors.userId.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="role-assignment">Role</Label>
                            <Select onValueChange={(value) => roleAssignmentForm.setValue('role', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="board">Board Member</SelectItem>
                                <SelectItem value="applicant">Applicant</SelectItem>
                              </SelectContent>
                            </Select>
                            {roleAssignmentForm.formState.errors.role && (
                              <p className="text-sm text-red-600 mt-1">
                                {roleAssignmentForm.formState.errors.role.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Assign Role</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Click "Assign Role" to manage user permissions</p>
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