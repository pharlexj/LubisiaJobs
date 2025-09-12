import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress"; // ✅ import Progress bar

// ------------------ Signup Schema ------------------ //
const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    idPassportType: z
      .enum(["national_id", "passport", "alien_id"], {
        required_error: "Please select ID/Passport type",
      })
      .optional(),
    idPassportNumber: z.string().min(5, "ID/Passport number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
    profilePhoto: z.instanceof(File).optional(),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupData = z.infer<typeof signupSchema>;

// ------------------ Password Strength Utility ------------------ //
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

// ------------------ Component ------------------ //
export default function AuthDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      idPassportType: undefined,
      idPassportNumber: "",
      password: "",
      confirmPassword: "",
      profilePhoto: undefined,
      agreeToTerms: false,
    },
  });

  const onSubmit: SubmitHandler<SignupData> = async (data) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      if (data.idPassportType) formData.append("idPassportType", data.idPassportType);
      formData.append("idPassportNumber", data.idPassportNumber);
      formData.append("password", data.password);
      if (data.profilePhoto) formData.append("profilePhoto", data.profilePhoto);

      await new Promise((resolve) => setTimeout(resolve, 1200)); // simulate API

      toast({
        title: "Account Created",
        description: "Your account has been successfully created!",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(passwordValue);

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create an Account</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              {...register("password")}
              onChange={(e) => setPasswordValue(e.target.value)}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}

            {/* ✅ Password Strength Meter */}
            {passwordValue && (
              <div className="mt-2">
                <Progress value={strength.value} className="h-2" />
                <p className={`text-sm mt-1 font-medium ${strength.color}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Other fields remain unchanged... */}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
