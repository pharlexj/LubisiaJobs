import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Archive, CheckCircle } from 'lucide-react';

export default function HR() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  const pendingDocuments = documents?.filter((d: any) => 
    d.status === 'sent_to_hr' || d.currentHandler === 'HR'
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'HR'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                HR Office - Agenda & Filing
              </h1>
              <p className="text-gray-600 mt-1">Manage board meeting agendas and file documents</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">For Agenda</p>
                      <p className="text-2xl font-bold text-indigo-600" data-testid="stat-pending">
                        {pendingDocuments.length}
                      </p>
                    </div>
                    <Calendar className="w-10 h-10 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">At Meeting</p>
                      <p className="text-2xl font-bold text-orange-600" data-testid="stat-at-meeting">
                        {stats?.atBoardMeeting || 0}
                      </p>
                    </div>
                    <FileText className="w-10 h-10 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Decided</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-decided">
                        {stats?.decided || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Filed</p>
                      <p className="text-2xl font-bold text-gray-600" data-testid="stat-filed">
                        {stats?.filed || 0}
                      </p>
                    </div>
                    <Archive className="w-10 h-10 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documents for Agenda Setting</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingDocuments.length === 0 ? (
                  <p className="text-center py-8 text-gray-600" data-testid="text-no-documents">
                    No documents pending agenda setting at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Agenda management and filing functionality coming soon...
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
