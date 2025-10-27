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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileCheck,
  TrendingUp,
  Activity,
  FileScan
} from 'lucide-react';

export default function RecordsOfficer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentToView, setDocumentToView] = useState<any>(null);

  // Form state for new document registration
  const [documentForm, setDocumentForm] = useState({
    referenceNumber: '',
    subject: '',
    initiatorDepartment: '',
    initiatorName: '',
    initiatorEmail: '',
    initiatorPhone: '',
    documentDate: '',
    documentType: 'letter',
    priority: 'normal'
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/rms/stats'],
  });

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/rms/documents'],
  });

  // Fetch departments from existing API
  const { data: config } = useQuery({
    queryKey: ['/api/public/config'],
  });
  
  const departments = (config as any)?.departments || [];

  // Register document mutation
  const registerDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/rms/documents', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to register document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Registered',
        description: 'Document has been successfully registered in the system.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowRegisterDialog(false);
      setDocumentForm({
        referenceNumber: '',
        subject: '',
        initiatorDepartment: '',
        initiatorName: '',
        initiatorEmail: '',
        initiatorPhone: '',
        documentDate: '',
        documentType: 'letter',
        priority: 'normal'
      });
      setDocumentFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register document',
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
        description: 'Document has been forwarded to Board Secretary.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowForwardDialog(false);
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

  // Dispatch document mutation
  const dispatchDocumentMutation = useMutation({
    mutationFn: async ({ id, decisionSummary }: { id: number; decisionSummary: string }) => {
      return await apiRequest('POST', `/api/rms/documents/${id}/dispatch`, { decisionSummary });
    },
    onSuccess: () => {
      toast({
        title: 'Document Dispatched',
        description: 'Decision has been communicated to the initiator.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rms/stats'] });
      setShowDispatchDialog(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to dispatch document',
        variant: 'destructive',
      });
    },
  });

  const handleRegisterDocument = () => {
    const formData = new FormData();
    Object.entries(documentForm).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (documentFile) {
      formData.append('document', documentFile);
    }
    registerDocumentMutation.mutate(formData);
  };

  const handleForwardDocument = () => {
    if (!selectedDocument) return;
    forwardDocumentMutation.mutate({
      id: selectedDocument.id,
      data: {
        toHandler: 'boardSecretary',
        toStatus: 'forwarded_to_secretary',
        notes: `Forwarded to Board Secretary for review - ${documentForm.subject || ''}`
      }
    });
  };

  const handleDispatchDocument = (decisionSummary: string) => {
    if (!selectedDocument) return;
    dispatchDocumentMutation.mutate({
      id: selectedDocument.id,
      decisionSummary
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
      forwarded_to_secretary: { label: 'With Secretary', className: 'bg-yellow-500' },
      sent_to_chair: { label: 'With Chairperson', className: 'bg-purple-500' },
      sent_to_hr: { label: 'With HR', className: 'bg-indigo-500' },
      board_meeting: { label: 'Board Meeting', className: 'bg-orange-500' },
      decision_made: { label: 'Decision Made', className: 'bg-green-500' },
      sent_to_records: { label: 'Ready to Dispatch', className: 'bg-teal-500' },
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole={user?.role || 'recordsOfficer'} />
        <main className="flex-1 p-1">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  Records Management Office
                </h1>
                <p className="text-gray-600 mt-1">Document intake, tracking, and dispatch</p>
              </div>
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
                    data-testid="button-register-document"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Register Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-register-document">
                  <DialogHeader>
                    <DialogTitle>Register New Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ref-number">Reference Number *</Label>
                        <Input
                          id="ref-number"
                          value={documentForm.referenceNumber}
                          onChange={(e) => setDocumentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          placeholder="e.g., TNPSB/2024/001"
                          data-testid="input-reference-number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="doc-date">Document Date *</Label>
                        <Input
                          id="doc-date"
                          type="date"
                          value={documentForm.documentDate}
                          onChange={(e) => setDocumentForm(prev => ({ ...prev, documentDate: e.target.value }))}
                          data-testid="input-document-date"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Textarea
                        id="subject"
                        value={documentForm.subject}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of the document"
                        rows={3}
                        data-testid="input-subject"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="doc-type">Document Type</Label>
                        <Select 
                          value={documentForm.documentType}
                          onValueChange={(value) => setDocumentForm(prev => ({ ...prev, documentType: value }))}
                        >
                          <SelectTrigger id="doc-type" data-testid="select-document-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="letter">Letter</SelectItem>
                            <SelectItem value="memo">Memo</SelectItem>
                            <SelectItem value="report">Report</SelectItem>
                            <SelectItem value="application">Application</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={documentForm.priority}
                          onValueChange={(value) => setDocumentForm(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger id="priority" data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="initiator-dept">Initiating Department *</Label>
                      <Select 
                        value={documentForm.initiatorDepartment}
                        onValueChange={(value) => setDocumentForm(prev => ({ ...prev, initiatorDepartment: value }))}
                      >
                        <SelectTrigger id="initiator-dept" data-testid="select-initiator-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length === 0 ? (
                            <SelectItem value="" disabled>
                              Loading departments...
                            </SelectItem>
                          ) : (
                            departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="initiator-name">Contact Person</Label>
                        <Input
                          id="initiator-name"
                          value={documentForm.initiatorName}
                          onChange={(e) => setDocumentForm(prev => ({ ...prev, initiatorName: e.target.value }))}
                          placeholder="Full name"
                          data-testid="input-initiator-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="initiator-phone">Phone Number</Label>
                        <Input
                          id="initiator-phone"
                          value={documentForm.initiatorPhone}
                          onChange={(e) => setDocumentForm(prev => ({ ...prev, initiatorPhone: e.target.value }))}
                          placeholder="0712345678"
                          data-testid="input-initiator-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="initiator-email">Email</Label>
                      <Input
                        id="initiator-email"
                        type="email"
                        value={documentForm.initiatorEmail}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, initiatorEmail: e.target.value }))}
                        placeholder="contact@example.com"
                        data-testid="input-initiator-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-file">Attach Document (PDF, DOC, DOCX)</Label>
                      <Input
                        id="document-file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                        data-testid="input-document-file"
                      />
                      {documentFile && (
                        <p className="text-sm text-gray-600 mt-2">Selected: {documentFile.name}</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowRegisterDialog(false)}
                      data-testid="button-cancel-register"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRegisterDocument}
                      disabled={registerDocumentMutation.isPending || !documentForm.referenceNumber || !documentForm.subject}
                      className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
                      data-testid="button-save-document"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      {registerDocumentMutation.isPending ? 'Registering...' : 'Register Document'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total">{(stats as any)?.total || 0}</p>
                    </div>
                    <FileText className="w-10 h-10 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Received</p>
                      <p className="text-2xl font-bold text-blue-600" data-testid="stat-received">{(stats as any)?.received || 0}</p>
                    </div>
                    <Clock className="w-10 h-10 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-600" data-testid="stat-in-progress">{(stats as any)?.inProgress || 0}</p>
                    </div>
                    <Activity className="w-10 h-10 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Dispatched</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-dispatched">{(stats as any)?.dispatched || 0}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documents Registry</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-gray-600">Loading documents...</p>
                ) : !documents || (documents as any[]).length === 0 ? (
                  <p className="text-center py-8 text-gray-600">No documents registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold text-gray-700">Ref. No.</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Subject</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Department</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Priority</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(documents as any[]).map((doc: any) => (
                          <tr key={doc.id} className="border-b hover:bg-gray-50" data-testid={`document-row-${doc.id}`}>
                            <td className="p-3 font-mono text-sm">{doc.referenceNumber}</td>
                            <td className="p-3 max-w-xs truncate">{doc.subject}</td>
                            <td className="p-3">{doc.initiatorDepartment}</td>
                            <td className="p-3">{getPriorityBadge(doc.priority)}</td>
                            <td className="p-3">{getStatusBadge(doc.status)}</td>
                            <td className="p-3 text-sm text-gray-600">
                              {new Date(doc.documentDate).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {doc.filePath && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewDocument(doc)}
                                    data-testid={`button-view-${doc.id}`}
                                  >
                                    <FileScan className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                                {doc.status === 'received' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowForwardDialog(true);
                                    }}
                                    data-testid={`button-forward-${doc.id}`}
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Forward
                                  </Button>
                                )}
                                {(doc.status === 'decision_made' || doc.status === 'sent_to_records') && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowDispatchDialog(true);
                                    }}
                                    data-testid={`button-dispatch-${doc.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Dispatch
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Forward Document Dialog */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent data-testid="dialog-forward-document">
          <DialogHeader>
            <DialogTitle>Forward Document to Board Secretary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-900">
                <strong>Document:</strong> {selectedDocument?.referenceNumber}<br />
                <strong>Subject:</strong> {selectedDocument?.subject}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              This document will be forwarded to the Board Secretary for review and comments.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForwardDialog(false)} data-testid="button-cancel-forward">
              Cancel
            </Button>
            <Button 
              onClick={handleForwardDocument}
              disabled={forwardDocumentMutation.isPending}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              data-testid="button-confirm-forward"
            >
              <Send className="w-4 h-4 mr-2" />
              {forwardDocumentMutation.isPending ? 'Forwarding...' : 'Forward to Secretary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch Document Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent data-testid="dialog-dispatch-document">
          <DialogHeader>
            <DialogTitle>Dispatch Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>Document:</strong> {selectedDocument?.referenceNumber}<br />
                <strong>Subject:</strong> {selectedDocument?.subject}
              </p>
            </div>
            <div>
              <Label htmlFor="decision-summary">Decision Summary</Label>
              <Textarea
                id="decision-summary"
                placeholder="Enter the board's decision to be communicated to the initiator..."
                rows={4}
                defaultValue={selectedDocument?.decisionSummary || ''}
                data-testid="textarea-decision-summary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispatchDialog(false)} data-testid="button-cancel-dispatch">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const textarea = document.getElementById('decision-summary') as HTMLTextAreaElement;
                handleDispatchDocument(textarea.value);
              }}
              disabled={dispatchDocumentMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-confirm-dispatch"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {dispatchDocumentMutation.isPending ? 'Dispatching...' : 'Dispatch Document'}
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
