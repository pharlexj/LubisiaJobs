import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, ChevronLeft, ChevronRight, Building, GraduationCap, Users, Award, Briefcase, MapPin, Clock, Target, Shield, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// Icon mapping
const iconMap = {
  Building,
  GraduationCap,
  Users,
  Award,
  Briefcase,
  MapPin,
  Clock,
  Target,
  Shield,
  Heart,
} as const;

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  bgGradient?: string;
  iconName: keyof typeof iconMap;
  accentColor?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  altText?: string;
  displayOrder: number;
  isActive: boolean;
}

// ✅ Fallback slides (mock data)
const fallbackSlides: CarouselSlide[] = [
  {
    id: 1,
    title: 'Build Your Career in Public Service',
    subtitle: 'Join Trans Nzoia County Public Service Board - Where dedication meets opportunity in serving our community.',
    bgGradient: 'from-[#1D523A] to-[#09CDE3]',
    iconName: 'Building',
    accentColor: '#EEF200',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    title: 'Professional Development Excellence',
    subtitle: 'Advance your skills and expertise while making a meaningful impact in public administration and community service.',
    bgGradient: 'from-[#09CDE3] to-[#1D523A]',
    iconName: 'GraduationCap',
    accentColor: '#EEF200',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    title: 'Community-Centered Employment',
    subtitle: 'Be part of a team dedicated to improving lives and building stronger communities across Trans Nzoia County.',
    bgGradient: 'from-[#EEF200]/80 via-[#09CDE3] to-[#1D523A]',
    iconName: 'Users',
    accentColor: '#1D523A',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 4,
    title: 'Recognition & Growth Opportunities',
    subtitle: 'Pursue excellence in public service with clear career progression paths and recognition for outstanding performance.',
    bgGradient: 'from-[#1D523A] via-[#09CDE3] to-[#EEF200]/80',
    iconName: 'Award',
    accentColor: '#1D523A',
    displayOrder: 4,
    isActive: true,
  },
];

export default function HeroCarousel() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>(fallbackSlides);
  const [isLoading, setIsLoading] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // ✅ Fetch API slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/carousel-slides', { credentials: 'include' });
        if (res.ok) {
          const apiSlides = await res.json();
          if (Array.isArray(apiSlides) && apiSlides.length > 0) setSlides(apiSlides);
        }
      } catch (err) {
        console.warn('Failed to fetch slides, using fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    const autoplay = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => {
      clearInterval(autoplay);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative overflow-hidden">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide) => {
            const IconComponent = iconMap[slide.iconName as keyof typeof iconMap] || Building;
            const bgGradient = slide.bgGradient || 'from-[#1D523A] to-[#09CDE3]';
            const accentColor = slide.accentColor || '#EEF200';

            // Extract gradient colors for fallback
            const gradientStart = bgGradient.match(/from-\[#(.*?)\]/)?.[1] ? `#${bgGradient.match(/from-\[#(.*?)\]/)?.[1]}` : '#1D523A';
            const gradientEnd = bgGradient.match(/to-\[#(.*?)\]/)?.[1] ? `#${bgGradient.match(/to-\[#(.*?)\]/)?.[1]}` : '#09CDE3';

            return (
              <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0">
                <div
                  className="relative min-h-[600px] flex items-center justify-center"
                  style={{ background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})` }}
                >
                  {/* ✅ Image background if available */}
                  {(slide.imageUrl || slide.mobileImageUrl) && (
                    <>
                      <img
                        src={slide.imageUrl}
                        alt={slide.altText || slide.title}
                        className="hidden lg:block absolute inset-0 w-full h-full object-cover object-center z-0"
                        loading="lazy"
                      />
                      <img
                        src={slide.mobileImageUrl || slide.imageUrl}
                        alt={slide.altText || slide.title}
                        className="block lg:hidden absolute inset-0 w-full h-full object-cover object-center z-0"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 z-0" />
                    </>
                  )}

                  <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      <div className="text-center lg:text-left text-white">
                        <div className="flex justify-center lg:justify-start mb-6">
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: accentColor }}
                          >
                            <IconComponent className="w-10 h-10" />
                          </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-2xl opacity-90 leading-relaxed">
                          {slide.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                          <Button
                            size="lg"
                            className="text-[#1D523A] bg-[#EEF200] font-semibold hover:bg-[#D9DA00] transition-all duration-300 shadow-lg"
                            onClick={() => setLocation('/jobs')}
                          >
                            <Search className="w-5 h-5 mr-2" /> Browse Jobs
                          </Button>
                          <Button
                            size="lg"
                            className="bg-[#1D523A] text-[#EEF200] font-semibold border-2 border-[#EEF200] hover:bg-[#174330] hover:text-[#FFF] transition-all duration-300 shadow-lg"
                            onClick={() => setLocation(user ? '/dashboard' : '/jobs')}
                          >
                            <UserPlus className="w-5 h-5 mr-2" /> Apply Now
                          </Button>
                        </div>
                      </div>

                      <div className="hidden lg:flex justify-center items-center">
                        <div className="relative">
                          <div
                            className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20"
                            style={{ backgroundColor: accentColor }}
                          ></div>
                          <div
                            className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full opacity-15"
                            style={{ backgroundColor: accentColor }}
                          ></div>
                          <div
                            className="w-64 h-64 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <IconComponent className="w-32 h-32" style={{ color: accentColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center z-10"
      >
        <ChevronLeft className="w-6 h-6 text-[#1D523A]" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center z-10"
      >
        <ChevronRight className="w-6 h-6 text-[#1D523A]" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              selectedIndex === i ? 'bg-[#EEF200] scale-125' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
}