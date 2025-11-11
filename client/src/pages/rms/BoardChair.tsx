import { useState, useRef } from 'react';
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
  Clock, 
  CheckCircle, 
  MessageSquare,
  Send,
  Eye,
  Calendar,
  Building2,
  User,
  FileCheck,
  FileScan,
  FlagIcon
} from 'lucide-react';
import { CornerUpLeft } from 'lucide-react';

export default function BoardChair() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentToView, setDocumentToView] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | 'defer' | ''>('');
  const remarksRef = useRef<HTMLTextAreaElement | null>(null);

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

  const pendingDocuments = (documents as any)?.filter((d: any) => 
    d.status === 'sent_to_chair' || d.currentHandler === 'boardChair'
  ) || [];

  // Add remark/decision mutation
  const addRemarkMutation = useMutation({
    mutationFn: async ({ documentId, remarkData }: { documentId: number; remarkData: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${documentId}/comments`, remarkData);
    },
    onSuccess: () => {
      toast({
        title: 'Remark Added',
        description: 'Your remarks have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/comments'] });
      queryClient.removeQueries({ queryKey: ['/api/rms/documents', selectedDocument?.id] });
      setRemarks('');
      setDecision('');
      setShowReviewDialog(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add remark',
        variant: 'destructive',
      });
    },
  });

  // Forward document mutation
  const forwardDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${id}/forward`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Document Forwarded',
        description: 'Document has been returned to Board Secretary.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowReviewDialog(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to forward document',
        variant: 'destructive',
      });
    },
  });

  const handleAddRemark = () => {
    if (!selectedDocument || !remarks.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your remarks',
        variant: 'destructive',
      });
      return;
    }

    addRemarkMutation.mutate({
      documentId: selectedDocument.id,
      remarkData: {
        comment: remarks.trim(),
        commentType: 'decision',
        recommendation: decision,
        role: 'boardChair'
      }
    });
  };

  const handleForwardToHR = () => {
    if (!selectedDocument) return;

    if (!remarks.trim()) {
      toast({
        title: 'Error',
        description: 'Please add your remarks before forwarding',
        variant: 'destructive',
      });
      return;
    }

    // First add the remark, then forward
    addRemarkMutation.mutate({
      documentId: selectedDocument.id,
      remarkData: {
        comment: remarks.trim(),
        commentType: 'decision',
        recommendation: decision,
        role: 'boardChair'
      }
    }, {
      onSuccess: () => {
        // After remark is added, forward back to Board Secretary
        forwardDocumentMutation.mutate({
					id: selectedDocument.id,
					data: {
						toHandler: "boardSecretary",
						// Use an enum value that exists in the database. The codebase's schema includes
						// 'returned_to_secretary_from_chair' but the DB may not have been migrated —
						// use 'forwarded_to_secretary' which is the canonical in-DB value.
						toStatus: "returned_to_secretary_from_chair",
						notes: `Reviewed by Board Chairperson - ${
							decision ? decision.toUpperCase() : "REMARKS ADDED"
						}`,
					},
				});
      }
    });
  };

  const handleViewDocument = (doc: any) => {
    if (doc.filePath) {
      // Transform to match DocumentViewer interface
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
      received: { label: 'Received', className: 'bg-blue-500' },
      forwarded_to_secretary: { label: 'With Secretary', className: 'bg-yellow-500' },
      commented_by_secretary: { label: 'Secretary Reviewed', className: 'bg-green-500' },
      sent_to_chair: { label: 'Pending Review', className: 'bg-purple-500' },
      commented_by_chair: { label: 'Chair Reviewed', className: 'bg-green-600' },
      sent_to_hr: { label: 'With HR', className: 'bg-indigo-500' },
      board_meeting: { label: 'Board Meeting', className: 'bg-orange-500' },
      decision_made: { label: 'Decision Made', className: 'bg-green-600' },
      dispatched: { label: 'Dispatched', className: 'bg-gray-500' },
      filed: { label: 'Filed', className: 'bg-slate-500' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={`${config.className} text-white`} data-testid={`status-${status}`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { className: string }> = {
      urgent: { className: 'bg-red-600 text-white' },
      high: { className: 'bg-orange-600 text-white' },
      normal: { className: 'bg-blue-600 text-white' },
      low: { className: 'bg-gray-600 text-white' },
    };
    const config = priorityConfig[priority] || { className: 'bg-gray-600 text-white' };
    return <Badge className={config.className} data-testid={`priority-${priority}`}>{priority.toUpperCase()}</Badge>;
  };

  const getDecisionBadge = (dec: string) => {
    const config: Record<string, { label: string; className: string }> = {
      approve: { label: 'APPROVE', className: 'bg-green-600 text-white' },
      reject: { label: 'REJECT', className: 'bg-red-600 text-white' },
      defer: { label: 'DEFER', className: 'bg-yellow-600 text-white' },
    };
    const badge = config[dec] || { label: dec, className: 'bg-gray-600 text-white' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'boardChair'} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent" data-testid="text-page-title">
                Board Chairperson - Document Review
              </h1>
              <p className="text-gray-600 mt-1">Review documents and provide final remarks</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-purple-500">
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
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Urgent</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-urgent">
                        {(stats as any)?.urgent || 0}
                      </p>
                    </div>
                    <FlagIcon className="w-10 h-10 text-green-700" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reviewed</p>
                      <p className="text-2xl font-bold text-green-300" data-testid="stat-reviewed">
                        {(stats as any)?.chairCommented || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Documents for Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <p className="text-center py-8 text-gray-600">Loading documents...</p>
                ) : pendingDocuments.length === 0 ? (
                  <div className="text-center py-12" data-testid="text-no-documents">
                    <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No documents pending your review at this time.</p>
                    <p className="text-sm text-gray-500 mt-2">All documents have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDocuments.map((doc: any) => (
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
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col" data-testid="dialog-review-document">
          <DialogHeader>
            <DialogTitle className="text-xl">Board Chairperson Review</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Document Details */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-600">Reference Number</Label>
                      <p className="font-mono font-semibold">{selectedDocument.referenceNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Document Date</Label>
                      <p className="font-medium">{new Date(selectedDocument.documentDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Department</Label>
                      <p className="font-medium">{selectedDocument.initiatorDepartment}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Document Type</Label>
                      <p className="font-medium capitalize">{selectedDocument.documentType}</p>
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
                {Array.isArray(allComments) && (allComments as any).length > 0 && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Previous Comments & Recommendations</Label>
                      <div className="space-y-3">
                        {(allComments as any).map((comment: any) => (
                          <div key={comment.id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-teal-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {comment.userRole === 'boardSecretary' ? 'Board Secretary' : comment.userRole}
                                </Badge>
                                {comment.recommendation && (
                                  <Badge className="text-xs bg-blue-100 text-blue-800">
                                    {comment.recommendation.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Prefill remarks with a short reply context and focus textarea
                                    const prefix = `Reply to ${comment.userRole}: `;
                                    setRemarks(prefix);
                                    // small timeout to ensure textarea is mounted/focused
                                    setTimeout(() => remarksRef.current?.focus(), 0);
                                  }}
                                  aria-label="Reply to comment"
                                >
                                  <CornerUpLeft className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Chairperson Remarks Form */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      Board Chairperson's Remarks & Decision
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Your remarks will be stamped on the document as the final decision from the Board Chair.
                    </p>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      ref={remarksRef}
                      placeholder="Enter your remarks, observations, and final decision..."
                      rows={6}
                      className="resize-none"
                      data-testid="input-remarks"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2">Decision</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={decision === 'approve' ? 'default' : 'outline'}
                        className={decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setDecision('approve')}
                        data-testid="button-decision-approve"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant={decision === 'reject' ? 'default' : 'outline'}
                        className={decision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setDecision('reject')}
                        data-testid="button-decision-reject"
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        variant={decision === 'defer' ? 'default' : 'outline'}
                        className={decision === 'defer' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        onClick={() => setDecision('defer')}
                        data-testid="button-decision-defer"
                      >
                        Defer
                      </Button>
                    </div>
                    {decision && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {getDecisionBadge(decision)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedDocument(null);
                setRemarks('');
                setDecision('');
              }}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleAddRemark}
              disabled={addRemarkMutation.isPending || !remarks.trim()}
              data-testid="button-save-remarks"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {addRemarkMutation.isPending ? 'Saving...' : 'Save Remarks'}
            </Button>
            <Button
              onClick={handleForwardToHR}
              disabled={forwardDocumentMutation.isPending || addRemarkMutation.isPending || !remarks.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
              data-testid="button-return-to-secretary"
            >
              <Send className="w-4 h-4 mr-2" />
              {forwardDocumentMutation.isPending ? 'Returning...' : 'Return to Board Secretary'}
            </Button>
          </DialogFooter>
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
