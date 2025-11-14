import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Save, Send, ChevronRight } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { SignatureCanvas } from "@/components/dials/signature-canvas";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type {
	DialRecordWithRelations,
	Spouse,
	Dependent,
	StatementItem,
} from "@shared/schema";
import Navigation from "@/components/layout/Navigation";

const declarationSchema = z.object({
	// Personal details
	dateOfBirth: z.string().optional(),
	placeOfBirth: z.string().optional(),
	maritalStatus: z
		.enum(["single", "married"])
		.optional(),
	postalAddress: z.string().optional(),
	physicalAddress: z.string().optional(),

	// Employment details
	employmentNumber: z.string().optional(),
	employerName: z.string().optional(),
	employmentNature: z.string().optional(),

	// Statement metadata
	statementDate: z.string().optional(),
	periodStart: z.string().optional(),
	periodEnd: z.string().optional(),

	// Other information
	otherInformation: z.string().optional(),

	// Signatures
	officerSignatureData: z.string().optional(),
	officerSignatureDate: z.string().optional(),
	witnessSignatureData: z.string().optional(),
	witnessName: z.string().optional(),
	witnessAddress: z.string().optional(),
	witnessSignatureDate: z.string().optional(),
});

type DeclarationFormData = z.infer<typeof declarationSchema>;

export default function DeclarationForm() {
	const params = useParams();
	const [location, navigate] = useLocation();
	const { toast } = useToast();
	const isNew = location === "/dial/new";
	const dialId = isNew ? undefined : parseInt(params.id || "");

	const [spouses, setSpouses] = useState<Spouse[]>([]);
	const [dependents, setDependents] = useState<Dependent[]>([]);
	const [incomeItems, setIncomeItems] = useState<StatementItem[]>([]);
	const [assetItems, setAssetItems] = useState<StatementItem[]>([]);
	const [liabilityItems, setLiabilityItems] = useState<StatementItem[]>([]);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const { data: declaration, isLoading } = useQuery<DialRecordWithRelations>({
		queryKey: ["/api/dial", dialId],
		enabled: !isNew && !!dialId,
	});

	const form = useForm<DeclarationFormData>({
		resolver: zodResolver(declarationSchema),
		defaultValues: {
			dateOfBirth: "",
			placeOfBirth: "",
			maritalStatus: undefined,
			postalAddress: "",
			physicalAddress: "",
			employmentNumber: "",
			employerName: "",
			employmentNature: "",
			statementDate: "",
			periodStart: "",
			periodEnd: "",
			otherInformation: "",
			officerSignatureData: "",
			officerSignatureDate: "",
			witnessSignatureData: "",
			witnessName: "",
			witnessAddress: "",
			witnessSignatureDate: "",
		},
	});

	// Load existing data
	useEffect(() => {
		if (declaration) {
			form.reset({
				dateOfBirth: declaration.dateOfBirth || "",
				placeOfBirth: declaration.placeOfBirth || "",
				maritalStatus: declaration.maritalStatus || undefined,
				postalAddress: declaration.postalAddress || "",
				physicalAddress: declaration.physicalAddress || "",
				employmentNumber: declaration.employmentNumber || "",
				employerName: declaration.employerName || "",
				employmentNature: declaration.employmentNature || "",
				statementDate: declaration.statementDate || "",
				periodStart: declaration.periodStart || "",
				periodEnd: declaration.periodEnd || "",
				otherInformation: declaration.otherInformation || "",
				officerSignatureData: declaration.officerSignatureData || "",
				officerSignatureDate: declaration.officerSignatureDate || "",
				witnessSignatureData: declaration.witnessSignatureData || "",
				witnessName: declaration.witnessName || "",
				witnessAddress: declaration.witnessAddress || "",
				witnessSignatureDate: declaration.witnessSignatureDate || "",
			});

			setSpouses(declaration.spouses || []);
			setDependents(declaration.dependents || []);

			const items = declaration.statementItems || [];
			setIncomeItems(items.filter((item) => item.category === "income"));
			setAssetItems(items.filter((item) => item.category === "asset"));
			setLiabilityItems(items.filter((item) => item.category === "liability"));
		}
	}, [declaration, form]);

	// Autosave
	useEffect(() => {
		const interval = setInterval(() => {
			if (dialId || isNew) {
				handleSave(true);
			}
		}, 15000);

		return () => clearInterval(interval);
	}, [dialId, isNew]);

	const saveMutation = useMutation({
		mutationFn: async (
			data: DeclarationFormData & {
				spouses: Spouse[];
				dependents: Dependent[];
				statementItems: StatementItem[];
			}
		) => {
			if (dialId) {
				return apiRequest("PATCH", `/api/dial/${dialId}`, data);
			} else {
				// For new declarations, ensure we include the user ID
				const userId = localStorage.getItem("dial_user")
					? JSON.parse(localStorage.getItem("dial_user")!).id
					: "mock-user-id";
				return apiRequest("POST", "/api/dial", { ...data, userId });
			}
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["/api/dial"] });
			setLastSaved(new Date());
			if (isNew && data?.id) {
				navigate(`/dial/${data.id}/edit`);
			}
		},
	});

	const submitMutation = useMutation({
		mutationFn: async () => {
			return apiRequest("POST", `/api/dial/${dialId}/submit`, {});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/api/dial"] });
			toast({
				title: "Declaration submitted",
				description: "Your declaration has been submitted for review",
			});
			navigate("/dials/dashboard");
		},
	});

	const handleSave = async (silent = false) => {
		const formData = form.getValues();
		const payload = {
			...formData,
			spouses,
			dependents,
			statementItems: [...incomeItems, ...assetItems, ...liabilityItems],
		};

		saveMutation.mutate(payload, {
			onSuccess: () => {
				if (!silent) {
					toast({
						title: "Draft saved",
						description: "Your declaration has been saved successfully",
					});
				}
			},
		});
	};

	const handleSubmit = () => {
		submitMutation.mutate();
	};

	// Helper functions for managing arrays
	const addSpouse = () => {
		setSpouses([
			...spouses,
			{
				id: 0,
				dialRecordId: dialId || 0,
				surname: "",
				firstName: "",
				otherNames: "",
				sequenceOrder: spouses.length + 1,
				createdAt: new Date(),
			},
		]);
	};

	const removeSpouse = (index: number) => {
		setSpouses(spouses.filter((_, i) => i !== index));
	};

	const updateSpouse = (index: number, field: keyof Spouse, value: string) => {
		const updated = [...spouses];
		updated[index] = { ...updated[index], [field]: value };
		setSpouses(updated);
	};

	const addDependent = () => {
		setDependents([
			...dependents,
			{
				id: 0,
				dialRecordId: dialId || 0,
				surname: "",
				firstName: "",
				otherNames: "",
				sequenceOrder: dependents.length + 1,
				createdAt: new Date(),
			},
		]);
	};

	const removeDependent = (index: number) => {
		setDependents(dependents.filter((_, i) => i !== index));
	};

	const updateDependent = (
		index: number,
		field: keyof Dependent,
		value: string
	) => {
		const updated = [...dependents];
		updated[index] = { ...updated[index], [field]: value };
		setDependents(updated);
	};

	const addStatementItem = (category: "income" | "asset" | "liability") => {
		const newItem: StatementItem = {
			id: 0,
			dialRecordId: dialId || 0,
			category,
			description: "",
			location: "",
			approximateAmount: 0,
			sequenceOrder: 1,
			createdAt: new Date(),
		};

		if (category === "income") {
			setIncomeItems([
				...incomeItems,
				{ ...newItem, sequenceOrder: incomeItems.length + 1 },
			]);
		} else if (category === "asset") {
			setAssetItems([
				...assetItems,
				{ ...newItem, sequenceOrder: assetItems.length + 1 },
			]);
		} else {
			setLiabilityItems([
				...liabilityItems,
				{ ...newItem, sequenceOrder: liabilityItems.length + 1 },
			]);
		}
	};

	const removeStatementItem = (
		category: "income" | "asset" | "liability",
		index: number
	) => {
		if (category === "income") {
			setIncomeItems(incomeItems.filter((_, i) => i !== index));
		} else if (category === "asset") {
			setAssetItems(assetItems.filter((_, i) => i !== index));
		} else {
			setLiabilityItems(liabilityItems.filter((_, i) => i !== index));
		}
	};

	const updateStatementItem = (
		category: "income" | "asset" | "liability",
		index: number,
		field: keyof StatementItem,
		value: any
	) => {
		const update = (items: StatementItem[]) => {
			const updated = [...items];
			updated[index] = { ...updated[index], [field]: value };
			return updated;
		};

		if (category === "income") {
			setIncomeItems(update(incomeItems));
		} else if (category === "asset") {
			setAssetItems(update(assetItems));
		} else {
			setLiabilityItems(update(liabilityItems));
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />
			<div className="flex">
				<main className="flex-1 p-6">
					<div className="max-w-5xl mx-auto space-y-8">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-4xl font-semibold">
									{isNew ? "New Declaration" : "Edit Declaration"}
								</h1>
								<p className="text-base text-muted-foreground mt-2">
									Declaration of Income, Assets & Liabilities
								</p>
							</div>
							<div className="flex gap-3">
								{lastSaved && (
									<p
										className="text-sm text-muted-foreground self-center"
										data-testid="text-last-saved"
									>
										Last saved: {format(lastSaved, "h:mm a")}
									</p>
								)}
								<Button
									variant="outline"
									onClick={() => handleSave(false)}
									data-testid="button-save-draft"
								>
									<Save className="h-4 w-4 mr-2" />
									Save Draft
								</Button>
								{dialId && declaration?.status === "draft" && (
									<Button onClick={handleSubmit} data-testid="button-submit">
										<Send className="h-4 w-4 mr-2" />
										Submit
									</Button>
								)}
							</div>
						</div>

						<Form {...form}>
							<form className="space-y-8">
								{/* Officer Personal Details */}
								<Card>
									<CardHeader>
										<CardTitle className="text-2xl font-medium">
											Officer Details
										</CardTitle>
										<CardDescription>
											Personal and employment information
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<FormField
												control={form.control}
												name="dateOfBirth"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Date of Birth</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																data-testid="input-date-of-birth"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="placeOfBirth"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Place of Birth</FormLabel>
														<FormControl>
															<Input
																{...field}
																data-testid="input-place-of-birth"
																placeholder="e.g, Saboti"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="maritalStatus"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Marital Status</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger data-testid="select-marital-status">
																<SelectValue placeholder="Select marital status" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="single">Single</SelectItem>
															<SelectItem value="married">Married</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<FormField
												control={form.control}
												name="postalAddress"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Postal Address</FormLabel>
														<FormControl>
															<Textarea
																{...field}
																data-testid="input-postal-address"
																placeholder="e.g, P.O. Box 4211-30200, Kitale"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="physicalAddress"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Physical Address</FormLabel>
														<FormControl>
															<Textarea
																{...field}
																data-testid="input-physical-address"
																placeholder="e.g, House No. 23, Lossos Centre, Bidii Village, Bidii Ward, Kwanza Sub County; OR Wamalwa Kijana Teaching and Referral Hospital, Trans Nzoia County (State where applicable in your case)"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<Separator className="my-6" />

										<div className="space-y-4">
											<h3 className="text-lg font-medium">
												Employment Details
											</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<FormField
													control={form.control}
													name="employmentNumber"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Employment Number</FormLabel>
															<FormControl>
																<Input
																	{...field}
																	data-testid="input-employment-number"
																	placeholder="e.g., 20030018909"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="employerName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Employer</FormLabel>
															<FormControl>
																<Input
																	{...field}
																	data-testid="input-employer-name"
																	placeholder="e.g. Trans Nzoia County - Executive"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<FormField
												control={form.control}
												name="employmentNature"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Nature of Employment</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger data-testid="select-marital-status">
																	<SelectValue placeholder="Select nature of employement" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="Permanent">
																	Permanent
																</SelectItem>
																<SelectItem value="Contract">
																	Contract
																</SelectItem>
																<SelectItem value="Casual">Casual</SelectItem>
																<SelectItem value="Temporary">
																	Temporary
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
								</Card>

								{/* Spouses */}
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-2xl font-medium">
													Spouse(s)
												</CardTitle>
												<CardDescription>
													Add details of your spouse(s)
												</CardDescription>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={addSpouse}
												data-testid="button-add-spouse"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Spouse
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										{spouses.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No spouses added yet
											</p>
										) : (
											<div className="space-y-4">
												{spouses.map((spouse, index) => (
													<Card key={index}>
														<CardContent className="p-6">
															<div className="flex items-start justify-between mb-4">
																<Badge variant="secondary">
																	Spouse {index + 1}
																</Badge>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() => removeSpouse(index)}
																	data-testid={`button-remove-spouse-${index}`}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
																<div>
																	<label className="text-sm font-medium">
																		Surname
																	</label>
																	<Input
																		value={spouse.surname}
																		onChange={(e) =>
																			updateSpouse(
																				index,
																				"surname",
																				e.target.value
																			)
																		}
																		data-testid={`input-spouse-surname-${index}`}
																		placeholder="e.g., Wafula"
																	/>
																</div>
																<div>
																	<label className="text-sm font-medium">
																		First Name
																	</label>
																	<Input
																		value={spouse.firstName}
																		onChange={(e) =>
																			updateSpouse(
																				index,
																				"firstName",
																				e.target.value
																			)
																		}
																		data-testid={`input-spouse-firstname-${index}`}
																		placeholder="e.g., Musa"
																	/>
																</div>
																<div>
																	<label className="text-sm font-medium">
																		Other Names
																	</label>
																	<Input
																		value={spouse.otherNames || ""}
																		onChange={(e) =>
																			updateSpouse(
																				index,
																				"otherNames",
																				e.target.value
																			)
																		}
																		data-testid={`input-spouse-othernames-${index}`}
																		placeholder="e.g., Juma"
																	/>
																</div>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Dependents */}
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-2xl font-medium">
													Dependent Children
												</CardTitle>
												<CardDescription>
													Add details of children under 18 years
												</CardDescription>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={addDependent}
												data-testid="button-add-dependent"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Dependent
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										{dependents.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No dependents added yet
											</p>
										) : (
											<div className="space-y-4">
												{dependents.map((dependent, index) => (
													<Card key={index}>
														<CardContent className="p-6">
															<div className="flex items-start justify-between mb-4">
																<Badge variant="secondary">
																	Dependent {index + 1}
																</Badge>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() => removeDependent(index)}
																	data-testid={`button-remove-dependent-${index}`}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
																<div>
																	<label className="text-sm font-medium">
																		Surname
																	</label>
																	<Input
																		value={dependent.surname}
																		onChange={(e) =>
																			updateDependent(
																				index,
																				"surname",
																				e.target.value
																			)
																		}
																		data-testid={`input-dependent-surname-${index}`}
																		placeholder="e.g., Juma"
																	/>
																</div>
																<div>
																	<label className="text-sm font-medium">
																		First Name
																	</label>
																	<Input
																		value={dependent.firstName}
																		onChange={(e) =>
																			updateDependent(
																				index,
																				"firstName",
																				e.target.value
																			)
																		}
																		data-testid={`input-dependent-firstname-${index}`}
																		placeholder="e.g., Ethan"
																	/>
																</div>
																<div>
																	<label className="text-sm font-medium">
																		Other Names
																	</label>
																	<Input
																		value={dependent.otherNames || ""}
																		onChange={(e) =>
																			updateDependent(
																				index,
																				"otherNames",
																				e.target.value
																			)
																		}
																		data-testid={`input-dependent-othernames-${index}`}
																		placeholder="e.g., Wakoli"
																	/>
																</div>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Statement Period */}
								<Card>
									<CardHeader>
										<CardTitle className="text-2xl font-medium">
											Statement Period
										</CardTitle>
										<CardDescription>
											Specify the declaration period
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<FormField
											control={form.control}
											name="statementDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Statement Date</FormLabel>
													<FormControl>
														<Input
															type="date"
															{...field}
															data-testid="input-statement-date"
														/>
													</FormControl>
													<FormDescription>
														The date of this declaration (e.g., 1st November
														2021)
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<FormField
												control={form.control}
												name="periodStart"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Period Start</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																data-testid="input-period-start"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="periodEnd"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Period End</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																data-testid="input-period-end"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
								</Card>

								{/* Income */}
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-2xl font-medium">
													Statement of Income
												</CardTitle>
												<CardDescription>
													List all sources of income
												</CardDescription>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => addStatementItem("income")}
												data-testid="button-add-income"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Income
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										{incomeItems.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No income items added yet
											</p>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12">#</TableHead>
														<TableHead>Description</TableHead>
														<TableHead>Amount (KES)</TableHead>
														<TableHead className="w-12"></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{incomeItems.map((item, index) => (
														<TableRow key={index}>
															<TableCell>{index + 1}</TableCell>
															<TableCell>
																<Input
																	value={item.description}
																	onChange={(e) =>
																		updateStatementItem(
																			"income",
																			index,
																			"description",
																			e.target.value
																		)
																	}
																	placeholder="e.g., Gross two year salary"
																	data-testid={`input-income-description-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Input
																	type="number"
																	value={item.approximateAmount}
																	onChange={(e) =>
																		updateStatementItem(
																			"income",
																			index,
																			"approximateAmount",
																			parseInt(e.target.value) || 0
																		)
																	}
																	data-testid={`input-income-amount-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		removeStatementItem("income", index)
																	}
																	data-testid={`button-remove-income-${index}`}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</CardContent>
								</Card>

								{/* Assets */}
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-2xl font-medium">
													Statement of Assets
												</CardTitle>
												<CardDescription>List all assets owned</CardDescription>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => addStatementItem("asset")}
												data-testid="button-add-asset"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Asset
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										{assetItems.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No assets added yet
											</p>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12">#</TableHead>
														<TableHead>Description</TableHead>
														<TableHead>Location</TableHead>
														<TableHead>Amount (KES)</TableHead>
														<TableHead className="w-12"></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{assetItems.map((item, index) => (
														<TableRow key={index}>
															<TableCell>{index + 1}</TableCell>
															<TableCell>
																<Input
																	value={item.description}
																	onChange={(e) =>
																		updateStatementItem(
																			"asset",
																			index,
																			"description",
																			e.target.value
																		)
																	}
																	placeholder="e.g., Plot No. 90; Matatu Nissan Caravan"
																	data-testid={`input-asset-description-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Input
																	value={item.location || ""}
																	onChange={(e) =>
																		updateStatementItem(
																			"asset",
																			index,
																			"location",
																			e.target.value
																		)
																	}
																	placeholder="Location, or Type, or Make"
																	data-testid={`input-asset-location-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Input
																	type="number"
																	value={item.approximateAmount}
																	onChange={(e) =>
																		updateStatementItem(
																			"asset",
																			index,
																			"approximateAmount",
																			parseInt(e.target.value) || 0
																		)
																	}
																	data-testid={`input-asset-amount-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		removeStatementItem("asset", index)
																	}
																	data-testid={`button-remove-asset-${index}`}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</CardContent>
								</Card>

								{/* Liabilities */}
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-2xl font-medium">
													Statement of Liabilities
												</CardTitle>
												<CardDescription>
													List all liabilities and debts
												</CardDescription>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => addStatementItem("liability")}
												data-testid="button-add-liability"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Liability
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										{liabilityItems.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No liabilities added yet
											</p>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12">#</TableHead>
														<TableHead>Description</TableHead>
														<TableHead>Amount (KES)</TableHead>
														<TableHead className="w-12"></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{liabilityItems.map((item, index) => (
														<TableRow key={index}>
															<TableCell>{index + 1}</TableCell>
															<TableCell>
																<Input
																	value={item.description}
																	onChange={(e) =>
																		updateStatementItem(
																			"liability",
																			index,
																			"description",
																			e.target.value
																		)
																	}
																	placeholder="e.g., Outstanding Apstar Sacco Loan"
																	data-testid={`input-liability-description-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Input
																	type="number"
																	value={item.approximateAmount}
																	onChange={(e) =>
																		updateStatementItem(
																			"liability",
																			index,
																			"approximateAmount",
																			parseInt(e.target.value) || 0
																		)
																	}
																	data-testid={`input-liability-amount-${index}`}
																/>
															</TableCell>
															<TableCell>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		removeStatementItem("liability", index)
																	}
																	data-testid={`button-remove-liability-${index}`}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</CardContent>
								</Card>

								{/* Other Information */}
								<Card>
									<CardHeader>
										<CardTitle className="text-2xl font-medium">
											Other Information
										</CardTitle>
										<CardDescription>
											Additional notes or details
										</CardDescription>
									</CardHeader>
									<CardContent>
										<FormField
											control={form.control}
											name="otherInformation"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<Textarea
															{...field}
															rows={6}
															placeholder="e.g., Income from crops is from land own by my father; or Title for plot is not issued due to unfinished land adjudication..."
															data-testid="input-other-information"
														/>
													</FormControl>
													<FormDescription>
														Optional additional information or clarifications
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>

								{/* Signatures */}
								<Card>
									<CardHeader>
										<CardTitle className="text-2xl font-medium">
											Signatures
										</CardTitle>
										<CardDescription>
											Officer and witness signatures
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-8">
										<div className="space-y-4">
											<h3 className="text-lg font-medium">Officer Signature</h3>
											<FormField
												control={form.control}
												name="officerSignatureData"
												render={({ field }) => (
													<FormItem>
														<FormControl>
															<SignatureCanvas
																value={field.value}
																onChange={field.onChange}
																label="Sign here"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="officerSignatureDate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Date</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																data-testid="input-officer-signature-date"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<Separator />

										<div className="space-y-4">
											<h3 className="text-lg font-medium">Witness Signature</h3>
											<FormField
												control={form.control}
												name="witnessSignatureData"
												render={({ field }) => (
													<FormItem>
														<FormControl>
															<SignatureCanvas
																value={field.value}
																onChange={field.onChange}
																label="Witness signs here"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<FormField
													control={form.control}
													name="witnessName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Witness Name</FormLabel>
															<FormControl>
																<Input
																	{...field}
																	data-testid="input-witness-name"
																	placeholder="e.g. Lilian Chepchirchir Kones"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="witnessSignatureDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Date</FormLabel>
															<FormControl>
																<Input
																	type="date"
																	{...field}
																	data-testid="input-witness-signature-date"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<FormField
												control={form.control}
												name="witnessAddress"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Witness Address</FormLabel>
														<FormControl>
															<Textarea
																{...field}
																data-testid="input-witness-address"
																placeholder="e.g., P.O. Box 2343-00100, Nairobi"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
								</Card>

								{/* Actions */}
								<div className="flex gap-3 justify-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => navigate("/dials/dashboard")}
										data-testid="button-cancel"
									>
										Cancel
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSave(false)}
										data-testid="button-save-draft-bottom"
									>
										<Save className="h-4 w-4 mr-2" />
										Save Draft
									</Button>
									{dialId && declaration?.status === "draft" && (
										<Button
											type="button"
											onClick={handleSubmit}
											data-testid="button-submit-bottom"
										>
											<Send className="h-4 w-4 mr-2" />
											Submit for Review
										</Button>
									)}
								</div>
							</form>
						</Form>
					</div>
				</main>
			</div>
		</div>
	);
}
