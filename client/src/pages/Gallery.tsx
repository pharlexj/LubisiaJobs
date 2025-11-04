import { useState, useMemo } from "react";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { GalleryItem } from "@shared/schema";

export default function Gallery() {
	const [selectedCategory, setSelectedCategory] = useState("All");

	const { data: galleryItems = [], isLoading } = useQuery({
		queryKey: ["/api/public/gallery"],
	}) as { data: GalleryItem[]; isLoading: boolean };

	const categories = useMemo(() => {
		const uniqueCategories = [
			...new Set(galleryItems.map((item) => item.category).filter(Boolean)),
		];
		return ["All", ...uniqueCategories];
	}, [galleryItems]);

	const filteredItems = useMemo(() => {
		if (selectedCategory === "All") return galleryItems;
		return galleryItems.filter((item) => item.category === selectedCategory);
	}, [galleryItems, selectedCategory]);

	const stats = useMemo(() => {
		const totalEvents = galleryItems.length;
		const totalPhotos = galleryItems.length;
		const trainingEvents = galleryItems.filter((item) =>
			item.category?.toLowerCase().includes("training")
		).length;
		const awardsEvents = galleryItems.filter(
			(item) =>
				item.category?.toLowerCase().includes("awards") ||
				item.category?.toLowerCase().includes("event")
		).length;

		return {
			events: totalEvents,
			photos: totalPhotos,
			training: trainingEvents,
			awards: awardsEvents,
		};
	}, [galleryItems]);

	const getCategoryColor = (category: string) => {
		const colors = {
			meetings: "bg-blue-100 text-blue-800",
			training: "bg-green-100 text-green-800",
			recruitment: "bg-purple-100 text-purple-800",
			events: "bg-yellow-100 text-yellow-800",
			outreach: "bg-red-100 text-red-800",
			awards: "bg-orange-100 text-orange-800",
		};
		const key = category?.toLowerCase();
		return colors[key as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-neutral-50">
				<Navigation />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="animate-pulse space-y-6">
						{[...Array(6)].map((_, i) => (
							<Card key={i}>
								<div className="aspect-video bg-gray-200 rounded-t-lg"></div>
								<CardContent className="p-4">
									<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-1/2"></div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-neutral-50">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						Explore our activities, events, and milestones through photos and
						documentation of our commitment to excellence in public service.
					</p>
				</div>

				<div className="flex flex-wrap justify-center gap-2 mb-8">
					{categories.map((category) => (
						<Badge
							key={category}
							variant={selectedCategory === category ? "default" : "outline"}
							className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
							onClick={() => setSelectedCategory(category)}
						>
							{category}
						</Badge>
					))}
				</div>

				{filteredItems.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-center">
							<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
								<span className="text-2xl">📸</span>
							</div>
							<p className="text-gray-600 mb-4">
								{selectedCategory === "All"
									? "No gallery items available."
									: `No items found in ${selectedCategory} category.`}
							</p>
							{selectedCategory !== "All" && (
								<Badge
									variant="outline"
									className="cursor-pointer"
									onClick={() => setSelectedCategory("All")}
								>
									Show All Items
								</Badge>
							)}
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredItems.map((item) => (
							<Card
								key={item.id}
								className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
								data-testid={`card-gallery-${item.id}`}
							>
								<div
									className="relative w-full overflow-hidden rounded-t-lg"
									style={{ aspectRatio: "auto" }}
								>
									{item.imageUrl ? (
										<img
											src={item.imageUrl}
											alt={item.title || "Gallery image"}
											className="w-full h-auto max-h-[500px] object-cover object-center block mx-auto"
										/>
									) : (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="text-center">
												<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
													<span className="text-2xl">📸</span>
												</div>
												<p className="text-sm text-gray-600">Photo Gallery</p>
											</div>
										</div>
									)}
									{item.category && (
										<Badge
											className={`absolute top-2 right-2 ${getCategoryColor(
												item.category
											)}`}
										>
											{item.category}
										</Badge>
									)}
								</div>
								<CardContent className="p-4 h-auto text-center">
									<h3 className="font-semibold text-gray-900 mb-1">
										{item.title}
									</h3>
									<p className="text-gray-600 text-sm mb-1 line-clamp-2">
										{item.description || "No description available."}
									</p>
									<p className="text-xs text-gray-500">
										{item.eventDate
											? new Date(item.eventDate).toLocaleDateString()
											: "No date specified"}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				<div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card>
						<CardContent className="p-6 text-center">
							<div className="text-3xl font-bold text-primary mb-2">
								{stats.events}
							</div>
							<div className="text-gray-600">Events Documented</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 text-center">
							<div className="text-3xl font-bold text-secondary mb-2">
								{stats.photos}
							</div>
							<div className="text-gray-600">Photos Archived</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 text-center">
							<div className="text-3xl font-bold text-primary mb-2">
								{stats.training}
							</div>
							<div className="text-gray-600">Training Sessions</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 text-center">
							<div className="text-3xl font-bold text-secondary mb-2">
								{stats.awards}
							</div>
							<div className="text-gray-600">Awards & Events</div>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-12">
					<CardContent className="p-8 text-center">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Share Your Experience
						</h2>
						<p className="text-gray-600 mb-6 max-w-2xl mx-auto">
							Have photos or memories from our events? We'd love to feature them
							in our gallery. Contact us to share your contributions to our
							public service community.
						</p>
						<div className="flex justify-center space-x-4">
							<Badge variant="outline" className="text-primary">
								📧 gallery@cpsbtransnzoia.go.ke
							</Badge>
							<Badge variant="outline" className="text-primary">
								📞 +254 713 635 352
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
