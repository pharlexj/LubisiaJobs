import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";

export default function NoticesSection({
	notices = [],
	onAdd,
	onEdit,
	onDelete,
}: any) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Notices Management</CardTitle>
					<p className="text-sm text-gray-600 mt-1">
						Create and manage system notices
					</p>
				</div>
				<Dialog>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							Add Notice
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Notice</DialogTitle>
						</DialogHeader>
						{/* Parent Settings.tsx owns the form and submission */}
						<div />
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{notices.length === 0 ? (
						<div className="col-span-3 text-center py-8 text-gray-500">
							<FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
							<p>Click "Add Notice" to create your first notice</p>
						</div>
					) : (
						notices.map((notice: any) => (
							<Card key={notice.id}>
								<CardContent className="p-4">
									<div className="flex justify-between items-start mb-2">
										<h4 className="font-semibold">{notice.title}</h4>
										<div className="flex justify space-x-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onEdit && onEdit(notice)}
											>
												<Edit className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onDelete && onDelete(notice.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
									{notice.content && (
										<p className="text-sm text-gray-600">{notice.content}</p>
									)}
								</CardContent>
							</Card>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
