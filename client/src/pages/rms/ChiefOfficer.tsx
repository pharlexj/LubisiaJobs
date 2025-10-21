import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, MessageSquare } from 'lucide-react';

export default function ChiefOfficer() {
  const { user } = useAuth();

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents } = useQuery<any[]>({
    queryKey: ['/api/rms/documents'],
  });

  const relevantDocuments = documents?.filter((d: any) => 
    d.currentHandler === 'chiefOfficer' || d.status === 'sent_to_committee'
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'chiefOfficer'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Chief Officer - Decision Oversight
              </h1>
              <p className="text-gray-600 mt-1">Provide input and oversight on board decisions</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">For Review</p>
                      <p className="text-2xl font-bold text-blue-600" data-testid="stat-pending">
                        {relevantDocuments.length}
                      </p>
                    </div>
                    <Eye className="w-10 h-10 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total">
                        {stats?.total || 0}
                      </p>
                    </div>
                    <FileText className="w-10 h-10 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Comments Made</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-comments">
                        {stats?.inProgress || 0}
                      </p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documents for Review</CardTitle>
              </CardHeader>
              <CardContent>
                {relevantDocuments.length === 0 ? (
                  <p className="text-center py-8 text-gray-600" data-testid="text-no-documents">
                    No documents pending your review at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Document review and input functionality coming soon...
                    </p>
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
