import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFileUpload, uploadConfigs } from "@/hooks/useFileUpload";
import { useToast } from "@/hooks/use-toast";

export default function DocumentUpload() {
	const { toast } = useToast();
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	// make mutable copy of predefined documents config
	const docsConfig = {
		...uploadConfigs.documents,
		invalidateQueries: Array.from(
			uploadConfigs.documents.invalidateQueries || []
		),
		acceptedTypes: Array.from(uploadConfigs.documents.acceptedTypes || []),
	} as any;

	const { uploadFile, uploadMultipleFiles, state, resetUploadState } =
		useFileUpload(docsConfig);

	const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files ? Array.from(e.target.files) : [];
		setSelectedFiles(files);
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedFiles.length === 0)
			return toast({
				title: "No files",
				description: "Please select one or more documents to upload",
				variant: "destructive",
			});

		try {
			const payload = selectedFiles.map((file) => ({
				file,
				identifier: `doc-${file.name}-${Date.now()}`,
			}));
			const results = await uploadMultipleFiles(payload as any);
			console.log("Upload results", results);
			// keep uploaded list visible; client may call resetUploadState() later
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle>Documents Upload</CardTitle>
					<p className="text-sm text-gray-600 mt-1">
						Upload supporting documents (PDF, images, Word).
					</p>
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<Label htmlFor="documents">Select documents</Label>
						<Input
							id="documents"
							type="file"
							multiple
							onChange={handleFiles}
							accept={docsConfig.acceptedTypes.join(",")}
						/>
						{selectedFiles.length > 0 && (
							<div className="mt-2 text-sm">
								Selected: {selectedFiles.map((f) => f.name).join(", ")}
							</div>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Button type="submit" disabled={state.isUploading}>
							{state.isUploading ? "Uploading..." : "Upload Documents"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setSelectedFiles([]);
								resetUploadState();
							}}
						>
							Clear
						</Button>
					</div>

					{state.isUploading && <div className="text-sm">Uploading…</div>}
					{Object.keys(state.uploadProgress).length > 0 && (
						<div className="text-sm">
							In progress:{" "}
							{Object.keys(state.uploadProgress)
								.filter((k) => state.uploadProgress[k])
								.join(", ")}
						</div>
					)}
					{state.uploadedFiles &&
						Object.keys(state.uploadedFiles).length > 0 && (
							<div className="text-sm text-green-700">
								Uploaded: {JSON.stringify(state.uploadedFiles)}
							</div>
						)}
				</form>
			</CardContent>
		</Card>
	);
}
