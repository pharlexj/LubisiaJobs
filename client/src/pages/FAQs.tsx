import Navigation from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const faqs = [
    {
      category: 'application',
      question: 'How do I apply for a job through the online portal?',
      answer: 'To apply for a job, you need to: 1) Create an account and complete your profile, 2) Browse available job opportunities, 3) Click "Apply Now" on jobs that match your qualifications, 4) Submit your application before the deadline. You can track your application status through your dashboard.'
    },
    {
      category: 'application',
      question: 'What documents do I need to upload?',
      answer: 'Required documents include: National ID copy, Academic certificates and transcripts, Professional certificates (if applicable), KRA PIN certificate, Good conduct certificate from DCI, and Passport-size photographs. All documents should be in PDF format and not exceed 5MB each.'
    },
    {
      category: 'requirements',
      question: 'What are the minimum qualifications for county jobs?',
      answer: 'Minimum qualifications vary by position. Generally, entry-level positions require KCSE mean grade C+ and relevant certificates/diplomas. Senior positions require degree qualifications with relevant experience. Specific requirements are listed in each job advertisement.'
    },
    {
      category: 'requirements',
      question: 'Can I apply if I don\'t meet all the listed requirements?',
      answer: 'We recommend applying only if you meet the minimum required qualifications. However, equivalent qualifications or extensive relevant experience may be considered. The system will validate your qualifications before allowing you to submit an application.'
    },
    {
      category: 'selection',
      question: 'How does the selection process work?',
      answer: 'The selection process includes: 1) Application screening, 2) Shortlisting based on qualifications, 3) Written tests (if applicable), 4) Interviews by a panel, 5) Reference checks, 6) Final selection and appointment. You will be notified at each stage via SMS and email.'
    },
    {
      category: 'selection',
      question: 'How long does the recruitment process take?',
      answer: 'The complete recruitment process typically takes 4-8 weeks from the application deadline. This includes shortlisting (1 week), interviews (2-3 weeks), and final selection (1-2 weeks). Timelines may vary depending on the position and number of applicants.'
    },
    {
      category: 'account',
      question: 'I forgot my password. How can I reset it?',
      answer: 'Click on "Forgot Password" on the login page and enter your email address. You will receive a password reset link via email. Follow the instructions to create a new password. If you don\'t receive the email, check your spam folder or contact support.'
    },
    {
      category: 'account',
      question: 'Can I update my profile after submitting an application?',
      answer: 'Yes, you can update your profile information at any time. However, changes made after submitting an application will not affect that specific application. Make sure your profile is complete and accurate before applying for positions.'
    },
    {
      category: 'technical',
      question: 'The website is not working properly. What should I do?',
      answer: 'First, try refreshing the page and clearing your browser cache. Ensure you\'re using a supported browser (Chrome, Firefox, Safari, Edge). If problems persist, contact our technical support team with details about the issue, including error messages and browser information.'
    },
    {
      category: 'application',
      question: 'Can I apply for multiple positions simultaneously?',
      answer: 'Yes, you can apply for multiple positions as long as you meet the qualifications for each. However, ensure you can commit to any position you apply for, as successful candidates are expected to honor their commitments.'
    },
    {
      category: 'requirements',
      question: 'Do I need work experience for entry-level positions?',
      answer: 'Entry-level positions typically don\'t require prior work experience, but relevant internships, volunteer work, or part-time experience can be advantageous. Focus on demonstrating your skills, knowledge, and enthusiasm for public service.'
    },
    {
      category: 'selection',
      question: 'What should I expect during the interview?',
      answer: 'Interviews typically include questions about your qualifications, experience, knowledge of the role, and commitment to public service. You may also face situational questions and competency-based assessments. Dress professionally and arrive early.'
    }
  ];

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
          {faqCategories.map((category) => (
            <Badge
              key={category.id}
              variant={category.id === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2"
            >
              {category.label} ({category.count})
            </Badge>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Card className="mb-12">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
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
