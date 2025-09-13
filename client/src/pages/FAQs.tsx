import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import { Search, MessageCircle, Phone, Mail } from 'lucide-react';

export default function FAQs() {
  const { toast } = useToast();
  const faqCategories = [
    { id: 'all', label: 'All Questions', count: 24 },
    { id: 'application', label: 'Application Process', count: 8 },
    { id: 'requirements', label: 'Requirements', count: 6 },
    { id: 'selection', label: 'Selection Process', count: 5 },
    { id: 'account', label: 'Account Management', count: 3 },
    { id: 'technical', label: 'Technical Support', count: 2 },
  ];

  const { data: faqs = [], isLoading } = useQuery({
    queryKey : [`/api/public/faqs`],
  });
  if (isLoading) {
      return (
        <div className="min-h-screen bg-neutral-50">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about the job application process, 
            requirements, and using our recruitment portal.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(faqs as any).map((category:any) => (
            <Badge
              key={category.id}
              variant={category.id === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2"
            >
              {category.category} ({category.category.length})
            </Badge>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Card className="mb-12">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4">
              {(faqs as any).map((faq:any, index:any) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary">
                    <div className="flex items-start space-x-3">
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs"
                      >
                        {faq.category}
                      </Badge>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pt-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still Need Help?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our support team is here to help you 
                with any questions about the recruitment process or using our portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Call us during business hours for immediate assistance
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('+254 713 635 352');
                    toast({ title: 'Phone Number Copied', description: 'Phone number copied to clipboard' });
                  }}
                >
                   +254 713 635 352
                </Button>
              </div>

              <div className="text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Send us an email and we'll respond within 24 hours
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('support@cpsbtransnzoia.co.ke');
                    toast({ title: 'Email Copied', description: 'Email address copied to clipboard' });
                  }}
                >
                  support@cpsbtransnzoia.co.ke
                </Button>
              </div>

              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Chat with our support team in real-time
                </p>
                <Button 
                  size="sm"
                  onClick={() => toast({ title: 'Live Chat', description: 'Live chat feature coming soon!' })}
                >
                  Start Chat
                </Button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Office Hours</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                <p>Holidays, Saturday and Sunday: Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
