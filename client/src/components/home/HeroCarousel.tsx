import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, ChevronLeft, ChevronRight, Building, GraduationCap, Users, Award, Briefcase, MapPin, Clock, Target, Shield, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// Icon mapping from string names to components
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
  linkHref?: string;
  ctaLabel?: string;
  displayOrder: number;
  isActive: boolean;
}

// Fallback slides if database is empty or API fails
const fallbackSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Build Your Career in Public Service",
    subtitle: "Join Trans Nzoia County Public Service Board - Where dedication meets opportunity in serving our community",
    bgGradient: "from-[#1D523A] to-[#09CDE3]",
    iconName: "Building",
    accentColor: "#EEF200",
    displayOrder: 1,
    isActive: true
  },
  {
    id: 2,
    title: "Professional Development Excellence",
    subtitle: "Advance your skills and expertise while making a meaningful impact in public administration and community service",
    bgGradient: "from-[#09CDE3] to-[#1D523A]",
    iconName: "GraduationCap",
    accentColor: "#EEF200",
    displayOrder: 2,
    isActive: true
  },
  {
    id: 3,
    title: "Community-Centered Employment",
    subtitle: "Be part of a team dedicated to improving lives and building stronger communities across Trans Nzoia County",
    bgGradient: "from-[#EEF200]/80 via-[#09CDE3] to-[#1D523A]",
    iconName: "Users",
    accentColor: "#1D523A",
    displayOrder: 3,
    isActive: true
  },
  {
    id: 4,
    title: "Recognition & Growth Opportunities",
    subtitle: "Pursue excellence in public service with clear career progression paths and recognition for outstanding performance",
    bgGradient: "from-[#1D523A] via-[#09CDE3] to-[#EEF200]/80",
    iconName: "Award",
    accentColor: "#1D523A",
    displayOrder: 4,
    isActive: true
  }
];

export default function HeroCarousel() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true 
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>(fallbackSlides);
  const [isLoading, setIsLoading] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Fetch carousel slides from API
  useEffect(() => {
    const fetchCarouselSlides = async () => {
      try {
        const response = await fetch('/api/carousel-slides', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const apiSlides = await response.json();
          if (apiSlides && apiSlides.length > 0) {
            setSlides(apiSlides);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch carousel slides, using fallback:', error);
        // Keep fallback slides
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarouselSlides();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Auto-play setup
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => {
      clearInterval(autoplay);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative overflow-hidden">
      <div className="embla" ref={emblaRef} data-testid="hero-carousel">
        <div className="embla__container flex">
          {slides.map((slide, index) => {
            const IconComponent = iconMap[slide.iconName as keyof typeof iconMap] || Building;
            const bgGradient = slide.bgGradient || "from-[#1D523A] to-[#09CDE3]";
            const accentColor = slide.accentColor || "#EEF200";
            // Compute gradient colors for inline style
            let gradientStart = '#1D523A';
            let gradientEnd = '#09CDE3';
            if (bgGradient.includes('from-[')) {
              const match = bgGradient.match(/from-\[(.*?)\]/);
              if (match && match[1]) gradientStart = match[1];
            }
            if (bgGradient.includes('to-[')) {
              const match = bgGradient.match(/to-\[(.*?)\]/);
              if (match && match[1]) gradientEnd = match[1];
            }
            const gradientStyle = !slide.imageUrl && !slide.mobileImageUrl ? {
              background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`,
              color: 'white',
            } : {};
            return (
              <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0">
                {/* Responsive image display: mobileImageUrl for mobile, imageUrl for desktop, fallback to gradient/icon */}
                <div className="relative min-h-[600px] flex items-center" style={gradientStyle}>
                  {/* Show image if available */}
                  {slide.imageUrl || slide.mobileImageUrl ? (
                    <>
                      {/* Desktop image */}
                      <img
                        src={slide.imageUrl}
                        alt={slide.altText || slide.title}
                        className="hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
                        style={{ borderRadius: '0.75rem' }}
                      />
                      {/* Mobile image */}
                      <img
                        src={slide.mobileImageUrl || slide.imageUrl}
                        alt={slide.altText || slide.title}
                        className="block lg:hidden absolute inset-0 w-full h-full object-cover z-0"
                        style={{ borderRadius: '0.75rem' }}
                      />
                      {/* Overlay for text readability */}
                      <div className="absolute inset-0 bg-black/30 z-0" />
                    </>
                  ) : (
                    <>
                      {/* Background Pattern Overlay */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `radial-gradient(circle at 20% 80%, ${accentColor}22 0%, transparent 50%), \
                                           radial-gradient(circle at 80% 20%, ${accentColor}22 0%, transparent 50%),\
                                           radial-gradient(circle at 40% 40%, ${accentColor}22 0%, transparent 50%)`,
                        }}></div>
                      </div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      {/* Text Content */}
                      <div className="text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start mb-6">
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: accentColor }}
                          >
                            <IconComponent className="w-10 h-10" style={{ color: accentColor === '#1D523A' ? '#FFFFFF' : '#1D523A' }} />
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
                            className="text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{ 
                              backgroundColor: accentColor,
                              color: accentColor === '#1D523A' ? '#FFFFFF' : '#1D523A'
                            }}
                            onClick={() => setLocation('/jobs')}
                            data-testid="button-browse-jobs"
                          >
                            <Search className="w-5 h-5 mr-2" />
                            Browse Jobs
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-2 text-white hover:text-current shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{ 
                              borderColor: accentColor
                            }}
                            onClick={() => {
                              if (user) {
                                // If user is logged in, go to their dashboard
                                if (user.role === 'applicant') {
                                  setLocation('/dashboard');
                                } else {
                                  setLocation('/jobs');
                                }
                              } else {
                                // If not logged in, go to jobs page where they can see the login option
                                setLocation('/jobs');
                              }
                            }}
                            data-testid="button-apply-now"
                          >
                            <UserPlus className="w-5 h-5 mr-2" />
                            Apply Now
                          </Button>
                        </div>
                      </div>

                      {/* Visual Element */}
                      <div className="hidden lg:flex justify-center items-center">
                        <div className="relative">
                          {/* Decorative circles */}
                          <div 
                            className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20"
                            style={{ backgroundColor: accentColor }}
                          ></div>
                          <div 
                            className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full opacity-15"
                            style={{ backgroundColor: accentColor }}
                          ></div>
                          
                          {/* Main icon display */}
                          <div 
                            className="w-64 h-64 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <IconComponent 
                              className="w-32 h-32" 
                              style={{ color: accentColor === '#1D523A' ? '#FFFFFF' : accentColor }}
                            />
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

      {/* Navigation Arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 z-10"
        onClick={scrollPrev}
        data-testid="carousel-prev"
        style={{ color: '#1d0f1aff' }}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 z-10"
        onClick={scrollNext}
        data-testid="carousel-next"
        style={{ color: '#2a5f81ff' }}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? 'bg-[#EEF200] scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            onClick={() => scrollTo(index)}
            data-testid={`carousel-dot-${index}`}
          />
        ))}
      </div>
    </section>
  );
}