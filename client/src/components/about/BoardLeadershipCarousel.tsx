import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { BoardMember } from '@shared/schema';

export default function BoardLeadershipCarousel() {
  const { data: boardMembers = [], isLoading, isError, refetch } = useQuery<BoardMember[]>({
    queryKey: ['/api/public/board-members'],
  });
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: boardMembers.length > 1,
    align: 'start',
    slidesToScroll: 1
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Board Members</h3>
        <p className="text-gray-600 mb-4">We're having trouble loading the board member information.</p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2 mx-auto" data-testid="button-retry-board-members">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-80 animate-pulse">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (boardMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No board members available at this time.</p>
      </div>
    );
  }

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
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
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="relative">
      <div className="embla overflow-hidden" ref={emblaRef} data-testid="board-leadership-carousel">
        <div className="embla__container flex">
          {boardMembers.map((member) => (
            <div key={member.id} className="embla__slide flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center h-full flex flex-col">
                  {/* Avatar */}
                  <div className="relative mb-6">
                    {member.photoUrl ? (
                      <img 
                        src={member.photoUrl} 
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#1D523A]/10"
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-xl font-semibold border-4"
                        style={{ 
                          backgroundColor: '#1D523A',
                          borderColor: '#09CDE3'
                        }}
                      >
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div 
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#EEF200' }}
                    >
                      <User className="w-4 h-4" style={{ color: '#1D523A' }} />
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{member.name}</h3>
                    <p 
                      className="font-semibold mb-2 text-sm"
                      style={{ color: '#1D523A' }}
                    >
                      {member.position}
                    </p>
                    
                    {/* Bio */}
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">
                      {member.bio || 'No bio available.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
          canScrollPrev 
            ? 'bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-[#1D523A]' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        data-testid="board-carousel-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
          canScrollNext 
            ? 'bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-[#1D523A]' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        onClick={scrollNext}
        disabled={!canScrollNext}
        data-testid="board-carousel-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {boardMembers.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? 'scale-125' 
                : 'hover:bg-gray-400'
            }`}
            style={{ 
              backgroundColor: index === selectedIndex ? '#1D523A' : '#D1D5DB'
            }}
            onClick={() => emblaApi?.scrollTo(index)}
            data-testid={`board-carousel-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}