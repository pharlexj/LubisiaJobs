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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Send, Bell, Users, Mail, MessageSquare } from 'lucide-react';

const notificationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  type: z.string().min(1, "Please select notification type"),
  targetAudience: z.string().min(1, "Please select target audience"),
  priority: z.string().min(1, "Please select priority level"),
  scheduledAt: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function AdminNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/notifications'],
    enabled: !!user && user.role === 'admin',
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: '',
      targetAudience: '',
      priority: 'medium',
      scheduledAt: '',
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      return await apiRequest('POST', '/api/admin/notifications', data);
    },
    onSuccess: () => {
      toast({
        title: 'Notification Sent',
        description: 'Your notification has been sent successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  const handleCreateNotification = (data: NotificationFormData) => {
    createNotificationMutation.mutate(data);
  };

  const notificationTypes = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'system', label: 'System Alert', icon: Bell },
  ];

  const targetAudiences = [
    { value: 'all', label: 'All Users' },
    { value: 'applicants', label: 'Applicants Only' },
    { value: 'admins', label: 'Administrators Only' },
    { value: 'board', label: 'Board Members Only' },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
                <p className="text-gray-600">Send notifications to users and manage communication</p>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send New Notification</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={form.handleSubmit(handleCreateNotification)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Notification Title</Label>
                        <Input 
                          id="title" 
                          {...form.register('title')} 
                          placeholder="Enter notification title"
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="type">Notification Type</Label>
                        <Select onValueChange={(value) => form.setValue('type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select notification type" />
                          </SelectTrigger>
                          <SelectContent>
                            {notificationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center">
                                  <type.icon className="w-4 h-4 mr-2" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.type && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.type.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Select onValueChange={(value) => form.setValue('targetAudience', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetAudiences.map((audience) => (
                              <SelectItem key={audience.value} value={audience.value}>
                                {audience.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.targetAudience && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.targetAudience.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority Level</Label>
                        <Select onValueChange={(value) => form.setValue('priority', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityLevels.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.priority && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.priority.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message Content</Label>
                      <Textarea
                        id="message"
                        {...form.register('message')}
                        placeholder="Enter your notification message..."
                        rows={4}
                      />
                      {form.formState.errors.message && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.message.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="scheduledAt">Schedule for Later (Optional)</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        {...form.register('scheduledAt')}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createNotificationMutation.isPending}>
                        <Send className="w-4 h-4 mr-2" />
                        {createNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Sent</p>
                      <p className="text-3xl font-bold text-gray-900">1,234</p>
                      <p className="text-green-600 text-sm mt-1">+12% this month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Open Rate</p>
                      <p className="text-3xl font-bold text-gray-900">85%</p>
                      <p className="text-green-600 text-sm mt-1">+3% improvement</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Users</p>
                      <p className="text-3xl font-bold text-gray-900">2,456</p>
                      <p className="text-green-600 text-sm mt-1">+8% this week</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending</p>
                      <p className="text-3xl font-bold text-gray-900">23</p>
                      <p className="text-yellow-600 text-sm mt-1">Scheduled</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notification History */}
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No notifications sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline">{notification.type}</Badge>
                            <Badge className={priorityLevels.find(p => p.value === notification.priority)?.color}>
                              {priorityLevels.find(p => p.value === notification.priority)?.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.recipientCount || 0} recipients
                          </p>
                          <p className="text-xs text-gray-500">
                            {notification.status || 'Delivered'}
                          </p>
                        </div>
                      </div>
                    ))}
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