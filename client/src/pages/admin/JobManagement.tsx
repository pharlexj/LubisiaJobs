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
import type { Job, Department, Designation, Award, CourseOffered } from '@shared/schema';
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Upload, 
  Calendar, 
  Users,
  Search,
  Filter
} from 'lucide-react';

const jobSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  departmentId: z.string().min(1, 'Please select a department'),
  designationId: z.string().optional(),
  jg: z.string().min(1, 'Please select a job group'),
  certificateLevel: z.string().min(1, 'Please select certificate level'),
  awardId: z.string().min(1, 'Please select required award'),
  requiredCourses: z.string().min(1, 'Please specify required courses'),
  posts: z.string().min(1, 'Please specify number of posts'),
  venue: z.string().min(1, 'Please specify venue'),
  experience: z.string().min(1, 'Please specify experience requirement'),
  category: z.string().min(1, 'Please select category'),
  applicationDeadline: z.string().min(1, 'Please select an application deadline'),
  requirements: z.string().optional(),
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

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['/api/public/jobs'],
  });

  const { data: config } = useQuery<{
    departments: Department[];
    designations: Designation[];
    awards: Award[];
    courses: CourseOffered[];
    certificateLevels: any[];
    jobGroups: any[];
  }>({
    queryKey: ['/api/public/config'],
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin',
  });

  const departments = config?.departments || [];
  const designations = config?.designations || [];
  const awards = config?.awards || [];
  const courses = config?.courses || [];
  const certificateLevels = config?.certificateLevels || [];
  const jobGroups = config?.jobGroups || [];

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      departmentId: '',
      designationId: '',
      jg: '',
      certificateLevel: '',
      awardId: '',
      requiredCourses: '',
      posts: '',
      venue: '',
      experience: '',
      category: '',
      applicationDeadline: '',
      requirements: '',
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      return await apiRequest('POST', '/api/admin/jobs', {
        ...data,
        departmentId: parseInt(data.departmentId),
        designationId: data.designationId ? parseInt(data.designationId) : null,
        awardId: parseInt(data.awardId),
        posts: parseInt(data.posts),
        jg: data.jg,
        certificateLevel: data.certificateLevel,
        requiredCourses: data.requiredCourses,
        venue: data.venue,
        experience: data.experience,
        category: data.category,
        requirements: data.requirements || null,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Job Created',
        description: 'Job posting has been created successfully.',
      });
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
          window.location.href = '/api/login';
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<JobFormData> }) => {
      return await apiRequest('PUT', `/api/admin/jobs/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Job Updated',
        description: 'Job posting has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] });
      setEditingJob(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
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
    createJobMutation.mutate(data);
  };

  const handleToggleJobStatus = (jobId: number, isActive: boolean) => {
    updateJobMutation.mutate({
      id: jobId,
      data: { isActive: !isActive }
    });
  };

  const filteredJobs = jobs.filter(job => {
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
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job Posting</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={form.handleSubmit(handleCreateJob)} className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          {...form.register('title')}
                          placeholder="e.g., ICT Officer"
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="applicationDeadline">Application Deadline</Label>
                        <Input
                          id="applicationDeadline"
                          type="date"
                          {...form.register('applicationDeadline')}
                        />
                        {form.formState.errors.applicationDeadline && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.applicationDeadline.message}
                          </p>
                        )}
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
                            {departments.map((dept) => (
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
                        <Label htmlFor="designationId">Designation (Optional)</Label>
                        <Select onValueChange={(value) => form.setValue('designationId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Designation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {designations.map((designation) => (
                              <SelectItem key={designation.id} value={designation.id.toString()}>
                                {designation.name} - Job Group {designation.jobGroup}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="jg">Job Group</Label>
                        <Select onValueChange={(value) => form.setValue('jg', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Job Group" />
                          </SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S'].map((group) => (
                              <SelectItem key={group} value={group}>
                                Job Group {group}
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
                          id="posts"
                          type="number"
                          {...form.register('posts')}
                          placeholder="e.g., 5"
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
                            <SelectItem value="permanent">Permanent</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="temporary">Temporary</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
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
                        <Label htmlFor="certificateLevel">Required Certificate Level</Label>
                        <Select onValueChange={(value) => form.setValue('certificateLevel', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Certificate Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="certificate">Certificate</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="degree">Bachelor's Degree</SelectItem>
                            <SelectItem value="masters">Master's Degree</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.certificateLevel && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.certificateLevel.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="awardId">Required Award/Qualification</Label>
                        <Select onValueChange={(value) => form.setValue('awardId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Award" />
                          </SelectTrigger>
                          <SelectContent>
                            {awards.map((award) => (
                              <SelectItem key={award.id} value={award.id.toString()}>
                                {award.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.awardId && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.awardId.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="requiredCourses">Required Courses/Fields</Label>
                        <Input
                          id="requiredCourses"
                          {...form.register('requiredCourses')}
                          placeholder="e.g., Computer Science, IT, Engineering"
                        />
                        {form.formState.errors.requiredCourses && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.requiredCourses.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="experience">Experience Requirement</Label>
                        <Input
                          id="experience"
                          {...form.register('experience')}
                          placeholder="e.g., 2 years minimum experience"
                        />
                        {form.formState.errors.experience && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.experience.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="venue">Work Venue/Location</Label>
                      <Input
                        id="venue"
                        {...form.register('venue')}
                        placeholder="e.g., Kitale, Trans Nzoia County"
                      />
                      {form.formState.errors.venue && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.venue.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Provide a detailed job description..."
                        rows={4}
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="requirements">Additional Requirements (Optional)</Label>
                      <Textarea
                        id="requirements"
                        {...form.register('requirements')}
                        placeholder="Any additional requirements or qualifications..."
                        rows={3}
                      />
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
                        disabled={createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
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
                    {jobs.filter(job => job.isActive).length}
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
                        {departments.map((dept) => (
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
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-600">
                                Job Group {job.designation?.jobGroup}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {job.department?.name}
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
                                {job.applicationDeadline
                                  ? new Date(job.applicationDeadline).toLocaleDateString()
                                  : 'Open'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={job.isActive}
                                  onCheckedChange={() => handleToggleJobStatus(job.id, job.isActive)}
                                />
                                <Badge variant={job.isActive ? 'default' : 'secondary'}>
                                  {job.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Upload className="w-4 h-4" />
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
