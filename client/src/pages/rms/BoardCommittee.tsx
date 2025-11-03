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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  FileScan,
  Calendar,
  Building2,
  User,
  FileCheck,
  Eye,
  Send
} from 'lucide-react';

export default function BoardCommittee() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentToView, setDocumentToView] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState<'support' | 'oppose' | 'amend' | ''>('');

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/rms/documents', { includeDetails: true }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/rms/documents?includeDetails=true');
      return response.map((d: any) => ({
        ...d.document,
        comments: d.comments,
        workflowLog: d.workflowLog,
      }));
    },
  });

  const { data: allComments } = useQuery({
    queryKey: ['/api/rms/comments', selectedDocument?.id],
    enabled: !!selectedDocument?.id,
  });

  const committeeDocuments = documents?.filter((d: any) => 
    d.status === 'sent_to_committee' && d.currentHandler === 'boardCommittee'
  ) || [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ documentId, commentData }: { documentId: number; commentData: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${documentId}/comments`, commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/comments'] });
    },
  });

  // Forward document mutation
  const forwardDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${id}/forward`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document returned to HR Office with committee input.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowReviewDialog(false);
      setSelectedDocument(null);
      setComment('');
      setRecommendation('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process document',
        variant: 'destructive',
      });
    },
  });

  const handleReturnToHR = () => {
    if (!selectedDocument || !comment.trim()) {
      toast({
        title: 'Error',
        description: 'Please add committee comments before returning',
        variant: 'destructive',
      });
      return;
    }

    addCommentMutation.mutate({
      documentId: selectedDocument.id,
      commentData: {
        comment: comment.trim(),
        commentType: 'note',
        recommendation,
        role: 'boardCommittee'
      }
    }, {
      onSuccess: () => {
        forwardDocumentMutation.mutate({
          id: selectedDocument.id,
          data: {
            toHandler: 'HR',
            toStatus: 'returned_to_hr_from_committee',
            notes: `Committee review completed - ${recommendation ? recommendation.toUpperCase() : 'REVIEWED'}`
          }
        });
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
      sent_to_committee: { label: 'Committee Review', className: 'bg-purple-500' },
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

  const getRecommendationBadge = (rec: string) => {
    const config: Record<string, { label: string; className: string }> = {
      support: { label: 'SUPPORT', className: 'bg-green-600 text-white' },
      oppose: { label: 'OPPOSE', className: 'bg-red-600 text-white' },
      amend: { label: 'AMEND', className: 'bg-yellow-600 text-white' },
    };
    const badge = config[rec] || { label: rec, className: 'bg-gray-600 text-white' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'boardCommittee'} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent" data-testid="text-page-title">
                Board Committee - Collaborative Review
              </h1>
              <p className="text-gray-600 mt-1">Review documents and provide committee input</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Committee</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="stat-pending">
                        {committeeDocuments.length}
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total">
                        {(stats as any)?.total || 0}
                      </p>
                    </div>
                    <FileText className="w-10 h-10 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Documents for Committee Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <p className="text-center py-8 text-gray-600">Loading documents...</p>
                ) : committeeDocuments.length === 0 ? (
                  <div className="text-center py-12" data-testid="text-no-documents">
                    <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No documents in committee review at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {committeeDocuments.map((doc: any) => (
                      <Card key={doc.id} className="border-l-4 border-l-purple-400 hover:shadow-md transition-shadow" data-testid={`document-card-${doc.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 mb-1" data-testid={`text-subject-${doc.id}`}>
                                    {doc.subject}
                                  </h3>
                                  <p className="text-sm text-gray-600 font-mono mb-2">
                                    Ref: {doc.referenceNumber}
                                  </p>
                                  <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Building2 className="w-4 h-4" />
                                      <span>{doc.initiatorDepartment}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{new Date(doc.documentDate).toLocaleDateString()}</span>
                                    </div>
                                    {doc.initiatorName && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex items-center gap-1">
                                          <User className="w-4 h-4" />
                                          <span>{doc.initiatorName}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    {getPriorityBadge(doc.priority)}
                                    {getStatusBadge(doc.status)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {doc.filePath && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                  data-testid={`button-view-${doc.id}`}
                                >
                                  <FileScan className="w-4 h-4 mr-1" />
                                  View PDF
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowReviewDialog(true);
                                }}
                                data-testid={`button-review-${doc.id}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Review Dialog */}
{/* Review Dialog */}
<Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
  <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Committee Review
      </DialogTitle>
    </DialogHeader>

    {selectedDocument && (
      <>
        {/* SCROLLABLE MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Document Details */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-gray-600">Reference Number</Label>
                <p className="font-mono font-semibold">
                  {selectedDocument.referenceNumber}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Document Date</Label>
                <p>{new Date(selectedDocument.documentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-gray-600">Department</Label>
                <p>{selectedDocument.initiatorDepartment}</p>
              </div>
              <div>
                <Label className="text-gray-600">Document Type</Label>
                <p className="capitalize">{selectedDocument.documentType}</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Subject</Label>
              <p className="font-medium text-gray-900">{selectedDocument.subject}</p>
            </div>
            <div className="flex gap-2">
              {getPriorityBadge(selectedDocument.priority)}
              {getStatusBadge(selectedDocument.status)}
            </div>
          </div>

          <Separator />

          {/* Previous Comments */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Previous Review Comments</Label>
            <div className="max-h-[180px] overflow-y-auto space-y-3 rounded-md border border-gray-100 p-2">
              {selectedDocument.comments?.length ? (
                selectedDocument.comments.map((c: any) => (
                  <div
                    key={c.id}
                    className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-teal-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {c.userRole}
                      </Badge>
                      <span className="text-[11px] text-gray-500">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No previous comments found.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Committee Comment Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Committee Input & Recommendations
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Provide the committee’s feedback and collective stance.
              </p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Enter committee comments, analysis, or recommendations..."
                className="resize-none w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-2">Committee Position</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={recommendation === 'support' ? 'default' : 'outline'}
                  className={recommendation === 'support' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setRecommendation('support')}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Support
                </Button>
                <Button
                  type="button"
                  variant={recommendation === 'oppose' ? 'default' : 'outline'}
                  className={recommendation === 'oppose' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setRecommendation('oppose')}
                >
                  Oppose
                </Button>
                <Button
                  type="button"
                  variant={recommendation === 'amend' ? 'default' : 'outline'}
                  className={recommendation === 'amend' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  onClick={() => setRecommendation('amend')}
                >
                  Amend
                </Button>
              </div>
              {recommendation && (
                <p className="text-sm text-gray-600 mt-2">
                  Position: {getRecommendationBadge(recommendation)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="flex justify-end items-center gap-3 mt-4 border-t pt-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowReviewDialog(false);
              setSelectedDocument(null);
              setComment('');
              setRecommendation('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReturnToHR}
            disabled={forwardDocumentMutation.isPending || addCommentMutation.isPending || !comment.trim()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {forwardDocumentMutation.isPending ? 'Returning...' : 'Return to HR Office'}
          </Button>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>


      {/* Document Viewer */}
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
