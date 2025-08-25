import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import HeroCarousel from '@/components/home/HeroCarousel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Search, UserPlus, Calendar, GraduationCap, MapPin } from 'lucide-react';
import { datetime } from 'drizzle-orm/mysql-core';

export default function Home() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/public/jobs'],
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['/api/public/notices'],
  });

  const featuredJobs = jobs.slice(0, 3);
  const recentNotices = notices.slice(0, 2);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-neutral-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-primary mb-2">150+</div>
              <div className="text-gray-600">Active Jobs</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-secondary mb-2">2,500+</div>
              <div className="text-gray-600">Applications</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-primary mb-2">85%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-secondary mb-2">19</div>
              <div className="text-gray-600">Departments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Opportunities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover exciting career opportunities across various departments in Trans Nzoia County
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{job.department?.name}</p>
                      <p className="text-primary font-medium">{job.designation?.jobGroup}</p>
                    </div>
                    <Badge variant="secondary">New</Badge>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {job.description || 'No description available'}
                    </p>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span>Bachelor's Degree Required</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Deadline: {job.applicationDeadline 
                          ? new Date(job.applicationDeadline).toLocaleDateString() 
                          : 'Open'}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              View All Jobs
              <Search className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Notices Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Latest Notices</h2>
            <Button variant="link">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentNotices.map((notice) => (
              <Card key={notice.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={notice.type === 'announcement' ? 'default' : 'secondary'}>
                      {notice.type?.charAt(0).toUpperCase() + notice.type?.slice(1)}
                    </Badge>
                    <span className="text-gray-500 text-sm">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{notice.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{notice.content}</p>
                  <Button variant="link" className="text-primary p-0 mt-3">
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to apply for your dream job
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'Create Account',
                description: 'Register with your email and verify via OTP',
              },
              {
                step: 2,
                title: 'Complete Profile',
                description: 'Fill in your personal, educational, and work details',
              },
              {
                step: 3,
                title: 'Apply for Jobs',
                description: 'Browse and apply for positions that match your qualifications',
              },
              {
                step: 4,
                title: 'Track Progress',
                description: 'Monitor your application status and receive updates',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">TNCPSB</span>
              </div>
              <p className="text-gray-300 text-sm">
                Trans Nzoia County Public Service Board - Building careers in public service excellence.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/about" className="hover:text-white">About Us</a></li>
                <li><a href="/jobs" className="hover:text-white">Job Opportunities</a></li>
                <li><a href="/faqs" className="hover:text-white">Application Process</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Recruitment</a></li>
                <li><a href="#" className="hover:text-white">Career Development</a></li>
                <li><a href="#" className="hover:text-white">HR Advisory</a></li>
                <li><a href="#" className="hover:text-white">Training</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><MapPin className="w-4 h-4 inline mr-2" />Kitale, Trans Nzoia County</p>
                <p>📞 +254 713 635 352</p>
                <p>✉️ info@cpsbtransnzoia.co.ke</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2024 Trans Nzoia County Public Service Board. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
