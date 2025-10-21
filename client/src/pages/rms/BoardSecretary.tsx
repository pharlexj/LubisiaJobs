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
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowRight,
  CalendarCheck
} from 'lucide-react';

export default function BoardSecretary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentToView, setDocumentToView] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [agendaItemNumber, setAgendaItemNumber] = useState('');
  const [boardMeetingDate, setBoardMeetingDate] = useState('');
  const [recommendation, setRecommendation] = useState<'approve' | 'reject' | 'revise' | ''>('');

  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  const { data: allComments } = useQuery({
    queryKey: ['/api/rms/comments', selectedDocument?.id],
    enabled: !!selectedDocument?.id,
  });

  // Filter documents by workflow stage
  const newDocuments = documents?.filter((d: any) => 
    d.status === 'forwarded_to_secretary' && d.currentHandler === 'boardSecretary'
  ) || [];

  const fromChairDocuments = documents?.filter((d: any) => 
    d.status === 'returned_to_secretary_from_chair'
  ) || [];

  const fromHRDocuments = documents?.filter((d: any) => 
    d.status === 'returned_to_secretary_from_hr'
  ) || [];

  const agendaDocuments = documents?.filter((d: any) => 
    d.status === 'agenda_set' || d.status === 'board_meeting'
  ) || [];

  const afterMeetingDocuments = documents?.filter((d: any) => 
    d.status === 'decision_made'
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
    onSuccess: (_, variables) => {
      const actionMessage = variables.data.toStatus === 'sent_to_chair' ? 'forwarded to Board Chairperson' :
                          variables.data.toStatus === 'sent_to_hr' ? 'forwarded to HR Office' :
                          variables.data.toStatus === 'sent_to_records' ? 'sent to Records Officer' : 'updated';
      toast({
        title: 'Success',
        description: `Document ${actionMessage}.`,
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

  // Set agenda mutation
  const setAgendaMutation = useMutation({
    mutationFn: async ({ id, agendaData }: { id: number; agendaData: any }) => {
      return await apiRequest('PATCH', `/api/rms/documents/${id}`, {
        agendaItemNumber: agendaData.agendaItemNumber,
        boardMeetingDate: agendaData.boardMeetingDate,
        status: 'agenda_set',
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      toast({
        title: 'Agenda Set',
        description: 'Document added to board meeting agenda.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowReviewDialog(false);
      setSelectedDocument(null);
      setAgendaItemNumber('');
      setBoardMeetingDate('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set agenda',
        variant: 'destructive',
      });
    },
  });

  const handleForwardToChair = () => {
    if (!selectedDocument || !comment.trim()) {
      toast({
        title: 'Error',
        description: 'Please add your review comments',
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
    }, {
      onSuccess: () => {
        forwardDocumentMutation.mutate({
          id: selectedDocument.id,
          data: {
            toHandler: 'boardChair',
            toStatus: 'sent_to_chair',
            notes: `Reviewed by Board Secretary - ${recommendation ? recommendation.toUpperCase() : 'FORWARDED'}`
          }
        });
      }
    });
  };

  const handleForwardToHR = () => {
    if (!selectedDocument) return;

    forwardDocumentMutation.mutate({
      id: selectedDocument.id,
      data: {
        toHandler: 'HR',
        toStatus: 'sent_to_hr',
        notes: 'Forwarded to HR Office after Board Chair review'
      }
    });
  };

  const handleSetAgenda = () => {
    if (!selectedDocument || !agendaItemNumber.trim() || !boardMeetingDate) {
      toast({
        title: 'Error',
        description: 'Please enter agenda item number and meeting date',
        variant: 'destructive',
      });
      return;
    }

    setAgendaMutation.mutate({
      id: selectedDocument.id,
      agendaData: {
        agendaItemNumber: agendaItemNumber.trim(),
        boardMeetingDate
      }
    });
  };

  const handleForwardToRecords = () => {
    if (!selectedDocument) return;

    forwardDocumentMutation.mutate({
      id: selectedDocument.id,
      data: {
        toHandler: 'recordsOfficer',
        toStatus: 'sent_to_records',
        notes: 'Sent to Records Officer for dispatch and filing after board meeting'
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
      received: { label: 'Received', className: 'bg-blue-500' },
      forwarded_to_secretary: { label: 'New - Needs Review', className: 'bg-yellow-500' },
      sent_to_chair: { label: 'With Chair', className: 'bg-purple-500' },
      returned_to_secretary_from_chair: { label: 'From Chair', className: 'bg-green-500' },
      sent_to_hr: { label: 'With HR', className: 'bg-indigo-500' },
      returned_to_secretary_from_hr: { label: 'From HR', className: 'bg-cyan-500' },
      agenda_set: { label: 'Agenda Set', className: 'bg-orange-500' },
      board_meeting: { label: 'In Meeting', className: 'bg-red-500' },
      decision_made: { label: 'Decision Made', className: 'bg-green-600' },
      sent_to_records: { label: 'With Records', className: 'bg-gray-500' },
      dispatched: { label: 'Dispatched', className: 'bg-gray-600' },
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

  const renderDocumentCard = (doc: any, actionButtons: React.ReactNode) => (
    <Card key={doc.id} className="border-l-4 border-l-teal-400 hover:shadow-md transition-shadow" data-testid={`document-card-${doc.id}`}>
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
            {actionButtons}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'boardSecretary'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent" data-testid="text-page-title">
                Board Secretary - Document Coordination
              </h1>
              <p className="text-gray-600 mt-1">Central hub for document workflow management</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">New Documents</p>
                  <p className="text-xl font-bold text-yellow-600">{newDocuments.length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">From Chair</p>
                  <p className="text-xl font-bold text-green-600">{fromChairDocuments.length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">From HR</p>
                  <p className="text-xl font-bold text-cyan-600">{fromHRDocuments.length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">After Meeting</p>
                  <p className="text-xl font-bold text-orange-600">{afterMeetingDocuments.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Document Workflow Tabs */}
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="new">New ({newDocuments.length})</TabsTrigger>
                <TabsTrigger value="from-chair">From Chair ({fromChairDocuments.length})</TabsTrigger>
                <TabsTrigger value="from-hr">From HR ({fromHRDocuments.length})</TabsTrigger>
                <TabsTrigger value="after-meeting">After Meeting ({afterMeetingDocuments.length})</TabsTrigger>
              </TabsList>

              {/* New Documents Tab */}
              <TabsContent value="new">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/50">
                    <CardTitle>New Documents - Forward to Board Chair</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {newDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No new documents pending review.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {newDocuments.map((doc: any) => renderDocumentCard(doc,
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
                            Review & Forward
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* From Chair Tab */}
              <TabsContent value="from-chair">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50">
                    <CardTitle>From Board Chair - Forward to HR</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {fromChairDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No documents from Board Chair.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fromChairDocuments.map((doc: any) => renderDocumentCard(doc,
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              handleForwardToHR();
                            }}
                            data-testid={`button-forward-hr-${doc.id}`}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Forward to HR
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* From HR Tab */}
              <TabsContent value="from-hr">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100/50">
                    <CardTitle>From HR - Set Agenda for Board Meeting</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {fromHRDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No documents from HR Office.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fromHRDocuments.map((doc: any) => renderDocumentCard(doc,
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowReviewDialog(true);
                            }}
                            data-testid={`button-set-agenda-${doc.id}`}
                          >
                            <CalendarCheck className="w-4 h-4 mr-1" />
                            Set Agenda
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* After Meeting Tab */}
              <TabsContent value="after-meeting">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50">
                    <CardTitle>After Board Meeting - Send to Records</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {afterMeetingDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No documents after board meeting.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {afterMeetingDocuments.map((doc: any) => renderDocumentCard(doc,
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              handleForwardToRecords();
                            }}
                            data-testid={`button-send-records-${doc.id}`}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Send to Records
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

      {/* Review/Action Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.status === 'forwarded_to_secretary' && 'Review & Forward to Board Chair'}
              {selectedDocument?.status === 'returned_to_secretary_from_hr' && 'Set Agenda for Board Meeting'}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <ScrollArea className="flex-1 pr-4">
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
                {allComments && allComments.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Previous Comments</Label>
                      <div className="space-y-3">
                        {allComments.map((c: any) => (
                          <div key={c.id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-teal-500">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">{c.userRole}</Badge>
                              <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Action Forms */}
                {selectedDocument.status === 'forwarded_to_secretary' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-2">Review Comments</Label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Enter your review comments before forwarding to Board Chair..."
                        rows={4}
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
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant={recommendation === 'reject' ? 'default' : 'outline'}
                          className={recommendation === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => setRecommendation('reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          variant={recommendation === 'revise' ? 'default' : 'outline'}
                          className={recommendation === 'revise' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          onClick={() => setRecommendation('revise')}
                        >
                          Needs Revision
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocument.status === 'returned_to_secretary_from_hr' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-2">Agenda Item Number</Label>
                      <Input
                        value={agendaItemNumber}
                        onChange={(e) => setAgendaItemNumber(e.target.value)}
                        placeholder="e.g., Item 5.2"
                        data-testid="input-agenda-number"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2">Board Meeting Date</Label>
                      <Input
                        type="date"
                        value={boardMeetingDate}
                        onChange={(e) => setBoardMeetingDate(e.target.value)}
                        data-testid="input-meeting-date"
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedDocument(null);
                setComment('');
                setRecommendation('');
                setAgendaItemNumber('');
                setBoardMeetingDate('');
              }}
            >
              Cancel
            </Button>
            {selectedDocument?.status === 'forwarded_to_secretary' && (
              <Button
                onClick={handleForwardToChair}
                disabled={forwardDocumentMutation.isPending || !comment.trim()}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {forwardDocumentMutation.isPending ? 'Forwarding...' : 'Forward to Board Chair'}
              </Button>
            )}
            {selectedDocument?.status === 'returned_to_secretary_from_hr' && (
              <Button
                onClick={handleSetAgenda}
                disabled={setAgendaMutation.isPending || !agendaItemNumber.trim() || !boardMeetingDate}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                {setAgendaMutation.isPending ? 'Setting...' : 'Set Agenda'}
              </Button>
            )}
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
