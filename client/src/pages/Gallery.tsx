import { useState, useMemo } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import type { GalleryItem } from '@shared/schema';

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['/api/public/gallery'],
  }) as { data: GalleryItem[], isLoading: boolean };
  
  // Get unique categories from actual gallery data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(galleryItems.map(item => item.category).filter(Boolean))];
    return ['All', ...uniqueCategories];
  }, [galleryItems]);
  
  // Filter gallery items by selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return galleryItems;
    return galleryItems.filter(item => item.category === selectedCategory);
  }, [galleryItems, selectedCategory]);
  
  // Calculate statistics from actual data
  const stats = useMemo(() => {
    const totalEvents = galleryItems.length;
    const totalPhotos = galleryItems.length; // Assuming each gallery item has a photo
    const trainingEvents = galleryItems.filter(item => item.category?.toLowerCase().includes('training')).length;
    const awardsEvents = galleryItems.filter(item => item.category?.toLowerCase().includes('awards') || item.category?.toLowerCase().includes('event')).length;
    
    return {
      events: totalEvents,
      photos: totalPhotos,
      training: trainingEvents,
      awards: awardsEvents
    };
  }, [galleryItems]);

  const getCategoryColor = (category: string) => {
    const colors = {
      'meetings': 'bg-blue-100 text-blue-800',
      'training': 'bg-green-100 text-green-800', 
      'recruitment': 'bg-purple-100 text-purple-800',
      'events': 'bg-yellow-100 text-yellow-800',
      'outreach': 'bg-red-100 text-red-800',
      'awards': 'bg-orange-100 text-orange-800',
    };
    
    const key = category?.toLowerCase();
    return colors[key as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our activities, events, and milestones through photos and documentation
            of our commitment to excellence in public service.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
              onClick={() => setSelectedCategory(category)}
              data-testid={`badge-gallery-category-${category.toLowerCase()}`}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <p className="text-gray-600 mb-4">
                {selectedCategory === 'All' ? 'No gallery items available.' : `No items found in ${selectedCategory} category.`}
              </p>
              {selectedCategory !== 'All' && (
                <Badge 
                  variant="outline" 
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory('All')}
                  data-testid="badge-show-all"
                >
                  Show All Items
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-gallery-${item.id}`}>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title || 'Gallery image'}
                      className="w-full h-full object-cover"
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
                    <Badge className={`absolute top-2 right-2 ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2" data-testid={`text-gallery-title-${item.id}`}>
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description || 'No description available.'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'No date specified'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-events">
                {stats.events}
              </div>
              <div className="text-gray-600">Events Documented</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2" data-testid="stat-photos">
                {stats.photos}
              </div>
              <div className="text-gray-600">Photos Archived</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-training">
                {stats.training}
              </div>
              <div className="text-gray-600">Training Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2" data-testid="stat-awards">
                {stats.awards}
              </div>
              <div className="text-gray-600">Awards & Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Share Your Experience
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Have photos or memories from our events? We'd love to feature them in our gallery.
              Contact us to share your contributions to our public service community.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="text-primary">
                📧 gallery@cpsbtransnzoia.go.ke 
              </Badge>
              <Badge variant="outline" className="text-primary">
                📞  +254 713 635 352
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
