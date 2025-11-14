// src/components/ProtectedRoute.tsx
import { Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import React from "react";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
	path: string;
	component: React.ComponentType;
	allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	path,
	component: Component,
	allowedRoles,
}) => {
	const { user, isLoading } = useAuth();

	// While the auth request is in-flight, don't render the NotFound fallback
	// for protected routes — render an empty placeholder so the Switch doesn't
	// fall through to the global NotFound. Once loading finishes we'll either
	// render the protected component or the NotFound component.
	if (isLoading) {
		// Use the Notices-style phone loading: Navigation + several pulsing Cards
		const Loader = () => (
			<div className="min-h-screen bg-neutral-50">
				<Navigation />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="animate-pulse space-y-6">
						{[...Array(5)].map((_, i) => (
							<Card key={i}>
								<CardContent className="p-6">
									<div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
									<div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
									<div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
									<div className="h-4 bg-gray-200 rounded w-2/3"></div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);

		return <Route path={path} component={Loader} />;
	}

	if (user && allowedRoles.includes(user?.role)) {
		return <Route path={path} component={() => <Component />} />;
	}

	return <Route path={path} component={NotFound} />;
};
