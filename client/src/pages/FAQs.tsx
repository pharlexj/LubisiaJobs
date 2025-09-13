import { useState, useMemo } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import { Search, MessageCircle, Phone, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { Faq } from '@shared/schema';

export default function FAQs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['/api/public/faqs'],
  }) as { data: Faq[], isLoading: boolean };
  
  // Get unique categories from actual FAQ data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(faqs.map(faq => faq.category).filter(Boolean))];
    return [
      { id: 'all', label: 'All Questions', count: faqs.length },
      ...uniqueCategories.map(category => ({
        id: category!,
        label: category!,
        count: faqs.filter(faq => faq.category === category).length
      }))
    ];
  }, [faqs]);
  
  // Sanitize and format FAQ answer
  const formatAnswer = (answer: string | null | undefined) => {
    if (!answer) return 'Answer not available.';
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(answer.replace(/\n/g, '<br>'), {
      ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target']
    });
  };
  
  // Filter FAQs based on search term and selected category
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = !searchTerm || 
        faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchTerm, selectedCategory]);
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
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="input-faq-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2"
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`badge-category-${category.id}`}
            >
              {category.label} ({category.count})
            </Badge>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Card className="mb-12">
          <CardContent className="p-6">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all' ? 'No FAQs found matching your criteria.' : 'No FAQs available.'}
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => {
                  const itemId = faq.id ?? index;
                  return (
                    <AccordionItem key={itemId} value={`item-${itemId}`}>
                      <AccordionTrigger className="text-left hover:text-primary" data-testid={`accordion-trigger-${itemId}`}>
                        <div className="flex items-start space-x-3">
                          {faq.category && (
                            <Badge 
                              variant="outline" 
                              className="mt-1 text-xs flex-shrink-0"
                            >
                              {faq.category}
                            </Badge>
                          )}
                          <span className="text-left">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pt-4" data-testid={`accordion-content-${itemId}`}>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: formatAnswer(faq.answer)
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
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
                  data-testid="button-copy-phone"
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
                  data-testid="button-copy-email"
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
                  data-testid="button-live-chat"
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
