import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  FileCheck
} from 'lucide-react';

export default function BoardSecretary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState<'approve' | 'reject' | 'revise' | ''>('');

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  // Filter documents that need secretary review
  const pendingDocuments = documents?.filter((d: any) => 
    d.status === 'forwarded_to_secretary' || d.currentHandler === 'boardSecretary'
  ) || [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ documentId, commentData }: { documentId: number; commentData: any }) => {
      return await apiRequest('POST', `/api/rms/documents/${documentId}/comments`, commentData);
    },
    onSuccess: () => {
      toast({
        title: 'Comment Added',
        description: 'Your comment has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setComment('');
      setRecommendation('');
      setShowReviewDialog(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
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
        description: 'Document has been forwarded to Board Chairperson.',
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

  const handleAddComment = () => {
    if (!selectedDocument || !comment.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    addCommentMutation.mutate({
      documentId: selectedDocument.id,
      commentData: {
        comment: comment.trim(),
        commentType: 'recommendation',
        recommendation,
        role: 'boardSecretary'
      }
    });
  };

  const handleForwardToChair = () => {
    if (!selectedDocument) return;

    if (!comment.trim()) {
      toast({
        title: 'Error',
        description: 'Please add your review comments before forwarding',
        variant: 'destructive',
      });
      return;
    }

    // First add the comment, then forward
    addCommentMutation.mutate({
      documentId: selectedDocument.id,
      commentData: {
        comment: comment.trim(),
        commentType: 'recommendation',
        recommendation,
        role: 'boardSecretary'
      }
    }, {
      onSuccess: () => {
        // After comment is added, forward the document
        forwardDocumentMutation.mutate({
          id: selectedDocument.id,
          data: {
            toHandler: 'boardChair',
            toStatus: 'sent_to_chair',
            notes: `Reviewed by Board Secretary - ${recommendation ? recommendation.toUpperCase() : 'NO RECOMMENDATION'}`
          }
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      received: { label: 'Received', className: 'bg-blue-500' },
      forwarded_to_secretary: { label: 'Pending Review', className: 'bg-yellow-500' },
      commented_by_secretary: { label: 'Reviewed', className: 'bg-green-500' },
      sent_to_chair: { label: 'With Chairperson', className: 'bg-purple-500' },
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

  const getRecommendationBadge = (rec: string) => {
    const config: Record<string, { label: string; className: string }> = {
      approve: { label: 'APPROVE', className: 'bg-green-600 text-white' },
      reject: { label: 'REJECT', className: 'bg-red-600 text-white' },
      revise: { label: 'REVISE', className: 'bg-yellow-600 text-white' },
    };
    const badge = config[rec] || { label: rec, className: 'bg-gray-600 text-white' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'boardSecretary'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent" data-testid="text-page-title">
                Board Secretary - Records Review
              </h1>
              <p className="text-gray-600 mt-1">Review and comment on documents</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">
                        {pendingDocuments.length}
                      </p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
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
              <Card className="border-l-4 border-l-green-500">
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
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
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
                    <p className="text-sm text-gray-500 mt-2">All documents have been reviewed and forwarded.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDocuments.map((doc: any) => (
                      <Card key={doc.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow" data-testid={`document-card-${doc.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-review-document">
          <DialogHeader>
            <DialogTitle className="text-xl">Review Document</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Details */}
              <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 p-4 rounded-lg space-y-3">
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

              {/* Contact Information */}
              {(selectedDocument.initiatorName || selectedDocument.initiatorEmail || selectedDocument.initiatorPhone) && (
                <>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Contact Information</Label>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      {selectedDocument.initiatorName && (
                        <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedDocument.initiatorName}</span></p>
                      )}
                      {selectedDocument.initiatorEmail && (
                        <p><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedDocument.initiatorEmail}</span></p>
                      )}
                      {selectedDocument.initiatorPhone && (
                        <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedDocument.initiatorPhone}</span></p>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Comment Form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    Board Secretary's Review & Comments
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Your comments will be stamped on the document and visible to all reviewers in the workflow.
                  </p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your review comments, recommendations, and remarks..."
                    rows={6}
                    className="resize-none"
                    data-testid="input-comment"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-2">Recommendation</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={recommendation === 'approve' ? 'default' : 'outline'}
                      className={recommendation === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => setRecommendation('approve')}
                      data-testid="button-recommend-approve"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant={recommendation === 'reject' ? 'default' : 'outline'}
                      className={recommendation === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                      onClick={() => setRecommendation('reject')}
                      data-testid="button-recommend-reject"
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant={recommendation === 'revise' ? 'default' : 'outline'}
                      className={recommendation === 'revise' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                      onClick={() => setRecommendation('revise')}
                      data-testid="button-recommend-revise"
                    >
                      Needs Revision
                    </Button>
                  </div>
                  {recommendation && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {getRecommendationBadge(recommendation)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedDocument(null);
                setComment('');
                setRecommendation('');
              }}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !comment.trim()}
              data-testid="button-save-comment"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {addCommentMutation.isPending ? 'Saving...' : 'Save Comment'}
            </Button>
            <Button
              onClick={handleForwardToChair}
              disabled={forwardDocumentMutation.isPending || addCommentMutation.isPending || !comment.trim()}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              data-testid="button-forward-to-chair"
            >
              <Send className="w-4 h-4 mr-2" />
              {forwardDocumentMutation.isPending ? 'Forwarding...' : 'Forward to Board Chair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
