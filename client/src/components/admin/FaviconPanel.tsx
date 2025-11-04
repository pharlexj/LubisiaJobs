import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function FaviconPanel() {
	const { toast } = useToast();

	const handleFaviconChange = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validTypes = [
			"image/x-icon",
			"image/vnd.microsoft.icon",
			"image/png",
		];
		if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
			toast({
				title: "Error",
				description: "Invalid file type. Please upload a .ico or .png file.",
				variant: "destructive",
			});
			return;
		}

		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch("/api/admin/upload-favicon", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (data.success) {
				toast({
					title: "Success",
					description:
						"Favicon uploaded successfully! Please refresh the page to see changes.",
				});
				e.currentTarget.value = "";
			} else {
				toast({
					title: "Error",
					description: data.message || "Failed to upload favicon",
					variant: "destructive",
				});
			}
		} catch (err) {
			toast({
				title: "Error",
				description: "Failed to upload favicon. Please try again.",
				variant: "destructive",
			});
		}
	};

	return (
		<>
			<div className="p-4 border rounded-lg">
				<h3 className="text-lg font-semibold mb-4">Favicon Management</h3>
				<p className="text-sm text-gray-600 mb-4">
					Upload a favicon for your website. Recommended size: 16x16 or 32x32
					pixels. Accepted formats: .ico, .png
				</p>

				<div className="space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex-1">
							<Label htmlFor="favicon-upload">Upload Favicon</Label>
							<Input
								id="favicon-upload"
								type="file"
								accept=".ico,.png"
								onChange={handleFaviconChange}
								data-testid="input-favicon-upload"
							/>
						</div>
					</div>

					<div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
						<div className="w-8 h-8 bg-white border rounded flex items-center justify-center">
							<img
								src="/uploads/favicon.ico"
								alt="Current favicon"
								className="w-4 h-4"
								onError={(e) => {
									const img = e.currentTarget as HTMLElement;
									img.classList.add("hidden");
									const next = img.nextElementSibling as HTMLElement | null;
									if (next) next.classList.remove("hidden");
								}}
							/>
							<div className="text-xs text-gray-400 hidden">🏛️</div>
						</div>
						<div>
							<p className="text-sm font-medium">Current Favicon</p>
							<p className="text-xs text-gray-500">
								Will fallback to default if not found
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="p-4 border rounded-lg border-dashed border-gray-300">
				<h3 className="text-lg font-semibold mb-2 text-gray-400">
					Future System Settings
				</h3>
				<p className="text-sm text-gray-500">
					Additional system settings like site title, default language, email
					configurations, etc. will be added here.
				</p>
			</div>
		</>
	);
}
