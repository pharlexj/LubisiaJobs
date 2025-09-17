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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Job, Department, Designation, CourseOffered, Jg,CertificateLevel,StudyArea as StudyAreas } from '@shared/schema';
import { Plus, Edit, Eye,Trash2, Upload,Calendar, Users,Search, Filter} from 'lucide-react';

const jobSchema = z
  .object({
    title: z.string().min(5, "Job title must be at least 5 characters"),
    jg: z.string().min(1, "Please select a job group"),
    posts: z.string().min(1, "Please specify number of posts"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    departmentId: z.string().min(1, "Please select a department"),
    designationId: z.string().optional(),
    category: z.string().min(1, "Please select category"),
    certificateLevel: z.string().min(1, "Please select certificate level"),
    requirements: z.string().optional(),
    requiredCourses: z.string().optional(),
    advertType: z.string().min(1, "Please specify advert type"),
    startDate: z.string().min(1, "Please select an application Start Date"),
    endDate: z.string().min(1, "Please select an application deadline"),
    advertNumb: z.string().min(6, "Please Enter Advert Number"),
    experience: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "Internal") {
      if (!data.designationId) {
        ctx.addIssue({
          path: ["designationId"],
          code: z.ZodIssueCode.custom,
          message: "Designation is required when category is Internal",
        });
      }

      if (!data.experience) {
        ctx.addIssue({
          path: ["experience"],
          code: z.ZodIssueCode.custom,
          message: "Experience is required when category is Internal",
        });
      }

      if (!data.jg) {
        ctx.addIssue({
          path: ["jg"],
          code: z.ZodIssueCode.custom,
          message: "Job Group is required when category is Internal",
        });
      }

      if (!data.requiredCourses) {
        ctx.addIssue({
          path: ["requiredCourses"],
          code: z.ZodIssueCode.custom,
          message: "Required Courses must be selected when category is Internal",
        });
      }
    }
  });
type JobFormData = z.infer<typeof jobSchema>;
export default function AdminJobManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);


  const { data: config, isLoading} = useQuery({
      queryKey: ['/api/public/config'],
      enabled: !!user && user.role === 'admin',
    });
  
    const configData = config || {} as any;

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin',
  });

  const departments = configData?.departments || [];
  const designations = configData?.designations || [];
  const courses = configData?.courses || [];
  const certificateLevels = configData?.certificateLevels || [];
  const jobGroups = configData?.jobGroups || [];
  const jobs = configData?.jobs || [];
  const studyArea = configData?.studyAreas || [];

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      departmentId: '',
      designationId: '',
      jg: '',
      certificateLevel: '',
      requiredCourses: '',
      posts: '',
      experience: '',
      category: '',
      requirements: '',
      advertNumb: '',
      advertType: "",

    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      console.log("Sending payload:", data);
      // apiRequest already returns parsed JSON, no need to call .json() again
      return await apiRequest('POST', '/api/admin/jobs', {
        ...data,
        departmentId: parseInt(data.departmentId),
        posts: parseInt(data.posts),
        jg: parseInt(data.jg),
        designationId: data.designationId ? parseInt(data.designationId) : null,
        certificateLevel: parseInt(data.certificateLevel),
        requiredCourses: data.requiredCourses,
        experience: data.experience,
        advertType: data.advertType,
        requirements: data.requirements || null,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Job Created',
        description: 'Job posting has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] });
      setIsCreateModalOpen(false);
      form.reset();
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
        description: error.message || 'Failed to create job',
        variant: 'destructive',
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/admin/jobs/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Job Updated',
        description: 'Job posting has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] });
      setEditingJob(null);
      resetForm();
      setIsCreateModalOpen(false);
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
        description: error.message || 'Failed to update job',
        variant: 'destructive',
      });
    },
  });

  const handleCreateJob = (data: JobFormData) => {
    console.log(' At handkecreate job',data);
    
    if (editingJob) {
      // Update existing job with proper type conversion
      const processedData = {
        ...data,
        departmentId: parseInt(data.departmentId),
        posts: parseInt(data.posts),
        jg: parseInt(data.jg),
        designationId: data.designationId ? parseInt(data.designationId) : null,
        certificateLevel: parseInt(data.certificateLevel),
        requirements: data.requirements || null,
      };
      updateJobMutation.mutate({
        id: editingJob.id,
        data: processedData
      });
    } else {
      // Create new job
      createJobMutation.mutate(data);
    }
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    // Populate form with job data
    form.reset({
      title: job.title || '',
      description: job.description || '',
      departmentId: job.departmentId?.toString() || '',
      designationId: job.designationId?.toString() || '',
      jg: job.jg?.toString() || '',
      certificateLevel: job.certificateLevel || '',
      requiredCourses: job.requiredCourses || '',
      posts: job.posts?.toString() || '',
      experience: job.experience || '',
      category: job.category || '',
      requirements: job.requirements || '',
      advertNumb: job.advertNumb || '',
      advertType: job.advertType || '',
      startDate: job.startDate || '',
      endDate: job.endDate || '',
      isActive: job.isActive || false
    });
    setIsCreateModalOpen(true);
  };

  const handleViewJob = (job: any) => {
    // Navigate to job details page or show job details modal
    console.log('View job:', job);
    // You can implement a view modal or redirect to details page
  };

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return await apiRequest('DELETE', `/api/admin/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Job Deleted',
        description: 'Job posting has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete job',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    form.reset({
      title: '',
      description: '',
      departmentId: '',
      designationId: '',
      jg: '',
      certificateLevel: '',
      requiredCourses: '',
      posts: '',
      experience: '',
      category: '',
      requirements: '',
      advertNumb: '',
      advertType: '',
      startDate: '',
      endDate: '',
      isActive: false
    });
  };

  const handleToggleJobStatus = (jobId: number, isActive: boolean) => {
    updateJobMutation.mutate({
      id: jobId,
      data: { isActive: !isActive }
    });
  };

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || job.departmentId?.toString() === departmentFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && job.isActive) ||
                         (statusFilter === 'inactive' && !job.isActive);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getApplicationCount = (jobId: number) => {
    return applications.filter(app => app.jobId === jobId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex">
          <Sidebar userRole="admin" />
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
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Management</h1>
                <p className="text-gray-600">Create, edit, and manage job postings</p>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
                setIsCreateModalOpen(open);
                if (!open) {
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  {/* Debug: Show all form errors for inspection */}
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="font-bold text-red-700 mb-2">Form Validation Errors:</div>
                      <ul className="text-sm text-red-700">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field}><strong>{field}:</strong> {error?.message?.toString() || JSON.stringify(error)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <DialogHeader>
                    <DialogTitle>
                      {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                    </DialogTitle>
                  </DialogHeader>                  
                  <form onSubmit={form.handleSubmit(handleCreateJob)} className="space-y-4">
                    <div className='grid grid-cols-3 gap-4'>
                      <div>
                        <Label htmlFor='advertNumb'>Advert Number:</Label>
                        <Input id='advertNumb' {...form.register('advertNumb')} placeholder='e.g., TCPSB/Open/1/2025' />
                        {form.formState.errors.advertNumb && (
                          <p className='text-sm text-red-600 mt-1'>{ form.formState.errors.advertNumb?.message}</p>
                          )}
                      </div>
                      <div>
                        <Label htmlFor='startDate'> Job Application Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          {...form.register('startDate')}
                        />
                        {form.formState.errors.startDate && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.startDate.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='endDate'>Job Application Dateline</Label>
                        <Input
                          id="endDate"
                          type="date"
                          {...form.register('endDate')}
                        />
                        {form.formState.errors.endDate && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.endDate.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Job Title</Label>
                        <Input id="title" {...form.register('title')} placeholder="e.g., ICT Officer" />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>                      
                      <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="jg">Job Group</Label>
                        <Select onValueChange={(value) => form.setValue('jg', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Job Group" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobGroups.map((group:any) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                Job Group {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.jg && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.jg.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="posts">Number of Posts</Label>
                        <Input
                          id="posts"  type="number" {...form.register('posts')}  placeholder="e.g., 5"
                          min="1"
                        />
                        {form.formState.errors.posts && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.posts.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(value) => form.setValue('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Internal">Internal</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.category && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.category.message}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="departmentId">Department</Label>
                        <Select onValueChange={(value) => form.setValue('departmentId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept:any) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.departmentId && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.departmentId.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="advertType">Advert Type</Label>
                        <Select onValueChange={(value) => form.setValue('advertType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Advert type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="First Time">First Time</SelectItem>
                            <SelectItem value="Readvertisement">Readvertisement</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.category && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.category.message}
                          </p>
                        )}
                      </div>
                    </div>                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="requiredCourses">Required Courses/Fields</Label>
                        <Select onValueChange={(value) => form.setValue('requiredCourses', value)}>                          
                          <SelectTrigger>
                            <SelectValue placeholder="Select Required Courses" />
                          </SelectTrigger>
                          <SelectContent>
                            {studyArea.map((area:any) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.requiredCourses && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.requiredCourses.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="certificateLevel">Required Certificate Level</Label>
                        <Select onValueChange={(value) => form.setValue('certificateLevel', value)} disabled={!form.watch("requiredCourses")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Certificate Level"/>                            
                          </SelectTrigger>
                          <SelectContent>
                            {certificateLevels.map((certs:any) => (
                              <SelectItem key={certs.id} value={certs.id.toString()}>
                                {certs.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.certificateLevel && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.certificateLevel.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">                      
                    </div>
                    <div>
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Provide a detailed job description..."
                        rows={8}
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>
                    <div className='grid grid-cols-3 gap-4'>                       
                      <div>
                        <Label htmlFor="designationId">Designation</Label>
                        <Select onValueChange={(value) => form.setValue('designationId', value)} disabled={form.watch("category") !== "Internal"}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {designations.map((designation:any) => (
                              <SelectItem key={designation.id} value={designation.id.toString()}>
                                {designation.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.designationId && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.designationId.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="experience">Experience Requirement</Label>
                        <Input id="experience" type='number'
                          {...form.register('experience')}
                          placeholder="e.g., 3 years"
                        />
                        {form.formState.errors.experience && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.experience.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="requirements">Required Document</Label>
                        <Select onValueChange={(value) => form.setValue('requirements', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Required Document" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Letter of promotion">Letter of promotion</SelectItem>
                            <SelectItem value="Recommendation Letter">Recommendation Letter</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.requirements && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.requirements.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createJobMutation.isPending || updateJobMutation.isPending}
                      >
                        {createJobMutation.isPending || updateJobMutation.isPending ? 
                          (editingJob ? 'Updating...' : 'Creating...') : 
                          (editingJob ? 'Update Job' : 'Create Job')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Job Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{jobs.length}</div>
                  <div className="text-gray-600">Total Jobs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {jobs.filter((job:any) => job.isActive).length}
                  </div>
                  <div className="text-gray-600">Active Jobs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{applications.length}</div>
                  <div className="text-gray-600">Total Applications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {Math.round(applications.length / Math.max(jobs.length, 1))}
                  </div>
                  <div className="text-gray-600">Avg. Applications per Job</div>
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
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept:any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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

            {/* Jobs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Job Postings ({filteredJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">No jobs found</div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      Create Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Job Title</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Applications</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Deadline</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map((job:any) => (
                          <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-600">
                                Job Group {
                                  jobGroups.find((d:any) => d.id === job.jg)?.name
                                }
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {departments.find((dept:any) => dept.id === job.departmentId)?.name}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {getApplicationCount(job.id)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {job.endDate
                                  ? new Date(job.endDate).toLocaleDateString()
                                  : 'Open'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={job.isActive}
                                  onCheckedChange={() => handleToggleJobStatus(job.id, job?.isActive)}
                                />
                                <Badge variant={job.isActive ? 'default' : 'secondary'}>
                                  {job.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewJob(job)}
                                  data-testid={`button-view-${job.id}`}
                                  title="View job details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditJob(job)}
                                  data-testid={`button-edit-${job.id}`}
                                  title="Edit job"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteJob(job.id)}
                                  data-testid={`button-delete-${job.id}`}
                                  title="Delete job"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
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
