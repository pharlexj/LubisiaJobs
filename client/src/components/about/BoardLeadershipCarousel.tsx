"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Leader {
	id: number;
	name: string;
	position: string;
	image: string;
}

interface BoardLeadershipCarouselProps {
	leaders?: Leader[];
}

export default function BoardLeadershipCarousel({
	leaders = [],
}: BoardLeadershipCarouselProps) {
	// Use ref to prevent Autoplay plugin from reinitializing when emblaApi changes
	const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
	const [emblaRef, emblaApi] = useEmblaCarousel(
		{ loop: true, align: "center", skipSnaps: false },
		[autoplay.current]
	);

	const [selectedIndex, setSelectedIndex] = useState(0);

	const scrollPrev = useCallback(() => {
		autoplay.current.stop();
		emblaApi?.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		autoplay.current.stop();
		emblaApi?.scrollNext();
	}, [emblaApi]);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
	}, [emblaApi, onSelect]);

	return (
		<div className="w-full max-w-6xl mx-auto relative overflow-hidden">
			{leaders.length === 0 ? (
				<p className="text-center text-gray-500 py-8">
					No board leaders found.
				</p>
			) : (
				<>
					<div className="overflow-hidden" ref={emblaRef}>
						<div className="flex items-center">
							{leaders.map((leader, index) => {
								const isActive = index === selectedIndex;
								return (
									<div
										key={leader.id}
										className={`flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] transition-transform duration-700 ease-in-out p-4 flex justify-center will-change-transform ${
											isActive
												? "scale-110 z-20"
												: "scale-90 opacity-50 blur-sm z-10"
										}`}
									>
										<div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center transition-transform duration-700">
											<div className="relative w-40 h-40 rounded-full overflow-hidden mb-4 shadow-lg">
												<img
													src={leader.image}
													alt={leader.name}
													className="absolute inset-0 w-full h-full object-cover object-center"
													loading="lazy"
												/>
											</div>
											<h3 className="font-semibold text-lg text-gray-900">
												{leader.name}
											</h3>
											<p className="text-sm text-gray-500">{leader.position}</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Navigation Buttons */}
					<button
						onClick={scrollPrev}
						className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
						aria-label="Previous leader"
					>
						<ChevronLeft className="w-6 h-6" />
					</button>

					<button
						onClick={scrollNext}
						className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
						aria-label="Next leader"
					>
						<ChevronRight className="w-6 h-6" />
					</button>

					{/* Indicators */}
					<div className="flex justify-center mt-4 space-x-2">
						{leaders.map((_, index) => (
							<button
								key={index}
								className={`w-3 h-3 rounded-full transition-colors duration-300 ${
									index === selectedIndex ? "bg-blue-600" : "bg-gray-300"
								}`}
								onClick={() => emblaApi?.scrollTo(index)}
								aria-label={`Go to slide ${index + 1}`}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
