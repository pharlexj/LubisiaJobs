import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Search, Filter, Download, Eye } from 'lucide-react';

export default function Notices() {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['/api/public/notices'],
  });  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');

  const getNoticeTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'interview':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Official Notices</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest announcements, interview schedules, 
            and important information from Trans Nzoia County Public Service Board.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search notices..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: 'Filter Options', description: 'Advanced filters coming soon!' })}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: 'Date Range', description: 'Date filtering coming soon!' })}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notice Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'Announcements', 'Interviews', 'Updates', 'Urgent', 'General'].map((category) => (
            <Badge
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Notices List */}
        <div className="space-y-6">
          {(notices as any)?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notices Available</h3>
                <p className="text-gray-600">
                  There are currently no published notices. Please check back later for updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            (notices as any).map((notice: any) => (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getNoticeTypeColor(notice.type || 'general')}>
                          {notice.type?.charAt(0).toUpperCase() + notice.type?.slice(1) || 'General'}
                        </Badge>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(notice.publishedAt || notice.createdAt)}
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold text-gray-900 mb-3">
                        {notice.title}
                      </h2>

                      <div className="prose prose-sm max-w-none text-gray-600 mb-4">
                        <p className="line-clamp-3">
                          {notice.content}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast({ title: 'Notice Details', description: `Opening full notice: ${notice.title}` })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Read Full Notice
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast({ title: 'Download', description: `Downloading PDF for: ${notice.title}` })}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>

                    {/* Priority indicator for urgent notices */}
                    {notice.type === 'urgent' && (
                      <div className="mt-4 lg:mt-0 lg:ml-6">
                        <div className="bg-red-100 border border-red-200 rounded-lg p-3 text-center">
                          <div className="text-red-600 font-semibold text-sm">URGENT</div>
                          <div className="text-red-500 text-xs">Immediate Attention Required</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {(notices as any).length > 0 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => toast({ title: 'Loading More', description: 'Loading additional notices...' })}
            >
              Load More Notices
            </Button>
          </div>
        )}

        {/* Notice Subscription */}
        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Subscribe to receive email notifications when new notices are published. 
              Never miss important updates about job opportunities and recruitment processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email address" 
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (email) {
                    toast({ title: 'Subscribed!', description: `You'll receive updates at ${email}` });
                    setEmail('');
                  } else {
                    toast({ title: 'Email Required', description: 'Please enter a valid email address', variant: 'destructive' });
                  }
                }}
              >
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              You can unsubscribe at any time. We respect your privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
