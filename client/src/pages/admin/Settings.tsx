import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  MapPin, 
  Users, 
  Award, 
  HelpCircle,
  Settings as SettingsIcon,
  Building,
  GraduationCap,
  Briefcase,
  HomeIcon,
  HouseIcon,
  Building2,
  Info,
  Camera,
  Globe,
  Upload,
  Link,
  X,
  Image as ImageIcon
} from 'lucide-react';

// Form schemas
const noticeSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.string().optional(),
  priority: z.string().default('medium'),
  isActive: z.boolean().default(true),
});

const boardMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().min(2, "Position must be at least 2 characters"),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  order: z.number().optional().default(0),
});

const countySchema = z.object({
  name: z.string().min(2, "County name must be at least 2 characters"),
});

const constituencySchema = z.object({
  name: z.string().min(2, "Constituency name must be at least 2 characters"),
  countyId: z.string().min(1, "Please select a county"),
});

const wardSchema = z.object({
  name: z.string().min(2, "Ward name must be at least 2 characters"),
  constituencyId: z.string().min(1, "Please select a constituency"),
});

const studyAreaSchema = z.object({
  name: z.string().min(2, "Study area name must be at least 2 characters"),
});

const specializationSchema = z.object({
  name: z.string().min(2, "Specialization name must be at least 2 characters"),
  studyArea: z.string().min(1, "Please select a study area"),
});

const jobGroupSchema = z.object({
  name: z.string().min(1, "Job group name is required"),
  description: z.string().optional(),
});

const awardSchema = z.object({
  name: z.string().min(2, "Award name must be at least 2 characters"),
});

const ethnicitySchema = z.object({
  name: z.string().min(2, "Ethnicity name must be at least 2 characters"),
});
const deptSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
});

const faqSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  order: z.number().optional(),
});

const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.string().min(1, "Please select a role"),
  assignedBy: z.string().optional(),
});

const aboutConfigSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  section: z.string().default('about'),
});

const galleryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional(),
  eventDate: z.string().optional(),
});

const carouselSlideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  bgGradient: z.string().optional(),
  iconName: z.enum(['Building', 'GraduationCap', 'Users', 'Award']),
  accentColor: z.string().optional(),
  imageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  altText: z.string().optional(),
  linkHref: z.string().optional(),
  ctaLabel: z.string().optional(),
  displayOrder: z.number().optional().default(0),
});

type NoticeFormData = z.infer<typeof noticeSchema>;
type CountyFormData = z.infer<typeof countySchema>;
type ConstituencyFormData = z.infer<typeof constituencySchema>;
type WardFormData = z.infer<typeof wardSchema>;
type StudyAreaFormData = z.infer<typeof studyAreaSchema>;
type SpecializationFormData = z.infer<typeof specializationSchema>;
type JobGroupFormData = z.infer<typeof jobGroupSchema>;
type AwardFormData = z.infer<typeof awardSchema>;
type EthnicityFormData = z.infer<typeof ethnicitySchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type DeptFormData = z.infer<typeof deptSchema>;
type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>;
type AboutConfigFormData = z.infer<typeof aboutConfigSchema>;
type GalleryItemFormData = z.infer<typeof galleryItemSchema>;
type BoardMemberFormData = z.infer<typeof boardMemberSchema>;
type CarouselSlideFormData = z.infer<typeof carouselSlideSchema>;

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [activeTab, setActiveTab] = useState('notices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedStudyArea, setSelectedStudyArea] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Gallery upload states
  const [galleryImageMode, setGalleryImageMode] = useState<'url' | 'upload'>('url');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Board member upload states
  const [boardPhotoMode, setBoardPhotoMode] = useState<'url' | 'upload'>('url');
  const [boardPhotoFile, setBoardPhotoFile] = useState<File | null>(null);
  const [boardPhotoPreview, setBoardPhotoPreview] = useState<string>('');
  const [editingBoardMember, setEditingBoardMember] = useState<any | null>(null);

  // Carousel slide states
  const [carouselImageMode, setCarouselImageMode] = useState<'gradient' | 'image'>('gradient');
  const [carouselImageFile, setCarouselImageFile] = useState<File | null>(null);
  const [carouselMobileImageFile, setCarouselMobileImageFile] = useState<File | null>(null);
  const [carouselImagePreview, setCarouselImagePreview] = useState<string>('');
  const [carouselMobilePreview, setCarouselMobilePreview] = useState<string>('');
  const [editingCarouselSlide, setEditingCarouselSlide] = useState<any | null>(null);

  // Fetch configuration data
  const { data: config } = useQuery({
    queryKey: ['/api/public/config'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all users for role assignment
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/all-users'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch board members
  const { data: boardMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/public/board-members'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch carousel slides
  const { data: carouselSlides = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/carousel-slides'],
    enabled: !!user && user.role === 'admin',
  });

  const configData = config || {} as any;
  const counties = configData.counties || [];
  const constituencies = configData.constituencies || [];
  const wards = configData.wards || [];
  const studyAreas = configData.studyAreas || [];
  const specializations = configData.specializations || [];
  const jobGroups = configData.jobGroups || [];
  const awards = configData.awards || [];
  const faqs = configData.faqs || [];
  const notices = configData.notices || [];
  const ethnicity = configData.ethnicity || [];
  const departments = configData.departments || [];
  const admins = configData.admins || [];

  // Fetch About and Gallery data
  const { data: aboutConfig = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/public/system-config?section=about'],
    enabled: !!user && user.role === 'admin',
  });
  
  const { data: contactConfig = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/public/system-config?section=contact'],
    enabled: !!user && user.role === 'admin',
  });
  
  const { data: galleryItems = [] } = useQuery<any[]>({
    queryKey: ['/api/public/gallery'],
    enabled: !!user && user.role === 'admin',
  });
  // Forms
  const noticeForm = useForm<NoticeFormData>({ resolver: zodResolver(noticeSchema) });
  const countyForm = useForm<CountyFormData>({ resolver: zodResolver(countySchema) });
  const constituencyForm = useForm<ConstituencyFormData>({ resolver: zodResolver(constituencySchema) });
  const wardForm = useForm<WardFormData>({ resolver: zodResolver(wardSchema) });
  const studyAreaForm = useForm<StudyAreaFormData>({ resolver: zodResolver(studyAreaSchema) });
  const specializationForm = useForm<SpecializationFormData>({ resolver: zodResolver(specializationSchema) });
  const jobGroupForm = useForm<JobGroupFormData>({ resolver: zodResolver(jobGroupSchema) });
  const awardForm = useForm<AwardFormData>({ resolver: zodResolver(awardSchema) });
  const ethnicityForm = useForm<EthnicityFormData>({ resolver: zodResolver(ethnicitySchema) });
  const faqForm = useForm<FaqFormData>({ resolver: zodResolver(faqSchema) });
  const deptForm = useForm<DeptFormData>({ resolver: zodResolver(deptSchema) });
  const roleAssignmentForm = useForm<RoleAssignmentFormData>({ resolver: zodResolver(roleAssignmentSchema) });
  const aboutConfigForm = useForm<AboutConfigFormData>({ resolver: zodResolver(aboutConfigSchema) });
  const galleryItemForm = useForm<GalleryItemFormData>({ resolver: zodResolver(galleryItemSchema) });
  const boardMemberForm = useForm<BoardMemberFormData>({ resolver: zodResolver(boardMemberSchema) });
  const carouselSlideForm = useForm<CarouselSlideFormData>({ resolver: zodResolver(carouselSlideSchema) });

  // File upload configuration for gallery (aligned with server-side accepted types)
  const galleryFileUpload = useFileUpload({
    endpoint: '/api/upload',
    fieldName: 'file',
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeInMB: 10,
    successMessage: 'Image uploaded successfully!',
    errorMessage: 'Failed to upload image',
    invalidateQueries: ['/api/public/gallery']
  });

  // File upload configuration for board member photos
  const boardPhotoUpload = useFileUpload({
    endpoint: '/api/upload',
    fieldName: 'file',
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeInMB: 5,
    successMessage: 'Board member photo uploaded successfully!',
    errorMessage: 'Failed to upload board member photo',
    invalidateQueries: ['/api/admin/board-members']
  });

  // File upload configuration for carousel slide images
  const carouselImageUpload = useFileUpload({
    endpoint: '/api/upload',
    fieldName: 'file',
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeInMB: 10,
    successMessage: 'Carousel image uploaded successfully!',
    errorMessage: 'Failed to upload carousel image',
    invalidateQueries: ['/api/admin/carousel-slides']
  });

  // Generic mutation handler
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return await apiRequest('POST', endpoint, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: 'Item created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      
      // Invalidate gallery cache when gallery items are added
      if (variables.endpoint.includes('gallery')) {
        queryClient.invalidateQueries({ queryKey: ['/api/public/gallery'] });
      }
      
      setIsModalOpen(false);
      // Reset appropriate form based on endpoint
      if (variables.endpoint.includes('notices')) noticeForm.reset();
      else if (variables.endpoint.includes('counties')) countyForm.reset();
      else if (variables.endpoint.includes('constituencies')) constituencyForm.reset();
      else if (variables.endpoint.includes('wards')) wardForm.reset();
      else if (variables.endpoint.includes('study-areas')) studyAreaForm.reset();
      else if (variables.endpoint.includes('specializations')) specializationForm.reset();
      else if (variables.endpoint.includes('job-groups')) jobGroupForm.reset();
      else if (variables.endpoint.includes('awards')) awardForm.reset();
      else if (variables.endpoint.includes('ethnicity')) ethnicityForm.reset();
      else if (variables.endpoint.includes('faqs')) faqForm.reset();
      else if (variables.endpoint.includes('dept')) deptForm.reset();
      else if (variables.endpoint.includes('system-config')) aboutConfigForm.reset();
      else if (variables.endpoint.includes('gallery')) galleryItemForm.reset();
      else if (variables.endpoint.includes('board-members')) boardMemberForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create item',
        variant: 'destructive',
      });
    },
  });

  // Generic update mutation handler
  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: number; data: any }) => {
      return await apiRequest('PUT', `${endpoint}/${id}`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: 'Item updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      
      // Invalidate gallery cache when gallery items are updated
      if (variables.endpoint.includes('gallery')) {
        queryClient.invalidateQueries({ queryKey: ['/api/public/gallery'] });
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      // Reset appropriate form based on endpoint
      if (variables.endpoint.includes('notices')) noticeForm.reset();
      else if (variables.endpoint.includes('faqs')) faqForm.reset();
      else if (variables.endpoint.includes('gallery')) galleryItemForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    },
  });

  // Generic delete mutation handler
  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: number }) => {
      return await apiRequest('DELETE', `${endpoint}/${id}`);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/config'] });
      
      // Invalidate gallery cache when gallery items are deleted
      if (variables.endpoint.includes('gallery')) {
        queryClient.invalidateQueries({ queryKey: ['/api/public/gallery'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });
  // Tab configurations
  const tabs = [
    { 
      id: 'notices', 
      label: 'Notices', 
      icon: FileText,
      description: 'Manage system notices and announcements'
    },
    { 
      id: 'dept', 
      label: 'Departments', 
      icon: Building,
      description: 'Manage Departments'
    },
    { 
      id: 'geography', 
      label: 'Location', 
      icon: MapPin,
      description: 'Manage counties, constituencies, and wards'
    },
    { 
      id: 'education', 
      label: 'Education', 
      icon: GraduationCap,
      description: 'Manage study areas and specializations'
    },
    { 
      id: 'job-management', 
      label: 'Job Groups', 
      icon: Briefcase,
      description: 'Manage job groups and related data'
    },
    { 
      id: 'awards', 
      label: 'Awards', 
      icon: Award,
      description: 'Manage awards and recognitions'
    },
    { 
      id: 'users', 
      label: 'Ethnicity', 
      icon: Users,
      description: 'Manage user roles and ethnicity data'
    },
    { 
      id: 'roles', 
      label: 'Role', 
      icon: SettingsIcon,
      description: 'Assign roles to users'
    },
    { 
      id: 'faqs', 
      label: 'FAQs', 
      icon: HelpCircle,
      description: 'Manage frequently asked questions'
    },
    {
      id: 'about',
      label: 'About Page',
      icon: Info,
      description: 'Manage about page content'
    },
    {
      id: 'board-leadership',
      label: 'Board Leadership',
      icon: Users,
      description: 'Manage board members and leadership'
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: Camera,
      description: 'Manage gallery items and images'
    },
    {
      id: 'system',
      label: 'System',
      icon: SettingsIcon,
      description: 'Manage system settings including favicon'
    },
    {
      id: 'carousel',
      label: 'Carousel',
      icon: ImageIcon,
      description: 'Manage homepage carousel slides and pictures'
    },
  ];

  const handleCreateNotice = (data: NoticeFormData) => {
    if (editingItem) {
      updateMutation.mutate({ 
        endpoint: '/api/admin/notices', 
        id: editingItem.id, 
        data 
      });
    } else {
      createMutation.mutate({ endpoint: '/api/admin/notices', data });
    }
  };

  const handleCreateCounty = (data: CountyFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/counties', data });
  };

  const handleCreateConstituency = (data: ConstituencyFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/constituencies', 
      data: { ...data, countyId: parseInt(data.countyId) }
    });
  };

  const handleCreateWard = (data: WardFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/wards', 
      data: { ...data, constituencyId: parseInt(data.constituencyId) }
    });
  };

  const handleCreateStudyArea = (data: StudyAreaFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/study-areas', data });
  };

  const handleCreateSpecialization = (data: SpecializationFormData) => {
    console.log(data);
    
    createMutation.mutate({ 
      endpoint: '/api/admin/specializations', 
      data: { ...data, studyArea: parseInt(data.studyArea) }
    });
  };

  const handleCreateJobGroup = (data: JobGroupFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/job-groups', data });
  };
  const handleCreateDept = (data: DeptFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/dept', data });
  };

  const handleCreateAward = (data: AwardFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/awards', data });
  };

  const handleCreateEthnicity = (data: EthnicityFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/ethnicity', data });
  };

  const handleCreateFaq = (data: FaqFormData) => {
    if (editingItem) {
      updateMutation.mutate({ 
        endpoint: '/api/admin/faqs', 
        id: editingItem.id, 
        data 
      });
    } else {
      createMutation.mutate({ endpoint: '/api/admin/faqs', data });
    }
  };

  const handleCreateRoleAssignment = (data: RoleAssignmentFormData) => {
    createMutation.mutate({ 
      endpoint: '/api/admin/role-assignments', 
      data: { ...data, assignedBy: user?.id }
    });
  };

  const handleCreateAboutConfig = (data: AboutConfigFormData) => {
    createMutation.mutate({ endpoint: '/api/admin/system-config', data });
  };

  const handleCreateBoardMember = async (data: BoardMemberFormData) => {
    try {
      // Validate that either URL or file is provided for photo
      if (boardPhotoMode === 'url' && (!data.photoUrl || data.photoUrl.trim() === '')) {
        // Allow empty photoUrl since it's optional
      } else if (boardPhotoMode === 'upload' && !boardPhotoFile) {
        // Allow no file upload since photo is optional
      }

      let photoUrl = data.photoUrl || '';

      // Handle file upload if in upload mode
      if (boardPhotoMode === 'upload' && boardPhotoFile) {
        toast({
          title: 'Processing...',
          description: 'Uploading photo and creating board member...',
        });

        // Upload the file first
        const uploadResult = await boardPhotoUpload.uploadFile(boardPhotoFile, 'board-member-photo', {
          memberName: data.name,
          position: data.position
        });

        // Use the uploaded file URL
        photoUrl = uploadResult.fileUrl || uploadResult.url || uploadResult.path || '';
      }

      // Create the board member with the photo URL (either from input or upload)
      const processedData = {
        ...data,
        photoUrl,
        order: data.order || 0
      };

      if (editingBoardMember) {
        // Update existing member
        await apiRequest('PUT', `/api/admin/board-members/${editingBoardMember.id}`, processedData);
        toast({
          title: 'Success',
          description: 'Board member updated successfully.',
        });
        setEditingBoardMember(null);
      } else {
        // Create new member
        createMutation.mutate({ endpoint: '/api/admin/board-members', data: processedData });
      }

      // Reset upload states after successful submission
      setBoardPhotoFile(null);
      setBoardPhotoPreview('');
      setBoardPhotoMode('url');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/board-members'] });

    } catch (error: any) {
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to process board member',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGalleryItem = async (data: GalleryItemFormData) => {
    try {
      // Validate that either URL or file is provided
      if (galleryImageMode === 'url' && (!data.imageUrl || data.imageUrl.trim() === '')) {
        toast({
          title: 'Image Required',
          description: 'Please provide an image URL.',
          variant: 'destructive',
        });
        return;
      }

      if (galleryImageMode === 'upload' && !uploadedImageFile) {
        toast({
          title: 'Image Required',
          description: 'Please select an image file to upload.',
          variant: 'destructive',
        });
        return;
      }

      let imageUrl = data.imageUrl || '';

      // Handle file upload if in upload mode
      if (galleryImageMode === 'upload' && uploadedImageFile) {
        toast({
          title: 'Processing...',
          description: 'Uploading image and creating gallery item...',
        });

        // Upload the file first
        const uploadResult = await galleryFileUpload.uploadFile(uploadedImageFile, 'gallery-image', {
          title: data.title,
          category: data.category
        });

        // Use the uploaded file URL
        imageUrl = uploadResult.fileUrl || uploadResult.url || uploadResult.path || '';
      }

      // Create the gallery item with the image URL (either from input or upload)
      const processedData = {
        ...data,
        imageUrl,
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : null
      };

      createMutation.mutate({ endpoint: '/api/admin/gallery', data: processedData });

      // Reset upload states after successful submission
      setUploadedImageFile(null);
      setPreviewImageUrl('');
      setGalleryImageMode('url');

    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const filteredConstituencies = selectedCounty 
    ? constituencies.filter((c: any) => c.countyId === parseInt(selectedCounty))
    : [];

  const filteredWards = selectedConstituency 
    ? wards.filter((w: any) => w.constituencyId === parseInt(selectedConstituency))
    : [];

  const filteredSpecializations = selectedStudyArea 
    ? specializations.filter((s: any) => s.studyArea === parseInt(selectedStudyArea))
    : [];

  // Board member photo handling functions
  const handleBoardPhotoFileSelect = (file: File) => {
    setBoardPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setBoardPhotoPreview(previewUrl);
  };

  const handleBoardPhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleBoardPhotoFileSelect(imageFile);
    }
  };

  const handleBoardPhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEditBoardMember = (member: any) => {
    setEditingBoardMember(member);
    boardMemberForm.reset({
      name: member.name,
      position: member.position,
      bio: member.bio || '',
      photoUrl: member.photoUrl || '',
      order: member.order || 0
    });
    if (member.photoUrl) {
      setBoardPhotoMode('url');
      setBoardPhotoPreview('');
    }
  };

  const handleDeleteBoardMember = async (memberId: number) => {
    if (confirm('Are you sure you want to delete this board member?')) {
      try {
        await apiRequest('DELETE', `/api/admin/board-members/${memberId}`);
        toast({
          title: 'Success',
          description: 'Board member deleted successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/board-members'] });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete board member',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCreateCarouselSlide = async (data: CarouselSlideFormData) => {
    try {
      let processedData = { ...data };

      // Handle desktop image upload if in image mode
      if (carouselImageMode === 'image' && carouselImageFile) {
        toast({
          title: 'Processing',
          description: 'Uploading carousel image...',
        });

        const uploadResult = await carouselImageUpload.uploadFile(carouselImageFile);
        if (uploadResult?.filename) {
          processedData.imageUrl = `/uploads/${uploadResult.filename}`;
        }
      }

      // Handle mobile image upload if provided
      if (carouselMobileImageFile) {
        const mobileUploadResult = await carouselImageUpload.uploadFile(carouselMobileImageFile);
        if (mobileUploadResult?.filename) {
          processedData.mobileImageUrl = `/uploads/${mobileUploadResult.filename}`;
        }
      }

      // Clear gradient if using image mode
      if (carouselImageMode === 'image') {
        processedData.bgGradient = '';
      } else {
        // Clear image fields if using gradient mode
        processedData.imageUrl = '';
        processedData.mobileImageUrl = '';
        processedData.altText = '';
      }

      if (editingCarouselSlide) {
        // Update existing slide
        const response = await apiRequest('PUT', `/api/admin/carousel-slides/${editingCarouselSlide.id}`, processedData);
        toast({
          title: 'Success',
          description: 'Carousel slide updated successfully.',
        });
        setEditingCarouselSlide(null);
      } else {
        // Create new slide
        createMutation.mutate({ endpoint: '/api/admin/carousel-slides', data: processedData });
      }

      // Reset upload states after successful submission
      setCarouselImageFile(null);
      setCarouselMobileImageFile(null);
      setCarouselImagePreview('');
      setCarouselMobilePreview('');
      setCarouselImageMode('gradient');
      carouselSlideForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousel-slides'] });

    } catch (error: any) {
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to process carousel slide',
        variant: 'destructive',
      });
    }
  };

  // Generic item edit handler
  const handleEditItem = (item: any, type: string, endpoint: string) => {
    setEditingItem(item);
    setEditingType(type);
    setIsModalOpen(true);
    
    // Pre-populate the appropriate form based on type
    if (type === 'notice') {
      noticeForm.reset({
        title: item.title,
        content: item.content,
        type: item.type || '',
        priority: item.priority || 'medium',
        isActive: item.isActive !== false
      });
    } else if (type === 'faq') {
      faqForm.reset({
        question: item.question,
        answer: item.answer,
        category: item.category,
        order: item.order || 0
      });
    } else if (type === 'gallery') {
      galleryItemForm.reset({
        title: item.title,
        description: item.description || '',
        category: item.category,
        imageUrl: item.imageUrl || '',
        eventDate: item.eventDate || ''
      });
    }
  };

  // Generic item delete handler
  const handleDeleteItem = async (id: number, endpoint: string, itemType: string) => {
    if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="admin" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
              <p className="text-gray-600">
                Manage system data, lookup tables, and configuration settings
              </p>
            </div>

            {/* Configuration Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 mb-8">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
                {/* Job Management Tab */}
              <TabsContent value="dept">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Departments Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage departments</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Department
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Department</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={deptForm.handleSubmit(handleCreateDept)} className="space-y-4">
                          <div>
                            <Label htmlFor="dept-name">Department Name</Label>
                            <Input 
                              id="dept-name" 
                              {...deptForm.register('name')} 
                              placeholder="e.g., Health Services and Sanitation..."
                            />
                            {deptForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {deptForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Department</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {departments.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <HouseIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No departments yet. Click "Add Department" to get started.</p>
                        </div>
                      ) : (
                        departments.map((dept: any) => (
                          <Card key={dept.id}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{dept.name}</h4>
                              {dept.description && (
                                <p className="text-sm text-gray-600">{dept.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Notices Tab */}
              <TabsContent value="notices">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notices Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Create and manage system notices</p>
                    </div>
                    <Dialog open={isModalOpen && activeTab === 'notices'} onOpenChange={setIsModalOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setActiveTab('notices')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Notice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Notice</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={noticeForm.handleSubmit(handleCreateNotice)} className="space-y-4">
                          <div>
                            <Label htmlFor="notice-title">Title</Label>
                            <Input 
                              id="notice-title" 
                              {...noticeForm.register('title')} 
                              placeholder="Notice title"
                            />
                            {noticeForm.formState.errors.title && (
                              <p className="text-sm text-red-600 mt-1">
                                {noticeForm.formState.errors.title.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="notice-content">Content</Label>
                            <Textarea 
                              id="notice-content" 
                              {...noticeForm.register('content')} 
                              placeholder="Notice content"
                              rows={4}
                            />
                            {noticeForm.formState.errors.content && (
                              <p className="text-sm text-red-600 mt-1">
                                {noticeForm.formState.errors.content.message}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="notice-type">Type</Label>
                              <Select onValueChange={(value) => noticeForm.setValue('type', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="notice-priority">Priority</Label>
                              <Select onValueChange={(value) => noticeForm.setValue('priority', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => {
                              setIsModalOpen(false);
                              setEditingItem(null);
                              setEditingType('');
                              noticeForm.reset();
                            }}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingItem ? 'Update Notice' : 'Create Notice'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {notices.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>Click "Add Notice" to create your first notice</p>
                        </div>
                      ) : (
                        notices.map((notice: any) => (
                          <Card key={notice.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{notice.title}</h4>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditItem(notice, 'notice', '/api/admin/notices')}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(notice.id, '/api/admin/notices', 'notice')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {notice.content && (
                                <p className="text-sm text-gray-600">{notice.content}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="geography">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Counties */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Counties</CardTitle>
                        <p className="text-sm text-gray-600">{counties.length} counties</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New County</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={countyForm.handleSubmit(handleCreateCounty)} className="space-y-4">
                            <div>
                              <Label htmlFor="county-name">County Name</Label>
                              <Input 
                                id="county-name" 
                                {...countyForm.register('name')} 
                                placeholder="Enter county name"
                              />
                              {countyForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {countyForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add County</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {counties.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No counties yet</p>
                        ) : (
                          counties.map((county: any) => (
                            <div key={county.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{county.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedCounty(county.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Constituencies */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Constituencies</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedCounty ? filteredConstituencies.length : constituencies.length} constituencies
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedCounty}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Constituency</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={constituencyForm.handleSubmit(handleCreateConstituency)} className="space-y-4">
                            <div>
                              <Label htmlFor="constituency-county">County</Label>
                              <Select 
                                value={selectedCounty}
                                onValueChange={(value) => {
                                  setSelectedCounty(value);
                                  constituencyForm.setValue('countyId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                                <SelectContent>
                                  {counties.map((county: any) => (
                                    <SelectItem key={county.id} value={county.id.toString()}>
                                      {county.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="constituency-name">Constituency Name</Label>
                              <Input 
                                id="constituency-name" 
                                {...constituencyForm.register('name')} 
                                placeholder="Enter constituency name"
                              />
                              {constituencyForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {constituencyForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Constituency</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedCounty ? filteredConstituencies : constituencies).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedCounty ? 'No constituencies in selected county' : 'Select a county first'}
                          </p>
                        ) : (
                          (selectedCounty ? filteredConstituencies : constituencies).map((constituency: any) => (
                            <div key={constituency.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{constituency.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedConstituency(constituency.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wards */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Wards</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedConstituency ? filteredWards.length : wards.length} wards
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedConstituency}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Ward</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={wardForm.handleSubmit(handleCreateWard)} className="space-y-4">
                            <div>
                              <Label htmlFor="ward-constituency">Constituency</Label>
                              <Select 
                                value={selectedConstituency}
                                onValueChange={(value) => {
                                  setSelectedConstituency(value);
                                  wardForm.setValue('constituencyId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select constituency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredConstituencies.map((constituency: any) => (
                                    <SelectItem key={constituency.id} value={constituency.id.toString()}>
                                      {constituency.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="ward-name">Ward Name</Label>
                              <Input 
                                id="ward-name" 
                                {...wardForm.register('name')} 
                                placeholder="Enter ward name"
                              />
                              {wardForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {wardForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Ward</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedConstituency ? filteredWards : wards).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedConstituency ? 'No wards in selected constituency' : 'Select a constituency first'}
                          </p>
                        ) : (
                          (selectedConstituency ? filteredWards : wards).map((ward: any) => (
                            <div key={ward.id} className="p-2 border rounded">
                              <span className="text-sm">{ward.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Study Areas */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Study Areas</CardTitle>
                        <p className="text-sm text-gray-600">{studyAreas.length} study areas</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Study Area
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Study Area</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={studyAreaForm.handleSubmit(handleCreateStudyArea)} className="space-y-4">
                            <div>
                              <Label htmlFor="study-area-name">Study Area Name</Label>
                              <Input 
                                id="study-area-name" 
                                {...studyAreaForm.register('name')} 
                                placeholder="e.g., Computer Science, Engineering"
                              />
                              {studyAreaForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {studyAreaForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Study Area</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studyAreas.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No study areas yet</p>
                        ) : (
                          studyAreas.map((area: any) => (
                            <div key={area.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{area.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedStudyArea(area.id.toString())}
                              >
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specializations */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Specializations</CardTitle>
                        <p className="text-sm text-gray-600">
                          {selectedStudyArea ? filteredSpecializations.length : specializations.length} specializations
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedStudyArea}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Specialization
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Specialization</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={specializationForm.handleSubmit(handleCreateSpecialization)} className="space-y-4">
                            <div>
                              <Label htmlFor="specialization-study-area">Study Area</Label>
                              <Select 
                                value={selectedStudyArea}
                                onValueChange={(value) => {
                                  setSelectedStudyArea(value);
                                  specializationForm.setValue('studyArea', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select study area" />
                                </SelectTrigger>
                                <SelectContent>
                                  {studyAreas.map((area: any) => (
                                    <SelectItem key={area.id} value={area.id.toString()}>
                                      {area.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="specialization-name">Specialization Name</Label>
                              <Input 
                                id="specialization-name" 
                                {...specializationForm.register('name')} 
                                placeholder="e.g., Software Engineering, Web Development"
                              />
                              {specializationForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {specializationForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Specialization</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedStudyArea ? filteredSpecializations : specializations).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            {selectedStudyArea ? 'No specializations in selected study area' : 'Select a study area first'}
                          </p>
                        ) : (
                          (selectedStudyArea ? filteredSpecializations : specializations).map((spec: any) => (
                            <div key={spec.id} className="p-2 border rounded">
                              <span className="text-sm">{spec.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Job Management Tab */}
              <TabsContent value="job-management">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Job Groups Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage job groups and classifications</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Job Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Job Group</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={jobGroupForm.handleSubmit(handleCreateJobGroup)} className="space-y-4">
                          <div>
                            <Label htmlFor="job-group-name">Job Group Name</Label>
                            <Input 
                              id="job-group-name" 
                              {...jobGroupForm.register('name')} 
                              placeholder="e.g., A, B, C, D..."
                            />
                            {jobGroupForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {jobGroupForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="job-group-description">Description (Optional)</Label>
                            <Textarea 
                              id="job-group-description" 
                              {...jobGroupForm.register('description')} 
                              placeholder="Description of the job group"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Job Group</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {jobGroups.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No job groups yet. Click "Add Job Group" to get started.</p>
                        </div>
                      ) : (
                        jobGroups.map((group: any) => (
                          <Card key={group.id}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">Job Group {group.name}</h4>
                              {group.description && (
                                <p className="text-sm text-gray-600">{group.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Awards Tab */}
              <TabsContent value="awards">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Certificates Awards Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage certificate awards</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Award
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Award</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={awardForm.handleSubmit(handleCreateAward)} className="space-y-4">
                          <div>
                            <Label htmlFor="award-name">Award Name</Label>
                            <Input 
                              id="award-name" 
                              {...awardForm.register('name')} 
                              placeholder="e.g., Best Employee, Outstanding Service"
                            />
                            {awardForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {awardForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Award</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {awards.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No awards yet. Click "Add Award" to get started.</p>
                        </div>
                      ) : (
                        awards.map((award: any) => (
                          <Card key={award.id}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{award.name}</h4>
                              {award.description && (
                                <p className="text-sm text-gray-600">{award.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Ethnicity Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage ethnicity data and user roles</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ethnicity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Ethnicity</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={ethnicityForm.handleSubmit(handleCreateEthnicity)} className="space-y-4">
                          <div>
                            <Label htmlFor="ethnicity-name">Ethnicity Name</Label>
                            <Input 
                              id="ethnicity-name" 
                              {...ethnicityForm.register('name')} 
                              placeholder="e.g., Kikuyu, Luo, Kalenjin"
                            />
                            {ethnicityForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {ethnicityForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Ethnicity</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {ethnicity.length===0 ? (<div className="text-center py-8 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Click "Add Ethnicity" to manage ethnicity data</p>
                    </div>) : (ethnicity.map((e:any)=> (
                      <Card>
                        <CardContent>
                          <div className='text-sm text-gray-600 text-center py-8'>
                            <h4> { e.name}</h4>
                          </div>
                        </CardContent>
                      </Card>
                    )))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQs Tab */}
              <TabsContent value="faqs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>FAQ Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage frequently asked questions</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add FAQ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New FAQ</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={faqForm.handleSubmit(handleCreateFaq)} className="space-y-4">
                          <div>
                            <Label htmlFor="faq-category">Category</Label>
                            <Select onValueChange={(value) => faqForm.setValue('category', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="application">Application Process</SelectItem>
                                <SelectItem value="requirements">Requirements</SelectItem>
                                <SelectItem value="selection">Selection Process</SelectItem>
                                <SelectItem value="account">Account Management</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                            {faqForm.formState.errors.category && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.category.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="faq-question">Question</Label>
                            <Input 
                              id="faq-question" 
                              {...faqForm.register('question')} 
                              placeholder="Enter the question"
                            />
                            {faqForm.formState.errors.question && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.question.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="faq-answer">Answer</Label>
                            <Textarea 
                              id="faq-answer" 
                              {...faqForm.register('answer')} 
                              placeholder="Enter the answer"
                              rows={5}
                            />
                            {faqForm.formState.errors.answer && (
                              <p className="text-sm text-red-600 mt-1">
                                {faqForm.formState.errors.answer.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => {
                              setIsModalOpen(false);
                              setEditingItem(null);
                              setEditingType('');
                              faqForm.reset();
                            }}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingItem ? 'Update FAQ' : 'Add FAQ'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {faqs.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>Click "Add FAQ" to create your first FAQ entry</p>
                        </div>
                      ) : (
                        faqs.map((faq: any) => (
                          <Card key={faq.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{faq.question}</h4>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditItem(faq, 'faq', '/api/admin/faqs')}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(faq.id, '/api/admin/faqs', 'FAQ')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {faq.answer && (
                                <p className="text-sm text-gray-600">{faq.answer}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Role Assignments Tab */}
              <TabsContent value="roles">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Role Assignments</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Assign roles to users in the system</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Assign Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Role to User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={roleAssignmentForm.handleSubmit(handleCreateRoleAssignment)} className="space-y-4">
                          <div>
                            <Label htmlFor="role-user">User</Label>
                            <div className="space-y-2">
                              <Input
                                placeholder="Search users..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="mb-2"
                              />
                              <Select onValueChange={(value) => roleAssignmentForm.setValue('userId', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(allUsers as any[])
                                    .filter((user: any) => 
                                      user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                    )
                                    .slice(0, 50) // Limit to 50 results for performance
                                    .map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                      </SelectItem>
                                    ))}
                                  {allUsers.length === 0 && (
                                    <SelectItem value="" disabled>
                                      No users found
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            {roleAssignmentForm.formState.errors.userId && (
                              <p className="text-sm text-red-600 mt-1">
                                {roleAssignmentForm.formState.errors.userId.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="role-assignment">Role</Label>
                            <Select onValueChange={(value) => roleAssignmentForm.setValue('role', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="board">Board Member</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="aie">A.i.E Holder</SelectItem>
                                <SelectItem value="records">Records</SelectItem>
                                <SelectItem value="procurement">Procurement</SelectItem>
                              </SelectContent>
                            </Select>
                            {roleAssignmentForm.formState.errors.role && (
                              <p className="text-sm text-red-600 mt-1">
                                {roleAssignmentForm.formState.errors.role.message}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Assign Role</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(allUsers as any[]).filter((user: any) => user.role !== 'applicant').length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>Click "Assign Role" to manage user permissions</p>
                        </div>
                      ) : (
                        (allUsers as any[])
                          .filter((user: any) => user.role !== 'applicant')
                          .map((user: any) => (
                            <Card key={user.id}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{user.name}</h4>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <Badge className="mt-2" variant="secondary">
                                  {user.role === 'admin' ? 'Administrator' : 
                                   user.role === 'board' ? 'Board Member' : user.role}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))
                      )}
                    </div>
                    
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Board Leadership Tab */}
              <TabsContent value="board-leadership">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Board Leadership Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage board members and leadership team</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingBoardMember(null);
                          boardMemberForm.reset();
                          setBoardPhotoMode('url');
                          setBoardPhotoFile(null);
                          setBoardPhotoPreview('');
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Board Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                        <DialogHeader>
                          <DialogTitle>
                            {editingBoardMember ? 'Edit Board Member' : 'Add Board Member'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={boardMemberForm.handleSubmit(handleCreateBoardMember)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="board-name">Full Name</Label>
                              <Input 
                                id="board-name" 
                                {...boardMemberForm.register('name')} 
                                placeholder="e.g., Dr. John Smith"
                              />
                              {boardMemberForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {boardMemberForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="board-position">Position/Title</Label>
                              <Input 
                                id="board-position" 
                                {...boardMemberForm.register('position')} 
                                placeholder="e.g., Chairman, CEO"
                              />
                              {boardMemberForm.formState.errors.position && (
                                <p className="text-sm text-red-600 mt-1">
                                  {boardMemberForm.formState.errors.position.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="board-bio">Biography</Label>
                            <Textarea 
                              id="board-bio" 
                              {...boardMemberForm.register('bio')} 
                              placeholder="Brief biography of the board member..."
                              rows={3}
                            />
                          </div>
                          {/* Photo Upload Section */}
                          <div className="space-y-4">
                            <Label>Board Member Photo</Label>
                            
                            {/* Upload Mode Toggle */}
                            <div className="flex rounded-md border border-gray-200 p-1">
                              <Button
                                type="button"
                                variant={boardPhotoMode === 'url' ? 'default' : 'ghost'}
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setBoardPhotoMode('url');
                                  setBoardPhotoFile(null);
                                  setBoardPhotoPreview('');
                                }}
                                data-testid="button-board-photo-url-mode"
                              >
                                <Link className="w-4 h-4 mr-1" />
                                URL
                              </Button>
                              <Button
                                type="button"
                                variant={boardPhotoMode === 'upload' ? 'default' : 'ghost'}
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setBoardPhotoMode('upload');
                                  boardMemberForm.setValue('photoUrl', '');
                                }}
                                data-testid="button-board-photo-upload-mode"
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                              </Button>
                            </div>

                            {/* URL Input Mode */}
                            {boardPhotoMode === 'url' && (
                              <div>
                                <Input 
                                  {...boardMemberForm.register('photoUrl')} 
                                  placeholder="https://example.com/board-member-photo.jpg"
                                  data-testid="input-board-photo-url"
                                />
                              </div>
                            )}

                            {/* File Upload Mode */}
                            {boardPhotoMode === 'upload' && (
                              <div>
                                <div 
                                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                  onDrop={handleBoardPhotoDrop}
                                  onDragOver={handleBoardPhotoDragOver}
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleBoardPhotoFileSelect(file);
                                    };
                                    input.click();
                                  }}
                                  data-testid="board-photo-drop-zone"
                                >
                                  {boardPhotoFile ? (
                                    <div className="space-y-2">
                                      <img 
                                        src={boardPhotoPreview} 
                                        alt="Preview" 
                                        className="w-24 h-24 object-cover rounded-full mx-auto"
                                      />
                                      <p className="text-sm font-medium text-green-600">
                                        {boardPhotoFile.name}
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBoardPhotoFile(null);
                                          setBoardPhotoPreview('');
                                        }}
                                        data-testid="button-remove-board-photo"
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          Drag and drop a photo here
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          or click to browse (JPEG, PNG up to 5MB)
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="board-order">Display Order</Label>
                            <Input 
                              id="board-order" 
                              type="number"
                              {...boardMemberForm.register('order', { valueAsNumber: true })} 
                              placeholder="0"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="submit" 
                              data-testid="button-submit-board-member"
                            >
                              {editingBoardMember ? 'Update Board Member' : 'Add Board Member'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(boardMembers as any[]).length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No board members yet. Click "Add Board Member" to get started.</p>
                        </div>
                      ) : (
                        (boardMembers as any[]).map((member: any) => (
                          <Card key={member.id}>
                            <CardContent className="p-4 text-center relative">
                              {/* Edit/Delete Action Buttons */}
                              <div className="absolute top-2 right-2 flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBoardMember(member)}
                                  data-testid={`button-edit-board-member-${member.id}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteBoardMember(member.id)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                  data-testid={`button-delete-board-member-${member.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Photo */}
                              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                                {member.photoUrl ? (
                                  <img 
                                    src={member.photoUrl} 
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                    data-testid={`img-board-member-${member.id}`}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Member Info */}
                              <h4 className="font-semibold text-lg" data-testid={`text-board-member-name-${member.id}`}>
                                {member.name}
                              </h4>
                              <p className="text-primary font-medium" data-testid={`text-board-member-position-${member.id}`}>
                                {member.position}
                              </p>
                              {member.bio && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-3" data-testid={`text-board-member-bio-${member.id}`}>
                                  {member.bio}
                                </p>
                              )}
                              <Badge className="mt-2" variant="outline" data-testid={`badge-board-member-order-${member.id}`}>
                                Order: {member.order || 0}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* About Page Management Tab */}
              <TabsContent value="about">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>About Page Configuration</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Manage content displayed on the about page</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Config
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
                          <DialogHeader>
                            <DialogTitle>Add About Page Configuration</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={aboutConfigForm.handleSubmit(handleCreateAboutConfig)} className="space-y-4">
                            <div>
                              <Label htmlFor="config-key">Configuration Key</Label>
                              <Select onValueChange={(value) => aboutConfigForm.setValue('key', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select configuration key" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="heroTitle">Hero Title</SelectItem>
                                  <SelectItem value="heroDescription">Hero Description</SelectItem>
                                  <SelectItem value="mission">Mission Statement</SelectItem>
                                  <SelectItem value="vision">Vision Statement</SelectItem>
                                  <SelectItem value="values">Values (comma-separated)</SelectItem>
                                  <SelectItem value="whoWeAre">Who We Are Content</SelectItem>
                                </SelectContent>
                              </Select>
                              {aboutConfigForm.formState.errors.key && (
                                <p className="text-sm text-red-600 mt-1">
                                  {aboutConfigForm.formState.errors.key.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="config-value">Content</Label>
                              <Textarea 
                                id="config-value" 
                                {...aboutConfigForm.register('value')} 
                                placeholder="Enter the content for this configuration"
                                rows={4}
                              />
                              {aboutConfigForm.formState.errors.value && (
                                <p className="text-sm text-red-600 mt-1">
                                  {aboutConfigForm.formState.errors.value.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="submit">Add Configuration</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.keys(aboutConfig).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Info className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No about page configuration found. Click "Add Config" to get started.</p>
                          </div>
                        ) : (
                          Object.entries(aboutConfig).map(([key, value]) => (
                            <Card key={key}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{key}</h4>
                                    <p className="text-gray-900 mt-1">{String(value).substring(0, 200)}{String(value).length > 200 ? '...' : ''}</p>
                                  </div>
                                  <div className="flex space-x-2 ml-4">
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage contact details displayed on the about page</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.keys(contactConfig).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No contact configuration found.</p>
                          </div>
                        ) : (
                          Object.entries(contactConfig).map(([key, value]) => (
                            <Card key={key}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{key}</h4>
                                    <p className="text-gray-900">{String(value)}</p>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Gallery Management Tab */}
              <TabsContent value="gallery">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Gallery Management</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage gallery items and images</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Gallery Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                        <DialogHeader>
                          <DialogTitle>Add Gallery Item</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={galleryItemForm.handleSubmit(handleCreateGalleryItem)} className="space-y-4">
                          <div>
                            <Label htmlFor="gallery-title">Title</Label>
                            <Input 
                              id="gallery-title" 
                              {...galleryItemForm.register('title')} 
                              placeholder="Gallery item title"
                            />
                            {galleryItemForm.formState.errors.title && (
                              <p className="text-sm text-red-600 mt-1">
                                {galleryItemForm.formState.errors.title.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="gallery-description">Description</Label>
                            <Textarea 
                              id="gallery-description" 
                              {...galleryItemForm.register('description')} 
                              placeholder="Gallery item description"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="gallery-category">Category</Label>
                            <Select onValueChange={(value) => galleryItemForm.setValue('category', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="meetings">Meetings</SelectItem>
                                <SelectItem value="training">Training</SelectItem>
                                <SelectItem value="recruitment">Recruitment</SelectItem>
                                <SelectItem value="events">Events</SelectItem>
                                <SelectItem value="awards">Awards</SelectItem>
                                <SelectItem value="outreach">Outreach</SelectItem>
                              </SelectContent>
                            </Select>
                            {galleryItemForm.formState.errors.category && (
                              <p className="text-sm text-red-600 mt-1">
                                {galleryItemForm.formState.errors.category.message}
                              </p>
                            )}
                          </div>
                          {/* Dynamic Image Input */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Image</Label>
                              <div className="flex rounded-lg bg-gray-100 p-1">
                                <Button
                                  type="button"
                                  variant={galleryImageMode === 'url' ? 'default' : 'ghost'}
                                  size="sm"
                                  className="h-6 px-3"
                                  onClick={() => {
                                    setGalleryImageMode('url');
                                    setUploadedImageFile(null);
                                    setPreviewImageUrl('');
                                  }}
                                  data-testid="button-gallery-url-mode"
                                >
                                  <Link className="w-3 h-3 mr-1" />
                                  URL
                                </Button>
                                <Button
                                  type="button"
                                  variant={galleryImageMode === 'upload' ? 'default' : 'ghost'}
                                  size="sm"
                                  className="h-6 px-3"
                                  onClick={() => {
                                    setGalleryImageMode('upload');
                                    galleryItemForm.setValue('imageUrl', '');
                                  }}
                                  data-testid="button-gallery-upload-mode"
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>

                            {galleryImageMode === 'url' ? (
                              <div>
                                <Input 
                                  id="gallery-imageUrl" 
                                  {...galleryItemForm.register('imageUrl')} 
                                  placeholder="https://example.com/image.jpg"
                                  data-testid="input-gallery-url"
                                />
                                {galleryItemForm.formState.errors.imageUrl && (
                                  <p className="text-sm text-red-600 mt-1">
                                    {galleryItemForm.formState.errors.imageUrl.message}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  {uploadedImageFile ? (
                                    <div className="space-y-3">
                                      {previewImageUrl && (
                                        <img 
                                          src={previewImageUrl} 
                                          alt="Preview" 
                                          className="max-h-32 mx-auto rounded-lg"
                                        />
                                      )}
                                      <div className="flex items-center justify-center space-x-2">
                                        <span className="text-sm text-gray-600">
                                          {uploadedImageFile.name}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setUploadedImageFile(null);
                                            setPreviewImageUrl('');
                                          }}
                                          data-testid="button-remove-upload"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                                      <div>
                                        <label htmlFor="gallery-file-upload" className="cursor-pointer">
                                          <span className="text-sm text-blue-600 hover:text-blue-500">
                                            Choose an image file
                                          </span>
                                          <input
                                            id="gallery-file-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setUploadedImageFile(file);
                                                setPreviewImageUrl(URL.createObjectURL(file));
                                              }
                                            }}
                                            data-testid="input-gallery-file"
                                          />
                                        </label>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        PNG, JPG up to 10MB
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {galleryFileUpload.state.isUploading && (
                                  <div className="mt-2 text-sm text-blue-600">
                                    Uploading image...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="gallery-eventDate">Event Date</Label>
                            <Input 
                              id="gallery-eventDate" 
                              type="date"
                              {...galleryItemForm.register('eventDate')} 
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="submit">Add Gallery Item</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleryItems.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>No gallery items yet. Click "Add Gallery Item" to get started.</p>
                        </div>
                      ) : (
                        (galleryItems as any[]).map((item: any) => (
                          <Card key={item.id} className="overflow-hidden">
                            <div className="aspect-video bg-gray-100 relative">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary">{item.category}</Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{item.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'No date'}
                                </p>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings Tab */}
              <TabsContent value="system">
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>System Settings</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage system-wide settings including favicon</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Favicon Management */}
                      <div className="p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Favicon Management</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload a favicon for your website. Recommended size: 16x16 or 32x32 pixels. Accepted formats: .ico, .png
                        </p>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <Label htmlFor="favicon-upload">Upload Favicon</Label>
                              <Input 
                                id="favicon-upload"
                                type="file"
                                accept=".ico,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Create FormData and upload
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    // Upload with specific filename
                                    fetch('/api/upload', {
                                      method: 'POST',
                                      body: formData
                                    })
                                    .then(response => response.json())
                                    .then(data => {
                                      if (data.success) {
                                        // Move the uploaded file to favicon.ico
                                        const faviconPath = '/uploads/favicon.ico';
                                        toast({
                                          title: 'Success',
                                          description: 'Favicon uploaded successfully! Please refresh the page to see changes.',
                                        });
                                      } else {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to upload favicon',
                                          variant: 'destructive',
                                        });
                                      }
                                    })
                                    .catch(error => {
                                      toast({
                                        title: 'Error',
                                        description: 'Failed to upload favicon',
                                        variant: 'destructive',
                                      });
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-white border rounded flex items-center justify-center">
                              <img 
                                src="/uploads/favicon.ico" 
                                alt="Current favicon"
                                className="w-4 h-4"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  ((e.currentTarget.nextElementSibling) as HTMLElement).style.display = 'block';
                                }}
                              />
                              <div style={{display: 'none'}} className="text-xs text-gray-400">🏛️</div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Current Favicon</p>
                              <p className="text-xs text-gray-500">Will fallback to default if not found</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Future system settings can be added here */}
                      <div className="p-4 border rounded-lg border-dashed border-gray-300">
                        <h3 className="text-lg font-semibold mb-2 text-gray-400">Future System Settings</h3>
                        <p className="text-sm text-gray-500">
                          Additional system settings like site title, default language, 
                          email configurations, etc. will be added here.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}