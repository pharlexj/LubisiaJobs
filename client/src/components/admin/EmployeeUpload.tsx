import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeUpload() {
	const { toast } = useToast();
	const [selected, setSelected] = useState<File | null>(null);

	const importConfig = {
		endpoint: "/api/admin/import-employees",
		fieldName: "file",
		acceptedTypes: [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/csv",
		],
		maxSizeInMB: 15,
		successMessage: "Employees imported successfully",
		errorMessage: "Failed to import employees",
	} as any;

	const { uploadFile, state } = useFileUpload(importConfig);

	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		setSelected(f);
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selected)
			return toast({
				title: "No file",
				description: "Please select a CSV or Excel file to import",
				variant: "destructive",
			});
		try {
			const identifier = `employee-import-${Date.now()}`;
			const res = await uploadFile(selected, identifier);
			console.log("Import success", res);
		} catch (err: any) {
			console.error(err);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle>Employee Import</CardTitle>
					<p className="text-sm text-gray-600 mt-1">
						Upload a CSV or Excel file to import employee records.
					</p>
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<Label
							htmlFor="employee-file"
							className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
						>
							<Input
								id="employee-file"
								type="file"
								accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								onChange={handleFile}
                                data-testid="input-employee-import"
                                className="hidden"
							/>
							<div className="flex flex-col items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-8 w-8 text-red-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 4v12m0 0l-4-4m4 4l4-4M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6"
									/>
								</svg>
								<div className="text-sm text-gray-500">
									Click to upload Employees Excel file
								</div>
								<div className="text-xs text-gray-400">.xlsx, .xls, .xlsm</div>
							</div>
						</Label>
						{selected && (
							<p className="text-sm text-gray-600 mt-1">
								Selected: {selected.name}
							</p>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Button type="submit" disabled={state.isUploading}>
							{state.isUploading ? "Importing..." : "Import Employees"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setSelected(null)}
						>
							Clear
						</Button>
					</div>

					{state.isUploading && (
						<div className="text-sm">Import in progress…</div>
					)}
					{Object.keys(state.uploadedFiles).length > 0 && (
						<div className="text-sm text-green-700">
							Imported: {JSON.stringify(state.uploadedFiles)}
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
