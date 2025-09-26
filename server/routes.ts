import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import passport from "passport";
import { sendOtp, verifyOtp } from "./lib/africastalking-sms";
import { ApplicantService } from "./applicantService";
import { log } from "util";
import { z } from "zod";
import { createInsertSchema } from 'drizzle-zod';
import { boardMembers, carouselSlides } from "@shared/schema";

// Board member validation schemas
const insertBoardMemberSchema = createInsertSchema(boardMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

const updateBoardMemberSchema = insertBoardMemberSchema.partial();

// Carousel slides validation schemas
const insertCarouselSlideSchema = createInsertSchema(carouselSlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

const updateCarouselSlideSchema = insertCarouselSlideSchema.partial();

// OTP utility functions
const applicantService = new ApplicantService(storage);
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simulate SMS sending (in production, integrate with SMS provider like Twilio)
function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  console.log(`SMS to ${phoneNumber}: ${message}`);
  // In development, just log the OTP
  return Promise.resolve(true);
}
// Document upload storage configuration with extensions preserved
const documentStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// File upload configuration
const upload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
// Profile photo upload config with extensions preserved
const profilePhotoStorage = multer.diskStorage({
  destination: "uploads/profile-photos/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // .jpg / .png
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
// Profile photo upload configuration  
const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile photos
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Profile photo must be JPEG or PNG format'));
    }
  }
});

// CSV conversion utility function
function convertToCSV(data: any[], reportType: string): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const keys = Object.keys(data[0]);
  const csvHeader = keys.join(',');
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      // Handle values that might contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeader, ...csvRows].join('\n');
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  app.use('/uploads', express.static('uploads'));

  // Profile photo upload endpoint
  app.post('/api/upload/profile-photo', profilePhotoUpload.single('profilePhoto'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Basic validation
      const file = req.file;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPEG and PNG are allowed.' });
      }

      // Generate file URL
      const fileUrl = `/uploads/profile-photos/${file.filename}`;
      
      res.json({ 
        message: 'Photo uploaded successfully',
        url: fileUrl,
        filename: file.filename
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  });

  // --- Signup ---
  app.post("/api/auth/signup", profilePhotoUpload.single("profilePhoto"), async (req, res) => {
    try {
      const { email, password, surname, phoneNumber, nationalId } = req.body;      
      const profilePhoto = req.file ? req.file.filename : "default.jpg";
      const fileUrl = `/uploads/profile-photos/${profilePhoto}`
      const isValidEmail = await storage.verifyEmail(email);
    if (isValidEmail) {
      return res.status(401).json({ message: `Your email ${email} already registered` });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
      const hashedPassword = await bcrypt.hash(password, 10);    
      const newUser = await storage.upsertUser({
        ...req.body,
        password: hashedPassword,
        passwordHash: hashedPassword,
        surname: surname,
        phoneNumber,
        profileImageUrl: fileUrl,
        nationalId
      });

      // Immediately log the user in
      req.login(newUser, (err) => {
        if (err) {
          console.error("Login after signup failed:", err);
          return res.status(500).json({ message: "Failed to login after signup" });
        }
        res.status(201).json({ user: newUser });
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ message: err.message || "Signup failed" });
    }
  });

  // --- Login ---
  app.post("/api/auth/login",
    passport.authenticate("local"),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  // --- Logout ---
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });
  app.get("/api/auth/me", async (req:any, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  // Decide redirectUrl based on role or other logic
  // --- Get current session user ---
    let redirectUrl = "/"; // default
    let applicantProfile = null;

switch (req.user?.role) {
  case "admin":
    redirectUrl = "/admin";
    break;
  case "applicant":
    redirectUrl = "/dashboard";
    applicantProfile = await storage.getApplicant(req.user?.id);    
    break;
  default:
    redirectUrl = "/";
    break;
}

  res.json({ user: req.user, redirectUrl, applicantProfile });
});
// Employee verification routes
  app.post('/api/employee/verify', async (req:any, res) => {
    try {
      const { personalNumber, idNumber } = req.body;
      const userId = req.user.id;
      if (!personalNumber || !idNumber) {
        return res.status(400).json({ message: 'Personal number and ID number are required' });
      }
      const applicantData = await storage.getApplicant(userId);
      // Check if employee exists with matching personal number and ID
      const employee = await storage.verifyEmployee(personalNumber, idNumber);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found or ID number does not match' });
      }
      await storage.updateApplicant(applicantData.id, { isEmployee: true }, 1.5);
      return res.json({ 
        message: 'Employee verified successfully',
        employee: {
          personalNumber: employee.personalNumber,
          designation: employee.designation,
        }
      });
    } catch (error) {
      console.error('Error verifying employee:', error);
      return res.status(500).json({ message: 'Failed to verify employee' });
    }
  });

  app.post('/api/employee/details', isAuthenticated, async (req:any, res) => {
    try {
      const userId = req.user.id;
      const employeeData = req.body;
      const applicantId = await applicantService.resolveApplicantId(userId);

      // Get applicant profile first
      const applicant = await storage.getApplicantById(applicantId);
      if (!applicant) {
        return res.status(404).json({ message: 'Applicant profile not found' });
      }

      // Create or update employee record
      const employee = await storage.upsertEmployeeDetails(applicantId, employeeData);      
      
      res.json({ 
        message: 'Employee details saved successfully',
        employee 
      });
    } catch (error) {
      console.error('Error saving employee details:', error);
      res.status(500).json({ message: 'Failed to save employee details' });
    }
  });
  // OTP routes using AfricaTalking SMS service
  // Server-side OTP routes with proper validation and security
  app.post("/api/auth/send-otp", async (req: any, res) => {
    try {
      const { phoneNumber, purpose = 'authentication' } = req.body;
      
      // Validate input
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number is required' 
        });
      }

      // Additional validation can be added here (e.g., purpose validation)
      const validPurposes = ['authentication', 'password-reset', 'phone-verification'];
      if (!validPurposes.includes(purpose)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purpose specified'
        });
      }

      // Rate limiting by IP could be added here
      const clientIP = req.ip || req.connection.remoteAddress;
      
      await sendOtp({ 
        to: phoneNumber,
        template: `Your ${purpose} code is {{CODE}}. Valid for 10 minutes. Do not share this code with anyone.`
      });
      
      // Log OTP send attempt (without the actual code)
      console.log(`OTP sent to ${phoneNumber} for ${purpose} from IP ${clientIP}`);
      
      res.json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to send verification code' 
      });
    }
  });

  app.post("/api/auth/verify-otp", async (req: any, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      // Validate input
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number is required' 
        });
      }
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Verification code is required' 
        });
      }

      // Verify OTP
      const isValid = verifyOtp({ 
        to: phoneNumber, 
        otp: code.trim() 
      });

      if (!isValid) {
        // Log failed verification attempt
        const clientIP = req.ip || req.connection.remoteAddress;
        console.log(`Failed OTP verification for ${phoneNumber} from IP ${clientIP}`);
        
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired verification code' 
        });
      }

      // Log successful verification
      console.log(`Successful OTP verification for ${phoneNumber}`);
      
      res.json({ 
        success: true, 
        message: 'Code verified successfully' 
      });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to verify code' 
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get applicant profile if user is an applicant
      let applicantProfile = null;
      if (user.role === 'applicant') {

        applicantProfile = await storage.getApplicant(userId);
      }

      // Determine redirect URL based on role and profile completion
      let redirectUrl = '/';
      if (user.role === 'applicant') {
        if (!applicantProfile) {
          redirectUrl = '/profile?step=1&reason=complete_profile';
        } else if ((applicantProfile.profileCompletionPercentage || 0) < 100) {
          redirectUrl = '/profile?step=2&reason=incomplete_profile';
        } else {
          redirectUrl = '/dashboard';
        }
      } else if (user.role === 'admin') {
        redirectUrl = '/admin';
      } else if (user.role === 'board') {
        redirectUrl = '/board';
      }

      res.json({ ...user, applicantProfile, redirectUrl });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes (no authentication required)
  
  // Get all counties for location dropdowns
  app.get('/api/public/counties', async (req, res) => {
    try {
      const counties = await storage.getCounties();
      res.json(counties);
    } catch (error) {
      console.error('Error fetching counties:', error);
      res.status(500).json({ message: 'Failed to fetch counties' });
    }
  });

  // Get constituencies by county
  app.get('/api/public/constituencies/:countyId', async (req, res) => {
    try {
      const countyId = parseInt(req.params.countyId);
      const constituencies = await storage.getConstituenciesByCounty(countyId);
      res.json(constituencies);
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      res.status(500).json({ message: 'Failed to fetch constituencies' });
    }
  });

  // Get wards by constituency
  app.get('/api/public/wards/:constituencyId', async (req, res) => {
    try {
      const constituencyId = parseInt(req.params.constituencyId);
      const wards = await storage.getWardsByConstituency(constituencyId);
      res.json(wards);
    } catch (error) {
      console.error('Error fetching wards:', error);
      res.status(500).json({ message: 'Failed to fetch wards' });
    }
  });

  // Get published notices
  app.get('/api/public/notices', async (req, res) => {
    try {
      const notices = await storage.getNotices(true);
      res.json(notices);
    } catch (error) {
      console.error('Error fetching notices:', error);
      res.status(500).json({ message: 'Failed to fetch notices' });
    }
  });

  // Subscribe to notice notifications
  app.post('/api/public/subscribe', async (req, res) => {
    try {
      // Validate request body using Zod
      const subscriptionSchema = z.object({
        email: z.string().email('Invalid email address'),
        notificationTypes: z.string().default('all')
      });
      
      const validatedData = subscriptionSchema.parse(req.body);
      const { email, notificationTypes } = validatedData;
      
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      // Check if email is already subscribed
      const existingSubscription = await storage.getSubscription(email);
      if (existingSubscription && existingSubscription.isActive) {
        return res.status(409).json({ message: 'Email is already subscribed' });
      }

      // Generate unique subscription token
      const subscriptionToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const subscriptionData = {
        email,
        subscriptionToken,
        notificationTypes: typeof notificationTypes === 'string' ? notificationTypes : JSON.stringify(notificationTypes),
        isActive: true,
        lastNotifiedAt: null,
        unsubscribedAt: null,
      };

      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json({ 
        message: 'Successfully subscribed to notice notifications',
        subscription: {
          email: subscription.email,
          subscribedAt: subscription.subscribedAt
        }
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  });

  // Unsubscribe from notice notifications
  app.post('/api/public/unsubscribe', async (req, res) => {
    try {
      // Validate request body using Zod
      const unsubscribeSchema = z.object({
        token: z.string().min(1, 'Subscription token is required')
      });
      
      const validatedData = unsubscribeSchema.parse(req.body);
      const { token } = validatedData;

      const success = await storage.unsubscribeEmail(token);
      if (success) {
        res.json({ message: 'Successfully unsubscribed from notice notifications' });
      } else {
        res.status(404).json({ message: 'Subscription not found or already inactive' });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });
  
  // Public study areas (for job requirements)
  app.get('/api/public/study-areas', async (req, res) => {
    try {
      const studyAreas = await storage.getStudyArea();
      res.json(studyAreas);
    } catch (error) {
      console.error('Error fetching study areas:', error);
      res.status(500).json({ message: 'Failed to fetch study areas' });
    }
  });
  
  // Public certificate levels (for job requirements)
  app.get('/api/public/certificate-levels', async (req, res) => {
    try {
      const certLevels = await storage.getCertLevel();
      res.json(certLevels);
    } catch (error) {
      console.error('Error fetching certificate levels:', error);
      res.status(500).json({ message: 'Failed to fetch certificate levels' });
    }
  });
  app.get('/api/public/faqs', async (req, res) => {
    try {
      const faq = await storage.getFaq();
      res.json(faq);
    } catch (error) {
      console.error('Error fetching faq:', error);
      res.status(500).json({ message: 'Failed to fetch faq' });
    }
  });

  // Get gallery items
  app.get('/api/public/gallery', async (req, res) => {
    try {
      const gallery = await storage.getGalleryItems();
      res.json(gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({ message: 'Failed to fetch gallery' });
    }
  });

  // Get system configuration
  app.get('/api/public/system-config', async (req, res) => {
    try {
      const section = req.query.section as string;
      const config = await storage.getSystemConfig(undefined, section);
      
      // Convert array to key-value object for easier frontend use
      const configObj = config.reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      
      res.json(configObj);
    } catch (error) {
      console.error('Error fetching system config:', error);
      res.status(500).json({ message: 'Failed to fetch system config' });
    }
  });

  // Get board members
  app.get('/api/public/board-members', async (req, res) => {
    try {
      const boardMembers = await storage.getBoardMembers();
      res.json(boardMembers);
    } catch (error) {
      console.error('Error fetching board members:', error);
      res.status(500).json({ message: 'Failed to fetch board members' });
    }
  });

  // Admin system configuration routes
  app.post('/api/admin/system-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const config = await storage.upsertSystemConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error('Error creating system config:', error);
      res.status(500).json({ message: 'Failed to create system config' });
    }
  });

  // Update system configuration (admin)
  app.put('/api/admin/system-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const config = await storage.upsertSystemConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({ message: 'Failed to update system config' });
    }
  });

  // Delete system configuration (admin)
  app.delete('/api/admin/system-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { section, key } = req.query;
      if (!section || !key) {
        return res.status(400).json({ message: 'Section and key are required' });
      }

      const result = await storage.deleteSystemConfig(section as string, key as string);
      res.json({ message: 'System configuration deleted successfully', result });
    } catch (error) {
      console.error('Error deleting system config:', error);
      res.status(500).json({ message: 'Failed to delete system config' });
    }
  });

  // Admin gallery management routes
  app.post('/api/admin/gallery', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const galleryItem = await storage.createGalleryItem({...req.body, createdBy:user.id});
      res.json(galleryItem);
    } catch (error) {
      console.error('Error creating gallery item:', error);
      res.status(500).json({ message: 'Failed to create gallery item' });
    }
  });

  // Get user permissions and navigation based on role
  app.get('/api/auth/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let permissions: string[] = [];
      let navigation: any[] = [];

      switch (user.role) {
        case 'admin':
          permissions = [
            'admin.dashboard.view',
            'admin.jobs.manage',
            'admin.applications.view',
            'admin.applications.update', 
            'admin.reports.view',
            'admin.notifications.send',
            'admin.settings.manage',
            'admin.users.manage'
          ];
          navigation = [
            { 
              href: '/admin', 
              icon: 'LayoutDashboard', 
              label: 'Dashboard', 
              description: 'Admin overview' 
            },
            { 
              href: '/admin/jobs', 
              icon: 'Briefcase', 
              label: 'Job Management', 
              description: 'Create & manage jobs' 
            },
            { 
              href: '/admin/applications', 
              icon: 'Users', 
              label: 'Applications', 
              description: 'Review applications' 
            },
            { 
              href: '/admin/reports', 
              icon: 'BarChart3', 
              label: 'Reports', 
              description: 'Generate reports' 
            },
            { 
              href: '/admin/notifications', 
              icon: 'Bell', 
              label: 'Notifications', 
              description: 'Send notifications' 
            },
            { 
              href: '/admin/settings', 
              icon: 'Settings', 
              label: 'System Config', 
              description: 'System settings' 
            }
          ];
          break;

        case 'board':
          permissions = [
            'board.dashboard.view',
            'board.shortlisting.manage',
            'board.interviews.manage',
            'board.scoring.manage',
            'board.reports.view'
          ];
          navigation = [
            { 
              href: '/board', 
              icon: 'LayoutDashboard', 
              label: 'Dashboard', 
              description: 'Committee overview' 
            },
            { 
              href: '/board/shortlisting', 
              icon: 'CheckCircle', 
              label: 'Shortlisting', 
              description: 'Review & shortlist' 
            },
            { 
              href: '/board/interviews', 
              icon: 'Calendar', 
              label: 'Interviews', 
              description: 'Schedule & conduct' 
            },
            { 
              href: '/board/reports', 
              icon: 'BarChart3', 
              label: 'Reports', 
              description: 'Selection reports' 
            }
          ];
          break;

        case 'applicant':
          permissions = [
            'applicant.dashboard.view',
            'applicant.profile.manage',
            'applicant.applications.view',
            'applicant.applications.create',
            'applicant.documents.upload',
            'jobs.public.view'
          ];
          navigation = [
            { 
              href: '/dashboard', 
              icon: 'LayoutDashboard', 
              label: 'Dashboard', 
              description: 'Overview and stats' 
            },
            { 
              href: '/profile', 
              icon: 'User', 
              label: 'Profile', 
              description: 'Complete your profile' 
            },
            { 
              href: '/applications', 
              icon: 'FileText', 
              label: 'My Applications', 
              description: 'Track applications' 
            },
            { 
              href: '/jobs', 
              icon: 'Search', 
              label: 'Browse Jobs', 
              description: 'Find opportunities' 
            },
            { 
              href: '/documents', 
              icon: 'Upload', 
              label: 'Documents', 
              description: 'Upload certificates' 
            }
          ];
          break;

        default:
          permissions = ['jobs.public.view'];
          navigation = [];
      }

      res.json({
        role: user.role,
        permissions,
        navigation,
        redirectUrl: user.role === 'admin' ? '/admin' : user.role === 'board' ? '/board' : user.role === 'applicant' ? '/dashboard' : '/'
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  // Get available roles (for admin role management)
  app.get('/api/admin/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const roles = [
        { value: 'admin', label: 'Administrator', description: 'Full system access and management' },
        { value: 'board', label: 'Board Member', description: 'Interview and selection management' },
        { value: 'applicant', label: 'Applicant', description: 'Job application and profile management' }
      ];

      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  // Get active jobs
  app.get('/api/public/jobs', async (req, res) => {
    try {
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
      const jobs = await storage.getJobs({ isActive: true, departmentId });
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  // Get system configuration data
  app.get('/api/public/config', async (req:any, res) => {
    try {
      const [departments,
        designations,
        awards, courses, institutions, studyAreas, specializations,        
        ethnicity, jobGroups, jobs, certificateLevels, counties,
        constituencies,
        wards, notices,faqs,admins,userData
      ] = await Promise.all([
        storage.getDepartments(),
        storage.getDesignations(),
        storage.getAwards(),
        storage.getCoursesOffered(),
        storage.getInstitutions(),
        storage.getStudyArea(),
        storage.getSpecializations(),
        storage.getEthnicity(),
        storage.getJobGroups(),
        storage.getJobs(),
        storage.getCertLevel(),
        storage.getCounties(),
        storage.getConstituencies(),
        storage.getWards(),
        storage.getNotices(),
        storage.getFaq(),
        storage.getUsers(),
        storage.getApplicant(req.user.id),
      ]);
      
      res.json({
        departments,
        designations,
        awards,
        courses,
        institutions,
        studyAreas,
        specializations,
        ethnicity,
        jobGroups,
        jobs,
        certificateLevels,
        counties,
        constituencies,
        wards,
        notices,
        faqs,
        admins,
        userData,
      });      
    } catch (error) {
      console.error('Error fetching config:', error);
      res.status(500).json({ message: 'Failed to fetch configuration', error: (error as Error).message });
    }
  });
  // Protected applicant routes  
  // Create applicant profile
  app.post('/api/applicant/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const {applicantId, data } = req.body;
      const user = await storage.getUser(userId); 
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Check if profile already exists
      const existingProfile = await storage.getApplicant(userId);      
      if (existingProfile.applicantId) {
           const updateProfile = await applicantService.updateBasicInfo(applicantId, data);
        return res.json(updateProfile);
      }
      const profileData = {
        userId,
        ...req.body.data,
      };
      const profile = await storage.createApplicant(profileData);
      res.json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ message: 'Failed to create profile' }); 
    }
  });
  // Update all other components of the stepwises
  
  app.patch("/api/applicant/profile", isAuthenticated, async (req, res) => {
    try {
    
    const { applicantId, step, data } = req.body;
    if (!applicantId) {
      return res.status(400).json({ error: "Applicant ID missing" });
    }
    const updatedProfile = await storage.updateApplicant(applicantId, data, step);
    res.json(updatedProfile);
  } catch (err) {
    console.error("Failed to update applicant:", err);
    res.status(500).json({ error: "Failed to update applicant profile" });
  }
});  
  // Mark phone as verified after OTP verification
  app.post('/api/applicant/verify-phone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const profile = await storage.getApplicant(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const { phoneNumber } = req.body;
      
      // Update phone verification status
      const updatedProfile = await storage.updateApplicant(profile.id, {
        phoneVerified: true,
        phoneNumber,
      }, 1);
      
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error verifying phone:', error);
      res.status(500).json({ message: 'Failed to verify phone' });
    }
  });

  // Get applicant's applications
  app.get('/api/applicant/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const profile = await storage.getApplicant(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const applications = await storage.getApplications({ applicantId: profile.id });
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });
  app.get('/api/applicant/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const profile = await storage.getApplicant(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  // Apply for a job
  app.post('/api/applicant/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const profile = await storage.getApplicant(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const { jobId } = req.body;
      
      // Get detailed applicant profile with completion data
      const applicant = await storage.getApplicantById(profile.id);
      if (!applicant) {
        return res.status(404).json({ message: 'Applicant profile not found' });
      }
      
      // Get job details with requirements
      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // ✅ Eligibility Check 1: Profile must be 100% complete
      if (applicant.profileCompletionPercentage < 100) {
        return res.status(400).json({ 
          message: 'Profile must be 100% complete to apply for jobs',
          currentCompletion: applicant.profileCompletionPercentage
        });
      }
      
      // ✅ Eligibility Check 2: Must have exactly 3 referees
      if (!applicant.referees || applicant.referees.length !== 3) {
        return res.status(400).json({ 
          message: 'You must have exactly 3 referees to apply for jobs',
          currentReferees: applicant.referees?.length || 0
        });
      }
      
      // ✅ Eligibility Check 3: Study area requirement (if job has one)
      console.log(`job`, job);
      console.log(`appliacant`, applicant.education);


      
      // ✅ Eligibility Check 3: Study area & specialization
      if (job.jobs?.requiredStudyAreaId) {
        const hasMatchingStudyArea = applicant.education?.some(
          (edu: any) => Number(edu.specialization?.studyAreaId || edu.studyAreaId) === job.jobs.requiredStudyAreaId
        );

        if (!hasMatchingStudyArea) {
          return res.status(400).json({
            message: "Your educational background does not match the required study area for this job",
          });
        }
      }

      // ✅ Eligibility Check 3.1: Specializations (if job requires specific ones)
      if (job.jobs?.requiredSpecializationIds?.length > 0) {
        const hasMatchingSpec = applicant.education?.some((edu: any) =>
          job.jobs.requiredSpecializationIds.includes(Number(edu.specializationId))
        );

        if (!hasMatchingSpec) {
          return res.status(400).json({
            message: "Your specialization does not meet the requirements for this job",
          });
        }
      }      
      // ✅ Eligibility Check 4: Certificate level requirement (if job has one)
      if (job.jobs?.certificateLevel) {
        const hasMatchingCertLevel = applicant.education?.some(
          (edu: any) => edu.certificateLevelId === job.jobs.certificateLevel
        );
        if (!hasMatchingCertLevel) {
          return res.status(400).json({ 
            message: 'Your certificate level does not match the requirements for this job'
          });
        }
      }
      
      // Check if already applied
      const existingApplications = await storage.getApplications({ 
        applicantId: profile.id, 
        jobId: parseInt(jobId) 
      });
      
      if (existingApplications.length > 0) {
        return res.status(400).json({ message: 'Already applied for this job' });
      }

      const application = await storage.createApplication({
        jobId: parseInt(jobId),
        applicantId: profile.id,
        status: 'submitted',
        submittedOn: new Date().toISOString().split('T')[0],
        remarks: null,
        interviewDate: null,
        interviewScore: null,
      });

      res.json(application);
    } catch (error) {
      console.error('Error applying for job:', error);
      res.status(500).json({ message: 'Failed to apply for job' });
    }
  });
  // Protected admin routes  
  // Get all applications (admin)
  app.get('/api/admin/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
      const status = req.query.status as string | undefined;      
      const applications = await storage.getApplications({ jobId, status });
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  // Create job (admin)
  app.post('/api/admin/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const jobData = {
        ...req.body,
        createdBy: user.id,
        description: req.body.description || null,
      };

      const job = await storage.createJob(jobData);
      
      res.json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ message: 'Failed to create job' });
    }
  });

  // Update job (admin)
  app.put('/api/admin/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.updateJob(jobId, req.body);
      res.json(job);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ message: 'Failed to update job' });
    }
  });
  //
  // route.ts

app.get("/api/applicant/:id/progress", async (req, res) => {
  const applicantId = Number(req.params.id);
  const progress = await storage.getProgress(applicantId);
  res.json(progress);
});

  // Create notice (admin) - Default published to true
  app.post('/api/admin/notices', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const noticeData = {
        ...req.body,
        createdBy: user.id,
        type: req.body.type || null,
        isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true, // Default to true
        publishedAt: req.body.isPublished !== false ? new Date() : null,
      };

      const notice = await storage.createNotice(noticeData);
      res.json(notice);
    } catch (error) {
      console.error('Error creating notice:', error);
      res.status(500).json({ message: 'Failed to create notice' });
    }
  });

  // Get active subscriptions (admin)
  app.get('/api/admin/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const subscriptions = await storage.getActiveSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  // Get all users for role assignment (admin)
  app.get('/api/admin/all-users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const allUsers = await storage.getAllUsersForRoleAssignment();
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Create board member (admin)
  app.post('/api/admin/board-members', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Validate request body with Zod
      const result = insertBoardMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const boardMemberData = {
        ...result.data,
        order: result.data.order || 0,
      };

      const boardMember = await storage.createBoardMember(boardMemberData);
      res.json(boardMember);
    } catch (error) {
      console.error('Error creating board member:', error);
      res.status(500).json({ message: 'Failed to create board member' });
    }
  });

  // Update board member (admin)
  app.put('/api/admin/board-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const boardMemberId = parseInt(req.params.id);
      if (isNaN(boardMemberId)) {
        return res.status(400).json({ message: 'Invalid board member ID' });
      }

      // Validate request body with Zod
      const result = updateBoardMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const boardMember = await storage.updateBoardMember(boardMemberId, result.data);
      if (!boardMember) {
        return res.status(404).json({ message: 'Board member not found' });
      }

      res.json(boardMember);
    } catch (error) {
      console.error('Error updating board member:', error);
      res.status(500).json({ message: 'Failed to update board member' });
    }
  });

  // Delete board member (admin)
  app.delete('/api/admin/board-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const boardMemberId = parseInt(req.params.id);
      if (isNaN(boardMemberId)) {
        return res.status(400).json({ message: 'Invalid board member ID' });
      }

      const boardMember = await storage.deleteBoardMember(boardMemberId);
      if (!boardMember) {
        return res.status(404).json({ message: 'Board member not found' });
      }

      res.json({ message: 'Board member deleted successfully', boardMember });
    } catch (error) {
      console.error('Error deleting board member:', error);
      res.status(500).json({ message: 'Failed to delete board member' });
    }
  });

  // ===== CAROUSEL SLIDES MANAGEMENT =====
  
  // Get active carousel slides (public)
  app.get('/api/carousel-slides', async (req: any, res) => {
    try {
      const slides = await storage.getCarouselSlides();
      res.json(slides);
    } catch (error) {
      console.error('Error fetching public carousel slides:', error);
      res.status(500).json({ message: 'Failed to fetch carousel slides' });
    }
  });

  // Get all carousel slides (admin)
  app.get('/api/admin/carousel-slides', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const slides = await storage.getCarouselSlides();
      res.json(slides);
    } catch (error) {
      console.error('Error fetching carousel slides:', error);
      res.status(500).json({ message: 'Failed to fetch carousel slides' });
    }
  });

  // Create carousel slide (admin)
  app.post('/api/admin/carousel-slides', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Validate request body with Zod
      const result = insertCarouselSlideSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const slideData = {
        ...result.data,
        createdBy: user.id,
        displayOrder: result.data.displayOrder || 0,
      };

      const slide = await storage.createCarouselSlide(slideData);
      res.json(slide);
    } catch (error) {
      console.log('Error creating carousel slide:', error);
      res.status(500).json({ message: 'Failed to create carousel slide' });
    }
  });

  // Update carousel slide (admin)
  app.put('/api/admin/carousel-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const slideId = parseInt(req.params.id);
      if (isNaN(slideId)) {
        return res.status(400).json({ message: 'Invalid carousel slide ID' });
      }

      // Validate request body with Zod
      const result = updateCarouselSlideSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const slide = await storage.updateCarouselSlide(slideId, result.data);
      if (!slide) {
        return res.status(404).json({ message: 'Carousel slide not found' });
      }

      res.json(slide);
    } catch (error) {
      console.error('Error updating carousel slide:', error);
      res.status(500).json({ message: 'Failed to update carousel slide' });
    }
  });

  // Delete carousel slide (admin)
  app.delete('/api/admin/carousel-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const slideId = parseInt(req.params.id);
      if (isNaN(slideId)) {
        return res.status(400).json({ message: 'Invalid carousel slide ID' });
      }

      const slide = await storage.deleteCarouselSlide(slideId);
      if (!slide) {
        return res.status(404).json({ message: 'Carousel slide not found' });
      }

      res.json({ message: 'Carousel slide deleted successfully', slide });
    } catch (error) {
      console.error('Error deleting carousel slide:', error);
      res.status(500).json({ message: 'Failed to delete carousel slide' });
    }
  });

  // Update gallery item (admin)
  app.put('/api/admin/gallery/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const galleryId = parseInt(req.params.id);
      if (isNaN(galleryId)) {
        return res.status(400).json({ message: 'Invalid gallery item ID' });
      }

      const galleryItem = await storage.updateGalleryItem(galleryId, req.body);
      if (!galleryItem) {
        return res.status(404).json({ message: 'Gallery item not found' });
      }

      res.json(galleryItem);
    } catch (error) {
      console.error('Error updating gallery item:', error);
      res.status(500).json({ message: 'Failed to update gallery item' });
    }
  });

  // Delete gallery item (admin)
  app.delete('/api/admin/gallery/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const galleryId = parseInt(req.params.id);
      if (isNaN(galleryId)) {
        return res.status(400).json({ message: 'Invalid gallery item ID' });
      }

      const galleryItem = await storage.deleteGalleryItem(galleryId);
      res.json(galleryItem);
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      res.status(500).json({ message: 'Failed to delete gallery item' });
    }
  });

  // Update notice (admin)
  app.put('/api/admin/notices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const noticeId = parseInt(req.params.id);
      if (isNaN(noticeId)) {
        return res.status(400).json({ message: 'Invalid notice ID' });
      }

      const notice = await storage.updateNotice(noticeId, req.body);
      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }

      res.json(notice);
    } catch (error) {
      console.error('Error updating notice:', error);
      res.status(500).json({ message: 'Failed to update notice' });
    }
  });

  // Delete notice (admin)
  app.delete('/api/admin/notices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const noticeId = parseInt(req.params.id);
      if (isNaN(noticeId)) {
        return res.status(400).json({ message: 'Invalid notice ID' });
      }

      const notice = await storage.deleteNotice(noticeId);
      res.json(notice);
    } catch (error) {
      console.error('Error deleting notice:', error);
      res.status(500).json({ message: 'Failed to delete notice' });
    }
  });
  // Delete Department (admin)
  app.delete('/api/admin/department:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const deptId = parseInt(req.params.id);
      if (isNaN(deptId)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }

      const department = await storage.deleteDept(deptId);
      res.json(department);
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ message: 'Failed to delete department' });
    }
  });
  // Delete JG (admin)
  app.delete('/api/admin/job-groups:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const jgId = parseInt(req.params.id);
      if (isNaN(jgId)) {
        return res.status(400).json({ message: 'Invalid jg ID' });
      }

      const jg = await storage.deleteJg(jgId);
      res.json(jg);
    } catch (error) {
      console.error('Error deleting jg:', error);
      res.status(500).json({ message: 'Failed to delete jg' });
    }
  });

  // Update FAQ (admin)
  app.put('/api/admin/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const faqId = parseInt(req.params.id);
      if (isNaN(faqId)) {
        return res.status(400).json({ message: 'Invalid FAQ ID' });
      }

      const faq = await storage.updateFaq(faqId, req.body);
      if (!faq) {
        return res.status(404).json({ message: 'FAQ not found' });
      }

      res.json(faq);
    } catch (error) {
      console.error('Error updating FAQ:', error);
      res.status(500).json({ message: 'Failed to update FAQ' });
    }
  });

  // Delete FAQ (admin)
  app.delete('/api/admin/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const faqId = parseInt(req.params.id);
      if (isNaN(faqId)) {
        return res.status(400).json({ message: 'Invalid FAQ ID' });
      }

      const faq = await storage.deleteFaq(faqId);
      res.json(faq);
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      res.status(500).json({ message: 'Failed to delete FAQ' });
    }
  });

  // Get notifications (admin)
  app.get('/api/admin/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Create notification (admin) with validation
  app.post('/api/admin/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Basic validation - schema import needed for full Zod validation
      const requiredFields = ['title', 'message', 'type', 'targetAudience', 'priority'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          errors: missingFields.map(field => ({ field, message: `${field} is required` }))
        });
      }

      // Calculate recipient count based on target audience
      let recipientCount = 0;
      const allUsers = await storage.getAllUsersForRoleAssignment();
      
      switch (req.body.targetAudience) {
        case 'all':
          recipientCount = allUsers.length;
          break;
        case 'applicants':
          recipientCount = allUsers.filter((u: any) => u.role === 'applicant').length;
          break;
        case 'admins':
          recipientCount = allUsers.filter((u: any) => u.role === 'admin').length;
          break;
        case 'board':
          recipientCount = allUsers.filter((u: any) => u.role === 'board').length;
          break;
        default:
          recipientCount = 0;
      }

      const notificationData = {
        ...req.body,
        createdBy: user.id,
        status: req.body.scheduledAt ? 'scheduled' : 'sent',
        sentAt: req.body.scheduledAt ? null : new Date(),
        recipientCount,
        deliveredCount: req.body.scheduledAt ? 0 : recipientCount, // Mark as delivered immediately if not scheduled
      };

      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  // Get notification stats (admin) 
  app.get('/api/admin/notification-stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const stats = await storage.getNotificationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ message: 'Failed to fetch notification stats' });
    }
  });

  // Removed old notification endpoint as it's been replaced with the full implementation above

  // Create county (admin)
  app.post('/api/admin/counties', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const county = await storage.seedCounties(req.body);
      res.json(county);
    } catch (error) {
      console.error('Error creating county:', error);
      res.status(500).json({ message: 'Failed to create county' });
    }
  });

  // Create constituency (admin)
  app.post('/api/admin/constituencies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const constituency = await storage.seedSubCounties({
        ...req.body,
        createdAt: new Date(),
      });
      res.json(constituency);
    } catch (error) {
      console.error('Error creating constituency:', error);
      res.status(500).json({ message: 'Failed to create constituency' });
    }
  });

  // Create ward (admin)
  app.post('/api/admin/wards', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const ward = await storage.seedWard({
        ...req.body,
        createdAt: new Date(),
      });
      res.json(ward);
    } catch (error) {
      console.error('Error creating ward:', error);
      res.status(500).json({ message: 'Failed to create ward' });
    }
  });

  // Create study area (admin)
  app.post('/api/admin/study-areas', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const studyArea = await storage.seedStudy(req.body);
      res.json(studyArea);
    } catch (error) {
      console.error('Error creating study area:', error);
      res.status(500).json({ message: 'Failed to create study area' });
    }
  });

  // Create specialization (admin)
  app.post('/api/admin/specializations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      console.log("Specialized", req.body);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const specialization = await storage.seedSpecialize({
        ...req.body,
        createdAt: new Date(),
      });
      res.json(specialization);
    } catch (error) {
      console.error('Error creating specialization:', error);
      res.status(500).json({ message: 'Failed to create specialization' });
    }
  });

  // Create job group (admin)
  app.post('/api/admin/job-groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const jobGroup = await storage.seedJobGroup(req.body);
      res.json(jobGroup);
    } catch (error) {
      console.error('Error creating job group:', error);
      res.status(500).json({ message: 'Failed to create job group' });
    }
  });
  // Create Department (admin)
  app.post('/api/admin/dept', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const dept = await storage.seedDepartment(req.body);
      res.json(dept);
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({ message: 'Failed to create department' });
    }
  });

  // Create award (admin)
  app.post('/api/admin/awards', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const award = await storage.seedAward(req.body);
      res.json(award);
    } catch (error) {
      console.error('Error creating award:', error);
      res.status(500).json({ message: 'Failed to create award' });
    }
  });

  // Create ethnicity (admin)
  app.post('/api/admin/ethnicity', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
       
      const ethnicity = await storage.seedEthnicity(req.body);
      res.json(ethnicity);
    } catch (error) {
      console.error('Error creating ethnicity:', error);
      res.status(500).json({ message: 'Failed to create ethnicity' });
    }
  });

  // Update county (admin)
  app.put('/api/admin/counties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const county = await storage.updateCounty(id, req.body);
      res.json(county);
    } catch (error) {
      console.error('Error updating county:', error);
      res.status(500).json({ message: 'Failed to update county' });
    }
  });

  // Delete county (admin)
  app.delete('/api/admin/counties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const county = await storage.deleteCounty(id);
      res.json(county);
    } catch (error) {
      console.error('Error deleting county:', error);
      res.status(500).json({ message: 'Failed to delete county' });
    }
  });

  // Update constituency (admin)
  app.put('/api/admin/constituencies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const constituency = await storage.updateConstituency(id, req.body);
      res.json(constituency);
    } catch (error) {
      console.error('Error updating constituency:', error);
      res.status(500).json({ message: 'Failed to update constituency' });
    }
  });

  // Delete constituency (admin)
  app.delete('/api/admin/constituencies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const constituency = await storage.deleteConstituency(id);
      res.json(constituency);
    } catch (error) {
      console.error('Error deleting constituency:', error);
      res.status(500).json({ message: 'Failed to delete constituency' });
    }
  });

  // Update ward (admin)
  app.put('/api/admin/wards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const ward = await storage.updateWard(id, req.body);
      res.json(ward);
    } catch (error) {
      console.error('Error updating ward:', error);
      res.status(500).json({ message: 'Failed to update ward' });
    }
  });

  // Delete ward (admin)
  app.delete('/api/admin/wards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const ward = await storage.deleteWard(id);
      res.json(ward);
    } catch (error) {
      console.error('Error deleting ward:', error);
      res.status(500).json({ message: 'Failed to delete ward' });
    }
  });

  // Update study area (admin)
  app.put('/api/admin/study-areas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const studyArea = await storage.updateStudyArea(id, req.body);
      res.json(studyArea);
    } catch (error) {
      console.error('Error updating study area:', error);
      res.status(500).json({ message: 'Failed to update study area' });
    }
  });

  // Delete study area (admin)
  app.delete('/api/admin/study-areas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const studyArea = await storage.deleteStudyArea(id);
      res.json(studyArea);
    } catch (error) {
      console.error('Error deleting study area:', error);
      res.status(500).json({ message: 'Failed to delete study area' });
    }
  });

  // Update specialization (admin)
  app.put('/api/admin/specializations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const specialization = await storage.updateSpecialization(id, req.body);
      res.json(specialization);
    } catch (error) {
      console.error('Error updating specialization:', error);
      res.status(500).json({ message: 'Failed to update specialization' });
    }
  });

  // Delete specialization (admin)
  app.delete('/api/admin/specializations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const id = parseInt(req.params.id);
      const specialization = await storage.deleteSpecialization(id);
      res.json(specialization);
    } catch (error) {
      console.error('Error deleting specialization:', error);
      res.status(500).json({ message: 'Failed to delete specialization' });
    }
  });

  // SMS Routes
  
  // Get applicants by job and filter for SMS
  app.get('/api/admin/sms-applicants', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { jobId, applicantType } = req.query;
      if (!jobId || !applicantType) {
        return res.status(400).json({ message: 'jobId and applicantType are required' });
      }

      const applicants = await storage.getApplicantsByJobAndType(parseInt(jobId as string), applicantType as string);
      res.json(applicants);
    } catch (error) {
      console.error('Error fetching SMS applicants:', error);
      res.status(500).json({ message: 'Failed to fetch applicants for SMS' });
    }
  });

  // Send SMS to selected applicants
  app.post('/api/admin/send-sms', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { applicantIds, message, jobId, applicantType } = req.body;
      if (!applicantIds || !message || !Array.isArray(applicantIds) || applicantIds.length === 0) {
        return res.status(400).json({ message: 'applicantIds and message are required' });
      }

      const result = await storage.sendSMSToApplicants(applicantIds, message, jobId, applicantType);
      res.json(result);
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Send SMS to staff
  app.post('/api/admin/send-staff-sms', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { staffIds, message } = req.body;
      if (!staffIds || !message || !Array.isArray(staffIds) || staffIds.length === 0) {
        return res.status(400).json({ message: 'staffIds and message are required' });
      }

      const result = await storage.sendSMSToStaff(staffIds, message);
      res.json(result);
    } catch (error) {
      console.error('Error sending staff SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS to staff' });
    }
  });

  // Get staff for SMS
  app.get('/api/admin/staff-list', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const staff = await storage.getStaffForSMS();
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff for SMS:', error);
      res.status(500).json({ message: 'Failed to fetch staff list' });
    }
  });

  // Create FAQ (admin)
  app.post('/api/admin/faqs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const faqs = await storage.createFaqs({
        ...req.body, 
        createdAt: new Date()
      });
      return res.json(faqs);
    } catch (error) {
      console.error('Error creating FAQ:', error);
      res.status(500).json({ message: 'Failed to create FAQ' });
    }
  });

  // Create role assignment (admin)
  app.post('/api/admin/role-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update user role in the database
      const { userId, role } = req.body;
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        id: updatedUser.id,
        userId: updatedUser.id,
        role: updatedUser.role,
        assignedBy: user.id,
        assignedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating role assignment:', error);
      res.status(500).json({ message: 'Failed to create role assignment' });
    }
  });

  // Report routes (admin)
  app.get('/api/admin/reports', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { type, startDate, endDate } = req.query;
      let reportData;

      switch (type) {
        case 'applications':
          reportData = await storage.getApplicationsReport(startDate as string, endDate as string);
          break;
        case 'jobs':
          reportData = await storage.getJobsReport(startDate as string, endDate as string);
          break;
        case 'users':
          reportData = await storage.getUsersReport(startDate as string, endDate as string);
          break;
        case 'performance':
          reportData = await storage.getPerformanceReport(startDate as string, endDate as string);
          break;
        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      res.json(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  // Download report (admin)
  app.get('/api/admin/reports/download', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { type, format, startDate, endDate } = req.query;
      let reportData;

      switch (type) {
        case 'applications':
          reportData = await storage.getApplicationsReport(startDate as string, endDate as string);
          break;
        case 'jobs':
          reportData = await storage.getJobsReport(startDate as string, endDate as string);
          break;
        case 'users':
          reportData = await storage.getUsersReport(startDate as string, endDate as string);
          break;
        case 'performance':
          reportData = await storage.getPerformanceReport(startDate as string, endDate as string);
          break;
        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      if (format === 'csv') {
        // Convert to CSV
        const csvData = convertToCSV(reportData.data, type as string);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        // Return JSON for now (can be extended to PDF)
        res.json(reportData);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({ message: 'Failed to download report' });
    }
  });

  // Protected board committee routes
  
  // Get applications for review (board)
  app.get('/api/board/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      console.log("Fetching applications with jobId:", jobId, "and status:", status);
      
      const applications = await storage.getApplications({ jobId, status });
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  // Update application status (board)
  app.put('/api/board/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applicationId = parseInt(req.params.id);
      const application = await storage.updateApplication(applicationId, req.body);
      res.json(application);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  });

  // Document upload endpoint
  app.post('/api/applicant/documents', isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { type } = req.body;
      if (!type) {
        return res.status(400).json({ message: 'Document type is required' });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'applicant') {
        return res.status(403).json({ message: 'Only applicants can upload documents' });
      }

      // Get the applicant profile to get applicant ID
      const applicantProfile = await storage.getApplicant(userId);
      if (!applicantProfile) {
        return res.status(404).json({ message: 'Applicant profile not found' });
      }
      // Save document to database
      const document = await storage.saveDocument({
        applicantId: applicantProfile.id,
        type,
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      res.json({
        id: document.id,
        type: document.type,
        fileName: document.fileName,
        filePath: document.filePath,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Panel Scoring API Endpoints for Collaborative Board Member Scoring

  // Create or update panel score for an application by a board member
  app.post('/api/board/panel-scores', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { applicationId, academicScore, experienceScore, skillsScore, leadershipScore, generalScore, negativeScore, remarks } = req.body;
      
      // Use user ID as panel ID (each user is a panel member)
      const panelId = parseInt(user.id) || 0;

      // Check if score already exists for this application and panel member
      const existingScore = await storage.getPanelScore(applicationId, panelId);

      let panelScore;
      if (existingScore) {
        // Update existing score
        panelScore = await storage.updatePanelScore(existingScore.scoreId, {
          applicationId,
          panelId,
          academicScore: academicScore || 0,
          experienceScore: experienceScore || 0,
          skillsScore: skillsScore || 0,
          leadershipScore: leadershipScore || 0,
          generalScore: generalScore || 0,
          negativeScore: negativeScore || 0,
          remarks
        });
      } else {
        // Create new score
        panelScore = await storage.createPanelScore({
          applicationId,
          panelId,
          academicScore: academicScore || 0,
          experienceScore: experienceScore || 0,
          skillsScore: skillsScore || 0,
          leadershipScore: leadershipScore || 0,
          generalScore: generalScore || 0,
          negativeScore: negativeScore || 0,
          remarks
        });
      }

      // Get updated average scores
      const averageScores = await storage.getAverageScores(applicationId);

      res.json({ 
        panelScore, 
        averageScores,
        message: 'Score saved successfully' 
      });
    } catch (error) {
      console.error('Error saving panel score:', error);
      res.status(500).json({ message: 'Failed to save panel score' });
    }
  });

  // Get all panel scores for an application (board members only)
  app.get('/api/board/panel-scores/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applicationId = parseInt(req.params.applicationId);
      const scores = await storage.getPanelScores(applicationId);
      const averageScores = await storage.getAverageScores(applicationId);

      res.json({ scores, averageScores });
    } catch (error) {
      console.error('Error fetching panel scores:', error);
      res.status(500).json({ message: 'Failed to fetch panel scores' });
    }
  });

  // Get current user's score for an application
  app.get('/api/board/my-score/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applicationId = parseInt(req.params.applicationId);
      const panelId = parseInt(user.id) || 0;
      const score = await storage.getPanelScore(applicationId, panelId);

      res.json({ score: score || null });
    } catch (error) {
      console.error('Error fetching user score:', error);
      res.status(500).json({ message: 'Failed to fetch user score' });
    }
  });

  // Get average scores for an application (board members only)
  app.get('/api/board/average-scores/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applicationId = parseInt(req.params.applicationId);
      const averageScores = await storage.getAverageScores(applicationId);

      res.json(averageScores);
    } catch (error) {
      console.error('Error fetching average scores:', error);
      res.status(500).json({ message: 'Failed to fetch average scores' });
    }
  });

  // Get scoring statistics (board members only)
  app.get('/api/board/scoring-statistics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applications = await storage.getApplications({ status: 'shortlisted' });
      
      // Get all scored applications count
      let totalScoredApplications = 0;
      let totalScoreSum = 0;
      let activeScorers = new Set();
      let highScores = 0;
      let mediumScores = 0;
      let lowScores = 0;

      for (const application of applications) {
        const scores = await storage.getPanelScores(application.id);
        if (scores.length > 0) {
          totalScoredApplications++;
          
          for (const score of scores) {
            activeScorers.add(score.panelId);
            const totalScore = (score.academicScore || 0) + (score.experienceScore || 0) + 
                             (score.skillsScore || 0) + (score.leadershipScore || 0) + 
                             (score.generalScore || 0) - (score.negativeScore || 0);
            totalScoreSum += totalScore;
            
            if (totalScore >= 80) highScores++;
            else if (totalScore >= 60) mediumScores++;
            else lowScores++;
          }
        }
      }

      const averageScore = totalScoredApplications > 0 ? totalScoreSum / totalScoredApplications : 0;

      res.json({
        totalScoredApplications,
        averageScore,
        activeScorers: activeScorers.size,
        highScores,
        mediumScores,
        lowScores
      });
    } catch (error) {
      console.error('Error fetching scoring statistics:', error);
      res.status(500).json({ message: 'Failed to fetch scoring statistics' });
    }
  });

  // Get interview statistics (board members only)
  app.get('/api/board/interview-statistics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'board') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applications = await storage.getApplications();
      
      const totalInterviews = applications.filter(app => app.interviewDate).length;
      const completedInterviews = applications.filter(app => app.status === 'interviewed').length;
      const scheduledInterviews = applications.filter(app => app.status === 'interview_scheduled').length;
      
      res.json({
        totalInterviews,
        completedInterviews,
        scheduledInterviews
      });
    } catch (error) {
      console.error('Error fetching interview statistics:', error);
      res.status(500).json({ message: 'Failed to fetch interview statistics' });
    }
  });

  // File upload endpoint
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // In production, you would upload to cloud storage (AWS S3, etc.)
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        filename: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
