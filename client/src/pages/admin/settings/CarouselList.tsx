import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export default function CarouselList({ slides = [], onEdit, onDelete }: any) {
	return (
		<CardContent>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{slides.length === 0 ? (
					<p className="text-gray-500 text-center py-4">
						No carousel slides yet. Add one above.
					</p>
				) : (
					slides.map((slide: any) => (
						<Card key={slide.id}>
							<CardContent className="p-4">
								<h4 className="font-semibold">{slide.title}</h4>
								<div className="text-xs text-gray-500 mb-1">
									Order: {slide.displayOrder} |{" "}
									{slide.isActive ? "Active" : "Inactive"}
								</div>
								<p className="text-sm text-gray-600">{slide.subtitle}</p>
								{slide.imageUrl ? (
									<img
										src={slide.imageUrl}
										alt={slide.altText || slide.title}
										className="mt-2 rounded-md h-32 object-cover"
									/>
								) : (
									<div className="mt-2 h-32 rounded-md bg-gray-100 flex items-center justify-center" />
								)}

								<div className="text-xs mt-2">
									Accent:{" "}
									<span
										className="px-2 py-1 rounded text-white"
										style={{ background: slide.accentColor || "#000" }}
									>
										{slide.accentColor || "—"}
									</span>
								</div>

								<div className="flex gap-2 mt-3">
									<Button
										size="sm"
										variant="outline"
										onClick={() => onEdit && onEdit(slide)}
									>
										<Edit className="w-4 h-4 mr-1" /> Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => onDelete && onDelete(slide.id)}
									>
										<Trash2 className="w-4 h-4 mr-1" /> Delete
									</Button>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</CardContent>
	);
}
