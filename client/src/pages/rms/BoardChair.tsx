import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle } from 'lucide-react';

export default function BoardChair() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  const pendingDocuments = documents?.filter((d: any) => 
    d.status === 'sent_to_chair' || d.currentHandler === 'boardChair'
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'boardChair'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Board Chairperson - Document Review
              </h1>
              <p className="text-gray-600 mt-1">Review and add final remarks</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="stat-pending">
                        {pendingDocuments.length}
                      </p>
                    </div>
                    <Clock className="w-10 h-10 text-purple-600" />
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
                      <p className="text-sm text-gray-600">Reviewed</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-reviewed">
                        {stats?.inProgress || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600" />
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
                {pendingDocuments.length === 0 ? (
                  <p className="text-center py-8 text-gray-600" data-testid="text-no-documents">
                    No documents pending your review at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Document review and remarks functionality coming soon...
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
