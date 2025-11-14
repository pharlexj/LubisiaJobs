import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dials/app-sidebar";
import { ThemeToggle } from "@/components/dials/theme-toggle";
import { UserMenu } from "@/components/dials/user-menu";
import { AuthProvider } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dials/dashboard";
import DeclarationForm from "@/pages/dials/declaration-form";
import DeclarationView from "@/pages/dials/declaration-view";
import ReviewQueue from "@/pages/dials/review-queue";
import Login from "@/pages/login";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ProtectedRoute({
	component: Component,
}: {
	component: () => JSX.Element;
}) {
	const { user } = useAuth();
	const [, navigate] = useLocation();

	useEffect(() => {
		if (!user) {
			navigate("/login");
		}
	}, [user, navigate]);

	if (!user) {
		return null;
	}

	return <Component />;
}

function Router() {
	return (
		<Switch>
			<Route path="/login" component={Login} />
			<Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
			<Route path="/dial/new">
				{() => <ProtectedRoute component={DeclarationForm} />}
			</Route>
			<Route path="/dial/:id/edit">
				{() => <ProtectedRoute component={DeclarationForm} />}
			</Route>
			<Route path="/dial/:id">
				{() => <ProtectedRoute component={DeclarationView} />}
			</Route>
			<Route path="/review">
				{() => <ProtectedRoute component={ReviewQueue} />}
			</Route>
			<Route component={NotFound} />
		</Switch>
	);
}

function AppLayout({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const [location] = useLocation();

	if (!user || location === "/login") {
		return <>{children}</>;
	}

	const style = {
		"--sidebar-width": "16rem",
		"--sidebar-width-icon": "3rem",
	};

	return (
		<SidebarProvider style={style as React.CSSProperties}>
			<div className="flex h-screen w-full">
				<AppSidebar />
				<div className="flex flex-col flex-1 overflow-hidden">
					<header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
						<SidebarTrigger data-testid="button-sidebar-toggle" />
						<div className="flex items-center gap-3">
							<ThemeToggle />
							<UserMenu />
						</div>
					</header>
					<main className="flex-1 overflow-auto">
						<div className="container mx-auto px-6 py-8">{children}</div>
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<AuthProvider>
					<AppLayout>
						<Router />
					</AppLayout>
				</AuthProvider>
				<Toaster />
			</TooltipProvider>
		</QueryClientProvider>
	);
}

export default App;
