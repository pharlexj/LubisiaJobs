import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DialRecordWithRelations } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import Navigation from "@/components/layout/Navigation";

export default function ReviewQueue() {
  const { toast } = useToast();
  const [selectedDeclaration, setSelectedDeclaration] = useState<DialRecordWithRelations | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  const { data: declarations, isLoading } = useQuery<DialRecordWithRelations[]>({
    queryKey: ["/api/dial", "submitted"],
    queryFn: async () => {
      const response = await fetch("/api/dial?status=submitted");
      if (!response.ok) throw new Error("Failed to fetch declarations");
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/dial/${id}/approve`, { comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dial"] });
      toast({
        title: "Declaration approved",
        description: "The declaration has been approved and locked",
      });
      setShowApproveDialog(false);
      setSelectedDeclaration(null);
      setComments("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/dial/${id}/reject`, { comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dial"] });
      toast({
        title: "Changes requested",
        description: "The officer has been notified to make changes",
      });
      setShowRejectDialog(false);
      setSelectedDeclaration(null);
      setComments("");
    },
  });

  const handleApprove = (declaration: DialRecordWithRelations) => {
    setSelectedDeclaration(declaration);
    setShowApproveDialog(true);
  };

  const handleReject = (declaration: DialRecordWithRelations) => {
    setSelectedDeclaration(declaration);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedDeclaration) {
      approveMutation.mutate(selectedDeclaration.id);
    }
  };

  const confirmReject = () => {
    if (selectedDeclaration) {
      rejectMutation.mutate(selectedDeclaration.id);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "submitted") {
      return <Badge>Pending Review</Badge>;
    }
    if (status === "under_review") {
      return <Badge variant="default">Under Review</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />
			<div className="flex">
				<main className="flex-1 p-6">
					<div className="space-y-8">
						<div>
							<h1 className="text-4xl font-semibold">Review Queue</h1>
							<p className="text-base text-muted-foreground mt-2">
								Review and approve submitted declarations
							</p>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Pending Declarations</CardTitle>
								<CardDescription>
									Declarations awaiting review and approval
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<div className="space-y-3">
										{[1, 2, 3].map((i) => (
											<Skeleton key={i} className="h-16 w-full" />
										))}
									</div>
								) : declarations && declarations.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Officer</TableHead>
												<TableHead>Statement Date</TableHead>
												<TableHead>Period</TableHead>
												<TableHead>Submitted</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{declarations.map((declaration) => (
												<TableRow
													key={declaration.id}
													data-testid={`row-review-${declaration.id}`}
												>
													<TableCell className="font-medium">
														{declaration.user?.firstName}{" "}
														{declaration.user?.surname}
													</TableCell>
													<TableCell>
														{declaration.statementDate
															? format(
																	new Date(declaration.statementDate),
																	"MMM dd, yyyy"
															  )
															: "—"}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{declaration.periodStart && declaration.periodEnd
															? `${format(
																	new Date(declaration.periodStart),
																	"MMM yyyy"
															  )} - ${format(
																	new Date(declaration.periodEnd),
																	"MMM yyyy"
															  )}`
															: "—"}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{declaration.submittedAt
															? format(
																	new Date(declaration.submittedAt),
																	"MMM dd, yyyy"
															  )
															: "—"}
													</TableCell>
													<TableCell>
														{getStatusBadge(declaration.status || "draft")}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex gap-2 justify-end">
															<Link href={`/dial/${declaration.id}`}>
																<Button
																	variant="ghost"
																	size="sm"
																	data-testid={`button-view-${declaration.id}`}
																>
																	<Eye className="h-4 w-4 mr-2" />
																	View
																</Button>
															</Link>
															<Button
																variant="default"
																size="sm"
																onClick={() => handleApprove(declaration)}
																data-testid={`button-approve-${declaration.id}`}
															>
																<CheckCircle className="h-4 w-4 mr-2" />
																Approve
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleReject(declaration)}
																data-testid={`button-reject-${declaration.id}`}
															>
																<XCircle className="h-4 w-4 mr-2" />
																Request Changes
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<div className="flex flex-col items-center justify-center py-12">
										<CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
										<h3 className="text-lg font-medium mb-2">
											No pending declarations
										</h3>
										<p className="text-sm text-muted-foreground text-center max-w-md">
											All submitted declarations have been reviewed
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Approve Dialog */}
						<Dialog
							open={showApproveDialog}
							onOpenChange={setShowApproveDialog}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Approve Declaration</DialogTitle>
									<DialogDescription>
										This will approve and lock the declaration. The officer will
										be able to download a PDF.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<label className="text-sm font-medium">
											Comments (optional)
										</label>
										<Textarea
											value={comments}
											onChange={(e) => setComments(e.target.value)}
											placeholder="Add any comments or notes..."
											data-testid="input-approve-comments"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setShowApproveDialog(false)}
									>
										Cancel
									</Button>
									<Button
										onClick={confirmApprove}
										data-testid="button-confirm-approve"
									>
										<CheckCircle className="h-4 w-4 mr-2" />
										Approve & Lock
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Reject Dialog */}
						<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Request Changes</DialogTitle>
									<DialogDescription>
										The declaration will be returned to the officer for
										corrections.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<label className="text-sm font-medium">Comments *</label>
										<Textarea
											value={comments}
											onChange={(e) => setComments(e.target.value)}
											placeholder="Describe what changes are needed..."
											data-testid="input-reject-comments"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setShowRejectDialog(false)}
									>
										Cancel
									</Button>
									<Button
										variant="outline"
										onClick={confirmReject}
										data-testid="button-confirm-reject"
									>
										<XCircle className="h-4 w-4 mr-2" />
										Request Changes
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</main>
			</div>
		</div>
	);
}
