import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import JobCard from '@/components/job/JobCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { apiRequest } from '@/lib/queryClient';

export default function Jobs() {
  // const { isAuthenticated } = useAuth();
   const { isAuthenticated, user, applicantProfile,redirectUrl } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedJobGroup, setSelectedJobGroup] = useState<string>('all');
  const { data: config, isLoading } = usePublicConfig();  
  const departments = config?.departments || [];
  const jobGroups = config?.jobGroups || [];
  const jobs = config?.jobs || [];  
  const counties = config?.counties || [];
  
  const filteredJobs = jobs.filter(job => { 
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || job.departmentId?.toString() === selectedDepartment;
    const matchesJobGroup = selectedJobGroup === 'all' || job.jg?.toString() === selectedJobGroup;
    
    return matchesSearch && matchesDepartment && matchesJobGroup;
  });
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Opportunities</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover exciting career opportunities in public service. Join us in building 
            a better Trans Nzoia County through dedicated public service.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{jobs.length}</div>
              <div className="text-gray-600">Active Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">{departments.length}</div>
              <div className="text-gray-600">Departments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{jobGroups.length}</div>
              <div className="text-gray-600">Job Groups</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">{counties.length}</div>
              <div className="text-gray-600">Counties</div>
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
                    placeholder="Search jobs by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full sm:w-48">
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
                <Select value={selectedJobGroup} onValueChange={setSelectedJobGroup}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Job Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {jobGroups.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        Group {group.name}
                      </SelectItem>
                    ))}
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

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
            <MapPin className="w-3 h-3 mr-1" />
            Trans Nzoia
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
            <Briefcase className="w-3 h-3 mr-1" />
            Full Time
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
            New Positions
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
            Remote Friendly
          </Badge>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedDepartment !== 'all' || selectedJobGroup !== 'all'
                  ? 'No jobs match your current filters. Try adjusting your search criteria.'
                  : 'There are currently no active job postings. Check back soon for new opportunities!'}
              </p>
              {(searchTerm || selectedDepartment !== 'all' || selectedJobGroup !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('all');
                    setSelectedJobGroup('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </p>
              <Select defaultValue="newest">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="deadline">Deadline Soon</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                key={job.id}
                job={job}
                applicantProfile={applicantProfile}
                applyToJob={async (jobId: number) => {
                  try {
                    const res = await apiRequest("POST", "/api/applicant/apply", { jobId });
                    if (!res || res.error) {
                      throw new Error(res?.message || "Application failed");
                    }
                    return res; // server returns application object
                  } catch (err: any) {
                    // throw so react-query onError can catch it
                    throw new Error(err.message || "Server error");
                  }
                }}
              />

              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        {!isAuthenticated && (
          <Card className="mt-12">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start Your Career in Public Service?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Create your account today to apply for jobs, track your applications, 
                and build your profile for future opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Create Account
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
