import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Eye, EyeOff, Phone, Shield, Upload, User } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress"; // ✅ import Progress bar

const loginSchema = z.object({
email: z.string().email('Invalid email address'),
password: z.string().min(6, 'Password must be at least 6 characters'),
rememberMe: z.boolean().default(false),
});
// ------------------ Signup Schema ------------------ //
const signupSchema = z.object({
firstName: z.string().min(2, "First name must be at least 2 characters"),
surname: z.string().min(2, "Last name must be at least 2 characters"),
email: z.string().email("Invalid email address"),
phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
idPassportType: z.enum(["national_id", "passport", "alien_id"], {
required_error: "Please select ID/Passport type",}).optional(),
nationalId: z.string().min(5, "ID/Passport number is required"),
password: z.string().min(8, "Password must be at least 8 characters")
.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
confirmPassword: z.string(),
// 🔄 Fix: allow File, null, or undefined
profilePhoto: z.custom<File | null>((val) => val === null || val instanceof File).optional(),
agreeToTerms: z.boolean()
.refine((val) => val === true, "You must agree to the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
message: "Passwords don't match", path: ["confirmPassword"],});

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", value: 33, color: "bg-red-500" };
  if (score === 3 || score === 4)
    return { label: "Medium", value: 66, color: "bg-yellow-500" };
  return { label: "Strong", value: 100, color: "bg-green-600" };
}
const otpSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'signup' | 'otp' | 'mobile';
  onModeChange: (mode: 'login' | 'signup' | 'otp' | 'mobile') => void;
  handleClick: (mode: 'login') => void;
}


export default function AuthDrawer({ open, onOpenChange, mode, onModeChange, handleClick }: AuthDrawerProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [,setLocation] = useLocation();
  const { phoneNumber, setPhoneNumber, openAuth, closeAuth } = useAuthContext();

// --- inside AuthDrawer.tsx ---

  // 1) make handleAuthError set pendingPhoneNumber too
  function handleAuthError(err: any, openAuth: (mode: "login" | "signup" | "mobile" | "otp", phone?: string) => void) {
  // Normalize the structure
  const payload = err?.body || err;
  const topStatus = err?.status || payload?.status;
  const phone = payload?.phoneNumber || err?.phoneNumber;

  if (topStatus === "phone_verification_required") {
    // ✅ Set phone so resend + OTP form use correct number
    if (phone) setPhoneNumber(phone);
    toast({
      title: "Verification Required",
      description:
        payload?.instructions ||
        payload?.message ||
        "Please verify your phone number to continue.",
    });
    
    openAuth("otp", phone);
    return;
  }

    if (topStatus === 401 || err?.statusText === "Unauthorized") {
      closeAuth();
    // 🔥 Invalid credentials
    toast({
      title: "Invalid Credentials",
      description: "The email or password you entered is incorrect.",
      variant: "destructive",
    });
    loginForm.reset({
    email: "",
    password: "",
    rememberMe: false,
  });
  setPasswordValue("");
    return;
  }

  // Default fallback
  toast({
    title: "Authentication Error",
    description: payload?.message || err?.message || "Unexpected authentication error.",
    variant: "destructive",
  });
}

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  // Types
  type SignupData = z.infer<typeof signupSchema>;
  type OtpData = z.infer<typeof otpSchema>;
 // --- Helper: refresh session ---
  const refreshSession = async () => {
    const data = await apiRequest("GET", "/api/auth/me");
    queryClient.setQueryData(["/api/auth/me"], data);
    return data;
  };
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      phoneNumber: '',
      idPassportType: undefined,
      nationalId: '',
      password: '',
      confirmPassword: '',
      profilePhoto: undefined,
      agreeToTerms: false,
    },
  });
  
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      phoneNumber: '',
      otp: '',
    },
  });
  // --- Login Mutation ---
  type LoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};
const loginMutation = useMutation({
  mutationFn: async (data: LoginInput) => apiRequest("POST", "/api/auth/login", data),
  onSuccess: async () => {
    try {
      // Small delay ensures cookies and session are synced before fetching
      await new Promise((r) => setTimeout(r, 400));

      // Get the full session payload (includes verifiedPhone)
      const session = await apiRequest("GET", "/api/auth/me");
      const user = session?.user;
      const verifiedPhone = session?.verifiedPhone;

      // Cache user session globally
      queryClient.setQueryData(["auth", "me"], session);

      // ✅ Determine if user’s phone is verified
      const phoneVerified = verifiedPhone?.verified === true;

      if (!phoneVerified && user?.role === "applicant") {
        toast({
          title: "Phone Verification Required",
          description:
            "Please verify your phone number using the 6-digit code sent to your phone.",
        });

        // Open the OTP drawer prefilled with user’s number
        setPhoneNumber(
          verifiedPhone?.phoneNumber || user?.phoneNumber || ""
        );
        setShowOtpStep(true);
        onModeChange("otp"); // show OTP step within drawer
        return;
      }

      // ✅ If verified, close auth and redirect properly
      closeAuth();
      toast({
        title: "Login Successful",
        description: `Welcome, ${user?.firstName || "User"}!`,
      });
      // Redirect (default /dashboard)
      const redirectUrl = session.redirectUrl || "/dashboard";
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error("Login flow error:", err);

      let parsed = err;
      try {
        if (err?.json) parsed = err.json;
        else if (typeof err === "string") parsed = JSON.parse(err);
        else if (err?.response?.data) parsed = err.response.data;
      } catch {
        parsed = err;
      }

      handleAuthError(parsed, openAuth);
    }
  },

  onError: (err: any) => {
    console.error("Login failed:", err);
    // 🔥 Distinguish between invalid credentials (401 from /login)
    handleAuthError(err, openAuth);
  },
});


 // --- Signup Mutation ---
const signupMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  onSuccess: (data) => {
    const { user } = data;

    toast({
      title: "Account Created",
      description: "Please verify your phone number with the OTP we sent.",
    });

    // ✅ Open OTP drawer and pass phone number
    openAuth("otp", user.phoneNumber);

    // ✅ Auto-send OTP
    if (user.phoneNumber) {
      sendOtpMutation.mutate(user.phoneNumber);
    }
  },
  onError: (error: any) => {
    toast({
      title: "Signup Failed",
      description: error.message || "Signup failed.",
      variant: "destructive",
    });
  },
});

  // --- Send OTP Mutation ---
  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return await apiRequest("POST", "/api/auth/send-otp", { phoneNumber });
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "Check your phone for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
  const handleSendOtp = () => {
  // Prefer phoneNumber, but fall back to form fields
  const phone =
    phoneNumber ||
    signupForm.watch("phoneNumber") ||
    otpForm.watch("phoneNumber");

  if (!phone) {
    toast({
      title: "Missing Phone Number",
      description: "We could not determine your phone number. Please go back and enter it again.",
      variant: "destructive",
    });
    console.warn("handleSendOtp(): Missing phone number, cannot send OTP");
    return;
  }

  sendOtpMutation.mutate(phone, {
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: `A verification code was sent to ${phone}.`,
      });
    },
    onError: (err: any) => {
      console.error(" Resend OTP failed:", err);
      toast({
        title: "Failed to Send OTP",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
};
  
  // --- Verify OTP Mutation ---
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpData) => {
      return await apiRequest("POST", "/api/auth/verify-otp", data);
    },
    onSuccess: async () => {
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      });

      // ✅ now login
      const data = await refreshSession();
      const { user, redirectUrl } = data;
      queryClient.setQueryData(["auth", "me"], user);
      await refreshSession()
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = "/";
      }

      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP code",
        variant: "destructive",
      });
    },
  });

  // --- Handlers ---
  const handleSignup = (data: SignupData) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("surname", data.surname);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("idPassportType", data?.idPassportType ?? "");
    formData.append("nationalId", data.nationalId);

    if (profilePhoto) {
      formData.append("profilePhoto", profilePhoto);
    }

    signupMutation.mutate(formData);
  };

const handleOtpVerification = (data: z.infer<typeof otpSchema>) => {
  if (!phoneNumber) {
    toast({
      title: "Missing Phone",
      description: "We couldn't find your phone number. Please sign up again.",
      variant: "destructive",
    });
    return;
  }  
  verifyOtpMutation.mutate({
    otp: data.otp,
    phoneNumber: phoneNumber,
  });
};

const handleLogin = (data: z.infer<typeof loginSchema>) => loginMutation.mutate(data);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] ?? null;
  if (file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPEG or PNG image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setProfilePhoto(file);
    signupForm.setValue('profilePhoto', file as any);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  } else {
    // Explicitly set null when no file
    signupForm.setValue('profilePhoto', null as any);
  }
};

  const removePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
    signupForm.setValue('profilePhoto', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };  
  
  const getIdPassportLabel = (type: string) => {
    switch (type) {
      case 'national_id': return 'National ID';
      case 'passport': return 'Passport';
      case 'alien_id': return 'Alien ID';
      default: return 'Select type';
    }
  };

  const handlePhoneLogin = () => {
    window.location.href = '/';
  };
const strength = getPasswordStrength(passwordValue);
  return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full max-w-md flex flex-col h-full">
      <SheetHeader className="flex-shrink-0">
        <SheetTitle>
          {mode === "login"
            ? "Login to Your Account"
            : mode === "signup"
            ? "Create Your Account"
            : "Verify Your Phone"}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto mt-6 pr-2 pb-4">
        {mode === "login" ? (
          // ===================== LOGIN =====================
          <div>
            <p className="text-gray-600 mb-6">
              Welcome back! Please sign in to continue.
            </p>

            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4 max-h-none"
            >
              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  {...loginForm.register("password")}
                  onChange={(e) => {
                    loginForm.setValue("password", e.target.value);
                    setPasswordValue(e.target.value);
                  }}
                />

                {passwordValue && (
                  <div className="mt-2">
                    <Progress value={strength.value} className="h-2" />
                    <p
                      className={`text-xs mt-1 font-medium ${
                        strength.label === "Weak"
                          ? "text-red-600"
                          : strength.label === "Medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {strength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    {...loginForm.register("rememberMe")}
                  />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="text-sm p-0">
                  Forgot password?
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or login with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handlePhoneLogin}
              >
                <Phone className="w-4 h-4 mr-2" /> Phone + OTP
              </Button>
            </div>

            {/* Switch to Signup */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 font-medium text-primary"
                  onClick={() => onModeChange("signup")}
                >
                  Sign up
                </Button>
              </p>
            </div>
          </div>
        ) : mode === "signup" ? (
          // ===================== SIGNUP =====================
          <div>
            <p className="text-gray-600 mb-6">
              {showOtpStep
                ? "Verify your phone number to finish signing up."
                : "Create your account to start applying for jobs."}
            </p>

            {!showOtpStep ? (
              // ---------- SIGNUP FORM ----------
              <form
                onSubmit={signupForm.handleSubmit(handleSignup)}
                className="space-y-4 max-h-none"
              >
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      {...signupForm.register("firstName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="surname">Last Name</Label>
                    <Input
                      id="surname"
                      placeholder="Last Name"
                      {...signupForm.register("surname")}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...signupForm.register("email")}
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0711234567"
                    {...signupForm.register("phoneNumber")}
                  />
                </div>

                {/* ID/Passport */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID/Passport Type</Label>
                    <Select
                      {...signupForm.register("idPassportType")}
                      onValueChange={(value) =>
                        signupForm.setValue("idPassportType", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="alien_id">Alien ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ID/Passport Number</Label>
                    <Input
                      id="nationalId"
                      placeholder="Enter number"
                      {...signupForm.register("nationalId")}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    {...signupForm.register("password")}
                    onChange={(e) => {
                      signupForm.setValue("password", e.target.value);
                      setPasswordValue(e.target.value);
                    }}
                  />
                  {passwordValue && (
                    <div className="mt-2">
                      <Progress value={strength.value} className="h-2" />
                      <p
                        className={`text-xs mt-1 font-medium ${
                          strength.label === "Weak"
                            ? "text-red-600"
                            : strength.label === "Medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {strength.label} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    {...signupForm.register("confirmPassword")}
                  />
                </div>

                {/* Profile Photo */}
                <div>
                  <Label htmlFor="profilePhoto">Profile Photo</Label>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      {photoPreview ? (
                        <AvatarImage src={photoPreview} alt="Profile preview" />
                      ) : (
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="profilePhoto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload Photo
                      </Button>
                      {profilePhoto && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removePhoto}
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={signupForm.watch("agreeToTerms")}
                    onCheckedChange={(checked) =>
                      signupForm.setValue("agreeToTerms", !!checked)
                    }
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the <Button variant="link">Terms</Button>
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    signupMutation.isPending || sendOtpMutation.isPending
                  }
                >
                  {signupMutation.isPending || sendOtpMutation.isPending
                    ? "Sending OTP..."
                    : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              // ---------- OTP STEP ----------
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Verify Your Phone
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We've sent a 6-digit code to {phoneNumber}
                  </p>
                </div>

                <form
                  onSubmit={otpForm.handleSubmit(handleOtpVerification)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      {...otpForm.register("otp")}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      verifyOtpMutation.isPending || !otpForm.watch("otp")
                    }
                    onClick={() =>
                      otpForm.setValue("phoneNumber", phoneNumber)
                    }
                  >
                    {verifyOtpMutation.isPending
                      ? "Verifying..."
                      : "Verify & Continue"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending}
                    >
                      {sendOtpMutation.isPending
                        ? "Sending..."
                        : "Resend Code"}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="ml-4"
                      onClick={() => onModeChange("mobile")}
                    >
                      Change Phone Number
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Switch to Login */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 font-medium text-primary"
                  onClick={() => onModeChange("login")}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </div>
        ) : mode === "otp" ? (
          // ===================== STANDALONE OTP MODE =====================
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Verify Your Phone
              </h3>
              <p className="text-gray-600 text-sm">
                We've sent a 6-digit code to {phoneNumber}
              </p>
            </div>

            <form
              onSubmit={otpForm.handleSubmit(handleOtpVerification)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...otpForm.register("otp")}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  verifyOtpMutation.isPending || !otpForm.watch("otp")
                }
                onClick={() =>
                  otpForm.setValue("phoneNumber", phoneNumber)
                }
              >
                {verifyOtpMutation.isPending
                  ? "Verifying..."
                  : "Verify & Continue"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </form>
          </div>
        ) : mode === "mobile" ? (
          <div>No mode selected</div>        
        ) : null}
      </div>
    </SheetContent>
  </Sheet>
);
}
