import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Edit, Trash2 } from "lucide-react";

export default function GalleryList({
	galleryItems = [],
	onEdit,
	onDelete,
}: any) {
	return (
		<CardContent>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{galleryItems.length === 0 ? (
					<div className="col-span-3 text-center py-12">
						<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Camera className="w-8 h-8 text-gray-400" />
						</div>
						<p className="text-gray-600 mb-4">No gallery items yet.</p>
					</div>
				) : (
					(galleryItems as any[]).map((item: any) => (
						<Card
							key={item.id}
							className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
						>
							<div className="relative w-full h-64 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
								{item.imageUrl ? (
									<img
										src={item.imageUrl}
										alt={item.title}
										className="absolute inset-0 w-full h-full object-cover object-center"
									/>
								) : (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
										<Camera className="w-12 h-12 text-gray-400" />
									</div>
								)}
								{item.category && (
									<Badge
										variant="secondary"
										className="absolute top-2 right-2 capitalize"
									>
										{item.category}
									</Badge>
								)}
							</div>

							<CardContent className="p-4">
								<h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
									{item.title}
								</h4>
								<p className="text-sm text-gray-600 mb-3 line-clamp-2">
									{item.description || "No description provided."}
								</p>

								<div className="flex items-center justify-between text-sm text-gray-500">
									<p>
										{item.eventDate
											? new Date(item.eventDate).toLocaleDateString()
											: "No date"}
									</p>
									<div className="flex space-x-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onEdit && onEdit(item)}
										>
											<Edit className="w-4 h-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDelete && onDelete(item.id)}
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</CardContent>
	);
}
