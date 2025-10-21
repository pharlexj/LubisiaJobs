import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Archive, CheckCircle, ArrowRight, FileCheck, FileScan, Building2, User } from 'lucide-react';

export default function HR() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentToView, setDocumentToView] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  const fromSecretaryDocuments = documents?.filter((d: any) => 
    d.status === 'sent_to_hr' && d.currentHandler === 'HR'
  ) || [];

  const fromCommitteeDocuments = documents?.filter((d: any) => 
    d.status === 'returned_to_hr_from_committee'
  ) || [];

  const forwardDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${id}/forward`, data);
    },
    onSuccess: (_, variables) => {
      const actionMessage = variables.data.toStatus === 'sent_to_committee' ? 'forwarded to Board Committee' :
                          'returned to Board Secretary';
      toast({
        title: 'Success',
        description: `Document ${actionMessage}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process document',
        variant: 'destructive',
      });
    },
  });

  const handleForwardToCommittee = (doc: any) => {
    setSelectedDocument(doc);
    forwardDocumentMutation.mutate({
      id: doc.id,
      data: {
        toHandler: 'boardCommittee',
        toStatus: 'sent_to_committee',
        notes: 'Forwarded to Board Committee for review'
      }
    });
  };

  const handleReturnToSecretary = (doc: any) => {
    setSelectedDocument(doc);
    forwardDocumentMutation.mutate({
      id: doc.id,
      data: {
        toHandler: 'boardSecretary',
        toStatus: 'returned_to_secretary_from_hr',
        notes: 'Returned to Board Secretary after committee review'
      }
    });
  };

  const handleViewDocument = (doc: any) => {
    if (doc.filePath) {
      setDocumentToView({
        id: doc.id,
        type: doc.documentType,
        fileName: doc.referenceNumber + '.pdf',
        filePath: doc.filePath,
        mimeType: 'application/pdf',
        createdAt: doc.createdAt
      });
      setShowDocumentViewer(true);
    } else {
      toast({
        title: 'No Document',
        description: 'No document file attached to this record',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      sent_to_hr: { label: 'From Secretary', className: 'bg-indigo-500' },
      sent_to_committee: { label: 'With Committee', className: 'bg-purple-500' },
      returned_to_hr_from_committee: { label: 'From Committee', className: 'bg-green-500' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={`${config.className} text-white`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { className: string }> = {
      urgent: { className: 'bg-red-600 text-white' },
      high: { className: 'bg-orange-600 text-white' },
      normal: { className: 'bg-blue-600 text-white' },
      low: { className: 'bg-gray-600 text-white' },
    };
    const config = priorityConfig[priority] || { className: 'bg-gray-600 text-white' };
    return <Badge className={config.className}>{priority.toUpperCase()}</Badge>;
  };

  const renderDocumentCard = (doc: any, actionButton: React.ReactNode) => (
    <Card key={doc.id} className="border-l-4 border-l-indigo-400 hover:shadow-md transition-shadow" data-testid={`document-card-${doc.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{doc.subject}</h3>
                <p className="text-sm text-gray-600 font-mono mb-2">Ref: {doc.referenceNumber}</p>
                <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{doc.initiatorDepartment}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(doc.documentDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(doc.priority)}
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {doc.filePath && (
              <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                <FileScan className="w-4 h-4 mr-1" />
                View PDF
              </Button>
            )}
            {actionButton}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'HR'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent" data-testid="text-page-title">
                HR Office - Committee Coordination
              </h1>
              <p className="text-gray-600 mt-1">Coordinate with Board Committee</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card className="border-l-4 border-l-indigo-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">From Secretary</p>
                  <p className="text-xl font-bold text-indigo-600">{fromSecretaryDocuments.length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">From Committee</p>
                  <p className="text-xl font-bold text-green-600">{fromCommitteeDocuments.length}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="from-secretary" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="from-secretary">From Secretary ({fromSecretaryDocuments.length})</TabsTrigger>
                <TabsTrigger value="from-committee">From Committee ({fromCommitteeDocuments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="from-secretary">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50">
                    <CardTitle>Forward to Board Committee</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {fromSecretaryDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No documents from Board Secretary.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fromSecretaryDocuments.map((doc: any) => renderDocumentCard(doc,
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForwardToCommittee(doc)}
                            disabled={forwardDocumentMutation.isPending}
                            data-testid={`button-forward-committee-${doc.id}`}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            To Committee
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="from-committee">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50">
                    <CardTitle>Return to Board Secretary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {fromCommitteeDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No documents from Board Committee.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fromCommitteeDocuments.map((doc: any) => renderDocumentCard(doc,
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnToSecretary(doc)}
                            disabled={forwardDocumentMutation.isPending}
                            data-testid={`button-return-secretary-${doc.id}`}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            To Secretary
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {documentToView && (
        <DocumentViewer
          document={documentToView}
          isOpen={showDocumentViewer}
          onClose={() => {
            setShowDocumentViewer(false);
            setDocumentToView(null);
          }}
        />
      )}
    </div>
  );
}
