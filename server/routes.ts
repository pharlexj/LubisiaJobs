import { sendEmail } from "./lib/email-service";
import { sendSms, sendBulkSms } from "./lib/sms-service";
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import passport, { authenticate } from "passport";
import crypto from "crypto";
import * as fs from "fs";
import {
	sendOtp,
	verifyOtp,
	normalizePhone,
	smsClient,
} from "./lib/africastalking-sms";
import { ApplicantService } from "./applicantService";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boardMembers, carouselSlides } from "@shared/schema";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
// import fs from "fs";
import numberToWords from "number-to-words";
import * as XLSX from "xlsx";

// Board member validation schemas
const insertBoardMemberSchema = createInsertSchema(boardMembers).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

const updateBoardMemberSchema = insertBoardMemberSchema.partial();

// Carousel slides validation schemas
const insertCarouselSlideSchema = createInsertSchema(carouselSlides).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true,
});

const updateCarouselSlideSchema = insertCarouselSlideSchema.partial();

// OTP utility functions
const applicantService = new ApplicantService(storage);
function generateOtp(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}
// Helper function to create audit log
async function createAudit(dialRecordId: number | null, action: string, actorId: string, changes?: any) {
  await storage.createAuditLog({
    dialRecordId,
    action: action as any,
    actorId,
    actorName: "System User",
    changes: changes ? JSON.stringify(changes) : null,
    ipAddress: null,
    userAgent: null,
  });
}
// Legacy SMS function for OTP (kept for backward compatibility)
async function sendSmsOtp(
	phoneNumber: string,
	message: string
): Promise<boolean> {
	const result = await sendSms(phoneNumber, message);
	return result.success;
}
// Document upload storage configuration with extensions preserved
const documentStorage = multer.diskStorage({
	destination: "uploads/",
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, uniqueName);
	},
});

// (moved) SMS balance endpoint will be registered later inside registerRoutes

// Generic file upload config (kept for admin/general use)
const upload = multer({
	storage: documentStorage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// PDF-only upload for applicant certificate uploads
const uploadApplicantPdf = multer({
	storage: documentStorage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowed = ["application/pdf"];
		if (allowed.includes(file.mimetype)) cb(null, true);
		else cb(new Error("Only PDF files are allowed for applicant documents"));
	},
});

// Excel-only upload for employee imports
const uploadEmployeeExcel = multer({
	storage: documentStorage,
	limits: { fileSize: 15 * 1024 * 1024 }, // 15MB for spreadsheets
	fileFilter: (req, file, cb) => {
		const allowed = [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/csv",
		];
		if (allowed.includes(file.mimetype)) cb(null, true);
		else cb(new Error("Invalid file type. Expected Excel or CSV"));
	},
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
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Profile photo must be JPEG or PNG format"));
		}
	},
});

// CSV conversion utility function
function convertToCSV(data: any[], reportType: string): string {
	if (!data || data.length === 0) {
		return "No data available";
	}

	const keys = Object.keys(data[0]);
	const csvHeader = keys.join(",");
	const csvRows = data.map((row) => {
		return keys
			.map((key) => {
				const value = row[key];
				// Handle values that might contain commas, quotes, or newlines
				if (
					typeof value === "string" &&
					(value.includes(",") || value.includes('"') || value.includes("\n"))
				) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			})
			.join(",");
	});

	return [csvHeader, ...csvRows].join("\n");
}

export async function registerRoutes(app: Express): Promise<Server> {
	await setupAuth(app);
	app.use("/uploads", express.static("uploads"));
	// Backwards compatibility: serve uploads under /rms/uploads as well
	app.use("/rms/uploads", express.static("uploads"));

	// SMS balance endpoint (best-effort)
	app.get("/api/sms/balance", isAuthenticated, async (req: any, res: any) => {
		try {
			const bal = await smsClient.getBalance();
			res.json({ balance: bal });
		} catch (err) {
			console.error("Error fetching SMS balance:", err);
			res.json({ balance: null });
		}
	});

	// Profile photo upload endpoint
	app.post(
		"/api/upload/profile-photo",
		profilePhotoUpload.single("profilePhoto"),
		async (req, res) => {
			try {
				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				// Basic validation
				const file = req.file;
				const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
				if (!allowedTypes.includes(file.mimetype)) {
					return res.status(400).json({
						message: "Invalid file type. Only JPEG and PNG are allowed.",
					});
				}

				// Generate file URL
				const fileUrl = `/uploads/profile-photos/${file.filename}`;

				res.json({
					message: "Photo uploaded successfully",
					url: fileUrl,
					filename: file.filename,
				});
			} catch (error) {
				console.error("Error uploading profile photo:", error);
				res.status(500).json({ message: "Failed to upload photo" });
			}
		}
	);

	// --- Signup ---
	app.post(
		"/api/auth/signup",
		profilePhotoUpload.single("profilePhoto"),
		async (req, res) => {
			try {
				const { email, password, surname, phoneNumber, nationalId } = req.body;
				const profilePhoto = req.file ? req.file.filename : "default.jpg";
				const fileUrl = `/uploads/profile-photos/${profilePhoto}`;
				const isValidEmail = await storage.verifyEmail(email);
				if (isValidEmail) {
					return res
						.status(401)
						.json({ message: `Your email ${email} already registered` });
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
					nationalId,
				});
				// Immediately log the user in
				req.login(newUser, (err) => {
					if (err) {
						console.error("Login after signup failed:", err);
						return res
							.status(500)
							.json({ message: "Failed to login after signup" });
					}
					res.status(201).json({ user: newUser });
				});
			} catch (err: any) {
				console.error("Signup error:", err);
				res.status(500).json({ message: err.message || "Signup failed" });
			}
		}
	);
	// Update Profile
	app.patch(
		"/api/users/update-profile",
		profilePhotoUpload.single("profilePhoto"),
		async (req: any, res) => {
			try {
				const { email, password, phoneNumber } = req.body;
				const profilePhoto = req.file ? req.file.filename : "avatar.jpg";
				const fileUrl = `/uploads/profile-photos/${profilePhoto}`;
				const hashedPassword = await bcrypt.hash(password, 10);
				const newUser = await storage.upsertUser({
					password: hashedPassword,
					passwordHash: hashedPassword,
					phoneNumber: phoneNumber ?? req?.user?.phoneNumber,
					profileImageUrl: fileUrl,
					email: email ?? req?.user?.email,
				});
				res.status(201).json({ user: newUser });
			} catch (err: any) {
				console.error("Profile Setup error:", err);
				res
					.status(500)
					.json({ message: err.message || "Profile Setting failed" });
			}
		}
	);
	// --- Login ---
	app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
		res.json({ user: req.user });
	});

	// --- Logout ---
	app.post("/api/auth/logout", (req, res) => {
		req.logout(() => {
			res.json({ message: "Logged out" });
		});
	});

	app.get("/api/auth/me", async (req: any, res) => {
		if (!req.user) {
			return res.status(401).json({ message: "Not authenticated" });
		}
		const phone = normalizePhone(req.user.phoneNumber);
		// Decide redirectUrl based on role or other logic
		// --- Get current session user ---
		let redirectUrl = "/";
		let applicantProfile = null;
		let verifiedPhone = null;

		switch (req.user?.role) {
			case "admin":
				redirectUrl = "/admin";
				break;
			case "board":
				redirectUrl = "/board";
				break;
			case "accountant":
				redirectUrl = "/accountant";
				break;
			case "a.i.e Holder":
				redirectUrl = "/aie";
				break;
			case "recordsOfficer":
				redirectUrl = "/rms/records-officer";
				break;
			case "boardSecretary":
				redirectUrl = "/rms/board-secretary";
				break;
			case "boardChair":
				redirectUrl = "/rms/board-chair";
				break;
			case "chiefOfficer":
				redirectUrl = "/rms/chief-officer";
				break;
			case "boardCommittee":
				redirectUrl = "/rms/board-committee";
				break;
			case "HR":
				redirectUrl = "/rms/hr";
				break;
			case "records":
				redirectUrl = "/records";
				break;
			case "procurement":
				redirectUrl = "/procurement";
				break;
			case "hod":
				redirectUrl = "/hod";
				break;
			case "applicant":
				redirectUrl = "/dashboard";
				applicantProfile = await storage.getApplicant(req.user?.id);
				verifiedPhone = await storage.getVerifiedPhone(phone);
				if (!verifiedPhone?.verified) {
					return res.status(403).json({
						status: "phone_verification_required",
						message: "Phone number not verified.",
						instructions:
							"Please enter the 6-digit code sent to your phone. If you did not receive it, you can resend the code.",
						phoneNumber:
							verifiedPhone?.phoneNumber || req.user?.phoneNumber || null,
						resendCodeEndpoint: "/api/auth/send-otp",
						enterCodeAt: "/auth/otp",
					});
				}
				break;
			default:
				redirectUrl = "/";
				break;
		}

		res.json({ user: req.user, redirectUrl, applicantProfile, verifiedPhone });
	});
	// Employee verification routes
	app.post("/api/employee/verify", async (req: any, res) => {
		try {
			const { personalNumber, idNumber } = req.body;
			const userId = req.user.id;
			if (!personalNumber || !idNumber) {
				return res
					.status(400)
					.json({ message: "Personal number and ID number are required" });
			}
			const applicantData = await storage.getApplicant(userId);
			// Check if employee exists with matching personal number and ID
			const employee = await storage.verifyEmployee(personalNumber, idNumber);

			if (!employee) {
				return res
					.status(404)
					.json({ message: "Employee not found or ID number does not match" });
			}
			await storage.updateApplicant(
				applicantData.id,
				{ isEmployee: true },
				1.5
			);
			return res.json({
				message: "Employee verified successfully",
				employee: {
					personalNumber: employee.personalNumber,
					designation: employee.designation,
				},
			});
		} catch (error) {
			console.error("Error verifying employee:", error);
			return res.status(500).json({ message: "Failed to verify employee" });
		}
	});

	app.post("/api/employee/details", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.id;
			const employeeData = req.body;
			const applicantId = await applicantService.resolveApplicantId(userId);

			// Get applicant profile first
			const applicant = await storage.getApplicantById(applicantId);
			if (!applicant) {
				return res.status(404).json({ message: "Applicant profile not found" });
			}

			// Create or update employee record
			const employee = await storage.upsertEmployeeDetails(
				applicantId,
				employeeData
			);

			res.json({
				message: "Employee details saved successfully",
				employee,
			});
		} catch (error) {
			console.error("Error saving employee details:", error);
			res.status(500).json({ message: "Failed to save employee details" });
		}
	});
	// OTP routes using AfricaTalking SMS service
	// Server-side OTP routes with proper validation and security
	app.post("/api/auth/send-otp", async (req: any, res) => {
		try {
			const { phoneNumber, purpose = "authentication" } = req.body;

			if (!phoneNumber || typeof phoneNumber !== "string") {
				return res
					.status(400)
					.json({ success: false, message: "Phone number is required" });
			}

			const validPurposes = [
				"authentication",
				"password-reset",
				"phone-verification",
			];
			if (!validPurposes.includes(purpose)) {
				return res
					.status(400)
					.json({ success: false, message: "Invalid purpose specified" });
			}

			const clientIP = req.ip || req.connection.remoteAddress;

			// call your lib sendOtp — ensure it handles normalization internally
			try {
				await sendOtp({
					to: phoneNumber,
					template: `Your ${purpose} code is {{CODE}}. Valid for 10 minutes. Do not share this code with anyone.`,
				});
			} catch (err) {
				// log detailed for debugging
				console.error("sendOtp() failed for", phoneNumber, err);
				return res.status(500).json({
					success: false,
					message: "Failed to send verification code",
				});
			}
			res.json({
				success: true,
				message: "Verification code sent successfully",
			});
		} catch (error: any) {
			console.error("Send OTP error:", error);
			res.status(500).json({
				success: false,
				message: error.message || "Failed to send verification code",
			});
		}
	});

	app.post("/api/auth/send-otp", async (req: any, res) => {
		try {
			const { phoneNumber, purpose = "authentication" } = req.body;

			// Validate input
			if (!phoneNumber || typeof phoneNumber !== "string") {
				return res.status(400).json({
					success: false,
					message: "Phone number is required",
				});
			}

			// Additional validation can be added here (e.g., purpose validation)
			const validPurposes = [
				"authentication",
				"password-reset",
				"phone-verification",
			];
			if (!validPurposes.includes(purpose)) {
				return res.status(400).json({
					success: false,
					message: "Invalid purpose specified",
				});
			}

			// Rate limiting by IP could be added here
			const clientIP = req.ip || req.connection.remoteAddress;

			await sendOtp({
				to: phoneNumber,
				template: `Your ${purpose} code is {{CODE}}. Valid for 10 minutes. Do not share this code with anyone.`,
			});
			res.json({
				success: true,
				message: "Verification code sent successfully",
			});
		} catch (error: any) {
			console.error("Send OTP error:", error);
			res.status(500).json({
				success: false,
				message: error.message || "Failed to send verification code",
			});
		}
	});
	// Verify OTP endpoint
	app.post("/api/auth/verify-otp", async (req: any, res) => {
		try {
			const { phoneNumber, otp } = req.body;

			// Validate input
			if (!phoneNumber || typeof phoneNumber !== "string") {
				return res.status(400).json({
					success: false,
					message: "Phone number is required",
				});
			}

			if (!otp || typeof otp !== "string") {
				return res.status(400).json({
					success: false,
					message: "Verification code is required",
				});
			}
			const normalized = normalizePhone(phoneNumber);

			// Verify OTP
			const isValid = await verifyOtp({
				to: normalized,
				otp: otp.trim(),
			});

			if (!isValid) {
				const clientIP = req.ip || req.connection.remoteAddress;
				console.log(
					`Failed OTP verification for ${phoneNumber} from IP ${clientIP}`
				);
				return res.status(400).json({
					success: false,
					status: "invalid_otp",
					message: "Invalid or expired OTP code.",
				});
			}
			res.json({
				success: true,
				message: "Code verified successfully",
			});
		} catch (error: any) {
			console.error("Verify OTP error:", error);
			res.status(500).json({
				success: false,
				message: error.message || "Failed to verify code",
			});
		}
	});

	// Auth routes
	app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.id;
			const user = await storage.getUser(userId);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			// Get applicant profile if user is an applicant
			let applicantProfile = null;
			if (user.role === "applicant") {
				applicantProfile = await storage.getApplicant(userId);
			}

			// Determine redirect URL based on role and profile completion
			let redirectUrl = "/";
			if (user.role === "applicant") {
				if (!applicantProfile) {
					redirectUrl = "/profile?step=1&reason=complete_profile";
				} else if ((applicantProfile.profileCompletionPercentage || 0) < 100) {
					redirectUrl = "/profile?step=2&reason=incomplete_profile";
				} else {
					redirectUrl = "/dashboard";
				}
			} else if (user.role === "admin") {
				redirectUrl = "/admin";
			} else if (user.role === "board") {
				redirectUrl = "/board";
			} else if (user.role === "accountant") {
				redirectUrl = "/accountant";
			} else if (user.role === "a.i.e Holder") {
				redirectUrl = "/aie";
			} else if (user.role === "recordsOfficer") {
				redirectUrl = "/rms/records-officer";
			} else if (user.role === "boardSecretary") {
				redirectUrl = "/rms/board-secretary";
			} else if (user.role === "boardChair") {
				redirectUrl = "/rms/board-chair";
			} else if (user.role === "chiefOfficer") {
				redirectUrl = "/rms/chief-officer";
			} else if (user.role === "boardCommittee") {
				redirectUrl = "/rms/board-committee";
			} else if (user.role === "HR") {
				redirectUrl = "/rms/hr";
			} else if (user.role === "records") {
				redirectUrl = "/records";
			} else if (user.role === "procurement") {
				redirectUrl = "/procurement";
			} else if (user.role === "hod") {
				redirectUrl = "/hod";
			}

			res.json({ ...user, applicantProfile, redirectUrl });
		} catch (error) {
			console.error("Error fetching user:", error);
			res.status(500).json({ message: "Failed to fetch user" });
		}
	});

	// Public routes (no authentication required)

	// Get all counties for location dropdowns
	app.get("/api/public/counties", async (req, res) => {
		try {
			const counties = await storage.getCounties();
			res.json(counties);
		} catch (error) {
			console.error("Error fetching counties:", error);
			res.status(500).json({ message: "Failed to fetch counties" });
		}
	});

	// Get constituencies by county
	app.get("/api/public/constituencies/:countyId", async (req, res) => {
		try {
			const countyId = parseInt(req.params.countyId);
			const constituencies = await storage.getConstituenciesByCounty(countyId);
			res.json(constituencies);
		} catch (error) {
			console.error("Error fetching constituencies:", error);
			res.status(500).json({ message: "Failed to fetch constituencies" });
		}
	});

	// Get wards by constituency
	app.get("/api/public/wards/:constituencyId", async (req, res) => {
		try {
			const constituencyId = parseInt(req.params.constituencyId);
			const wards = await storage.getWardsByConstituency(constituencyId);
			res.json(wards);
		} catch (error) {
			console.error("Error fetching wards:", error);
			res.status(500).json({ message: "Failed to fetch wards" });
		}
	});

	// Get published notices
	app.get("/api/public/notices", async (req, res) => {
		try {
			const notices = await storage.getNotices(true);
			res.json(notices);
		} catch (error) {
			console.error("Error fetching notices:", error);
			res.status(500).json({ message: "Failed to fetch notices" });
		}
	});

	// Subscribe to notice notifications
	app.post("/api/public/subscribe", async (req, res) => {
		try {
			// Validate request body using Zod
			const subscriptionSchema = z.object({
				email: z.string().email("Invalid email address"),
				notificationTypes: z.string().default("all"),
			});

			const validatedData = subscriptionSchema.parse(req.body);
			const { email, notificationTypes } = validatedData;

			if (!email) {
				return res.status(400).json({ message: "Email address is required" });
			}

			// Check if email is already subscribed
			const existingSubscription = await storage.getSubscription(email);
			if (existingSubscription && existingSubscription.isActive) {
				return res.status(409).json({ message: "Email is already subscribed" });
			}

			// Generate unique subscription token
			const subscriptionToken = `${Date.now()}-${Math.random()
				.toString(36)
				.substr(2, 9)}`;

			const subscriptionData = {
				email,
				subscriptionToken,
				notificationTypes:
					typeof notificationTypes === "string"
						? notificationTypes
						: JSON.stringify(notificationTypes),
				isActive: true,
				lastNotifiedAt: null,
				unsubscribedAt: null,
			};

			const subscription = await storage.createSubscription(subscriptionData);
			res.status(201).json({
				message: "Successfully subscribed to notice notifications",
				subscription: {
					email: subscription.email,
					subscribedAt: subscription.subscribedAt,
				},
			});
		} catch (error) {
			console.error("Error creating subscription:", error);
			if (error instanceof z.ZodError) {
				return res.status(400).json({
					message: "Invalid request data",
					errors: error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				});
			}
			res.status(500).json({ message: "Failed to subscribe" });
		}
	});

	// Unsubscribe from notice notifications
	app.post("/api/public/unsubscribe", async (req, res) => {
		try {
			// Validate request body using Zod
			const unsubscribeSchema = z.object({
				token: z.string().min(1, "Subscription token is required"),
			});

			const validatedData = unsubscribeSchema.parse(req.body);
			const { token } = validatedData;

			const success = await storage.unsubscribeEmail(token);
			if (success) {
				res.json({
					message: "Successfully unsubscribed from notice notifications",
				});
			} else {
				res
					.status(404)
					.json({ message: "Subscription not found or already inactive" });
			}
		} catch (error) {
			console.error("Error unsubscribing:", error);
			if (error instanceof z.ZodError) {
				return res.status(400).json({
					message: "Invalid request data",
					errors: error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				});
			}
			res.status(500).json({ message: "Failed to unsubscribe" });
		}
	});

	// Public study areas (for job requirements)
	app.get("/api/public/study-areas", async (req, res) => {
		try {
			const studyAreas = await storage.getStudyArea();
			res.json(studyAreas);
		} catch (error) {
			console.error("Error fetching study areas:", error);
			res.status(500).json({ message: "Failed to fetch study areas" });
		}
	});

	// Public certificate levels (for job requirements)
	app.get("/api/public/certificate-levels", async (req, res) => {
		try {
			const certLevels = await storage.getCertLevel();
			res.json(certLevels);
		} catch (error) {
			console.error("Error fetching certificate levels:", error);
			res.status(500).json({ message: "Failed to fetch certificate levels" });
		}
	});
	app.get("/api/public/faqs", async (req, res) => {
		try {
			const faq = await storage.getFaq();
			res.json(faq);
		} catch (error) {
			console.error("Error fetching faq:", error);
			res.status(500).json({ message: "Failed to fetch faq" });
		}
	});

	// Get gallery items
	app.get("/api/public/gallery", async (req, res) => {
		try {
			const gallery = await storage.getGalleryItems();
			res.json(gallery);
		} catch (error) {
			console.error("Error fetching gallery:", error);
			res.status(500).json({ message: "Failed to fetch gallery" });
		}
	});

	// Get system configuration
	app.get("/api/public/system-config", async (req, res) => {
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
			console.error("Error fetching system config:", error);
			res.status(500).json({ message: "Failed to fetch system config" });
		}
	});

	// Get board members
	app.get("/api/public/board-members", async (req, res) => {
		try {
			const boardMembers = await storage.getBoardMembers();
			res.json(boardMembers);
		} catch (error) {
			console.error("Error fetching board members:", error);
			res.status(500).json({ message: "Failed to fetch board members" });
		}
	});

	// Admin system configuration routes
	app.post(
		"/api/admin/system-config",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const config = await storage.upsertSystemConfig(req.body);
				res.json(config);
			} catch (error) {
				console.error("Error creating system config:", error);
				res.status(500).json({ message: "Failed to create system config" });
			}
		}
	);

	// Update system configuration (admin)
	app.put(
		"/api/admin/system-config/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const config = await storage.upsertSystemConfig(req.body);
				res.json(config);
			} catch (error) {
				console.error("Error updating system config:", error);
				res.status(500).json({ message: "Failed to update system config" });
			}
		}
	);

	// Delete system configuration (admin)
	app.delete(
		"/api/admin/system-config",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { section, key } = req.query;
				if (!section || !key) {
					return res
						.status(400)
						.json({ message: "Section and key are required" });
				}

				const result = await storage.deleteSystemConfig(
					section as string,
					key as string
				);
				res.json({
					message: "System configuration deleted successfully",
					result,
				});
			} catch (error) {
				console.error("Error deleting system config:", error);
				res.status(500).json({ message: "Failed to delete system config" });
			}
		}
	);

	// Admin gallery management routes
	app.post("/api/admin/gallery", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const galleryItem = await storage.createGalleryItem({
				...req.body,
				createdBy: user.id,
			});
			res.json(galleryItem);
		} catch (error) {
			console.error("Error creating gallery item:", error);
			res.status(500).json({ message: "Failed to create gallery item" });
		}
	});

	// Get user permissions and navigation based on role
	app.get("/api/auth/permissions", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			let permissions: string[] = [];
			let navigation: any[] = [];

			switch (user.role) {
				case "admin":
					permissions = [
						"admin.dashboard.view",
						"admin.jobs.manage",
						"admin.applications.view",
						"admin.applications.update",
						"admin.reports.view",
						"admin.notifications.send",
						"admin.settings.manage",
						"admin.users.manage",
					];
					navigation = [
						{
							href: "/admin",
							icon: "LayoutDashboard",
							label: "Dashboard",
							description: "Admin overview",
						},
						{
							href: "/admin/jobs",
							icon: "Briefcase",
							label: "Job Management",
							description: "Create & manage jobs",
						},
						{
							href: "/admin/applications",
							icon: "Users",
							label: "Applications",
							description: "Review applications",
						},
						{
							href: "/admin/reports",
							icon: "BarChart3",
							label: "Reports",
							description: "Generate reports",
						},
						{
							href: "/admin/notifications",
							icon: "Bell",
							label: "Notifications",
							description: "Send notifications",
						},
						{
							href: "/admin/settings",
							icon: "Settings",
							label: "System Config",
							description: "System settings",
						},
					];
					break;

				case "board":
					permissions = [
						"board.dashboard.view",
						"board.shortlisting.manage",
						"board.interviews.manage",
						"board.scoring.manage",
						"board.reports.view",
					];
					navigation = [
						{
							href: "/board",
							icon: "LayoutDashboard",
							label: "Dashboard",
							description: "Committee overview",
						},
						{
							href: "/board/shortlisting",
							icon: "CheckCircle",
							label: "Shortlisting",
							description: "Review & shortlist",
						},
						{
							href: "/board/interviews",
							icon: "Calendar",
							label: "Interviews",
							description: "Schedule & conduct",
						},
						{
							href: "/board/reports",
							icon: "BarChart3",
							label: "Reports",
							description: "Selection reports",
						},
					];
					break;

				case "applicant":
					permissions = [
						"applicant.dashboard.view",
						"applicant.profile.manage",
						"applicant.applications.view",
						"applicant.applications.create",
						"applicant.documents.upload",
						"jobs.public.view",
					];
					navigation = [
						{
							href: "/dashboard",
							icon: "LayoutDashboard",
							label: "Dashboard",
							description: "Overview and stats",
						},
						{
							href: "/profile",
							icon: "User",
							label: "Profile",
							description: "Complete your profile",
						},
						{
							href: "/applications",
							icon: "FileText",
							label: "My Applications",
							description: "Track applications",
						},
						{
							href: "/jobs",
							icon: "Search",
							label: "Browse Jobs",
							description: "Find opportunities",
						},
						{
							href: "/documents",
							icon: "Upload",
							label: "Documents",
							description: "Upload certificates",
						},
					];
					break;

				default:
					permissions = ["jobs.public.view"];
					navigation = [];
			}

			// Determine redirect URL based on role
			let redirectUrl = "/";
			switch (user.role) {
				case "admin":
					redirectUrl = "/admin";
					break;
				case "board":
					redirectUrl = "/board";
					break;
				case "accountant":
					redirectUrl = "/accountant";
					break;
				case "a.i.e Holder":
					redirectUrl = "/aie";
					break;
				case "recordsOfficer":
					redirectUrl = "/rms/records-officer";
					break;
				case "boardSecretary":
					redirectUrl = "/rms/board-secretary";
					break;
				case "boardChair":
					redirectUrl = "/rms/board-chair";
					break;
				case "chiefOfficer":
					redirectUrl = "/rms/chief-officer";
					break;
				case "boardCommittee":
					redirectUrl = "/rms/board-committee";
					break;
				case "HR":
					redirectUrl = "/rms/hr";
					break;
				case "records":
					redirectUrl = "/records";
					break;
				case "procurement":
					redirectUrl = "/procurement";
					break;
				case "hod":
					redirectUrl = "/hod";
					break;
				case "applicant":
					redirectUrl = "/dashboard";
					break;
				default:
					redirectUrl = "/";
			}

			res.json({
				role: user.role,
				permissions,
				navigation,
				redirectUrl,
			});
		} catch (error) {
			console.error("Error fetching user permissions:", error);
			res.status(500).json({ message: "Failed to fetch permissions" });
		}
	});
	// Get available roles (for admin role management)
	app.get("/api/admin/roles", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const roles = [
				{
					value: "applicant",
					label: "Applicant",
					description: "Job application and profile management",
				},
				{
					value: "admin",
					label: "Administrator",
					description: "Full system access and management",
				},
				{
					value: "board",
					label: "Board Member",
					description: "Interview and selection management",
				},
				{
					value: "accountant",
					label: "Accountant",
					description: "Financial management and accounting",
				},
				{
					value: "records",
					label: "Records Officer",
					description: "Records management and filing",
				},
				{
					value: "procurement",
					label: "Procurement Officer",
					description: "Procurement and purchasing",
				},
				{
					value: "hod",
					label: "Head of Department",
					description: "Department management and oversight",
				},
				{
					value: "a.i.e Holder",
					label: "A.I.E Holder",
					description: "Accounting and imprest expenditure approval",
				},
				{
					value: "recordsOfficer",
					label: "RMS Records Officer",
					description: "Document intake and dispatch",
				},
				{
					value: "boardSecretary",
					label: "Board Secretary",
					description: "Board document review and management",
				},
				{
					value: "chiefOfficer",
					label: "Chief Officer",
					description: "Decision oversight and input",
				},
				{
					value: "boardChair",
					label: "Board Chairperson",
					description: "Board leadership and final review",
				},
				{
					value: "boardCommittee",
					label: "Board Committee",
					description: "Collaborative board review",
				},
				{
					value: "HR",
					label: "HR Office",
					description: "Agenda management and filing",
				},
			];

			res.json(roles);
		} catch (error) {
			console.error("Error fetching roles:", error);
			res.status(500).json({ message: "Failed to fetch roles" });
		}
	});

	// Get active jobs
	app.get("/api/public/jobs", async (req, res) => {
		try {
			const departmentId = req.query.departmentId
				? parseInt(req.query.departmentId as string)
				: undefined;
			const jobs = await storage.getJobs({ isActive: true, departmentId });
			res.json(jobs);
		} catch (error) {
			console.error("Error fetching jobs:", error);
			res.status(500).json({ message: "Failed to fetch jobs" });
		}
	});

	// Get system configuration data
	app.get("/api/public/config", async (req: any, res) => {
		try {
			const [
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
			});
		} catch (error) {
			console.error("Error fetching config:", error);
			res.status(500).json({
				message: "Failed to fetch configuration",
				error: (error as Error).message,
			});
		}
	});
	// Protected applicant routes
	// Create applicant profile
	app.post("/api/applicant/profile", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.id;
			const { applicantId, data } = req.body;
			const user = await storage.getUser(userId);

			if (!user || user.role !== "applicant") {
				return res.status(403).json({ message: "Access denied" });
			}

			// Check if profile already exists
			const existingProfile = await storage.getApplicant(userId);
			if (existingProfile.applicantId) {
				const updateProfile = await applicantService.updateBasicInfo(
					applicantId,
					data
				);
				return res.json(updateProfile);
			}
			const profileData = {
				userId,
				...req.body.data,
			};
			const profile = await storage.createApplicant(profileData);
			res.json(profile);
		} catch (error) {
			console.error("Error creating profile:", error);
			res.status(500).json({ message: "Failed to create profile" });
		}
	});
	// Update all other components of the stepwises

	app.patch("/api/applicant/profile", isAuthenticated, async (req, res) => {
		try {
			const { applicantId, step, data } = req.body;
			if (!applicantId) {
				return res.status(400).json({ error: "Applicant ID missing" });
			}
			const updatedProfile = await storage.updateApplicant(
				applicantId,
				data,
				step
			);
			res.json(updatedProfile);
		} catch (err) {
			console.error("Failed to update applicant:", err);
			res.status(500).json({ error: "Failed to update applicant profile" });
		}
	});
	// Mark phone as verified after OTP verification
	app.post(
		"/api/applicant/verify-phone",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const userId = req.user.id;
				const user = await storage.getUser(userId);

				if (!user || user.role !== "applicant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const profile = await storage.getApplicant(userId);
				if (!profile) {
					return res.status(404).json({ message: "Profile not found" });
				}

				const { phoneNumber } = req.body;

				// Update phone verification status
				const updatedProfile = await storage.updateApplicant(
					profile.id,
					{
						phoneVerified: true,
						phoneNumber,
					},
					1
				);

				res.json(updatedProfile);
			} catch (error) {
				console.error("Error verifying phone:", error);
				res.status(500).json({ message: "Failed to verify phone" });
			}
		}
	);

	// Get applicant's applications
	app.get(
		"/api/applicant/applications",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const userId = req.user.id;
				const user = await storage.getUser(userId);

				if (!user || user.role !== "applicant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const profile = await storage.getApplicant(userId);
				if (!profile) {
					return res.status(404).json({ message: "Profile not found" });
				}

				const applications = await storage.getApplications({
					applicantId: profile.id,
				});
				res.json(applications);
			} catch (error) {
				console.error("Error fetching applications:", error);
				res.status(500).json({ message: "Failed to fetch applications" });
			}
		}
	);
	app.get("/api/applicant/profile", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.id;
			const user = await storage.getUser(userId);

			if (!user || user.role !== "applicant") {
				return res.status(403).json({ message: "Access denied" });
			}

			const profile = await storage.getApplicant(userId);
			if (!profile) {
				return res.status(404).json({ message: "Profile not found" });
			}
			res.json(profile);
		} catch (error) {
			console.error("Error fetching applications:", error);
			res.status(500).json({ message: "Failed to fetch applications" });
		}
	});

	// Apply for a job
	app.post("/api/applicant/apply", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.id;
			const user = await storage.getUser(userId);

			if (!user || user.role !== "applicant") {
				return res.status(403).json({ message: "Access denied" });
			}

			const profile = await storage.getApplicant(userId);
			if (!profile) {
				return res.status(404).json({ message: "Profile not found" });
			}

			const { jobId } = req.body;

			// Get detailed applicant profile with completion data
			const applicant = await storage.getApplicantById(profile.id);
			if (!applicant) {
				return res.status(404).json({ message: "Applicant profile not found" });
			}

			// Get job details with requirements
			const job = await storage.getJob(parseInt(jobId));
			if (!job) {
				return res.status(404).json({ message: "Job not found" });
			}

			// ✅ Eligibility Check 1: Profile must be 100% complete
			if (applicant.profileCompletionPercentage < 100) {
				return res.status(400).json({
					message: "Profile must be 100% complete to apply for jobs",
					currentCompletion: applicant.profileCompletionPercentage,
				});
			}

			// ✅ Eligibility Check 2: Must have exactly 3 referees
			if (!applicant.referees || applicant.referees.length !== 3) {
				return res.status(400).json({
					message: "You must have exactly 3 referees to apply for jobs",
					currentReferees: applicant.referees?.length || 0,
				});
			}

			// ✅ Eligibility Check 3: Study area & specialization
			if (job.jobs?.requiredStudyAreaId) {
				const hasMatchingStudyArea = applicant.education?.some(
					(edu: any) =>
						Number(edu.specialization?.studyAreaId || edu.studyAreaId) ===
						job.jobs.requiredStudyAreaId
				);

				if (!hasMatchingStudyArea) {
					return res.status(400).json({
						message:
							"Your educational background does not match the required study area for this job",
					});
				}
			}

			// ✅ Eligibility Check 3.1: Specializations (if job requires specific ones)
			if (job.jobs?.requiredSpecializationIds?.length > 0) {
				const hasMatchingSpec = applicant.education?.some((edu: any) =>
					job.jobs.requiredSpecializationIds.includes(
						Number(edu.specializationId)
					)
				);

				if (!hasMatchingSpec) {
					return res.status(400).json({
						message:
							"Your specialization does not meet the requirements for this job",
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
						message:
							"Your certificate level does not match the requirements for this job",
					});
				}
			}

			// Check if already applied
			const existingApplications = await storage.getApplications({
				applicantId: profile.id,
				jobId: parseInt(jobId),
			});

			if (existingApplications.length > 0) {
				return res
					.status(400)
					.json({ message: "Already applied for this job" });
			}

			const application = await storage.createApplication({
				jobId: parseInt(jobId),
				applicantId: profile.id,
				status: "submitted",
				submittedOn: new Date().toISOString().split("T")[0],
				remarks: null,
				interviewDate: null,
				interviewTime: null,
				interviewVenue: null,
				interviewDuration: null,
				interviewScore: null,
				shortlistedAt: null,
				hiredAt: null,
				shortlistSmsSent: false,
				hireSmsSent: false,
			});

			res.json(application);
		} catch (error) {
			console.error("Error applying for job:", error);
			res.status(500).json({ message: "Failed to apply for job" });
		}
	});
	// Protected admin (routes)
	// Get all applications (admin)
	// This route allows admin and board ('applications/users.tsx') to ('view.tsx') all (job applications)
	app.get("/api/admin/applications", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || (user.role !== "admin" && user.role !== "board")) {
				return res.status(403).json({ message: "Access denied" });
			}
			const jobId = req.query.jobId
				? parseInt(req.query.jobId as string)
				: undefined;
			const status = req.query.status as string | undefined;
			const applications = await storage.getApplications({ jobId, status });
			res.json(applications);
		} catch (error) {
			console.error("Error fetching applications:", error);
			res.status(500).json({ message: "Failed to fetch applications" });
		}
	});

	// Create job (admin)
	app.post("/api/admin/jobs", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}
			const jobData = {
				...req.body,
				createdBy: user.id,
				description: req.body.description || null,
			};

			const job = await storage.createJob(jobData);

			res.json(job);
		} catch (error) {
			console.error("Error creating job:", error);
			res.status(500).json({ message: "Failed to create job" });
		}
	});

	// Update job (admin)
	app.put("/api/admin/jobs/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const jobId = parseInt(req.params.id);
			const job = await storage.updateJob(jobId, req.body);
			res.json(job);
		} catch (error) {
			console.error("Error updating job:", error);
			res.status(500).json({ message: "Failed to update job" });
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
	app.post("/api/admin/notices", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const noticeData = {
				...req.body,
				createdBy: user.id,
				type: req.body.type || null,
				isPublished:
					req.body.isPublished !== undefined ? req.body.isPublished : true, // Default to true
				publishedAt: req.body.isPublished !== false ? new Date() : null,
			};

			const notice = await storage.createNotice(noticeData);
			res.json(notice);
		} catch (error) {
			console.error("Error creating notice:", error);
			res.status(500).json({ message: "Failed to create notice" });
		}
	});

	// Get active subscriptions (admin)
	app.get(
		"/api/admin/subscriptions",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const subscriptions = await storage.getActiveSubscriptions();
				res.json(subscriptions);
			} catch (error) {
				console.error("Error fetching subscriptions:", error);
				res.status(500).json({ message: "Failed to fetch subscriptions" });
			}
		}
	);

	// Get all users for role assignment (admin)
	app.get("/api/admin/all-users", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const allUsers = await storage.getAllUsersForRoleAssignment();
			res.json(allUsers);
		} catch (error) {
			console.error("Error fetching all users:", error);
			res.status(500).json({ message: "Failed to fetch users" });
		}
	});

	// Create board member (admin)
	app.post(
		"/api/admin/board-members",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				// Validate request body with Zod
				const result = insertBoardMemberSchema.safeParse(req.body);
				if (!result.success) {
					return res.status(400).json({
						message: "Validation failed",
						errors: result.error.errors.map((err) => ({
							field: err.path.join("."),
							message: err.message,
						})),
					});
				}

				const boardMemberData = {
					...result.data,
					order: result.data.order || 0,
				};

				const boardMember = await storage.createBoardMember(boardMemberData);
				res.json(boardMember);
			} catch (error) {
				console.error("Error creating board member:", error);
				res.status(500).json({ message: "Failed to create board member" });
			}
		}
	);

	// Update board member (admin)
	app.put(
		"/api/admin/board-members/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const boardMemberId = parseInt(req.params.id);
				if (isNaN(boardMemberId)) {
					return res.status(400).json({ message: "Invalid board member ID" });
				}

				// Validate request body with Zod
				const result = updateBoardMemberSchema.safeParse(req.body);
				if (!result.success) {
					return res.status(400).json({
						message: "Validation failed",
						errors: result.error.errors.map((err) => ({
							field: err.path.join("."),
							message: err.message,
						})),
					});
				}

				const boardMember = await storage.updateBoardMember(
					boardMemberId,
					result.data
				);
				if (!boardMember) {
					return res.status(404).json({ message: "Board member not found" });
				}

				res.json(boardMember);
			} catch (error) {
				console.error("Error updating board member:", error);
				res.status(500).json({ message: "Failed to update board member" });
			}
		}
	);

	// Delete board member (admin)
	app.delete(
		"/api/admin/board-members/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const boardMemberId = parseInt(req.params.id);
				if (isNaN(boardMemberId)) {
					return res.status(400).json({ message: "Invalid board member ID" });
				}

				const boardMember = await storage.deleteBoardMember(boardMemberId);
				if (!boardMember) {
					return res.status(404).json({ message: "Board member not found" });
				}

				res.json({ message: "Board member deleted successfully", boardMember });
			} catch (error) {
				console.error("Error deleting board member:", error);
				res.status(500).json({ message: "Failed to delete board member" });
			}
		}
	);

	// ===== CAROUSEL SLIDES MANAGEMENT =====

	// Get active carousel slides (public)
	app.get("/api/carousel-slides", async (req: any, res) => {
		try {
			const slides = await storage.getCarouselSlides();
			res.json(slides);
		} catch (error) {
			console.error("Error fetching public carousel slides:", error);
			res.status(500).json({ message: "Failed to fetch carousel slides" });
		}
	});

	// Get all carousel slides (admin)
	app.get(
		"/api/admin/carousel-slides",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const slides = await storage.getCarouselSlides();
				res.json(slides);
			} catch (error) {
				console.error("Error fetching carousel slides:", error);
				res.status(500).json({ message: "Failed to fetch carousel slides" });
			}
		}
	);

	// Create carousel slide (admin)
	app.post(
		"/api/admin/carousel-slides",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				// Validate request body with Zod
				const result = insertCarouselSlideSchema.safeParse(req.body);
				if (!result.success) {
					// Enhanced error logging: show field, message, and type
					console.error("Carousel Slide Validation Error:", {
						payload: req.body,
						errors: result.error.errors.map((err) => ({
							field: err.path.join("."),
							message: err.message,
							code: err.code,
						})),
					});
					// Also log a summary of missing/invalid fields for quick debugging
					const missingFields = result.error.errors
						.filter(
							(err) =>
								err.code === "invalid_type" && err.received === "undefined"
						)
						.map((err) => err.path.join("."));
					if (missingFields.length > 0) {
						console.error("Missing required fields:", missingFields);
					}
					return res.status(400).json({
						message: "Validation failed",
						errors: result.error.errors.map((err) => ({
							field: err.path.join("."),
							message: err.message,
						})),
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
				console.log("Error creating carousel slide:", error);
				res.status(500).json({ message: "Failed to create carousel slide" });
			}
		}
	);

	// Update carousel slide (admin)
	app.put(
		"/api/admin/carousel-slides/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const slideId = parseInt(req.params.id);
				if (isNaN(slideId)) {
					return res.status(400).json({ message: "Invalid carousel slide ID" });
				}

				// Validate request body with Zod
				const result = updateCarouselSlideSchema.safeParse(req.body);
				if (!result.success) {
					return res.status(400).json({
						message: "Validation failed",
						errors: result.error.errors.map((err) => ({
							field: err.path.join("."),
							message: err.message,
						})),
					});
				}

				const slide = await storage.updateCarouselSlide(slideId, result.data);
				if (!slide) {
					return res.status(404).json({ message: "Carousel slide not found" });
				}

				res.json(slide);
			} catch (error) {
				console.error("Error updating carousel slide:", error);
				res.status(500).json({ message: "Failed to update carousel slide" });
			}
		}
	);

	// Delete carousel slide (admin)
	app.delete(
		"/api/admin/carousel-slides/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const slideId = parseInt(req.params.id);
				if (isNaN(slideId)) {
					return res.status(400).json({ message: "Invalid carousel slide ID" });
				}

				const slide = await storage.deleteCarouselSlide(slideId);
				if (!slide) {
					return res.status(404).json({ message: "Carousel slide not found" });
				}

				res.json({ message: "Carousel slide deleted successfully", slide });
			} catch (error) {
				console.error("Error deleting carousel slide:", error);
				res.status(500).json({ message: "Failed to delete carousel slide" });
			}
		}
	);

	// Update gallery item (admin)
	app.put("/api/admin/gallery/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const galleryId = parseInt(req.params.id);
			if (isNaN(galleryId)) {
				return res.status(400).json({ message: "Invalid gallery item ID" });
			}

			const galleryItem = await storage.updateGalleryItem(galleryId, req.body);
			if (!galleryItem) {
				return res.status(404).json({ message: "Gallery item not found" });
			}

			res.json(galleryItem);
		} catch (error) {
			console.error("Error updating gallery item:", error);
			res.status(500).json({ message: "Failed to update gallery item" });
		}
	});

	// Delete gallery item (admin)
	app.delete(
		"/api/admin/gallery/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const galleryId = parseInt(req.params.id);
				if (isNaN(galleryId)) {
					return res.status(400).json({ message: "Invalid gallery item ID" });
				}

				// Use the storage's deleteGalleryItem (or equivalent) to remove or soft-delete the item
				// If your storage implements soft-delete, deleteGalleryItem should mark isDeleted; otherwise it will remove the record.
				const galleryItem = await storage.deleteGalleryItem(galleryId);
				res.json(galleryItem);
			} catch (error) {
				console.error("Error deleting gallery item:", error);
				res.status(500).json({ message: "Failed to delete gallery item" });
			}
		}
	);

	// Update notice (admin)
	app.put("/api/admin/notices/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const noticeId = parseInt(req.params.id);
			if (isNaN(noticeId)) {
				return res.status(400).json({ message: "Invalid notice ID" });
			}

			const notice = await storage.updateNotice(noticeId, req.body);
			if (!notice) {
				return res.status(404).json({ message: "Notice not found" });
			}

			res.json(notice);
		} catch (error) {
			console.error("Error updating notice:", error);
			res.status(500).json({ message: "Failed to update notice" });
		}
	});

	// Delete notice (admin)
	app.delete(
		"/api/admin/notices/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const noticeId = parseInt(req.params.id);
				if (isNaN(noticeId)) {
					return res.status(400).json({ message: "Invalid notice ID" });
				}

				const notice = await storage.deleteNotice(noticeId);
				res.json(notice);
			} catch (error) {
				console.error("Error deleting notice:", error);
				res.status(500).json({ message: "Failed to delete notice" });
			}
		}
	);
	// Delete Department (admin)
	app.delete(
		"/api/admin/department:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const deptId = parseInt(req.params.id);
				if (isNaN(deptId)) {
					return res.status(400).json({ message: "Invalid department ID" });
				}

				const department = await storage.deleteDept(deptId);
				res.json(department);
			} catch (error) {
				console.error("Error deleting department:", error);
				res.status(500).json({ message: "Failed to delete department" });
			}
		}
	);
	// Delete JG (admin)
	app.delete(
		"/api/admin/job-groups:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const jgId = parseInt(req.params.id);
				if (isNaN(jgId)) {
					return res.status(400).json({ message: "Invalid jg ID" });
				}

				const jg = await storage.deleteJg(jgId);
				res.json(jg);
			} catch (error) {
				console.error("Error deleting jg:", error);
				res.status(500).json({ message: "Failed to delete jg" });
			}
		}
	);

	// Update FAQ (admin)
	app.put("/api/admin/faqs/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const faqId = parseInt(req.params.id);
			if (isNaN(faqId)) {
				return res.status(400).json({ message: "Invalid FAQ ID" });
			}

			const faq = await storage.updateFaq(faqId, req.body);
			if (!faq) {
				return res.status(404).json({ message: "FAQ not found" });
			}

			res.json(faq);
		} catch (error) {
			console.error("Error updating FAQ:", error);
			res.status(500).json({ message: "Failed to update FAQ" });
		}
	});

	// Delete FAQ (admin)
	app.delete("/api/admin/faqs/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const faqId = parseInt(req.params.id);
			if (isNaN(faqId)) {
				return res.status(400).json({ message: "Invalid FAQ ID" });
			}

			const faq = await storage.deleteFaq(faqId);
			res.json(faq);
		} catch (error) {
			console.error("Error deleting FAQ:", error);
			res.status(500).json({ message: "Failed to delete FAQ" });
		}
	});

	// Get notifications (admin)
	app.get(
		"/api/admin/notifications",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const notifications = await storage.getNotifications();
				res.json(notifications);
			} catch (error) {
				console.error("Error fetching notifications:", error);
				res.status(500).json({ message: "Failed to fetch notifications" });
			}
		}
	);

	// Create notification (admin) with validation
	app.post(
		"/api/admin/notifications",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				// Basic validation - schema import needed for full Zod validation
				const requiredFields = [
					"title",
					"message",
					"type",
					"targetAudience",
					"priority",
				];
				const missingFields = requiredFields.filter(
					(field) => !req.body[field]
				);

				if (missingFields.length > 0) {
					return res.status(400).json({
						message: "Missing required fields",
						errors: missingFields.map((field) => ({
							field,
							message: `${field} is required`,
						})),
					});
				}

				// Calculate recipient count based on target audience
				let recipientCount = 0;
				const allUsers = await storage.getAllUsersForRoleAssignment();

				switch (req.body.targetAudience) {
					case "all":
						recipientCount = allUsers.length;
						break;
					case "applicants":
						recipientCount = allUsers.filter(
							(u: any) => u.role === "applicant"
						).length;
						break;
					case "admins":
						recipientCount = allUsers.filter(
							(u: any) => u.role === "admin"
						).length;
						break;
					case "board":
						recipientCount = allUsers.filter(
							(u: any) => u.role === "board"
						).length;
						break;
					default:
						recipientCount = 0;
				}
				// Sanitize scheduledAt to ensure it's a valid ISO string or undefined
				let scheduledAt = req.body.scheduledAt;
				if (scheduledAt) {
					if (typeof scheduledAt === "string") {
						const date = new Date(scheduledAt);
						scheduledAt = !isNaN(date.getTime())
							? date.toISOString()
							: undefined;
					} else if (scheduledAt instanceof Date) {
						scheduledAt = scheduledAt.toISOString();
					} else {
						scheduledAt = undefined;
					}
				}
				const notificationType = req.body.type;

				const notificationData = {
					...req.body,
					scheduledAt,
					createdBy: user.id,
					status: scheduledAt ? "scheduled" : "sent",
					sentAt: scheduledAt ? null : new Date(),
					recipientCount,
					deliveredCount: scheduledAt ? 0 : recipientCount, // Mark as delivered immediately if not scheduled
				};

				const notification = await storage.createNotification(notificationData);
				let sendResult: any = {
					success: true,
					message: "Notification created",
				};
				let deliveredCount = 0;

				if (!scheduledAt) {
					if (notificationType === "sms") {
						// Get recipients (phone numbers)
						const recipients =
							await storage.getNotificationRecipientsForAudience(
								notification.id,
								req.body.targetAudience
							);
						const phoneNumbers = recipients
							.map((r: any) => String(r.phoneNumber))
							.filter(Boolean);

						if (phoneNumbers.length > 0) {
							sendResult = await sendBulkSms(phoneNumbers, req.body.message);
							deliveredCount = sendResult.sentCount || 0;
						} else {
							sendResult = {
								success: false,
								error: "No phone numbers found for recipients",
								sentCount: 0,
								failedCount: 0,
							};
						}
					} else if (notificationType === "email") {
						// Get recipients (emails)
						const recipients =
							await storage.getNotificationRecipientsForAudience(
								notification.id,
								req.body.targetAudience
							);
						const emails = recipients
							.map((r: any) => String(r.email))
							.filter(Boolean);

						if (emails.length > 0) {
							sendResult = await sendEmail(
								emails,
								req.body.title,
								req.body.message
							);
							deliveredCount = sendResult.sentCount || 0;
						} else {
							sendResult = {
								success: false,
								error: "No email addresses found for recipients",
								sentCount: 0,
							};
						}
					} else if (notificationType === "system") {
						// System alert: just save to DB
						sendResult = { success: true, message: "System alert saved" };
						deliveredCount = recipientCount;
					}

					// Update notification with delivery status
					if (deliveredCount > 0) {
						await storage.updateNotification(notification.id, {
							deliveredCount,
						});
					}
				}

				res.json({
					notification,
					sendResult,
					success: sendResult.success,
					message: sendResult.success
						? `Notification sent successfully to ${deliveredCount} recipient(s)`
						: `Failed to send: ${sendResult.error || "Unknown error"}`,
				});
			} catch (error) {
				console.error("Error creating notification:", error);
				res.status(500).json({ message: "Failed to create notification" });
			}
		}
	);

	// Get notification stats (admin)
	app.get(
		"/api/admin/notification-stats",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const stats = await storage.getNotificationStats();
				res.json(stats);
			} catch (error) {
				console.error("Error fetching notification stats:", error);
				res.status(500).json({ message: "Failed to fetch notification stats" });
			}
		}
	);

	// Removed old notification endpoint as it's been replaced with the full implementation above

	// Create county (admin)
	app.post("/api/admin/counties", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const county = await storage.seedCounties(req.body);
			res.json(county);
		} catch (error) {
			console.error("Error creating county:", error);
			res.status(500).json({ message: "Failed to create county" });
		}
	});

	// Create constituency (admin)
	app.post(
		"/api/admin/constituencies",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const constituency = await storage.seedSubCounties({
					...req.body,
					createdAt: new Date(),
				});
				res.json(constituency);
			} catch (error) {
				console.error("Error creating constituency:", error);
				res.status(500).json({ message: "Failed to create constituency" });
			}
		}
	);

	// Create ward (admin)
	app.post("/api/admin/wards", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const ward = await storage.seedWard({
				...req.body,
				createdAt: new Date(),
			});
			res.json(ward);
		} catch (error) {
			console.error("Error creating ward:", error);
			res.status(500).json({ message: "Failed to create ward" });
		}
	});

	// Create study area (admin)
	app.post("/api/admin/study-areas", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const studyArea = await storage.seedStudy(req.body);
			res.json(studyArea);
		} catch (error) {
			console.error("Error creating study area:", error);
			res.status(500).json({ message: "Failed to create study area" });
		}
	});

	// Create specialization (admin)
	app.post(
		"/api/admin/specializations",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const specialization = await storage.seedSpecialize({
					...req.body,
					createdAt: new Date(),
				});
				res.json(specialization);
			} catch (error) {
				console.error("Error creating specialization:", error);
				res.status(500).json({ message: "Failed to create specialization" });
			}
		}
	);

	// Create job group (admin)
	app.post("/api/admin/job-groups", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const jobGroup = await storage.seedJobGroup(req.body);
			res.json(jobGroup);
		} catch (error) {
			console.error("Error creating job group:", error);
			res.status(500).json({ message: "Failed to create job group" });
		}
	});
	// Create Department (admin)
	app.post("/api/admin/dept", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}
			const dept = await storage.seedDepartment(req.body);
			res.json(dept);
		} catch (error) {
			console.error("Error creating department:", error);
			res.status(500).json({ message: "Failed to create department" });
		}
	});

	// Create award (admin)
	app.post("/api/admin/awards", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const award = await storage.seedAward(req.body);
			res.json(award);
		} catch (error) {
			console.error("Error creating award:", error);
			res.status(500).json({ message: "Failed to create award" });
		}
	});

	// Create ethnicity (admin)
	app.post("/api/admin/ethnicity", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const ethnicity = await storage.seedEthnicity(req.body);
			res.json(ethnicity);
		} catch (error) {
			console.error("Error creating ethnicity:", error);
			res.status(500).json({ message: "Failed to create ethnicity" });
		}
	});

	// Update county (admin)
	app.put("/api/admin/counties/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const id = parseInt(req.params.id);
			const county = await storage.updateCounty(id, req.body);
			res.json(county);
		} catch (error) {
			console.error("Error updating county:", error);
			res.status(500).json({ message: "Failed to update county" });
		}
	});

	// Delete county (admin)
	app.delete(
		"/api/admin/counties/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const county = await storage.deleteCounty(id);
				res.json(county);
			} catch (error) {
				console.error("Error deleting county:", error);
				res.status(500).json({ message: "Failed to delete county" });
			}
		}
	);

	// Update constituency (admin)
	app.put(
		"/api/admin/constituencies/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const constituency = await storage.updateConstituency(id, req.body);
				res.json(constituency);
			} catch (error) {
				console.error("Error updating constituency:", error);
				res.status(500).json({ message: "Failed to update constituency" });
			}
		}
	);

	// Delete constituency (admin)
	app.delete(
		"/api/admin/constituencies/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const constituency = await storage.deleteConstituency(id);
				res.json(constituency);
			} catch (error) {
				console.error("Error deleting constituency:", error);
				res.status(500).json({ message: "Failed to delete constituency" });
			}
		}
	);

	// Update ward (admin)
	app.put("/api/admin/wards/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const id = parseInt(req.params.id);
			const ward = await storage.updateWard(id, req.body);
			res.json(ward);
		} catch (error) {
			console.error("Error updating ward:", error);
			res.status(500).json({ message: "Failed to update ward" });
		}
	});

	// Delete ward (admin)
	app.delete("/api/admin/wards/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const id = parseInt(req.params.id);
			const ward = await storage.deleteWard(id);
			res.json(ward);
		} catch (error) {
			console.error("Error deleting ward:", error);
			res.status(500).json({ message: "Failed to delete ward" });
		}
	});

	// Update study area (admin)
	app.put(
		"/api/admin/study-areas/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const studyArea = await storage.updateStudyArea(id, req.body);
				res.json(studyArea);
			} catch (error) {
				console.error("Error updating study area:", error);
				res.status(500).json({ message: "Failed to update study area" });
			}
		}
	);

	// Delete study area (admin)
	app.delete(
		"/api/admin/study-areas/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const studyArea = await storage.deleteStudyArea(id);
				res.json(studyArea);
			} catch (error) {
				console.error("Error deleting study area:", error);
				res.status(500).json({ message: "Failed to delete study area" });
			}
		}
	);

	// Update specialization (admin)
	app.put(
		"/api/admin/specializations/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const specialization = await storage.updateSpecialization(id, req.body);
				res.json(specialization);
			} catch (error) {
				console.error("Error updating specialization:", error);
				res.status(500).json({ message: "Failed to update specialization" });
			}
		}
	);

	// Delete specialization (admin)
	app.delete(
		"/api/admin/specializations/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const specialization = await storage.deleteSpecialization(id);
				res.json(specialization);
			} catch (error) {
				console.error("Error deleting specialization:", error);
				res.status(500).json({ message: "Failed to delete specialization" });
			}
		}
	);

	// SMS Routes

	// Get applicants by job and filter for SMS
	app.get(
		"/api/admin/sms-applicants",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				// Accept jobId/applicantType from either query string or request body (for flexibility)
				let jobId = req.query.jobId || req.body?.jobId;
				let applicantType = req.query.applicantType || req.body?.applicantType;
				if (!jobId || !applicantType) {
					return res
						.status(400)
						.json({ message: "jobId and applicantType are required" });
				}

				jobId = parseInt(jobId as string);
				if (isNaN(jobId)) {
					return res
						.status(400)
						.json({ message: "jobId must be a valid number" });
				}
				const applicants = await storage.getApplicantsByJobAndType(
					jobId,
					applicantType as string
				);
				res.json(applicants);
			} catch (error) {
				const errMsg =
					error instanceof Error && error.message
						? error.message
						: String(error);
				console.error("Error fetching SMS applicants:", error);
				res.status(500).json({
					message: "Failed to fetch applicants for SMS",
					error: errMsg,
				});
			}
		}
	);

	// Send SMS to selected applicants
	app.post("/api/admin/send-sms", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const { applicantIds, message, jobId, applicantType } = req.body;
			if (
				!applicantIds ||
				!message ||
				!Array.isArray(applicantIds) ||
				applicantIds.length === 0
			) {
				return res
					.status(400)
					.json({ message: "applicantIds and message are required" });
			}

			const result = await storage.sendSMSToApplicants(
				applicantIds,
				message,
				jobId,
				applicantType
			);
			res.json(result);
		} catch (error) {
			console.error("Error sending SMS:", error);
			res.status(500).json({ message: "Failed to send SMS" });
		}
	});

	// Send SMS to staff
	app.post(
		"/api/admin/send-staff-sms",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { staffIds, message } = req.body;
				if (
					!staffIds ||
					!message ||
					!Array.isArray(staffIds) ||
					staffIds.length === 0
				) {
					return res
						.status(400)
						.json({ message: "staffIds and message are required" });
				}

				const result = await storage.sendSMSToStaff(staffIds, message);
				res.json(result);
			} catch (error) {
				console.error("Error sending staff SMS:", error);
				res.status(500).json({ message: "Failed to send SMS to staff" });
			}
		}
	);

	// Get staff for SMS
	app.get("/api/admin/staff-list", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const staff = await storage.getStaffForSMS();
			res.json(staff);
		} catch (error) {
			console.error("Error fetching staff for SMS:", error);
			res.status(500).json({ message: "Failed to fetch staff list" });
		}
	});

	// Create FAQ (admin)
	app.post("/api/admin/faqs", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}
			const faqs = await storage.createFaqs({
				...req.body,
				createdAt: new Date(),
			});
			return res.json(faqs);
		} catch (error) {
			console.error("Error creating FAQ:", error);
			res.status(500).json({ message: "Failed to create FAQ" });
		}
	});

	// Create role assignment (admin)
	app.post(
		"/api/admin/role-assignments",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				// Update user role in the database
				const { userId, role } = req.body;
				const updatedUser = await storage.updateUserRole(userId, role);

				if (!updatedUser) {
					return res.status(404).json({ message: "User not found" });
				}

				res.json({
					id: updatedUser.id,
					userId: updatedUser.id,
					role: updatedUser.role,
					assignedBy: user.id,
					assignedAt: new Date().toISOString(),
				});
			} catch (error) {
				console.error("Error creating role assignment:", error);
				res.status(500).json({ message: "Failed to create role assignment" });
			}
		}
	);

	// Report routes (admin)
	app.get("/api/admin/reports", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const { type, startDate, endDate } = req.query;
			let reportData;

			switch (type) {
				case "applications":
					reportData = await storage.getApplicationsReport(
						startDate as string,
						endDate as string
					);
					break;
				case "jobs":
					reportData = await storage.getJobsReport(
						startDate as string,
						endDate as string
					);
					break;
				case "users":
					reportData = await storage.getUsersReport(
						startDate as string,
						endDate as string
					);
					break;
				case "performance":
					reportData = await storage.getPerformanceReport(
						startDate as string,
						endDate as string
					);
					break;
				default:
					return res.status(400).json({ message: "Invalid report type" });
			}

			res.json(reportData);
		} catch (error) {
			console.error("Error generating report:", error);
			res.status(500).json({ message: "Failed to generate report" });
		}
	});

	// Download report (admin)
	app.get(
		"/api/admin/reports/download",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { type, format, startDate, endDate } = req.query;
				let reportData;

				switch (type) {
					case "applications":
						reportData = await storage.getApplicationsReport(
							startDate as string,
							endDate as string
						);
						break;
					case "jobs":
						reportData = await storage.getJobsReport(
							startDate as string,
							endDate as string
						);
						break;
					case "users":
						reportData = await storage.getUsersReport(
							startDate as string,
							endDate as string
						);
						break;
					case "performance":
						reportData = await storage.getPerformanceReport(
							startDate as string,
							endDate as string
						);
						break;
					default:
						return res.status(400).json({ message: "Invalid report type" });
				}

				if (format === "csv") {
					// Convert to CSV
					const csvData = convertToCSV(reportData.data, type as string);
					res.setHeader("Content-Type", "text/csv");
					res.setHeader(
						"Content-Disposition",
						`attachment; filename="${type}_report_${Date.now()}.csv"`
					);
					res.send(csvData);
				} else {
					// Return JSON for now (can be extended to PDF)
					res.json(reportData);
				}
			} catch (error) {
				console.error("Error downloading report:", error);
				res.status(500).json({ message: "Failed to download report" });
			}
		}
	);

	// Protected board committee routes

	// Get applications for review (board)
	app.get("/api/board/applications", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "board") {
				return res.status(403).json({ message: "Access denied" });
			}

			const jobId = req.query.jobId
				? parseInt(req.query.jobId as string)
				: undefined;
			const status = req.query.status as string | undefined;
			const applications = await storage.getApplications({ jobId, status });
			res.json(applications);
		} catch (error) {
			console.error("Error fetching applications:", error);
			res.status(500).json({ message: "Failed to fetch applications" });
		}
	});

	// Update application status (board)
	app.put(
		"/api/board/applications/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applicationId = parseInt(req.params.id);
				const application = await storage.updateApplication(
					applicationId,
					req.body
				);
				res.json(application);
			} catch (error) {
				console.error("Error updating application:", error);
				res.status(500).json({ message: "Failed to update application" });
			}
		}
	);

	// Bulk update applications (board)
	app.post(
		"/api/board/applications/bulk-update",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { applicationIds, status, shortlistedAt } = req.body;

				if (
					!applicationIds ||
					!Array.isArray(applicationIds) ||
					applicationIds.length === 0
				) {
					return res
						.status(400)
						.json({ message: "applicationIds must be a non-empty array" });
				}

				if (!status) {
					return res.status(400).json({ message: "status is required" });
				}

				const updates = [];
				for (const appId of applicationIds) {
					const updateData: any = { status };
					if (shortlistedAt) {
						updateData.shortlistedAt = shortlistedAt;
					}
					const updated = await storage.updateApplication(appId, updateData);
					updates.push(updated);
				}

				res.json({ success: true, updated: updates.length, status });
			} catch (error) {
				console.error("Error bulk updating applications:", error);
				res.status(500).json({ message: "Failed to bulk update applications" });
			}
		}
	);

	// Document upload endpoint
	app.post(
		"/api/applicant/documents",
		isAuthenticated,
		upload.single("document"),
		async (req: any, res) => {
			try {
				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				const { type } = req.body;
				if (!type) {
					return res.status(400).json({ message: "Document type is required" });
				}

				const userId = req.user.id;
				const user = await storage.getUser(userId);

				if (!user || user.role !== "applicant") {
					return res
						.status(403)
						.json({ message: "Only applicants can upload documents" });
				}

				// Get the applicant profile to get applicant ID
				const applicantProfile = await storage.getApplicant(userId);
				if (!applicantProfile) {
					return res
						.status(404)
						.json({ message: "Applicant profile not found" });
				}
				// Save document to database
				const document = await storage.saveDocument({
					applicantId: applicantProfile.id,
					type,
					fileName: req.file.originalname,
					filePath: `/uploads/${req.file.filename}`,
					fileSize: req.file.size,
					mimeType: req.file.mimetype,
				});

				res.json({
					id: document.id,
					type: document.type,
					fileName: document.fileName,
					filePath: document.filePath,
					message: "Document uploaded successfully",
				});
			} catch (error) {
				console.error("Error uploading document:", error);
				res.status(500).json({ message: "Failed to upload document" });
			}
		}
	);

	// Panel Scoring API Endpoints for Collaborative Board Member Scoring

	// Create or update panel score for an application by a board member
	app.post(
		"/api/board/panel-scores",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const {
					applicationId,
					academicScore,
					experienceScore,
					skillsScore,
					leadershipScore,
					generalScore,
					negativeScore,
					remarks,
				} = req.body;

				// Use user ID as panel ID (each user is a panel member)
				const panelId = parseInt(user.id) || 0;

				// Check if score already exists for this application and panel member
				const existingScore = await storage.getPanelScore(
					applicationId,
					panelId
				);

				let panelScore;
				if (existingScore) {
					// Update existing score
					await storage.updateApplication(applicationId, {
						status: "interviewed",
					});
					panelScore = await storage.updatePanelScore(existingScore.scoreId, {
						applicationId,
						panelId,
						academicScore: academicScore || 0,
						experienceScore: experienceScore || 0,
						skillsScore: skillsScore || 0,
						leadershipScore: leadershipScore || 0,
						generalScore: generalScore || 0,
						negativeScore: negativeScore || 0,
						remarks,
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
						remarks,
					});
					await storage.updateApplication(applicationId, {
						status: "interviewed",
					});
				}

				// Get updated average scores
				const averageScores = await storage.getAverageScores(applicationId);

				res.json({
					panelScore,
					averageScores,
					message: "Score saved successfully",
				});
			} catch (error) {
				console.error("Error saving panel score:", error);
				res.status(500).json({ message: "Failed to save panel score" });
			}
		}
	);

	// Get all panel scores for an application (board members only)
	app.get(
		"/api/board/panel-scores/:applicationId",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applicationId = parseInt(req.params.applicationId);
				const scores = await storage.getPanelScores(applicationId);
				const averageScores = await storage.getAverageScores(applicationId);

				res.json({ scores, averageScores });
			} catch (error) {
				console.error("Error fetching panel scores:", error);
				res.status(500).json({ message: "Failed to fetch panel scores" });
			}
		}
	);

	// Get current user's score for an application
	app.get(
		"/api/board/my-score/:applicationId",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applicationId = parseInt(req.params.applicationId);
				const panelId = parseInt(user.id) || 0;
				const score = await storage.getPanelScore(applicationId, panelId);

				res.json({ score: score || null });
			} catch (error) {
				console.error("Error fetching user score:", error);
				res.status(500).json({ message: "Failed to fetch user score" });
			}
		}
	);

	// Get average scores for an application (board members only)
	app.get(
		"/api/board/average-scores/:applicationId",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applicationId = parseInt(req.params.applicationId);
				const averageScores = await storage.getAverageScores(applicationId);

				res.json(averageScores);
			} catch (error) {
				console.error("Error fetching average scores:", error);
				res.status(500).json({ message: "Failed to fetch average scores" });
			}
		}
	);

	// Get scoring statistics (board members only)
	app.get(
		"/api/board/scoring-statistics",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applications = await storage.getApplications({ status: "" });

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
							const totalScore =
								(score.academicScore || 0) +
								(score.experienceScore || 0) +
								(score.skillsScore || 0) +
								(score.leadershipScore || 0) +
								(score.generalScore || 0) -
								(score.negativeScore || 0);
							totalScoreSum += totalScore;

							if (totalScore >= 80) highScores++;
							else if (totalScore >= 60) mediumScores++;
							else lowScores++;
						}
					}
				}

				const averageScore =
					totalScoredApplications > 0
						? totalScoreSum / totalScoredApplications
						: 0;

				res.json({
					totalScoredApplications,
					averageScore,
					activeScorers: activeScorers.size,
					highScores,
					mediumScores,
					lowScores,
				});
			} catch (error) {
				console.error("Error fetching scoring statistics:", error);
				res.status(500).json({ message: "Failed to fetch scoring statistics" });
			}
		}
	);

	// Get interview statistics (board members only)
	app.get(
		"/api/board/interview-statistics",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const applications = await storage.getApplications();

				const totalInterviews = applications.filter(
					(app) => app.interviewDate
				).length;
				const completedInterviews = applications.filter(
					(app) => app.status === "interviewed"
				).length;
				const scheduledInterviews = applications.filter(
					(app) => app.status === "interview_scheduled"
				).length;

				res.json({
					totalInterviews,
					completedInterviews,
					scheduledInterviews,
				});
			} catch (error) {
				console.error("Error fetching interview statistics:", error);
				res
					.status(500)
					.json({ message: "Failed to fetch interview statistics" });
			}
		}
	);

	// File upload endpoint
	app.post(
		"/api/upload",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				// In production, you would upload to cloud storage (AWS S3, etc.)
				const fileUrl = `/uploads/${req.file.filename}`;

				res.json({
					filename: req.file.originalname,
					url: fileUrl,
					size: req.file.size,
					mimeType: req.file.mimetype,
				});
			} catch (error) {
				console.error("Error uploading file:", error);
				res.status(500).json({ message: "Failed to upload file" });
			}
		}
	);

	// Dedicated favicon upload endpoint
	app.post(
		"/api/admin/upload-favicon",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res
						.status(403)
						.json({ message: "Access denied. Admin role required." });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				// Validate file type
				const allowedMimeTypes = [
					"image/x-icon",
					"image/vnd.microsoft.icon",
					"image/png",
				];
				if (!allowedMimeTypes.includes(req.file.mimetype)) {
					return res.status(400).json({
						message: "Invalid file type. Only .ico and .png files are allowed.",
					});
				}

				// Determine the target filename based on mime type
				const targetFilename =
					req.file.mimetype === "image/png" ? "favicon.png" : "favicon.ico";
				const sourcePath = req.file.path;
				const targetPath = path.join("uploads", targetFilename);

				// Use fs to rename/move the file
				const fs = require("fs").promises;
				await fs.rename(sourcePath, targetPath);

				res.json({
					success: true,
					message: "Favicon uploaded successfully",
					filename: targetFilename,
					url: `/uploads/${targetFilename}`,
				});
			} catch (error) {
				console.error("Error uploading favicon:", error);
				res
					.status(500)
					.json({ success: false, message: "Failed to upload favicon" });
			}
		}
	);

	// Job archiving routes
	app.post(
		"/api/admin/jobs/archive-expired",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const archivedCount = await storage.archiveExpiredJobs();
				res.json({
					message: `${archivedCount} job(s) archived successfully`,
					count: archivedCount,
				});
			} catch (error) {
				console.error("Error archiving jobs:", error);
				res.status(500).json({ message: "Failed to archive jobs" });
			}
		}
	);

	app.get(
		"/api/admin/jobs/archived",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const archivedJobs = await storage.getArchivedJobs();
				res.json(archivedJobs);
			} catch (error) {
				console.error("Error fetching archived jobs:", error);
				res.status(500).json({ message: "Failed to fetch archived jobs" });
			}
		}
	);

	// Admin documents routes
	app.post(
		"/api/admin/documents",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				const { title, description, type, jobId } = req.body;

				const adminDoc = await storage.createAdminDocument({
					title,
					description,
					type,
					fileName: req.file.originalname,
					filePath: `/uploads/${req.file.filename}`,
					fileSize: req.file.size,
					mimeType: req.file.mimetype,
					jobId: jobId ? parseInt(jobId) : null,
					isPublished: true,
					uploadedBy: user.id,
				});

				res.json(adminDoc);
			} catch (error) {
				console.error("Error uploading admin document:", error);
				res.status(500).json({ message: "Failed to upload document" });
			}
		}
	);

	// Applicant document upload (PDF only)
	app.post(
		"/api/applicant/documents",
		isAuthenticated,
		uploadApplicantPdf.single("document"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "applicant") {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				const applicant = await storage.getApplicant(req.user.id);
				if (!applicant || !applicant.id) {
					return res
						.status(404)
						.json({ message: "Applicant profile not found" });
				}

				const docRecord = await storage.createApplicantDocument({
					applicantId: applicant.id,
					type: req.body.type || "certificate",
					fileName: req.file.originalname,
					filePath: `/uploads/${req.file.filename}`,
					fileSize: req.file.size,
					mimeType: req.file.mimetype,
				});

				res.json(docRecord);
			} catch (error) {
				console.error("Error uploading applicant document:", error);
				res.status(500).json({ message: "Failed to upload document" });
			}
		}
	);

	app.get("/api/admin/documents", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Access denied" });
			}

			const { type, jobId } = req.query;
			const filters: any = {};
			if (type) filters.type = type;
			if (jobId) filters.jobId = parseInt(jobId as string);

			const documents = await storage.getAdminDocuments(filters);
			res.json(documents);
		} catch (error) {
			console.error("Error fetching admin documents:", error);
			res.status(500).json({ message: "Failed to fetch documents" });
		}
	});

	app.get("/api/public/admin-documents", async (req, res) => {
		try {
			const { type } = req.query;
			const filters: any = {};
			if (type) filters.type = type;

			const documents = await storage.getAdminDocuments(filters);
			res.json(documents);
		} catch (error) {
			console.error("Error fetching public admin documents:", error);
			res.status(500).json({ message: "Failed to fetch documents" });
		}
	});

	app.put(
		"/api/admin/documents/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const adminDoc = await storage.updateAdminDocument(
					parseInt(id),
					req.body
				);
				res.json(adminDoc);
			} catch (error) {
				console.error("Error updating admin document:", error);
				res.status(500).json({ message: "Failed to update document" });
			}
		}
	);

	app.delete(
		"/api/admin/documents/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				await storage.deleteAdminDocument(parseInt(id));
				res.json({ message: "Document deleted successfully" });
			} catch (error) {
				console.error("Error deleting admin document:", error);
				res.status(500).json({ message: "Failed to delete document" });
			}
		}
	);

	// Interview scheduling routes
	app.post(
		"/api/admin/applications/:id/schedule-interview",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const { interviewDate, interviewTime, duration } = req.body;

				const application = await storage.scheduleInterview(
					parseInt(id),
					interviewDate,
					interviewTime,
					duration
				);

				res.json(application);
			} catch (error) {
				console.error("Error scheduling interview:", error);
				res.status(500).json({ message: "Failed to schedule interview" });
			}
		}
	);

	app.post(
		"/api/admin/applications/bulk-schedule-interviews",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No Excel file uploaded" });
				}

				// Parse Excel/CSV file here - for now accepting JSON in body
				const schedules = req.body.schedules || [];

				await storage.bulkScheduleInterviews(schedules);

				res.json({
					message: "Interviews scheduled successfully",
					count: schedules.length,
				});
			} catch (error) {
				console.error("Error bulk scheduling interviews:", error);
				res.status(500).json({ message: "Failed to bulk schedule interviews" });
			}
		}
	);

	// Bulk Interview Scheduling via Excel Upload
	app.post(
		"/api/board/bulk-schedule-interviews-excel",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No Excel file uploaded" });
				}

				// Read and parse Excel file. Use cellDates so date cells are returned as JS Date objects
				const buffer = fs.readFileSync(req.file.path);
				const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const data = XLSX.utils.sheet_to_json(worksheet);

				// Validate and process data
				const errors: any[] = [];
				const updates: any[] = [];

				for (let i = 0; i < data.length; i++) {
					const row: any = data[i];

					// Validate required fields
					if (
						!row.ApplicationId ||
						row.InterviewDate === undefined ||
						row.InterviewDate === null ||
						!row.InterviewTime
					) {
						errors.push({
							row: i + 2, // +2 because Excel is 1-indexed and has header
							message:
								"Missing required fields (ApplicationId, InterviewDate, or InterviewTime)",
						});
						continue;
					}

					// Normalize InterviewDate to YYYY-MM-DD string. XLSX with cellDates:true will give Date objects for date cells.
					let interviewDate: string | null = null;
					const rawDate = row.InterviewDate;
					try {
						if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
							interviewDate = rawDate.toISOString().split("T")[0];
						} else if (typeof rawDate === "number") {
							// Excel sometimes gives serial date numbers; try to parse with SSF
							const parsed = XLSX.SSF.parse_date_code(rawDate);
							if (parsed) {
								const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
								interviewDate = d.toISOString().split("T")[0];
							}
						} else if (typeof rawDate === "string" && rawDate.trim()) {
							const d = new Date(rawDate);
							if (!isNaN(d.getTime()))
								interviewDate = d.toISOString().split("T")[0];
						}
					} catch (e) {
						// fall through to error handling below
					}

					if (!interviewDate) {
						errors.push({
							row: i + 2,
							message: `Invalid InterviewDate value: ${String(rawDate)}`,
						});
						continue;
					}

					updates.push({
						applicationId: parseInt(row.ApplicationId),
						interviewDate,
						interviewTime: String(row.InterviewTime),
						interviewVenue: row.InterviewVenue || "TBD",
						interviewDuration: 30,
					});
				}

				if (errors.length > 0 && updates.length === 0) {
					// Clean up uploaded file
					fs.unlinkSync(req.file.path);
					return res.status(400).json({
						message: "Invalid Excel data",
						errors,
					});
				}

				// Bulk update applications
				for (const update of updates) {
					try {
						await storage.updateApplication(update.applicationId, {
							interviewDate: update.interviewDate,
							interviewTime: update.interviewTime,
							interviewVenue: update.interviewVenue,
							interviewDuration: update.interviewDuration,
							status: "interview_scheduled",
						});
					} catch (err: any) {
						console.error(
							`Failed to update application ${update.applicationId}:`,
							err?.message || err
						);
						errors.push({
							applicationId: update.applicationId,
							message: `Failed to update application: ${
								err?.message || "Unknown error"
							}`,
						});
					}
				}

				// Clean up uploaded file
				fs.unlinkSync(req.file.path);

				res.json({
					message: "Bulk interview scheduling completed",
					success: updates.length - errors.length,
					total: data.length,
					errors: errors.length > 0 ? errors : undefined,
				});
			} catch (error) {
				console.error("Error in bulk interview scheduling:", error);
				// Clean up uploaded file if it exists
				if (req.file?.path && fs.existsSync(req.file.path)) {
					fs.unlinkSync(req.file.path);
				}
				res.status(500).json({ message: "Failed to process Excel file" });
			}
		}
	);

	// Bulk Appointments via Excel Upload
	app.post(
		"/api/board/bulk-appointments-excel",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No Excel file uploaded" });
				}

				// Read and parse Excel file
				const buffer = fs.readFileSync(req.file.path);
				const workbook = XLSX.read(buffer, { type: "buffer" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const data = XLSX.utils.sheet_to_json(worksheet);

				// Validate and process data
				const errors: any[] = [];
				const updates: any[] = [];

				for (let i = 0; i < data.length; i++) {
					const row: any = data[i];

					// Validate required fields
					if (!row.ApplicationId) {
						errors.push({
							row: i + 2,
							message: "Missing ApplicationId",
						});
						continue;
					}

					updates.push({
						applicationId: parseInt(row.ApplicationId),
						interviewScore: row.InterviewScore
							? parseInt(row.InterviewScore)
							: null,
						remarks: row.Remarks || "",
					});
				}

				if (errors.length > 0 && updates.length === 0) {
					fs.unlinkSync(req.file.path);
					return res.status(400).json({
						message: "Invalid Excel data",
						errors,
					});
				}

				// Bulk update applications to hired status
				for (const update of updates) {
					try {
						await storage.updateApplication(update.applicationId, {
							status: "hired",
							interviewScore: update.interviewScore,
							remarks: update.remarks,
							hiredAt: new Date(),
						});
					} catch (err) {
						errors.push({
							applicationId: update.applicationId,
							message: "Failed to update application",
						});
					}
				}

				// Clean up uploaded file
				fs.unlinkSync(req.file.path);

				res.json({
					message: "Bulk appointments completed",
					success: updates.length - errors.length,
					total: data.length,
					errors: errors.length > 0 ? errors : undefined,
				});
			} catch (error) {
				console.error("Error in bulk appointments:", error);
				if (req.file?.path && fs.existsSync(req.file.path)) {
					fs.unlinkSync(req.file.path);
				}
				res.status(500).json({ message: "Failed to process Excel file" });
			}
		}
	);

	// Send interview SMS to selected applicants (board)
	app.post(
		"/api/board/send-interview-sms",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "board") {
					return res.status(403).json({ message: "Access denied" });
				}

				const {
					applicationIds,
					message,
					interviewDate,
					interviewTime,
					interviewVenue,
				} = req.body;

				if (
					!applicationIds ||
					!Array.isArray(applicationIds) ||
					applicationIds.length === 0
				) {
					return res
						.status(400)
						.json({ message: "applicationIds must be a non-empty array" });
				}

				if (!message || typeof message !== "string") {
					return res.status(400).json({ message: "message is required" });
				}

				// Update each application with interview details and mark as scheduled
				const updated: number[] = [];
				const errors: any[] = [];
				for (const appId of applicationIds) {
					try {
						await storage.updateApplication(appId, {
							interviewDate: interviewDate || undefined,
							interviewTime: interviewTime || undefined,
							interviewVenue: interviewVenue || undefined,
							status: "interview_scheduled",
							shortlistSmsSent: true,
						});
						updated.push(appId);
					} catch (err: any) {
						console.error(
							`Failed to update application ${appId}:`,
							err?.message || err
						);
						errors.push({
							applicationId: appId,
							error: err?.message || String(err),
						});
					}
				}

				// Send SMS to applicants (storage handles phone lookup and sending)
				const smsResult = await storage.sendSMSToApplicants(
					applicationIds,
					message,
					null as any,
					"applicants"
				);

				res.json({
					success: true,
					updated: updated.length,
					errors: errors.length ? errors : undefined,
					smsResult,
				});
			} catch (error) {
				console.error("Error sending interview SMS:", error);
				res.status(500).json({ message: "Failed to send interview SMS" });
			}
		}
	);

	// Download Excel Template for Interview Scheduling
	app.get(
		"/api/board/download-interview-template",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				// Get query params for filtering
				const { jobId, status } = req.query;

				// Get applications to populate template
				let applications = await storage.getApplications();

				// Filter by job if specified
				if (jobId) {
					applications = applications.filter(
						(app) => app.jobId === parseInt(jobId as string)
					);
				}

				// Filter by status if specified (default to shortlisted)
				const filterStatus = status || "shortlisted" || "interviewed";
				applications = applications.filter(
					(app) => app.status === filterStatus
				);

				// Create workbook with sample data
				const templateData = applications.map((app) => ({
					ApplicationId: app.id,
					JobTitle: app.job?.title || "",
					Name: app.fullName || "",
					IdNumber: app.nationalId || "",
					Gender: app.gender || "",
					Ward: app.ward || "",
					InterviewDate: "", // Empty for user to fill
					InterviewTime: "", // Empty for user to fill
					InterviewVenue: "", // Empty for user to fill
				}));
				console.log(filterStatus, templateData);

				const worksheet = XLSX.utils.json_to_sheet(templateData);
				const workbook = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(workbook, worksheet, "Interview Schedule");

				// Set column widths
				worksheet["!cols"] = [
					{ wch: 15 }, // ApplicationId
					{ wch: 30 }, // JobTitle
					{ wch: 25 }, // Name
					{ wch: 15 }, // IdNumber
					{ wch: 10 }, // Gender
					{ wch: 20 }, // Ward
					{ wch: 15 }, // InterviewDate
					{ wch: 15 }, // InterviewTime
					{ wch: 25 }, // InterviewVenue
				];

				// Generate buffer
				const buffer = XLSX.write(workbook, {
					type: "buffer",
					bookType: "xlsx",
				});

				// Set headers for download
				res.setHeader(
					"Content-Type",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				);
				res.setHeader(
					"Content-Disposition",
					`attachment; filename=interview-schedule-template-${Date.now()}.xlsx`
				);
				res.send(buffer);
			} catch (error) {
				console.error("Error generating interview template:", error);
				res.status(500).json({ message: "Failed to generate template" });
			}
		}
	);

	// Download Excel Template for Bulk Appointments
	app.get(
		"/api/board/download-appointment-template",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "board")) {
					return res.status(403).json({ message: "Access denied" });
				}

				// Get query params for filtering
				const { jobId, status } = req.query;

				// Get applications to populate template
				let applications = await storage.getApplications();

				// Filter by job if specified
				if (jobId) {
					applications = applications.filter(
						(app) => app.jobId === parseInt(jobId as string)
					);
				}

				// Filter by status if specified (default to interviewed)
				const filterStatus = status || "interviewed";
				applications = applications.filter(
					(app) => app.status === filterStatus
				);

				// Create workbook with sample data
				const templateData = applications.map((app) => ({
					ApplicationId: app.id,
					JobTitle: app.job?.title || "",
					Name: app.fullName || "",
					IdNumber: app.nationalId || "",
					Gender: app.gender || "",
					Ethnicity: app.ethnicity || "",
					Ward: app.ward || "",
					InterviewScore: app.interviewScore || "", // Show existing score if any
					Remarks: app.remarks || "", // Show existing remarks if any
				}));

				const worksheet = XLSX.utils.json_to_sheet(templateData);
				const workbook = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

				// Set column widths
				worksheet["!cols"] = [
					{ wch: 15 }, // ApplicationId
					{ wch: 30 }, // JobTitle
					{ wch: 25 }, // Name
					{ wch: 15 }, // IdNumber
					{ wch: 10 }, // Gender
					{ wch: 20 }, // Ward
					{ wch: 15 }, // InterviewScore
					{ wch: 40 }, // Remarks
				];

				// Generate buffer
				const buffer = XLSX.write(workbook, {
					type: "buffer",
					bookType: "xlsx",
				});

				// Set headers for download
				res.setHeader(
					"Content-Type",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				);
				res.setHeader(
					"Content-Disposition",
					`attachment; filename=appointment-template-${Date.now()}.xlsx`
				);
				res.send(buffer);
			} catch (error) {
				console.error("Error generating appointment template:", error);
				res.status(500).json({ message: "Failed to generate template" });
			}
		}
	);

	// SMS-triggered status update routes
	app.post(
		"/api/admin/applications/:id/shortlist-with-sms",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const application = await storage.shortlistApplicationWithSMS(
					parseInt(id)
				);

				// Send SMS notification here
				const applicant = await storage.getApplicantById(
					application.applicantId
				);
				if (applicant?.phoneNumber) {
					await sendOtp({
						to: applicant.phoneNumber,
						template: `Congratulations! You have been shortlisted. Your application ID: ${application.id}`,
					});
				}

				res.json(application);
			} catch (error) {
				console.error("Error shortlisting with SMS:", error);
				res.status(500).json({ message: "Failed to shortlist application" });
			}
		}
	);

	app.post(
		"/api/admin/applications/:id/hire-with-sms",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const application = await storage.hireApplicationWithSMS(parseInt(id));

				// Send SMS notification here
				const applicant = await storage.getApplicantById(
					application.applicantId
				);
				if (applicant?.phoneNumber) {
					await sendOtp({
						to: applicant.phoneNumber,
						template: `Congratulations! You have been hired. Your application ID: ${application.id}`,
					});
				}

				res.json(application);
			} catch (error) {
				console.error("Error hiring with SMS:", error);
				res.status(500).json({ message: "Failed to hire application" });
			}
		}
	);

	// ========================================
	// ACCOUNTING MODULE ROUTES
	// ========================================

	// Vote Accounts Routes
	app.get(
		"/api/accounting/vote-accounts",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const voteAccounts = await storage.getAllVoteAccounts();
				res.json(voteAccounts);
			} catch (error) {
				console.error("Error fetching vote accounts:", error);
				res.status(500).json({ message: "Failed to fetch vote accounts" });
			}
		}
	);
	// Vote Routes
	app.get("/api/accounting/votes", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const voteAccounts = await storage.getAllVote();
			res.json(voteAccounts);
		} catch (error) {
			console.error("Error fetching vote accounts:", error);
			res.status(500).json({ message: "Failed to fetch vote accounts" });
		}
	});

	app.post(
		"/api/accounting/vote-accounts",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const voteAccount = await storage.createVoteAccount(req.body);
				res.json(voteAccount);
			} catch (error) {
				console.error("Error creating vote account:", error);
				res.status(500).json({ message: "Failed to create vote account" });
			}
		}
	);

	// Bulk import vote accounts via Excel/CSV upload
	app.post(
		"/api/accounting/vote-accounts/bulk",
		isAuthenticated,
		uploadEmployeeExcel.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				// Read and parse Excel file
				const buffer = fs.readFileSync(req.file.path);
				const workbook = XLSX.read(buffer, { type: "buffer" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const data: any[] = XLSX.utils.sheet_to_json(worksheet);

				const errors: any[] = [];
				const created: any[] = [];
				for (let i = 0; i < data.length; i++) {
					const row = data[i];
					const voteId = row.VoteID;
					const votedItems = row.Items;
					const voteType = row.Type;

					if (!voteId || !votedItems) {
						errors.push({
							row: i + 2,
							message: "Missing required VoteId or Items",
						});
						continue;
					}

					try {
						const createdAccount = await storage.createVote({
							voteId,
							votedItems,
							voteType,
						});
						created.push(createdAccount);
					} catch (err) {
						errors.push({
							row: i + 2,
							message: "Failed to create vote account",
						});
					}
				}

				// Clean up uploaded file
				try {
					fs.unlinkSync(req.file.path);
				} catch (e) {
					/* ignore */
				}

				res.json({
					message: "Bulk import completed",
					total: data.length,
					created: created.length,
					errors: errors.length ? errors : undefined,
				});
			} catch (error) {
				console.error("Error importing vote accounts bulk:", error);
				if (req.file?.path && fs.existsSync(req.file.path))
					fs.unlinkSync(req.file.path);
				res.status(500).json({ message: "Failed to import vote accounts" });
			}
		}
	);

	// Employee import (Excel/CSV) - creates payroll rows
	app.post(
		"/api/admin/import-employees",
		isAuthenticated,
		uploadEmployeeExcel.single("file"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || (user.role !== "admin" && user.role !== "accountant")) {
					return res.status(403).json({ message: "Access denied" });
				}

				if (!req.file) {
					return res.status(400).json({ message: "No file uploaded" });
				}

				const buffer = fs.readFileSync(req.file.path);
				const workbook = XLSX.read(buffer, { type: "buffer" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const data: any[] = XLSX.utils.sheet_to_json(worksheet);

				const rows: Array<{
					personalNumber: string;
					idNumber: string;
					designation?: string;
					dofa?: string;
					doca?: string;
				}> = [];
				for (const row of data) {
					const personalNumber = String(row.personalNumber).trim();
					const idNumber = String(row.idNumber).trim();
					const designation = row.designation;
					const dofa = row.dofa;
					const doca = row.doca;
					if (!personalNumber || !idNumber) continue;
					rows.push({ personalNumber, idNumber, designation, dofa, doca });
				}

				const created = await storage.bulkUpsertPayroll(rows);

				// Clean up uploaded file
				try {
					fs.unlinkSync(req.file.path);
				} catch (e) {
					/* ignore */
				}

				res.json({
					message: "Employee import completed",
					processed: rows.length,
					upserted: created,
				});
			} catch (error) {
				console.error("Error importing employees:", error);
				if (req.file?.path && fs.existsSync(req.file.path))
					fs.unlinkSync(req.file.path);
				res.status(500).json({ message: "Failed to import employees" });
			}
		}
	);

	// Download Excel template for vote accounts
	app.get(
		"/api/accounting/vote-accounts/template",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const templateData = [
					{
						Code: "210501",
						Description: "Travel and Transport",
						Allocated: 500000,
						FiscalYear: "2024/2025",
					},
					{
						Code: "210502",
						Description: "Office Supplies",
						Allocated: 100000,
						FiscalYear: "2024/2025",
					},
				];

				const worksheet = XLSX.utils.json_to_sheet(templateData);
				const workbook = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(workbook, worksheet, "Vote Accounts");
				worksheet["!cols"] = [
					{ wch: 15 },
					{ wch: 40 },
					{ wch: 15 },
					{ wch: 15 },
				];

				const buffer = XLSX.write(workbook, {
					type: "buffer",
					bookType: "xlsx",
				});

				res.setHeader(
					"Content-Type",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				);
				res.setHeader(
					"Content-Disposition",
					`attachment; filename=vote-accounts-template-${Date.now()}.xlsx`
				);
				res.send(buffer);
			} catch (error) {
				console.error("Error generating vote accounts template:", error);
				res.status(500).json({ message: "Failed to generate template" });
			}
		}
	);

	// Delete vote account
	app.delete(
		"/api/accounting/vote-accounts/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const id = parseInt(req.params.id);
				const deleted = await storage.deleteVoteAccount(id);
				if (!deleted)
					return res.status(404).json({ message: "Vote account not found" });
				res.json({ success: true });
			} catch (error) {
				console.error("Error deleting vote account:", error);
				res.status(500).json({ message: "Failed to delete vote account" });
			}
		}
	);

	// Budget Routes
	app.get("/api/accounting/budgets", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const budgets = await storage.getAllBudgets();
			res.json(budgets);
		} catch (error) {
			console.error("Error fetching budgets:", error);
			res.status(500).json({ message: "Failed to fetch budgets" });
		}
	});

	app.post(
		"/api/accounting/budgets",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const budget = await storage.createBudget(req.body);
				res.json(budget);
			} catch (error) {
				console.error("Error creating budget:", error);
				res.status(500).json({ message: "Failed to create budget" });
			}
		}
	);

	// Transaction Routes (Claims & Payments)
	app.get(
		"/api/accounting/transactions",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const { type, status } = req.query;
				const transactions = await storage.getTransactions({ type, status });
				res.json(transactions);
			} catch (error) {
				console.error("Error fetching transactions:", error);
				res.status(500).json({ message: "Failed to fetch transactions" });
			}
		}
	);

	app.post(
		"/api/accounting/transactions/claim",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const transaction = await storage.createClaim({
					...req.body,
					transactionType: "claim",
					createdBy: user.id,
				});

				res.json({
					success: true,
					message: "Claim generated successfully!",
					transaction,
				});
			} catch (error) {
				console.error("Error creating claim:", error);
				res.status(500).json({ message: "Failed to create claim" });
			}
		}
	);

	app.post(
		"/api/accounting/transactions/payment",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const transaction = await storage.createPayment({
					...req.body,
					transactionType: "payment",
					createdBy: user.id,
				});

				res.json({
					success: true,
					message: "Payment generated successfully!",
					transaction,
				});
			} catch (error) {
				console.error("Error creating payment:", error);
				res.status(500).json({ message: "Failed to create payment" });
			}
		}
	);

	app.patch(
		"/api/accounting/transactions/:id/approve",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res
						.status(403)
						.json({ message: "Only A.I.E Holder can approve transactions" });
				}

				const { id } = req.params;
				const transaction = await storage.approveTransaction(
					parseInt(id),
					user.id
				);
				res.json(transaction);
			} catch (error) {
				console.error("Error approving transaction:", error);
				res.status(500).json({ message: "Failed to approve transaction" });
			}
		}
	);

	app.patch(
		"/api/accounting/transactions/:id/reject",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "admin") {
					return res
						.status(403)
						.json({ message: "Only A.I.E Holder can reject transactions" });
				}

				const { id } = req.params;
				const { reason } = req.body;
				const transaction = await storage.rejectTransaction(
					parseInt(id),
					user.id,
					reason
				);
				res.json(transaction);
			} catch (error) {
				console.error("Error rejecting transaction:", error);
				res.status(500).json({ message: "Failed to reject transaction" });
			}
		}
	);

	// Master Imprest Register Routes
	app.get("/api/accounting/mir", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const mirEntries = await storage.getAllMIREntries();
			res.json(mirEntries);
		} catch (error) {
			console.error("Error fetching MIR entries:", error);
			res.status(500).json({ message: "Failed to fetch MIR entries" });
		}
	});

	app.post("/api/accounting/mir", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "accountant") {
				return res.status(403).json({ message: "Access denied" });
			}

			const mirEntry = await storage.createMIREntry(req.body);
			res.json(mirEntry);
		} catch (error) {
			console.error("Error creating MIR entry:", error);
			res.status(500).json({ message: "Failed to create MIR entry" });
		}
	});

	// Document Export Routes
	app.post(
		"/api/accounting/export/claim/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const transactions = await storage.getTransactions({ type: "claim" });
				const claim = transactions.find((t: any) => t.id === parseInt(id));

				if (!claim) {
					return res.status(404).json({ message: "Claim not found" });
				}

				// Load the template
				const templatePath = path.join(
					process.cwd(),
					"public",
					"templates",
					"claim.docx"
				);
				const content = fs.readFileSync(templatePath, "binary");
				const zip = new PizZip(content);
				const doc = new Docxtemplater(zip, {
					paragraphLoop: true,
					linebreaks: true,
				});

				// Format currency
				const formatCurrency = (amount: number) =>
					`KSh ${amount.toLocaleString("en-KE", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;

				// Convert amount to words
				const amountInWords =
					numberToWords.toWords(claim.amounts || 0).toUpperCase() +
					" SHILLINGS ONLY";

				// Calculate financial year
				const currentDate = new Date();
				const currentYear = currentDate.getFullYear();
				const fiscalYear =
					currentDate.getMonth() >= 6
						? `${currentYear}/${currentYear + 1}`
						: `${currentYear - 1}/${currentYear}`;

				// Set template data
				const claimData: any = claim;
				doc.render({
					txtname: claim.name || "",
					txtdesignation: claimData.designation || "",
					txtjg: claimData.jobGroup || "",
					txtdate_travel: claimData.travelDate || "",
					txtdate_return: claimData.returnDate || "",
					txtdestination: claimData.destination || "",
					txtdays: claimData.numberOfDays || "",
					txtamount: formatCurrency(claim.amounts || 0),
					txtamount_in_words: amountInWords,
					txtvote: claim.voteId || "",
					txtvoucher: claim.voucherNo || "",
					txtparticulars: claim.particulars || "",
					txtbus: formatCurrency(claim.busFare || 0),
					txttaxi: formatCurrency(claim.taxiFare || 0),
					txtperdiem: formatCurrency(claimData.perDiem || 0),
					txtsubsistence: formatCurrency(claim.subsistence || 0),
					txtfy: claim.fy || fiscalYear,
					txtdate: new Date().toLocaleDateString("en-GB"),
				});

				const buf = doc.getZip().generate({ type: "nodebuffer" });

				// Ensure exports directory exists
				const exportsDir = path.join(process.cwd(), "public", "exports");
				if (!fs.existsSync(exportsDir)) {
					fs.mkdirSync(exportsDir, { recursive: true });
				}

				// Save file
				const filename = `claim_${claim.voucherNo || id}_${Date.now()}.docx`;
				const filepath = path.join(exportsDir, filename);
				fs.writeFileSync(filepath, buf);

				res.json({
					success: true,
					message: "Claim document generated successfully",
					filename,
					downloadUrl: `/exports/${filename}`,
				});
			} catch (error) {
				console.error("Error generating claim document:", error);
				res.status(500).json({ message: "Failed to generate claim document" });
			}
		}
	);

	app.post(
		"/api/accounting/export/payment/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const transactions = await storage.getTransactions({ type: "payment" });
				const payment = transactions.find((t: any) => t.id === parseInt(id));

				if (!payment) {
					return res.status(404).json({ message: "Payment not found" });
				}

				// Load the template
				const templatePath = path.join(
					process.cwd(),
					"public",
					"templates",
					"payment.docx"
				);
				const content = fs.readFileSync(templatePath, "binary");
				const zip = new PizZip(content);
				const doc = new Docxtemplater(zip, {
					paragraphLoop: true,
					linebreaks: true,
				});

				// Format currency
				const formatCurrency = (amount: number) =>
					`KSh ${amount.toLocaleString("en-KE", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;

				// Convert amount to words
				const amountInWords =
					numberToWords.toWords(payment.amounts || 0).toUpperCase() +
					" SHILLINGS ONLY";

				// Calculate financial year
				const currentDate = new Date();
				const currentYear = currentDate.getFullYear();
				const fiscalYear =
					currentDate.getMonth() >= 6
						? `${currentYear}/${currentYear + 1}`
						: `${currentYear - 1}/${currentYear}`;

				// Set template data
				const paymentData: any = payment;
				doc.render({
					txtname: payment.name || "",
					txtdated: payment.dated || new Date().toLocaleDateString("en-GB"),
					txtamount: formatCurrency(payment.amounts || 0),
					txtamount_in_words: amountInWords,
					txtvote: payment.voteId || "",
					txtvoucher: payment.voucherNo || "",
					txtparticulars: payment.particulars || "",
					txtdepartment: paymentData.departmentName || "",
					txtfy: payment.fy || fiscalYear,
					txtallocation: formatCurrency(payment.amountsAllocated || 0),
					txttotal_balance: formatCurrency(payment.balanceAfterCommitted || 0),
				});

				const buf = doc.getZip().generate({ type: "nodebuffer" });

				// Ensure exports directory exists
				const exportsDir = path.join(process.cwd(), "public", "exports");
				if (!fs.existsSync(exportsDir)) {
					fs.mkdirSync(exportsDir, { recursive: true });
				}

				// Save file
				const filename = `payment_${
					payment.voucherNo || id
				}_${Date.now()}.docx`;
				const filepath = path.join(exportsDir, filename);
				fs.writeFileSync(filepath, buf);

				res.json({
					success: true,
					message: "Payment document generated successfully",
					filename,
					downloadUrl: `/exports/${filename}`,
				});
			} catch (error) {
				console.error("Error generating payment document:", error);
				res
					.status(500)
					.json({ message: "Failed to generate payment document" });
			}
		}
	);

	app.patch(
		"/api/accounting/mir/:id/retire",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "accountant") {
					return res.status(403).json({ message: "Access denied" });
				}

				const { id } = req.params;
				const { retirementAmount, retirementDate, retirementVoucherNo } =
					req.body;
				const mirEntry = await storage.retireMIREntry(
					parseInt(id),
					retirementAmount,
					retirementDate,
					retirementVoucherNo
				);
				res.json(mirEntry);
			} catch (error) {
				console.error("Error retiring MIR entry:", error);
				res.status(500).json({ message: "Failed to retire MIR entry" });
			}
		}
	);

	// Employee financial records
	app.get(
		"/api/accounting/employees",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const employees = await storage.getAllEmployees();
				res.json(employees);
			} catch (error) {
				console.error("Error fetching employees:", error);
				res.status(500).json({ message: "Failed to fetch employees" });
			}
		}
	);

	// ========================================
	// ACCOUNTANT-SPECIFIC ROUTES (Frontend compatibility)
	// ========================================
	// Get dashboard stats for A.I.E Holder
	app.get("/api/aie/stats", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "accountant") {
				return res.status(403).json({ message: "Access denied" });
			}

			const transactions = await storage.getTransactions();
			const mirEntries = await storage.getAllMIREntries();
			const budgets = await storage.getAllBudgets();

			const pendingApprovals = transactions.filter(
				(t) => t.state === "pending"
			).length;
			const approvedToday = transactions.filter(
				(t) =>
					t.state === "approved" &&
					t.updatedAt &&
					new Date(t.updatedAt).toDateString() === new Date().toDateString()
			).length;
			const activeMirs = mirEntries.filter(
				(m) => m.status === "pending"
			).length;

			const currentMonth = new Date().getMonth();
			const monthlySpend = transactions
				.filter(
					(t) =>
						t.state === "approved" &&
						t.createdAt &&
						new Date(t.createdAt).getMonth() === currentMonth
				)
				.reduce((sum, t) => sum + (t.amounts || 0), 0);

			const totalBudget = budgets.reduce(
				(sum, b) => sum + (b.estimatedAmount || 0),
				0
			);
			const utilized = transactions
				.filter((t) => t.state === "approved")
				.reduce((sum, t) => sum + (t.amounts || 0), 0);
			const budgetBalance = totalBudget - utilized;
			const utilizationRate =
				totalBudget > 0 ? Math.round((utilized / totalBudget) * 100) : 0;

			res.json({
				pendingApprovals,
				approvedToday,
				activeMirs,
				monthlySpend,
				budgetBalance,
				utilizationRate,
			});
		} catch (error) {
			console.error("Error fetching A.I.E stats:", error);
			res.status(500).json({ message: "Failed to fetch statistics" });
		}
	});
	// Get all claims (transactions with type='claim')
	app.get("/api/accountant/claims", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const transactions = await storage.getTransactions({ type: "claim" });
			res.json(transactions);
		} catch (error) {
			console.error("Error fetching claims:", error);
			res.status(500).json({ message: "Failed to fetch claims" });
		}
	});

	// Get all payments (transactions with type='payment')
	app.get(
		"/api/accountant/payments",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const transactions = await storage.getTransactions({ type: "payment" });
				res.json(transactions);
			} catch (error) {
				console.error("Error fetching payments:", error);
				res.status(500).json({ message: "Failed to fetch payments" });
			}
		}
	);

	// Get all MIR entries
	app.get("/api/accountant/mir", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const mirEntries = await storage.getAllMIREntries();
			res.json(mirEntries);
		} catch (error) {
			console.error("Error fetching MIR entries:", error);
			res.status(500).json({ message: "Failed to fetch MIR entries" });
		}
	});

	// Get all vote accounts
	app.get("/api/accountant/votes", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const voteAccounts = await storage.getAllVoteAccounts();
			res.json(voteAccounts);
		} catch (error) {
			console.error("Error fetching vote accounts:", error);
			res.status(500).json({ message: "Failed to fetch vote accounts" });
		}
	});

	// Get all budgets
	app.get("/api/accountant/budgets", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const budgets = await storage.getAllBudgets();
			res.json(budgets);
		} catch (error) {
			console.error("Error fetching budgets:", error);
			res.status(500).json({ message: "Failed to fetch budgets" });
		}
	});

	// Get all employees for accounting
	app.get(
		"/api/accountant/employees",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !["accountant", "admin"].includes(user.role!)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const employees = await storage.getAllEmployees();
				res.json(employees);
			} catch (error) {
				console.error("Error fetching employees:", error);
				res.status(500).json({ message: "Failed to fetch employees" });
			}
		}
	);

	// Get budget summary for accountant
	app.get("/api/accountant/budget", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !["accountant", "admin"].includes(user.role!)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const budgets = await storage.getAllBudgets();
			const totalBudget = budgets.reduce(
				(sum, b) => sum + (b.estimatedAmount || 0),
				0
			);
			const utilized = 0; // Calculate from transactions if needed

			res.json({
				totalBudget,
				allocated: totalBudget,
				utilized,
				remaining: totalBudget - utilized,
			});
		} catch (error) {
			console.error("Error fetching budget summary:", error);
			res.status(500).json({ message: "Failed to fetch budget summary" });
		}
	});

	// ========================================
	// A.I.E HOLDER ROUTES (Financial approval workflow)
	// ========================================

	// Get dashboard stats for A.I.E Holder
	app.get("/api/aie/stats", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "a.i.e Holder") {
				return res.status(403).json({ message: "Access denied" });
			}

			const transactions = await storage.getTransactions();
			const mirEntries = await storage.getAllMIREntries();
			const budgets = await storage.getAllBudgets();

			const pendingApprovals = transactions.filter(
				(t) => t.state === "pending"
			).length;
			const approvedToday = transactions.filter(
				(t) =>
					t.state === "approved" &&
					t.updatedAt &&
					new Date(t.updatedAt).toDateString() === new Date().toDateString()
			).length;
			const activeMirs = mirEntries.filter(
				(m) => m.status === "pending"
			).length;

			const currentMonth = new Date().getMonth();
			const monthlySpend = transactions
				.filter(
					(t) =>
						t.state === "approved" &&
						t.createdAt &&
						new Date(t.createdAt).getMonth() === currentMonth
				)
				.reduce((sum, t) => sum + (t.amounts || 0), 0);

			const totalBudget = budgets.reduce(
				(sum, b) => sum + (b.estimatedAmount || 0),
				0
			);
			const utilized = transactions
				.filter((t) => t.state === "approved")
				.reduce((sum, t) => sum + (t.amounts || 0), 0);
			const budgetBalance = totalBudget - utilized;
			const utilizationRate =
				totalBudget > 0 ? Math.round((utilized / totalBudget) * 100) : 0;

			res.json({
				pendingApprovals,
				approvedToday,
				activeMirs,
				monthlySpend,
				budgetBalance,
				utilizationRate,
			});
		} catch (error) {
			console.error("Error fetching A.I.E stats:", error);
			res.status(500).json({ message: "Failed to fetch statistics" });
		}
	});

	// Get all approval requests for A.I.E Holder
	app.get("/api/aie/requests", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "a.i.e Holder") {
				return res.status(403).json({ message: "Access denied" });
			}

			const transactions = await storage.getTransactions();
			res.json(transactions);
		} catch (error) {
			console.error("Error fetching approval requests:", error);
			res.status(500).json({ message: "Failed to fetch approval requests" });
		}
	});

	// Get MIR overview for A.I.E Holder (same as accountant)
	app.get("/api/aie/mir", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || user.role !== "a.i.e Holder") {
				return res.status(403).json({ message: "Access denied" });
			}

			const mirEntries = await storage.getAllMIREntries();
			res.json(mirEntries);
		} catch (error) {
			console.error("Error fetching MIR entries:", error);
			res.status(500).json({ message: "Failed to fetch MIR entries" });
		}
	});

	// ========================================
	// RECORDS MANAGEMENT SYSTEM (RMS) ROUTES
	// ========================================

	// Helper function to check RMS access
	const hasRmsAccess = (role: string) => {
		return [ "recordsOfficer","boardSecretary","chiefOfficer","boardChair", "boardCommittee","HR", "admin", "board",
		].includes(role);
	};
	// Create/Upload new document (Records Officer)
	app.post(
		"/api/rms/documents",
		isAuthenticated,
		upload.single("document"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (
					!user ||
					(user.role !== "recordsOfficer" && user.role !== "chiefOfficer")
				) {
					return res.status(403).json({
						message:
							"Access denied. Only Records Officer or Chief Officer can register documents.",
					});
				}

				const documentData = {
					...req.body,
					filePath: req.file?.path,
					createdBy: req.user.id,
					currentHandler: req.user.role === "recordsOfficer" ? "recordsOfficer" : "chiefOfficer",
					status: "received" as const,
				};

				const document = await storage.createRmsDocument(documentData);
				// Log the action
				await storage.createRmsWorkflowLog({
					documentId: document.id,
					fromStatus: null,
					toStatus: "received",
					fromHandler: null,
					toHandler: "recordsOfficer",
					actionBy: req.user.id,
					actionType: "Document Received",
					notes: `Document registered: ${document.subject}`,
				});

				res.json(document);
			} catch (error) {
				console.error("Error creating document:", error);
				res.status(500).json({ message: "Failed to create document" });
			}
		}
	);
	// Get all RMS documents with optional filters and enrichment
	app.get("/api/rms/documents", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !hasRmsAccess((user as any).role)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const { status, priority, includeDetails } = req.query;
			const documents = await storage.getRmsDocuments(status, priority);

			// If includeDetails flag is true, enrich each document
			if (includeDetails === "true") {
				const enrichedDocuments = await Promise.all(
					documents.map(async (doc: any) => {
						const [comments, workflowLog] = await Promise.all([
							storage.getRmsComments(doc.id),
							storage.getRmsWorkflowLog(doc.id),
						]);
						return { document: doc, comments, workflowLog };
					})
				);
				return res.json(enrichedDocuments);
			}

			// Otherwise, return plain document list
			return res.json(documents);
		} catch (error) {
			console.error("Error fetching documents:", error);
			res.status(500).json({ message: "Failed to fetch documents" });
		}
	});

	// Get all documents (role-based filtering)
	app.get("/api/rms/documents", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !hasRmsAccess((user as any).role)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const { status, priority } = req.query;

			const documents = await storage.getRmsDocuments(status, priority);
			res.json(documents);
		} catch (error) {
			console.error("Error fetching documents:", error);
			res.status(500).json({ message: "Failed to fetch documents" });
		}
	});

	// Get single document with comments and workflow log
	app.get("/api/rms/documents/:id", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !hasRmsAccess((user as any).role)) {
				return res.status(403).json({ message: "Access denied" });
			}
			const documentId = parseInt(req.params.id);
			const document = await storage.getRmsDocument(documentId);
			const comments = await storage.getRmsComments(documentId);
			const workflowLog = await storage.getRmsWorkflowLog(documentId);

			res.json({ document, comments, workflowLog });
		} catch (error) {
			console.error("Error fetching document:", error);
			res.status(500).json({ message: "Failed to fetch document" });
		}
	});

	// Forward document to next handler (Records Officer can attach file and update our reference)
	app.post(
		"/api/rms/documents/:id/forward",
		isAuthenticated,
		upload.single("document"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !hasRmsAccess((user as any).role)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const documentId = parseInt(req.params.id);
				const { toHandler, toStatus, notes, referenceNumber } = req.body;

				const document = await storage.getRmsDocument(documentId);

				// Update document
				const updates: any = {
					status: toStatus,
					currentHandler: toHandler,
					updatedAt: new Date(),
				};
				if (req.file) {
					updates.filePath = req.file.path;
				}
				if (referenceNumber) {
					updates.referenceNumber = referenceNumber;
				}

				const updated = await storage.updateRmsDocument(documentId, updates);

				// Log the action
				await storage.createRmsWorkflowLog({
					documentId,
					fromStatus: document.status,
					toStatus,
					fromHandler: document.currentHandler,
					toHandler,
					actionBy: req.user.id,
					actionType: "Document Forwarded",
					notes,
				});

				res.json(updated);
			} catch (error) {
				console.error("Error forwarding document:", error);
				res.status(500).json({ message: "Failed to forward document" });
			}
		}
	);

	// Chief Officer: attach file (optional) and send document to Records Officer
	app.post(
		"/api/rms/documents/:id/send-to-records",
		isAuthenticated,
		upload.single("document"),
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "chiefOfficer") {
					return res.status(403).json({
						message: "Access denied. Only Chief Officer can send to records.",
					});
				}

				const documentId = parseInt(req.params.id);
				const { notes, yourRef } = req.body;

				const document = await storage.getRmsDocument(documentId);

				// Update document: attach filePath if provided and set handler/status to records
				const updates: any = {
					status: "sent_to_records",
					currentHandler: "recordsOfficer",
					updatedAt: new Date(),
				};
				if (req.file) {
					updates.filePath = req.file.path;
				}

				const updated = await storage.updateRmsDocument(documentId, updates);

				// Log the action
				await storage.createRmsWorkflowLog({
					documentId,
					fromStatus: document.status,
					toStatus: "sent_to_records",
					fromHandler: document.currentHandler,
					toHandler: "recordsOfficer",
					actionBy: req.user.id,
					actionType: "Sent to Records",
					notes: notes,
				});

				// If the Chief Officer provided an external reference, save it as a comment
				if (yourRef) {
					await storage.createRmsComment({
						documentId,
						userId: req.user.id,
						userRole: user.role,
						commentType: "external_ref",
						comment: yourRef,
					});
				}

				res.json(updated);
			} catch (error) {
				console.error("Error sending document to records:", error);
				res.status(500).json({ message: "Failed to send document to records" });
			}
		}
	);

	// Get comments for a document
	app.get(
		"/api/rms/comments/:documentId",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !hasRmsAccess((user as any).role)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const documentId = parseInt(req.params.documentId);
				const comments = await storage.getRmsComments(documentId);
				res.json(comments);
			} catch (error) {
				console.error("Error fetching comments:", error);
				res.status(500).json({ message: "Failed to fetch comments" });
			}
		}
	);

	// Add comment/remark to document
	app.post("/api/rms/documents/:id/comments",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !hasRmsAccess((user as any).role)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const documentId = parseInt(req.params.id);

				// Get current document to get its status
				const document = await storage.getRmsDocument(documentId);
				if (!document) {
					return res.status(404).json({ message: "Document not found" });
				}

				const commentData = {
					documentId,
					userId: req.user.id,
					userRole: user.role,
					...req.body,
				};

				const comment = await storage.createRmsComment(commentData);

				// Log the action - status doesn't change when just adding a comment
				await storage.createRmsWorkflowLog({
					documentId,
					fromStatus: document.status,
					toStatus: document.status,
					fromHandler: document.currentHandler,
					toHandler: document.currentHandler,
					actionBy: req.user.id,
					actionType: `Comment Added (${req.body.commentType})`,
					notes: req.body.comment.substring(0, 100),
				});

				res.json(comment);
			} catch (error) {
				console.error("Error adding comment:", error);
				res.status(500).json({ message: "Failed to add comment" });
			}
		}
	);

	// Update document status and details
	app.patch(
		"/api/rms/documents/:id",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || !hasRmsAccess((user as any).role)) {
					return res.status(403).json({ message: "Access denied" });
				}

				const documentId = parseInt(req.params.id);
				const updates = { ...req.body, updatedAt: new Date() };

				const updated = await storage.updateRmsDocument(documentId, updates);
				res.json(updated);
			} catch (error) {
				console.error("Error updating document:", error);
				res.status(500).json({ message: "Failed to update document" });
			}
		}
	);

	// Dispatch document (Records Officer)
	app.post(
		"/api/rms/documents/:id/dispatch",
		isAuthenticated,
		async (req: any, res) => {
			try {
				const user = await storage.getUser(req.user.id);
				if (!user || user.role !== "recordsOfficer") {
					return res.status(403).json({
						message:
							"Access denied. Only Records Officer can dispatch documents.",
					});
				}

				const documentId = parseInt(req.params.id);
				const { decisionSummary, outcome } = req.body;

				// Try to read current document status for better workflow logging
				let fromStatus = "decision_made";
				try {
					if (typeof storage.getRmsDocument === "function") {
						const current = await storage.getRmsDocument(documentId);
						if (current && current.status) fromStatus = current.status;
					}
				} catch (err) {
					// ignore - we'll fallback to a sensible default
				}

				let updated: any;
				if (outcome === "file") {
					// File the document in the registry
					updated = await storage.updateRmsDocument(documentId, {
						status: "filed",
						// record that registry is now the current handler; schema does not have filedDate/filedBy
						currentHandler: "registry",
						decisionSummary,
						updatedAt: new Date(),
					});

					// Log the filing action
					await storage.createRmsWorkflowLog({
						documentId,
						fromStatus,
						toStatus: "filed",
						fromHandler: user.role,
						toHandler: "registry",
						actionBy: req.user.id,
						actionType: "Document Filed",
						notes: "Filed in registry",
					});
				} else {
					// Default to dispatch
					updated = await storage.updateRmsDocument(documentId, {
						status: "dispatched",
						dispatchedDate: new Date(),
						dispatchedBy: req.user.id,
						decisionSummary,
						updatedAt: new Date(),
					});

					// Log the dispatch action
					await storage.createRmsWorkflowLog({
						documentId,
						fromStatus,
						toStatus: "dispatched",
						fromHandler: user.role,
						toHandler: "initiator",
						actionBy: req.user.id,
						actionType: "Document Dispatched",
						notes: "Decision communicated to initiator",
					});
				}

				res.json(updated);
			} catch (error) {
				console.error("Error dispatching document:", error);
				res.status(500).json({ message: "Failed to dispatch document" });
			}
		}
	);
	// Get RMS dashboard statistics
	app.get("/api/rms/stats", isAuthenticated, async (req: any, res) => {
		try {
			const user = await storage.getUser(req.user.id);
			if (!user || !hasRmsAccess((user as any).role)) {
				return res.status(403).json({ message: "Access denied" });
			}

			const documents = await storage.getRmsDocuments();

			const stats = {
				total: documents.length,
				received: documents.filter((d) => d.status === "received").length,
				inProgress: documents.filter((d) =>
					[
						"forwarded_to_secretary",
						"commented_by_secretary",
						"sent_to_chair",
						"commented_by_chair",
						"sent_to_hr",
						"sent_to_committee",
						"agenda_set",
					].includes(d.status)
				).length,
				atBoardMeeting: documents.filter((d) => d.status === "board_meeting")
					.length,
				decided: documents.filter((d) => d.status === "decision_made").length,
				dispatched: documents.filter((d) => d.status === "dispatched").length,
				filed: documents.filter((d) => d.status === "filed").length,
				urgent: documents.filter((d) => d.priority === "urgent").length,
				high: documents.filter((d) => d.priority === "high").length,
				chairCommented: documents.filter(
					(d) => d.priority === "commented_by_chair"
				).length,
			};

			res.json(stats);
		} catch (error) {
			console.error("Error fetching RMS stats:", error);
			res.status(500).json({ message: "Failed to fetch statistics" });
		}
	});
// Get DIAL stats
  app.get("/api/dial/stats",isAuthenticated, async (req: any, res) => {
	try {
	  const userId = req.query.userId as string | undefined;
	  const stats = await storage.getDialStats(userId);
	  res.json(stats);
	} catch (error) {
	  console.error("Error fetching stats:", error);
	  res.status(500).json({ error: "Failed to fetch stats" });
	}
  });

  // Get all DIAL records (with optional filtering)
  app.get("/api/dial", isAuthenticated, async (req: any, res: any) => {
	try {
	  const { userId, status } = req.query;

	  let records;
	  if (userId) {
		records = await storage.getDialRecordsByUserId(userId as string);
	  } else if (status) {
		records = await storage.getDialRecordsByStatus(status as string);
	  } else {
		records = await storage.getAllDialRecords();
	  }

	  res.json(records);
	} catch (error) {
	  console.error("Error fetching DIAL records:", error);
	  res.status(500).json({ error: "Failed to fetch records" });
	}
  });

  // Get single DIAL record
  app.get("/api/dial/:id", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const record = await storage.getDialRecord(id);

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  res.json(record);
	} catch (error) {
	  console.error("Error fetching DIAL record:", error);
	  res.status(500).json({ error: "Failed to fetch record" });
	}
  });

  // Create new DIAL record
  app.post("/api/dial", isAuthenticated, async (req: any, res: any) => {
	try {
	  const { spouses, dependents, statementItems, ...dialData } = req.body;

	  // Default userId for demo (in production, get from auth session)
	  const userId = dialData.userId || "mock-user-id";

	  // Create the main DIAL record
	  const record = await storage.createDialRecord({
		...dialData,
		userId,
		status: "draft",
	  });

	  // Create related records
	  if (spouses && Array.isArray(spouses)) {
		for (const spouse of spouses) {
		  await storage.createSpouse({
			...spouse,
			dialRecordId: record.id,
		  });
		}
	  }

	  if (dependents && Array.isArray(dependents)) {
		for (const dependent of dependents) {
		  await storage.createDependent({
			...dependent,
			dialRecordId: record.id,
		  });
		}
	  }

	  if (statementItems && Array.isArray(statementItems)) {
		for (const item of statementItems) {
		  await storage.createStatementItem({
			...item,
			dialRecordId: record.id,
		  });
		}
	  }

	  // Create audit log
	  await createAudit(record.id, "created", userId);

	  // Fetch the complete record with relations
	  const completeRecord = await storage.getDialRecord(record.id);
	  res.status(201).json(completeRecord);
	} catch (error) {
	  console.error("Error creating DIAL record:", error);
	  res.status(500).json({ error: "Failed to create record" });
	}
  });

  // Update DIAL record
  app.patch("/api/dial/:id", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const { spouses, dependents, statementItems, ...dialData } = req.body;

	  // Default userId for demo
	  const userId = dialData.userId || "mock-user-id";

	  // Update the main DIAL record
	  const record = await storage.updateDialRecord(id, dialData);

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  // Update spouses - delete all and recreate
	  if (spouses && Array.isArray(spouses)) {
		await storage.deleteSpousesByDialRecordId(id);
		for (const spouse of spouses) {
		  await storage.createSpouse({
			...spouse,
			dialRecordId: id,
		  });
		}
	  }

	  // Update dependents - delete all and recreate
	  if (dependents && Array.isArray(dependents)) {
		await storage.deleteDependentsByDialRecordId(id);
		for (const dependent of dependents) {
		  await storage.createDependent({
			...dependent,
			dialRecordId: id,
		  });
		}
	  }

	  // Update statement items - delete all and recreate
	  if (statementItems && Array.isArray(statementItems)) {
		await storage.deleteStatementItemsByDialRecordId(id);
		for (const item of statementItems) {
		  await storage.createStatementItem({
			...item,
			dialRecordId: id,
		  });
		}
	  }

	  // Create audit log
	  await createAudit(id, "updated", userId);

	  // Fetch the complete record with relations
	  const completeRecord = await storage.getDialRecord(id);
	  res.json(completeRecord);
	} catch (error) {
	  console.error("Error updating DIAL record:", error);
	  res.status(500).json({ error: "Failed to update record" });
	}
  });

  // Submit DIAL record for review
  app.post("/api/dial/:id/submit", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const userId = "mock-user-id"; // In production, get from auth session

	  // Only set properties that exist on the update type
	  const record = await storage.updateDialRecord(id, {
		status: "submitted",
	  });

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  // Create audit log
	  await createAudit(id, "submitted", userId);

	  const completeRecord = await storage.getDialRecord(id);
	  res.json(completeRecord);
	} catch (error) {
	  console.error("Error submitting DIAL record:", error);
	  res.status(500).json({ error: "Failed to submit record" });
	}
  });

  // Approve DIAL record
  app.post("/api/dial/:id/approve", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const userId = "mock-user-id"; // In production, get from auth session
	  const { comments } = req.body;

	  // Generate acknowledgment number
	  const acknowledgmentNumber = `ACK-${Date.now()}-${id}`;

	  const updates: any = {
		status: "locked",
		approvedAt: new Date(),
		approvedBy: userId,
		lockedAt: new Date(),
		acknowledgmentNumber,
	  };
	  const record = await storage.updateDialRecord(id, updates);

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  // Create audit log
	  await createAudit(id, "approved", userId, { comments });

	  const completeRecord = await storage.getDialRecord(id);
	  res.json(completeRecord);
	} catch (error) {
	  console.error("Error approving DIAL record:", error);
	  res.status(500).json({ error: "Failed to approve record" });
	}
  });

  // Reject DIAL record (request changes)
  app.post("/api/dial/:id/reject", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const userId = "mock-user-id"; // In production, get from auth session
	  const { comments } = req.body;

	  const record = await storage.updateDialRecord(id, {
		status: "draft",
	  });

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  // Create audit log
	  await createAudit(id, "rejected", userId, { comments });

	  const completeRecord = await storage.getDialRecord(id);
	  res.json(completeRecord);
	} catch (error) {
	  console.error("Error rejecting DIAL record:", error);
	  res.status(500).json({ error: "Failed to reject record" });
	}
  });

  // Get audit logs for a DIAL record
  app.get("/api/dial/:id/audit", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const logs = await storage.getAuditLogsByDialRecordId(id);
	  res.json(logs);
	} catch (error) {
	  console.error("Error fetching audit logs:", error);
	  res.status(500).json({ error: "Failed to fetch audit logs" });
	}
  });

  // Upload files for a DIAL record
  app.post("/api/dial/:id/files", isAuthenticated, upload.single("file"), async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const userId = "mock-user-id"; // In production, get from auth session

	  if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		  }
	
		  // Calculate file hash
		  const fileBuffer = await fs.promises.readFile(req.file.path);
		  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
	
		  const uploadedFile = await storage.createUploadedFile({
			dialRecordId: id,
			fileName: req.file.originalname,
			fileType: req.file.mimetype,
			fileSize: req.file.size,
			filePath: req.file.path,
			fileHash: hash,
			uploadedBy: userId,
		  });
	
		  res.status(201).json(uploadedFile);
		} catch (error) {
	  console.error("Error uploading file:", error);
	  res.status(500).json({ error: "Failed to upload file" });
	}
  });

  // Get files for a DIAL record
  app.get("/api/dial/:id/files",isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const files = await storage.getUploadedFilesByDialRecordId(id);
	  res.json(files);
	} catch (error) {
	  console.error("Error fetching files:", error);
	  res.status(500).json({ error: "Failed to fetch files" });
	}
  });

  // Download file
  app.get("/api/dial/:id/files/:fileId", isAuthenticated, async (req: any, res: any) => {
	try {
	  const fileId = parseInt(req.params.fileId);
	  const files = await storage.getUploadedFilesByDialRecordId(parseInt(req.params.id));
	  const file = files.find(f => f.id === fileId);

	  if (!file) {
		return res.status(404).json({ error: "File not found" });
	  }

	  res.download(file.filePath, file.fileName);
	} catch (error) {
	  console.error("Error downloading file:", error);
	  res.status(500).json({ error: "Failed to download file" });
	}
  });

  // Generate PDF (placeholder - would use a proper PDF library in production)
  app.get("/api/dial/:id/pdf", isAuthenticated, async (req: any, res: any) => {
	try {
	  const id = parseInt(req.params.id);
	  const record = await storage.getDialRecord(id);

	  if (!record) {
		return res.status(404).json({ error: "Record not found" });
	  }

	  // Create audit log
	  const userId = "mock-user-id";
	  await createAudit(id, "printed", userId);

	  // In production, this would generate a proper PDF using a library like PDFKit or Puppeteer
	  // For now, we'll return a simple text response
	  res.setHeader("Content-Type", "application/pdf");
	  res.setHeader("Content-Disposition", `attachment; filename="declaration-${id}.pdf"`);
	  
	  const pdfContent = `
DECLARATION OF INCOME, ASSETS & LIABILITIES

Officer: ${record.user?.firstName} ${record.user?.surname}
Statement Date: ${record.statementDate}
Period: ${record.periodStart} to ${record.periodEnd}

Status: ${record.status}
Acknowledgment Number: ${record.acknowledgmentNumber || "N/A"}

This is a placeholder PDF. In production, this would be a properly formatted PDF document.
	  `;

	  res.send(Buffer.from(pdfContent));
	} catch (error) {
	  console.error("Error generating PDF:", error);
	  res.status(500).json({ error: "Failed to generate PDF" });
	}
  });
	const httpServer = createServer(app);
	return httpServer;
}