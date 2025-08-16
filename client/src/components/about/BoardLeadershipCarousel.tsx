import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

// Mock data - this will be replaced with database data later
const mockBoardMembers = [
  {
    id: 1,
    name: "Dr. Mary Kiprotich",
    position: "Chairperson",
    qualification: "PhD in Public Administration",
    bio: "Dr. Kiprotich brings over 15 years of experience in public administration and governance. She has been instrumental in implementing transparent recruitment processes.",
    avatar: null,
    expertise: ["Public Administration", "Governance", "Policy Development"]
  },
  {
    id: 2,
    name: "John Wekesa",
    position: "Vice Chairperson", 
    qualification: "Masters in Human Resource Management",
    bio: "A seasoned HR professional with extensive experience in talent acquisition and organizational development across both public and private sectors.",
    avatar: null,
    expertise: ["Human Resources", "Talent Management", "Organizational Development"]
  },
  {
    id: 3,
    name: "Grace Nasimiyu",
    position: "Board Member",
    qualification: "LLB, Advocate of the High Court",
    bio: "An accomplished legal practitioner specializing in employment law and public sector governance. She ensures all board decisions comply with legal requirements.",
    avatar: null,
    expertise: ["Employment Law", "Legal Compliance", "Governance"]
  },
  {
    id: 4,
    name: "Prof. James Mutua",
    position: "Board Member",
    qualification: "PhD in Business Administration",
    bio: "A distinguished academic and consultant with expertise in strategic management and organizational effectiveness in public institutions.",
    avatar: null,
    expertise: ["Strategic Management", "Organizational Development", "Public Policy"]
  },
  {
    id: 5,
    name: "Sarah Chebet",
    position: "Board Member",
    qualification: "Masters in Public Policy",
    bio: "A policy expert with a strong background in public service reforms and capacity building initiatives across various government levels.",
    avatar: null,
    expertise: ["Public Policy", "Service Delivery", "Capacity Building"]
  },
  {
    id: 6,
    name: "David Kiprotich",
    position: "Secretary/CEO",
    qualification: "Masters in Public Administration",
    bio: "Serves as the chief executive officer of the board, overseeing day-to-day operations and ensuring smooth implementation of board decisions.",
    avatar: null,
    expertise: ["Executive Leadership", "Operations Management", "Strategic Implementation"]
  }
];

export default function BoardLeadershipCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
          {mockBoardMembers.map((member) => (
            <div key={member.id} className="embla__slide flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center h-full flex flex-col">
                  {/* Avatar */}
                  <div className="relative mb-6">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
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
                    <p className="text-sm text-gray-600 mb-3">{member.qualification}</p>
                    
                    {/* Bio */}
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {member.expertise.slice(0, 2).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: '#09CDE3' }}
                        >
                          {skill}
                        </span>
                      ))}
                      {member.expertise.length > 2 && (
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: '#EEF200',
                            color: '#1D523A'
                          }}
                        >
                          +{member.expertise.length - 2}
                        </span>
                      )}
                    </div>
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
        {mockBoardMembers.map((_, index) => (
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