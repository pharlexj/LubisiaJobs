import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, ChevronLeft, ChevronRight, Building, GraduationCap, Users, Award } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Build Your Career in Public Service",
    subtitle: "Join Trans Nzoia County Public Service Board - Where dedication meets opportunity in serving our community",
    bgGradient: "from-[#1D523A] to-[#09CDE3]",
    icon: Building,
    accent: "#EEF200"
  },
  {
    id: 2,
    title: "Professional Development Excellence",
    subtitle: "Advance your skills and expertise while making a meaningful impact in public administration and community service",
    bgGradient: "from-[#09CDE3] to-[#1D523A]",
    icon: GraduationCap,
    accent: "#EEF200"
  },
  {
    id: 3,
    title: "Community-Centered Employment",
    subtitle: "Be part of a team dedicated to improving lives and building stronger communities across Trans Nzoia County",
    bgGradient: "from-[#EEF200]/80 via-[#09CDE3] to-[#1D523A]",
    icon: Users,
    accent: "#1D523A"
  },
  {
    id: 4,
    title: "Recognition & Growth Opportunities",
    subtitle: "Pursue excellence in public service with clear career progression paths and recognition for outstanding performance",
    bgGradient: "from-[#1D523A] via-[#09CDE3] to-[#EEF200]/80",
    icon: Award,
    accent: "#1D523A"
  }
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true 
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

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
            const IconComponent = slide.icon;
            return (
              <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0">
                <div className={`relative bg-gradient-to-r ${slide.bgGradient} text-white min-h-[600px] flex items-center`}>
                  {/* Background Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 20% 80%, ${slide.accent}22 0%, transparent 50%), 
                                       radial-gradient(circle at 80% 20%, ${slide.accent}22 0%, transparent 50%),
                                       radial-gradient(circle at 40% 40%, ${slide.accent}22 0%, transparent 50%)`,
                    }}></div>
                  </div>

                  {/* Content */}
                  <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      {/* Text Content */}
                      <div className="text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start mb-6">
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: slide.accent }}
                          >
                            <IconComponent className="w-10 h-10" style={{ color: slide.id === 3 || slide.id === 4 ? '#1D523A' : '#FFFFFF' }} />
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
                              backgroundColor: slide.accent,
                              color: slide.id === 3 || slide.id === 4 ? '#1D523A' : '#FFFFFF'
                            }}
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
                              borderColor: slide.accent
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
                            style={{ backgroundColor: slide.accent }}
                          ></div>
                          <div 
                            className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full opacity-15"
                            style={{ backgroundColor: slide.accent }}
                          ></div>
                          
                          {/* Main icon display */}
                          <div 
                            className="w-64 h-64 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
                            style={{ backgroundColor: `${slide.accent}20` }}
                          >
                            <IconComponent 
                              className="w-32 h-32" 
                              style={{ color: slide.accent === '#a4a70fff' ? '#1D523A' : slide.accent }}
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
        style={{ color: '#762364ff' }}
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