import React, { useState } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";

export default function EmployeeImportExample() {
	const [selected, setSelected] = useState<File | null>(null);

	const importConfig = {
		endpoint: "/api/employee/import",
		fieldName: "file",
		acceptedTypes: [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/csv",
		],
		maxSizeInMB: 15,
	};

	// cast to any because the project's UploadConfig uses mutable arrays
	const { uploadFile, state } = useFileUpload(importConfig as any);

	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		setSelected(f);
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selected) return alert("Please select an Excel or CSV file");
		try {
			const identifier = `employee-import-${Date.now()}`;
			const res = await uploadFile(selected, identifier);
			console.log("Import success", res);
			alert("Import completed: " + JSON.stringify(res));
		} catch (err: any) {
			console.error(err);
			alert(err?.message || "Import failed");
		}
	};

	return (
		<div className="max-w-xl mx-auto p-4">
			<h2 className="text-xl font-semibold mb-2">
				Employee Import (Excel/CSV)
			</h2>
			<form onSubmit={submit}>
				<input
					type="file"
					accept=".xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					onChange={handleFile}
				/>
				<div className="mt-3">
					<button
						type="submit"
						disabled={state.isUploading}
						className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
					>
						{state.isUploading ? "Importing..." : "Import"}
					</button>
				</div>
			</form>

			{state.isUploading && (
				<div className="mt-3 text-sm">Import in progress…</div>
			)}

			{Object.keys(state.uploadedFiles).length > 0 && (
				<div className="mt-3 text-green-700">
					Imported: {JSON.stringify(state.uploadedFiles)}
				</div>
			)}
		</div>
	);
}
