import React, { useState } from "react";
import { useFileUpload, uploadConfigs } from "../../hooks/useFileUpload";

export default function UploadDocumentExample() {
	const [selected, setSelected] = useState<File | null>(null);
	// make a mutable copy of the predefined config (uploadConfigs.documents uses readonly arrays)
	const docsConfig = {
		...uploadConfigs.documents,
		invalidateQueries: Array.from(
			uploadConfigs.documents.invalidateQueries || []
		),
		acceptedTypes: Array.from(uploadConfigs.documents.acceptedTypes || []),
	};

	const { uploadFile, state, resetUploadState } = useFileUpload(docsConfig);

	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		setSelected(f);
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selected) return alert("Please select a PDF to upload");
		try {
			// use filename-based identifier so the hook can track progress per file
			const identifier = `certificate-${Date.now()}`;
			const res = await uploadFile(selected, identifier, {
				type: "certificate",
			});
			console.log("Upload success", res);
			alert("Upload successful");
		} catch (err: any) {
			console.error(err);
			alert(err?.message || "Upload failed");
		}
	};

	return (
		<div className="max-w-xl mx-auto p-4">
			<h2 className="text-xl font-semibold mb-2">Upload Certificate (PDF)</h2>
			<form onSubmit={submit}>
				<input type="file" accept="application/pdf" onChange={handleFile} />
				<div className="mt-3">
					<button
						type="submit"
						disabled={state.isUploading}
						className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
					>
						{state.isUploading ? "Uploading..." : "Upload"}
					</button>
				</div>
			</form>

			{state.isUploading && <div className="mt-3 text-sm">Uploading…</div>}
			{Object.keys(state.uploadProgress).length > 0 && (
				<div className="mt-3 text-sm">
					In progress:{" "}
					{Object.keys(state.uploadProgress)
						.filter((k) => state.uploadProgress[k])
						.join(", ")}
				</div>
			)}
			{state.uploadedFiles && Object.keys(state.uploadedFiles).length > 0 && (
				<div className="mt-3 text-green-700">
					Uploaded: {JSON.stringify(state.uploadedFiles)}
				</div>
			)}
		</div>
	);
}
