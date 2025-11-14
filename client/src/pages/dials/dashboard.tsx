import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Plus, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { DialRecordWithRelations } from "@shared/schema";
import { format } from "date-fns";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: declarations, isLoading } = useQuery<DialRecordWithRelations[]>({
    queryKey: ["/api/dial"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        params.set("userId", user.id);
      }
      const response = await fetch(`/api/dial?${params}`);
      if (!response.ok) throw new Error("Failed to fetch declarations");
      return response.json();
    },
  });

  const { data: stats } = useQuery<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
  }>({
    queryKey: ["/api/dial/stats", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        params.set("userId", user.id);
      }
      const response = await fetch(`/api/dial/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "Draft", icon: Clock },
      submitted: { variant: "default" as const, label: "Submitted", icon: Calendar },
      under_review: { variant: "default" as const, label: "Under Review", icon: AlertCircle },
      approved: { variant: "default" as const, label: "Approved", icon: CheckCircle },
      locked: { variant: "default" as const, label: "Locked", icon: CheckCircle },
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />

			<div className="flex">
				<Sidebar userRole="applicant" />
				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto space-y-6">
						<div>
							<h1 className="text-4xl font-semibold">My Declarations</h1>
							<p className="text-base text-muted-foreground mt-2">
								Manage your income, assets, and liabilities declarations
							</p>
						</div>

						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Total Declarations
											</p>
											<p
												className="text-3xl font-semibold mt-2"
												data-testid="text-total-declarations"
											>
												{stats?.total || 0}
											</p>
										</div>
										<FileText className="h-8 w-8 text-primary" />
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Drafts
											</p>
											<p
												className="text-3xl font-semibold mt-2"
												data-testid="text-draft-count"
											>
												{stats?.draft || 0}
											</p>
										</div>
										<Clock className="h-8 w-8 text-muted-foreground" />
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Submitted
											</p>
											<p
												className="text-3xl font-semibold mt-2"
												data-testid="text-submitted-count"
											>
												{stats?.submitted || 0}
											</p>
										</div>
										<Calendar className="h-8 w-8 text-primary" />
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Approved
											</p>
											<p
												className="text-3xl font-semibold mt-2"
												data-testid="text-approved-count"
											>
												{stats?.approved || 0}
											</p>
										</div>
										<CheckCircle className="h-8 w-8 text-primary" />
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							<Link href="/dial/new">
								<Button className="gap-2" data-testid="button-new-declaration">
									<Plus className="h-4 w-4" />
									New Declaration
								</Button>
							</Link>
						</div>

						{/* Declarations Table */}
						<Card>
							<CardHeader>
								<CardTitle>Recent Declarations</CardTitle>
								<CardDescription>
									View and manage all your submitted declarations
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
												<TableHead>Statement Date</TableHead>
												<TableHead>Period</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Submitted</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{declarations.map((declaration) => (
												<TableRow
													key={declaration.id}
													data-testid={`row-declaration-${declaration.id}`}
												>
													<TableCell className="font-medium">
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
													<TableCell>
														{getStatusBadge(declaration.status || "draft")}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{declaration.submittedAt
															? format(
																	new Date(declaration.submittedAt),
																	"MMM dd, yyyy"
															  )
															: "—"}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex gap-2 justify-end">
															{declaration.status === "draft" ? (
																<Link href={`/dial/${declaration.id}/edit`}>
																	<Button
																		variant="ghost"
																		size="sm"
																		data-testid={`button-edit-${declaration.id}`}
																	>
																		Continue
																	</Button>
																</Link>
															) : (
																<Link href={`/dial/${declaration.id}`}>
																	<Button
																		variant="ghost"
																		size="sm"
																		data-testid={`button-view-${declaration.id}`}
																	>
																		View
																	</Button>
																</Link>
															)}
															{(declaration.status === "approved" ||
																declaration.status === "locked") && (
																<Button
																	variant="ghost"
																	size="sm"
																	data-testid={`button-download-${declaration.id}`}
																>
																	Download PDF
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<div className="flex flex-col items-center justify-center py-12">
										<FileText className="h-12 w-12 text-muted-foreground mb-4" />
										<h3 className="text-lg font-medium mb-2">
											No declarations yet
										</h3>
										<p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
											Start your first declaration to track your income, assets,
											and liabilities
										</p>
										<Link href="/dial/new">
											<Button className="gap-2">
												<Plus className="h-4 w-4" />
												Create First Declaration
											</Button>
										</Link>
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
