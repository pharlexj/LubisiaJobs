import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, MessageSquare, FileScan } from "lucide-react";
import DocumentViewer from "@/components/documents/DocumentViewer";
import { CheckCircle } from "lucide-react";
import { Upload, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function ChiefOfficer() {
	const { user } = useAuth();
	const { toast } = useToast();
	const [showSendDialog, setShowSendDialog] = useState(false);
	const [showRegisterDialog, setShowRegisterDialog] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<any>(null);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [theirRef, setTheirRef] = useState<string>("");
	const [notes, setNotes] = useState("");
	const [showDocumentViewer, setShowDocumentViewer] = useState(false);
	const [documentToView, setDocumentToView] = useState<any>(null);

	// Register document state (copied from RecordsOfficer)
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const [documentForm, setDocumentForm] = useState({
    referenceNumber: "",
    	theirReferenceNumber: "",
		subject: "",
		initiatorDepartment: "",
		initiatorName: "",
		initiatorEmail: "",
		initiatorPhone: "",
		documentDate: "",
		documentType: "letter",
		priority: "normal",
	});

	// departments for select
	const { data: config } = useQuery({ queryKey: ["/api/public/config"] });
	const departments = (config as any)?.departments || [];

	const registerDocumentMutation = useMutation({
		mutationFn: async (data: FormData) => {
			const response = await fetch("/api/rms/documents", {
				method: "POST",
				body: data,
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to register document");
			return response.json();
		},
		onSuccess: () => {
			toast({
				title: "Document Registered",
				description: "Document has been successfully registered in the system.",
			});
			queryClient.invalidateQueries({ queryKey: ["/api/rms/documents"] });
			queryClient.invalidateQueries({ queryKey: ["/api/rms/stats"] });
			setShowRegisterDialog(false);
			setDocumentForm({
        referenceNumber: "",
        theirReferenceNumber: "",
				subject: "",
				initiatorDepartment: "",
				initiatorName: "",
				initiatorEmail: "",
				initiatorPhone: "",
				documentDate: "",
				documentType: "letter",
				priority: "normal",
			});
			setDocumentFile(null);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to register document",
				variant: "destructive",
			});
		},
	});

	const handleRegisterDocument = () => {
		const formData = new FormData();
		Object.entries(documentForm).forEach(([key, value]) => {
			formData.append(key, value as any);
		});
		if (documentFile) formData.append("document", documentFile);
		registerDocumentMutation.mutate(formData);
	};

	const { data: stats } = useQuery<any>({
		queryKey: ["/api/rms/stats"],
	});

	const { data: documents } = useQuery<any[]>({
		queryKey: ["/api/rms/documents"],
	});

	// Include documents that the Chief Officer should act on. Include dispatched/filed responses
	const relevantDocuments =
		documents?.filter(
			(d: any) =>
				["sent_to_records", "received"].includes(
					d.status
				) && d.currentHandler === "chiefOfficer"
		) || [];

	const sendToRecordsMutation = useMutation({
		mutationFn: async (data: FormData) => {
			const response = await fetch(
				`/api/rms/documents/${selectedDocument.id}/send-to-records`,
				{
					method: "POST",
					body: data,
					credentials: "include",
				}
			);
			if (!response.ok) throw new Error("Failed to send to records");
			return response.json();
		},
		onSuccess: () => {
			toast({
				title: "Sent",
				description: "Document sent to Records Officer.",
			});
			queryClient.invalidateQueries({ queryKey: ["/api/rms/documents"] });
			queryClient.invalidateQueries({ queryKey: ["/api/rms/stats"] });
			setShowSendDialog(false);
			setSelectedDocument(null);
			setAttachment(null);
			setNotes("");
			setTheirRef("");
		},
		onError: (err: any) => {
			toast({
				title: "Error",
				description: err.message || "Failed to send",
				variant: "destructive",
			});
		},
	});

	const handleSendToRecords = () => {
		if (!selectedDocument) return;
		const form = new FormData();
		if (attachment) form.append("document", attachment);
		form.append("notes", notes || "");
		if (theirRef) form.append("yourRef", theirRef);
		sendToRecordsMutation.mutate(form);
	};

	return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />
			<div className="flex">
				<Sidebar userRole={user?.role || "chiefOfficer"} />
				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto">
						<div className="mb-6">
							<h1
								className="text-2xl md:text-3xl font-bold text-gray-900"
								data-testid="text-page-title"
							>
								Chief Officer - Decision Oversight
							</h1>
							<p className="text-gray-600 mt-1">
								Provide input and oversight on board decisions
							</p>
						</div>

						{/* Statistics */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-gray-600">For Review</p>
											<p
												className="text-2xl font-bold text-blue-600"
												data-testid="stat-pending"
											>
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
											<p
												className="text-2xl font-bold text-gray-900"
												data-testid="stat-total"
											>
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
											<p
												className="text-2xl font-bold text-green-600"
												data-testid="stat-comments"
											>
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
									<p
										className="text-center py-8 text-gray-600"
										data-testid="text-no-documents"
									>
										No documents pending your review at this time.
									</p>
								) : (
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr className="border-b">
													<th className="text-left p-3 font-semibold text-gray-700">
														Ref. No.
													</th>
													<th className="text-left p-3 font-semibold text-gray-700">
														Subject
													</th>
													<th className="text-left p-3 font-semibold text-gray-700">
														Status
													</th>
													<th className="text-left p-3 font-semibold text-gray-700">
														Actions
													</th>
												</tr>
											</thead>
											<tbody>
												{relevantDocuments.map((doc: any) => (
													<tr
														key={doc.id}
														className="border-b hover:bg-gray-50"
													>
														<td className="p-3 font-mono text-sm">
															{doc.theirReferenceNumber}
														</td>
														<td className="p-3 max-w-xs truncate">
															{doc.subject}
														</td>
														<td className="p-3">{doc.status}</td>
														<td className="p-3">
															<div className="flex gap-2">
																{doc.filePath && (
																	<Button
																		size="sm"
																		variant="outline"
																		onClick={() => {
																			setDocumentToView({
																				id: doc.id,
																				type: doc.documentType,
																				fileName:
																					doc.theirReferenceNumber + ".pdf",
																				filePath: doc.filePath,
																				mimeType: "application/pdf",
																				createdAt: doc.createdAt,
																			});
																			setShowDocumentViewer(true);
																		}}
																		data-testid={`button-view-${doc.id}`}
																	>
																		<FileScan className="w-4 h-4 mr-1" />
																		View
																	</Button>
																)}
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => {
																		setSelectedDocument(doc);
																		setShowSendDialog(true);
																	}}
																>
																	Forward to Records
																</Button>
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
				<DialogContent
					className="max-w-2xl max-h-[90vh] overflow-y-auto"
					data-testid="dialog-register-document"
				>
					<DialogHeader>
						<DialogTitle>Register New Document</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="ref-number">Reference Number *</Label>
								<Input
									id="ref-number"
									value={documentForm.theirReferenceNumber}
									onChange={(e) =>
										setDocumentForm((prev) => ({
											...prev,
											theirReferenceNumber: e.target.value,
										}))
									}
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
									onChange={(e) =>
										setDocumentForm((prev) => ({
											...prev,
											documentDate: e.target.value,
										}))
									}
									data-testid="input-document-date"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="subject">Subject *</Label>
							<Textarea
								id="subject"
								value={documentForm.subject}
								onChange={(e) =>
									setDocumentForm((prev) => ({
										...prev,
										subject: e.target.value,
									}))
								}
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
									onValueChange={(value) =>
										setDocumentForm((prev) => ({
											...prev,
											documentType: value,
										}))
									}
								>
									<SelectTrigger
										id="doc-type"
										data-testid="select-document-type"
									>
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
									onValueChange={(value) =>
										setDocumentForm((prev) => ({ ...prev, priority: value }))
									}
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
								onValueChange={(value) =>
									setDocumentForm((prev) => ({
										...prev,
										initiatorDepartment: value,
									}))
								}
							>
								<SelectTrigger
									id="initiator-dept"
									data-testid="select-initiator-department"
								>
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
									onChange={(e) =>
										setDocumentForm((prev) => ({
											...prev,
											initiatorName: e.target.value,
										}))
									}
									placeholder="Full name"
									data-testid="input-initiator-name"
								/>
							</div>
							<div>
								<Label htmlFor="initiator-phone">Phone Number</Label>
								<Input
									id="initiator-phone"
									value={documentForm.initiatorPhone}
									onChange={(e) =>
										setDocumentForm((prev) => ({
											...prev,
											initiatorPhone: e.target.value,
										}))
									}
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
								onChange={(e) =>
									setDocumentForm((prev) => ({
										...prev,
										initiatorEmail: e.target.value,
									}))
								}
								placeholder="contact@example.com"
								data-testid="input-initiator-email"
							/>
						</div>
						<div>
							<Label htmlFor="document-file">
								Attach Document (PDF, DOC, DOCX)
							</Label>
							<Input
								id="document-file"
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
								data-testid="input-document-file"
							/>
							{documentFile && (
								<p className="text-sm text-gray-600 mt-2">
									Selected: {documentFile.name}
								</p>
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
							disabled={
								registerDocumentMutation.isPending ||
								!documentForm.theirReferenceNumber ||
								!documentForm.subject
							}
							className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
							data-testid="button-save-document"
						>
							<FileCheck className="w-4 h-4 mr-2" />
							{registerDocumentMutation.isPending
								? "Registering..."
								: "Register Document"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Send to Records Dialog */}
			<Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
				<DialogContent data-testid="dialog-send-to-records">
					<DialogHeader>
						<DialogTitle>Send Document to Records</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
							<p className="text-sm text-teal-900">
								<strong>Document:</strong>{" "}
								{selectedDocument?.theirReferenceNumber}
								<br />
								<strong>Subject:</strong> {selectedDocument?.subject}
							</p>
						</div>
						<div>
							<div>
								<Label htmlFor="their-ref">Document Ref (Your Ref)</Label>
								<Input
									id="their-ref"
									value={theirRef}
									onChange={(e) => setTheirRef(e.target.value)}
									placeholder="Ref provided by sender"
								/>
							</div>
							<Label htmlFor="attachment">Attach File (optional)</Label>
							<Input
								id="attachment"
								type="file"
								onChange={(e) => setAttachment(e.target.files?.[0] || null)}
							/>
						</div>
						<div>
							<Label htmlFor="notes">Notes</Label>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
								placeholder="Optional notes to Records Officer"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSendDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSendToRecords}
							disabled={sendToRecordsMutation.isPending}
							className="bg-gradient-to-r from-teal-600 to-teal-700 text-white"
						>
							{sendToRecordsMutation.isPending
								? "Sending..."
								: "Send to Records"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Document Viewer Modal for previewing attachments */}
			{documentToView && (
				<DocumentViewer
					document={documentToView}
					isOpen={showDocumentViewer}
					onClose={() => setShowDocumentViewer(false)}
				/>
			)}
		</div>
	);
}
