import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import passport from "passport";
import { sendOtpHandler, verifyOtpHandler } from "../client/src/lib/africastalking-sms";
import { ApplicantService } from "./applicantService";
import { log } from "util";

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
// File upload configuration
const upload = multer({
  dest: 'uploads/',
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
  app.get("/api/auth/me", (req:any, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Decide redirectUrl based on role or other logic
  // --- Get current session user ---
    let redirectUrl = "/"; // default

switch (req.user?.role) {
  case "admin":
    redirectUrl = "/admin";
    break;
  case "applicant":
    redirectUrl = "/dashboard";
    break;
  default:
    redirectUrl = "/";
    break;
}

  res.json({ user: req.user, redirectUrl });
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
  // OTP routes

app.post("/api/auth/send-otp", sendOtpHandler);
app.post("/api/auth/verify-otp", verifyOtpHandler);

  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      // Generate OTP
      const otp = generateOtp();
      
      // Store OTP in database
      await storage.createOtp(phoneNumber, otp);
      
      // Send SMS (in production, use real SMS service)
      const message = `Your TNCPSB verification code is: ${otp}. Valid for 5 minutes.`;
      await sendSms(phoneNumber, message);
      
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
      }

      const isValid = await storage.verifyOtp(phoneNumber, otp);
      
      if (isValid) {
        res.json({ message: 'OTP verified successfully', verified: true });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP', verified: false });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
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

  // Admin gallery management routes
  app.post('/api/admin/gallery', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const galleryItem = await storage.createGalleryItem(req.body);
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
      console.log("Existing Data",existingProfile);
      
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
console.log("Update Data", data);

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

  // Create notice (admin)
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
      };

      const notice = await storage.createNotice(noticeData);
      res.json(notice);
    } catch (error) {
      console.error('Error creating notice:', error);
      res.status(500).json({ message: 'Failed to create notice' });
    }
  });

  // Get notifications (admin)
  app.get('/api/admin/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Return empty array for now - can be implemented later
      res.json([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Send notification (admin)
  app.post('/api/admin/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // For now, just return success - can be implemented with actual notification service
      res.json({ 
        id: Date.now(), 
        ...req.body, 
        status: 'sent',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

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
       
      // For now, return success - ethnicity table may need to be created
      res.json({ 
        id: Date.now(), 
        ...req.body, 
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating ethnicity:', error);
      res.status(500).json({ message: 'Failed to create ethnicity' });
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

      // For now, return success - role assignment logic can be implemented
      res.json({ 
        id: Date.now(), 
        ...req.body, 
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
