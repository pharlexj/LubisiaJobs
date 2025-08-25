import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Gallery() {
  const galleryItems = [
    {
      id: 1,
      title: "Board Meeting - January 2024",
      description: "Monthly board meeting discussing recruitment policies",
      category: "Meetings",
      date: "January 15, 2024"
    },
    {
      id: 2,
      title: "Staff Training Workshop",
      description: "Capacity building session for county employees",
      category: "Training",
      date: "February 10, 2024"
    },
    {
      id: 3,
      title: "Interview Panel Session",
      description: "Recruitment interviews for administrative positions",
      category: "Recruitment",
      date: "March 5, 2024"
    },
    {
      id: 4,
      title: "Awards Ceremony",
      description: "Recognition of outstanding public servants",
      category: "Events",
      date: "April 20, 2024"
    },
    {
      id: 5,
      title: "Policy Review Meeting",
      description: "Reviewing and updating HR policies",
      category: "Meetings",
      date: "May 8, 2024"
    },
    {
      id: 6,
      title: "Community Outreach",
      description: "Public service awareness campaign",
      category: "Outreach",
      date: "June 15, 2024"
    }
  ];

  const categories = ["All", "Meetings", "Training", "Recruitment", "Events", "Outreach"];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Meetings":
        return "bg-blue-100 text-blue-800";
      case "Training":
        return "bg-green-100 text-green-800";
      case "Recruitment":
        return "bg-purple-100 text-purple-800";
      case "Events":
        return "bg-yellow-100 text-yellow-800";
      case "Outreach":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
              variant={category === "All" ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                {/* Placeholder for image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">📸</span>
                    </div>
                    <p className="text-sm text-gray-600">Photo Gallery</p>
                  </div>
                </div>
                <Badge className={`absolute top-2 right-2 ${getCategoryColor(item.category)}`}>
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <p className="text-xs text-gray-500">{item.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Events Documented</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">200+</div>
              <div className="text-gray-600">Photos Archived</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">15</div>
              <div className="text-gray-600">Training Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">30</div>
              <div className="text-gray-600">Awards Ceremonies</div>
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
