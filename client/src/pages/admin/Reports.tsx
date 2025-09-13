import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Download, FileText, Users, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('applications');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  // Query for fetching report stats (dashboard data)
  const { data: statsData, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/admin/reports', 'performance'],
    enabled: !!user && user.role === 'admin',
    queryFn: () => apiRequest('GET', `/api/admin/reports?type=performance`),
  });

  // Mutation for generating reports
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ type: reportType });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      return await apiRequest('GET', `/api/admin/reports?${params.toString()}`);
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({
        title: 'Report Generated',
        description: 'Your report has been generated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    },
  });

  // Mutation for downloading reports as CSV
  const downloadReportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const params = new URLSearchParams({ type: reportType, format });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/admin/reports/download?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Download Started',
        description: 'Your report download has started.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download report',
        variant: 'destructive',
      });
    },
  });

  const reportTypes = [
    { value: 'applications', label: 'Applications Report', icon: FileText },
    { value: 'jobs', label: 'Job Postings Report', icon: Briefcase },
    { value: 'users', label: 'Users Report', icon: Users },
    { value: 'performance', label: 'Performance Report', icon: TrendingUp },
  ];

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  const handleDownloadReport = (format: 'csv' | 'json') => {
    downloadReportMutation.mutate(format);
  };

  const handleDateReset = () => {
    setStartDate('');
    setEndDate('');
    setReportData(null);
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
                      <SelectTrigger data-testid="select-report-type">
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
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        data-testid="input-start-date"
                        placeholder="Start date"
                      />
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        data-testid="input-end-date"
                        placeholder="End date"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleGenerateReport} 
                      disabled={generateReportMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-report"
                    >
                      {generateReportMutation.isPending ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                    {startDate || endDate ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDateReset}
                        data-testid="button-reset-dates"
                      >
                        Clear Dates
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="w-12 h-12 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm" data-testid="text-total-applications">Total Applications</p>
                          <p className="text-3xl font-bold text-gray-900" data-testid="value-total-applications">
                            {statsData?.overallMetrics?.totalApplications || '0'}
                          </p>
                          <p className="text-green-600 text-sm mt-1">Real-time data</p>
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
                          <p className="text-gray-600 text-sm" data-testid="text-total-jobs">Total Jobs</p>
                          <p className="text-3xl font-bold text-gray-900" data-testid="value-total-jobs">
                            {statsData?.overallMetrics?.totalJobs || '0'}
                          </p>
                          <p className="text-green-600 text-sm mt-1">Active positions</p>
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
                          <p className="text-gray-600 text-sm" data-testid="text-total-hired">Total Hired</p>
                          <p className="text-3xl font-bold text-gray-900" data-testid="value-total-hired">
                            {statsData?.overallMetrics?.totalHired || '0'}
                          </p>
                          <p className="text-green-600 text-sm mt-1">Successful hires</p>
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
                          <p className="text-gray-600 text-sm" data-testid="text-hire-rate">Hire Rate</p>
                          <p className="text-3xl font-bold text-gray-900" data-testid="value-hire-rate">
                            {statsData?.overallMetrics?.hireRate || '0'}%
                          </p>
                          <p className="text-green-600 text-sm mt-1">Success rate</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Report Preview</CardTitle>
                  {reportData && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadReport('csv')}
                        disabled={downloadReportMutation.isPending}
                        data-testid="button-download-csv"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadReport('json')}
                        disabled={downloadReportMutation.isPending}
                        data-testid="button-download-json"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        JSON
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generateReportMutation.isPending ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : generateReportMutation.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {generateReportMutation.error?.message || 'Failed to generate report'}
                    </AlertDescription>
                  </Alert>
                ) : reportData ? (
                  <div className="space-y-6" data-testid="report-preview">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Report Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {Object.entries(reportData.summary || {}).map(([key, value]) => (
                          <div key={key}>
                            <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-2xl font-bold">{value as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {reportData.data && reportData.data.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Sample Data (First 5 Records)</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b">
                                {Object.keys(reportData.data[0]).map(key => (
                                  <th key={key} className="text-left p-2 border-r">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.data.slice(0, 5).map((row: any, index: number) => (
                                <tr key={index} className="border-b">
                                  {Object.values(row).map((value: any, cellIndex: number) => (
                                    <td key={cellIndex} className="p-2 border-r">
                                      {value?.toString() || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {reportData.data.length > 5 && (
                          <p className="text-gray-500 text-sm mt-2">
                            Showing 5 of {reportData.data.length} records. Download the full report to see all data.
                          </p>
                        )}
                      </div>
                    )}
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