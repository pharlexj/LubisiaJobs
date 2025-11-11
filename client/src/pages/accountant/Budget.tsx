import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Search, Download, Plus, Upload } from "lucide-react";
import * as XLSX from "xlsx";

export default function Budget() {
	const [searchTerm, setSearchTerm] = useState("");
	const [showAddSection, setShowAddSection] = useState(false);
	const [budgets, setBudgets] = useState<any[]>([]);
	const [votes, setVotes] = useState<any[]>([]);
	const [departments, setDepartments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [fiscalYear, setFiscalYear] = useState(
		new Date().getFullYear().toString()
	);
	type budgetData = {
		totalBudget: number;
		allocated: number;
		utilized: number;
		remaining: number;
	};
	const [formData, setFormData] = useState({
		voteId: "",
		departmentId: "",
		estimatedAmt: "",
		fiscalYear: new Date().getFullYear().toString(),
		quarter: "Q1",
	});

	const { data: budgetData } = useQuery<budgetData>({
		queryKey: ["/api/accountant/budget"],
	});

	useEffect(() => {
		setLoading(false);
	}, [fiscalYear]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		alert("Budget estimate created successfully! (mocked)");
		setBudgets([
			...budgets,
			{ ...formData, estimatedAmt: parseFloat(formData.estimatedAmt) },
		]);
		resetForm();
	};

	const resetForm = () => {
		setFormData({
			voteId: "",
			departmentId: "",
			estimatedAmt: "",
			fiscalYear,
			quarter: "Q1",
		});
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data);
			const worksheet = workbook.Sheets[workbook.SheetNames[0]];
			const jsonData = XLSX.utils.sheet_to_json(worksheet);
			const imported = jsonData.map((item: any) => ({
				voteId: item["Vote ID"],
				departmentId: item["Department ID"],
				estimatedAmt: parseFloat(item["Estimated Amount"]),
				fiscalYear: item["Fiscal Year"] || fiscalYear,
				quarter: item["Quarter"] || "Q1",
			}));
			setBudgets([...budgets, ...imported]);
			alert(
				`Successfully imported ${jsonData.length} budget estimates! (mocked)`
			);
		} catch (error: any) {
			alert("Failed to import budget: " + error.message);
		} finally {
			setUploading(false);
		}
	};

	const downloadTemplate = () => {
		const template = [
			{
				"Vote ID": "221001",
				"Department ID": "dept-1",
				"Estimated Amount": "50000",
				"Fiscal Year": fiscalYear,
				Quarter: "Q1",
			},
		];
		const worksheet = XLSX.utils.json_to_sheet(template);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Template");
		XLSX.writeFile(workbook, `budget_template_${fiscalYear}.xlsx`);
	};

	const totalEstimated = budgets.reduce(
		(sum, b) => sum + (parseFloat(b.estimatedAmt) || 0),
		0
	);

	const departmentBudgets = [
		{ name: "Human Resources", allocated: 5000000, utilized: 3200000 },
		{ name: "Finance", allocated: 8000000, utilized: 5600000 },
		{ name: "Administration", allocated: 6000000, utilized: 4100000 },
		{ name: "ICT", allocated: 4500000, utilized: 2900000 },
	];

	return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />
			<div className="flex">
				<Sidebar userRole="accountant" />
				<main className="flex-1">
					<div className="container mx-auto p-6 space-y-6">
						<div className="flex justify-between items-center">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">
									Budget Planning
								</h1>
								<p className="text-gray-600 mt-2">
									Manage department budgets and allocations
								</p>
							</div>
							<div className="flex gap-2">
								<Button variant="outline">
									<Download className="w-4 h-4 mr-2" />
									Export
								</Button>
								<Button onClick={() => setShowAddSection(!showAddSection)}>
									<Plus className="w-4 h-4 mr-2" />
									Add Budget
								</Button>
							</div>
						</div>

						{/* Summary Cards */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<Card>
								<CardHeader>
									<CardTitle>Total Budget</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										KES{" "}
										{(
											budgetData?.totalBudget || totalEstimated
										).toLocaleString()}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Allocated</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										KES{" "}
										{(budgetData?.allocated || totalEstimated).toLocaleString()}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Utilized</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										KES {(budgetData?.utilized || 0).toLocaleString()}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Remaining</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										KES{" "}
										{(budgetData?.remaining || totalEstimated).toLocaleString()}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Add Budget Section */}
						{showAddSection && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Add Budget Estimate</CardTitle>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleSubmit} className="space-y-3">
											<Input
												placeholder="Vote ID"
												value={formData.voteId}
												onChange={(e) =>
													setFormData({ ...formData, voteId: e.target.value })
												}
												className="w-full"
												required
											/>
											<Input
												placeholder="Department ID"
												value={formData.departmentId}
												onChange={(e) =>
													setFormData({
														...formData,
														departmentId: e.target.value,
													})
												}
												className="w-full"
												required
											/>
											<Input
												type="number"
												placeholder="Estimated Amount (KES)"
												value={formData.estimatedAmt}
												onChange={(e) =>
													setFormData({
														...formData,
														estimatedAmt: e.target.value,
													})
												}
												className="w-full"
												required
											/>
											<div className="grid grid-cols-2 gap-2">
												<Select
													value={formData.fiscalYear}
													onValueChange={(val: string) =>
														setFormData({ ...formData, fiscalYear: val })
													}
												>
													<SelectTrigger className="border rounded p-2">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[2023, 2024, 2025, 2026, 2027].map((y) => (
															<SelectItem key={y} value={y.toString()}>
																{y}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={formData.quarter}
													onValueChange={(val: string) =>
														setFormData({ ...formData, quarter: val })
													}
												>
													<SelectTrigger className="border rounded p-2">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Q1">Q1</SelectItem>
														<SelectItem value="Q2">Q2</SelectItem>
														<SelectItem value="Q3">Q3</SelectItem>
														<SelectItem value="Q4">Q4</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<Button type="submit" className="w-full">
												<Plus size={16} /> Add Budget
											</Button>
										</form>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex justify-between items-center">
										<CardTitle>Upload Excel File</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={downloadTemplate}
										>
											<Download size={14} /> Template
										</Button>
									</CardHeader>
									<CardContent>
										<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
											<input
												type="file"
												accept=".xlsx,.xls,.xlsm"
												onChange={handleFileUpload}
												disabled={uploading}
												id="budget-upload"
												className="hidden"
											/>
											<label
												htmlFor="budget-upload"
												className="cursor-pointer flex flex-col items-center gap-2"
											>
												<Upload
													size={32}
													className={
														uploading ? "text-gray-400" : "text-purple-600"
													}
												/>
												<span className="text-sm font-semibold">
													{uploading
														? "Uploading..."
														: "Click to upload Excel file"}
												</span>
											</label>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Department Budgets */}
						<Card>
							<CardHeader>
								<CardTitle>Department Budgets</CardTitle>
								<CardDescription>
									Budget allocation and utilization by department
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="relative mb-6">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
									<Input
										placeholder="Search departments..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10"
									/>
								</div>
								<div className="space-y-6">
									{departmentBudgets
										.filter((d) =>
											d.name.toLowerCase().includes(searchTerm.toLowerCase())
										)
										.map((dept) => {
											const percentage = Math.round(
												(dept.utilized / dept.allocated) * 100
											);
											return (
												<div key={dept.name} className="space-y-2">
													<div className="flex justify-between items-center">
														<div>
															<h3 className="font-medium text-gray-900">
																{dept.name}
															</h3>
															<p className="text-sm text-gray-500">
																KES {dept.utilized.toLocaleString()} of KES{" "}
																{dept.allocated.toLocaleString()}
															</p>
														</div>
														<div className="text-right">
															<div className="text-sm font-medium">
																{percentage}%
															</div>
															<div className="text-sm text-gray-500">
																utilized
															</div>
														</div>
													</div>
													<Progress value={percentage} className="h-2" />
												</div>
											);
										})}
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		</div>
	);
}
