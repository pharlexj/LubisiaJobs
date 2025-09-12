import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/date-picker';
import { BarChart3, Download, FileText, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function AdminReports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('applications');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/admin/reports', reportType, dateRange],
    enabled: !!user && user.role === 'admin',
  });

  const reportTypes = [
    { value: 'applications', label: 'Applications Report', icon: FileText },
    { value: 'jobs', label: 'Job Postings Report', icon: Briefcase },
    { value: 'users', label: 'Users Report', icon: Users },
    { value: 'performance', label: 'Performance Report', icon: TrendingUp },
  ];

  const handleGenerateReport = () => {
    // Logic to generate and download report
    console.log('Generating report:', { reportType, dateRange });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
              <p className="text-gray-600">
                Generate and download recruitment system reports
              </p>
            </div>

            {/* Report Configuration */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Report Type</label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="w-4 h-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" placeholder="From date" />
                      <Input type="date" placeholder="To date" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateReport} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Applications</p>
                      <p className="text-3xl font-bold text-gray-900">1,234</p>
                      <p className="text-green-600 text-sm mt-1">+12% this month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">45</p>
                      <p className="text-green-600 text-sm mt-1">+3 this week</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Registered Users</p>
                      <p className="text-3xl font-bold text-gray-900">2,567</p>
                      <p className="text-green-600 text-sm mt-1">+8% this month</p>
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
                      <p className="text-gray-600 text-sm">Hire Rate</p>
                      <p className="text-3xl font-bold text-gray-900">18%</p>
                      <p className="text-green-600 text-sm mt-1">+2% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Report Preview</CardTitle>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Chart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select report parameters and click "Generate Report" to preview data</p>
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