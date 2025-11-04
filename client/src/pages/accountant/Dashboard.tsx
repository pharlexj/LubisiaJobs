import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DollarSign,
	Receipt,
	BookOpen,
	TrendingUp,
	Users,
	Calculator,
} from "lucide-react";

export default function AccountantDashboard() {
	const { data: stats = {} as any } = useQuery<any>({
		queryKey: ["/api/accountant/stats"],
	});

	const statCards = [
		{
			title: "Pending Claims",
			value: stats?.pendingClaims || 0,
			icon: Receipt,
			description: "Claims awaiting processing",
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			title: "Total Payments",
			value: `KES ${(stats?.totalPayments || 0).toLocaleString()}`,
			icon: DollarSign,
			description: "This month",
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "Active MIRs",
			value: stats?.activeMirs || 0,
			icon: BookOpen,
			description: "Master Imprest Registers",
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "Budget Utilization",
			value: `${stats?.budgetUtilization || 0}%`,
			icon: TrendingUp,
			description: "Current fiscal year",
			color: "text-purple-600",
			bgColor: "bg-purple-50",
		},
		{
			title: "Active Employees",
			value: stats?.activeEmployees || 0,
			icon: Users,
			description: "Registered in system",
			color: "text-indigo-600",
			bgColor: "bg-indigo-50",
		},
		{
			title: "Vote Accounts",
			value: stats?.voteAccounts || 0,
			icon: Calculator,
			description: "Active vote accounts",
			color: "text-teal-600",
			bgColor: "bg-teal-50",
		},
	];

	return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />

			<div className="flex">
				<Sidebar userRole="accountant" />

				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto space-y-6">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Accountant Dashboard
							</h1>
							<p className="text-gray-600 mt-2">
								Manage financial transactions and accounting operations
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{statCards.map((stat) => {
								const IconComponent = stat.icon;
								return (
									<Card
										key={stat.title}
										data-testid={`card-${stat.title
											.toLowerCase()
											.replace(/\s+/g, "-")}`}
									>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<CardTitle className="text-sm font-medium text-gray-600">
												{stat.title}
											</CardTitle>
											<div className={`p-2 rounded-lg ${stat.bgColor}`}>
												<IconComponent className={`w-5 h-5 ${stat.color}`} />
											</div>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">{stat.value}</div>
											<p className="text-xs text-gray-500 mt-1">
												{stat.description}
											</p>
										</CardContent>
									</Card>
								);
							})}
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle>Recent Transactions</CardTitle>
									<CardDescription>Latest financial activities</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<p className="text-sm text-gray-500 text-center py-8">
											No recent transactions
										</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>Common accounting tasks</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-3">
										<button
											className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
											data-testid="button-process-claim"
										>
											<Receipt className="w-5 h-5 mb-2 text-orange-600" />
											<div className="font-medium text-sm">Process Claim</div>
										</button>
										<button
											className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
											data-testid="button-new-payment"
										>
											<DollarSign className="w-5 h-5 mb-2 text-green-600" />
											<div className="font-medium text-sm">New Payment</div>
										</button>
										<button
											className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
											data-testid="button-view-mir"
										>
											<BookOpen className="w-5 h-5 mb-2 text-blue-600" />
											<div className="font-medium text-sm">View MIR</div>
										</button>
										<button
											className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
											data-testid="button-budget-report"
										>
											<TrendingUp className="w-5 h-5 mb-2 text-purple-600" />
											<div className="font-medium text-sm">Budget Report</div>
										</button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
