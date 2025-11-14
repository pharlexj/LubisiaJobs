import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@shared/schema1";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	role: z.enum(["officer", "reviewer", "admin", "auditor"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
	const [, navigate] = useLocation();
	const { setUser } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			role: "officer",
		},
	});

	const onSubmit = (data: LoginFormData) => {
		setIsLoading(true);

		// Mock login - in production this would call a real API
		const mockUser: User = {
			id: "mock-user-id",
			email: data.email,
			firstName: "John",
			surname: "Doe",
			profileImageUrl: null,
			nationalId: "12345678901",
			idPassportType: "National ID",
			phoneNumber: "+254712345678",
			passwordHash: "hashed",
			role: data.role,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		setUser(mockUser);

		setTimeout(() => {
			setIsLoading(false);
			navigate("/");
		}, 500);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<div className="flex justify-center mb-6">
						<div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
							<FileText className="h-8 w-8 text-primary-foreground" />
						</div>
					</div>
					<h1 className="text-4xl font-semibold">DIAL System</h1>
					<p className="text-base text-muted-foreground mt-2">
						Declaration of Income, Assets & Liabilities
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-medium">Sign In</CardTitle>
						<CardDescription>
							Enter your credentials to access the system
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="your.email@example.com"
													{...field}
													data-testid="input-email"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Role (for demo purposes)</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger data-testid="select-role">
														<SelectValue placeholder="Select your role" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="officer">Officer</SelectItem>
													<SelectItem value="reviewer">Reviewer</SelectItem>
													<SelectItem value="admin">Admin</SelectItem>
													<SelectItem value="auditor">Auditor</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									className="w-full"
									disabled={isLoading}
									data-testid="button-login"
								>
									{isLoading ? "Signing in..." : "Sign In"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>

				<p className="text-xs text-center text-muted-foreground">
					Demo version - For production use, proper authentication is required
				</p>
			</div>
		</div>
	);
}
