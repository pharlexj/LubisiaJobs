import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { useFileUpload, uploadConfigs } from "@/hooks/useFileUpload";

export default function ProfileSettingsDrawer({ open, onClose, user }: any) {
  const { toast } = useToast();
  const { refreshUser } = useAuthContext();

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [profilePhoto, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { uploadFile, state } = useFileUpload((uploadConfigs as any))

  
  // ✅ Password strength logic
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isStrong =
    password &&
    Object.values(passwordChecks).every((check) => check === true);

  // ✅ Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    if (password) formData.append("password", password);
    if (profilePhoto) formData.append("profilePhoto", profilePhoto);

    try {
      const res = await fetch("/api/users/update-profile", {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });

      await refreshUser(); // ✅ Update sidebar avatar + email instantly
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ✅ Profile Photo with Preview */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>

            {profilePhoto ? (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            ) : user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt="Current"
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 text-sm">
                No photo
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm mt-2"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </div>

          {/* ✅ Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* ✅ Password with Strength Validation */}
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {password && (
              <div className="text-sm mt-2 space-y-1">
                <p className="font-medium text-gray-700">
                  Password must include:
                </p>
                <ul className="space-y-1 text-gray-600">
                  {[
                    { key: "length", label: "At least 8 characters" },
                    { key: "upper", label: "An uppercase letter (A-Z)" },
                    { key: "lower", label: "A lowercase letter (a-z)" },
                    { key: "number", label: "A number (0-9)" },
                    { key: "special", label: "A special symbol (!@#$%)" },
                  ].map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2">
                      {passwordChecks[key as keyof typeof passwordChecks] ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
                {isStrong && (
                  <p className="text-green-600 font-medium mt-1">
                    ✅ Strong password!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
