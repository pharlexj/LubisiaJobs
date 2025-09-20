"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Leader {
  id: number;
  name: string;
  position: string;
  image: string;
}

interface BoardLeadershipCarouselProps {
  leaders?: Leader[]; // optional, can be undefined
}

export default function BoardLeadershipCarousel({
  leaders = [],
}: BoardLeadershipCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000 }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full max-w-5xl mx-auto relative">
      {/* If no leaders, show fallback */}
      {leaders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No board leaders found.
        </p>
      ) : (
        <>
          {/* Carousel viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] p-4"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="w-32 h-32 rounded-full object-cover mb-4"
                    />
                    <h3 className="font-semibold text-lg">{leader.name}</h3>
                    <p className="text-sm text-gray-500">{leader.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow disabled:opacity-30"
            disabled={!canScrollPrev}
            aria-label="Previous leader"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow disabled:opacity-30"
            disabled={!canScrollNext}
            aria-label="Next leader"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {leaders.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${
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
