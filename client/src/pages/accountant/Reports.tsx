import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

export default function Reports() {
  const reportTypes = [
    {
      title: 'Financial Summary',
      description: 'Comprehensive financial overview',
      icon: FileText,
      period: 'Monthly / Quarterly / Yearly',
    },
    {
      title: 'Claims Report',
      description: 'All claims processed and pending',
      icon: FileText,
      period: 'Custom date range',
    },
    {
      title: 'Payment Vouchers',
      description: 'Payment transactions summary',
      icon: FileText,
      period: 'Monthly',
    },
    {
      title: 'Imprest Register',
      description: 'MIR advances and retirements',
      icon: FileText,
      period: 'Custom date range',
    },
    {
      title: 'Budget Utilization',
      description: 'Department budget analysis',
      icon: FileText,
      period: 'Fiscal Year',
    },
    {
      title: 'Vote Account Statement',
      description: 'Vote account transactions',
      icon: FileText,
      period: 'Custom date range',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole="accountant" />
        <main className="flex-1">
          <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">Generate and download financial reports</p>
        </div>
        <Button variant="outline" data-testid="button-schedule-report">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Types</CardTitle>
          <CardDescription>Select a report type to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <Card key={report.title} className="hover:shadow-md transition-shadow" data-testid={`card-${report.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <Button size="sm" variant="ghost" data-testid={`button-generate-${report.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base mt-3">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {report.period}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
          <CardDescription>Generate a custom report with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" data-testid="button-custom-date">
              <Calendar className="w-4 h-4 mr-2" />
              Select Date Range
            </Button>
            <Button variant="outline" data-testid="button-custom-filter">
              <Filter className="w-4 h-4 mr-2" />
              Add Filters
            </Button>
            <Button data-testid="button-generate-custom">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
        </main>
      </div>
    </div>
  );
}
