import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, Search, Filter, Download, Eye, X } from 'lucide-react';

const subscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  notificationTypes: z.string().default('all'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export default function Notices() {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['/api/public/notices'],
  });  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      email: '',
      notificationTypes: 'all',
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (subscriptionData: SubscriptionFormData) => {
      return await apiRequest('POST', '/api/public/subscribe', subscriptionData);
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Successfully Subscribed!', 
        description: `You'll receive notice updates at ${form.getValues('email')}. Check your email for confirmation.`,
        duration: 5000
      });
      form.reset();
    },
    onError: (error: any) => {
      let title = 'Subscription Failed';
      let message = 'Failed to subscribe. Please try again.';
      
      // Handle specific error cases
      if (error.status === 409) {
        title = 'Already Subscribed';
        message = 'This email is already subscribed to notifications.';
      } else if (error.message) {
        message = error.message;
      }
      
      toast({ 
        title, 
        description: message, 
        variant: 'destructive' 
      });
    }
  });

  const onSubmit = (data: SubscriptionFormData) => {
    subscribeMutation.mutate(data);
  };

  // Map UI labels to database types
  const categoryTypeMap: { [key: string]: string | null } = {
    'All': null,
    'Announcements': 'announcement',
    'Interviews': 'interview',
    'Updates': 'update',
    'Urgent': 'urgent',
    'General': 'general'
  };

  // Filter notices based on search term, category, and date range
  const filteredNotices = (notices as any[])?.filter((notice: any) => {
    const matchesSearch = !searchTerm || 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const expectedType = categoryTypeMap[selectedCategory];
    const matchesCategory = expectedType === null || 
      notice.type === expectedType ||
      (!notice.type && expectedType === 'general');
    
    const matchesDateRange = (() => {
      if (!dateRange.start && !dateRange.end) return true;
      
      const noticeDate = new Date(notice.publishedAt || notice.createdAt);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      if (startDate && endDate) {
        return noticeDate >= startDate && noticeDate <= endDate;
      } else if (startDate) {
        return noticeDate >= startDate;
      } else if (endDate) {
        return noticeDate <= endDate;
      }
      return true;
    })();
    
    return matchesSearch && matchesCategory && matchesDateRange;
  }) || [];

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setDateRange({ start: '', end: '' });
    toast({ title: 'Filters Cleared', description: 'All filters have been reset.' });
  };

  const applyDateRange = () => {
    setShowFilterOptions(false);
    toast({ 
      title: 'Date Filter Applied', 
      description: `Showing notices ${dateRange.start ? `from ${dateRange.start}` : ''}${dateRange.start && dateRange.end ? ' ' : ''}${dateRange.end ? `to ${dateRange.end}` : ''}` 
    });
  };

  const openNoticeModal = (notice: any) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
  };

  const downloadNoticeHtml = (notice: any) => {
    // Create a simple HTML content for PDF generation
    const content = `
      <html>
        <head>
          <title>${notice.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${notice.title}</div>
            <div class="meta">Type: ${notice.type || 'General'} | Date: ${formatDate(notice.publishedAt || notice.createdAt)}</div>
          </div>
          <div class="content">
            ${notice.content}
          </div>
        </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notice.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ 
      title: 'Download Started', 
      description: 'Notice has been downloaded as HTML file.' 
    });
  };

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
                    data-testid="input-search-notices"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  data-testid="button-clear-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilterOptions(!showFilterOptions)}
                  data-testid="button-date-range"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </div>

            {/* Date Range Filter */}
            {showFilterOptions && (
              <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
                <h4 className="font-medium mb-3 text-gray-900">Filter by Date Range</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      data-testid="input-date-start"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      data-testid="input-date-end"
                    />
                  </div>
                  <Button 
                    onClick={applyDateRange}
                    data-testid="button-apply-date-range"
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notice Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'Announcements', 'Interviews', 'Updates', 'Urgent', 'General'].map((category) => (
            <Badge
              key={category}
              variant={category === selectedCategory ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2"
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-category-${category.toLowerCase()}`}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Notices List */}
        <div className="space-y-6">
          {filteredNotices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {(notices as any)?.length === 0 ? 'No Notices Available' : 'No Notices Match Your Search'}
                </h3>
                <p className="text-gray-600">
                  {(notices as any)?.length === 0 
                    ? 'There are currently no published notices. Please check back later for updates.'
                    : 'Try adjusting your search terms or selected category to find notices.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotices.map((notice: any) => (
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
                          onClick={() => openNoticeModal(notice)}
                          data-testid={`button-read-notice-${notice.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Read Full Notice
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadNoticeHtml(notice)}
                          data-testid={`button-download-notice-${notice.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
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

        {/* Results Summary */}
        {(notices as any)?.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Showing {filteredNotices.length} of {(notices as any).length} notices
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter your email address"
                            data-testid="input-email-subscription"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    data-testid="button-subscribe"
                  >
                    {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
              </form>
            </Form>
            <p className="text-xs text-gray-500 mt-3">
              You can unsubscribe at any time. We respect your privacy.
            </p>
          </CardContent>
        </Card>

        {/* Notice Detail Modal */}
        <Dialog open={showNoticeModal} onOpenChange={setShowNoticeModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="pr-8">{selectedNotice?.title}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedNotice && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={getNoticeTypeColor(selectedNotice.type || 'general')}>
                    {selectedNotice.type?.charAt(0).toUpperCase() + selectedNotice.type?.slice(1) || 'General'}
                  </Badge>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(selectedNotice.publishedAt || selectedNotice.createdAt)}
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedNotice.content}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadNoticeHtml(selectedNotice)}
                    data-testid="button-download-modal"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Notice
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNoticeModal(false)}
                    data-testid="button-close-modal"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
