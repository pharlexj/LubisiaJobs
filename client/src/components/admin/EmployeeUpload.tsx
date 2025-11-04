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
						<Label htmlFor="employee-file">Employee file (CSV / XLSX)</Label>
						<Input
							id="employee-file"
							type="file"
							accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							onChange={handleFile}
							data-testid="input-employee-import"
						/>
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
