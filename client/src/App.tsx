import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Gallery from "@/pages/Gallery";
import FAQs from "@/pages/FAQs";
import Notices from "@/pages/Notices";
import Jobs from "@/pages/Jobs";

// Applicant pages
import ApplicantDashboard from "@/pages/applicant/Dashboard";
import ApplicantProfile from "@/pages/applicant/Profile";
import ApplicantApplications from "@/pages/applicant/Applications";
import ApplicantDocuments from "@/pages/applicant/Documents";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminJobManagement from "@/pages/admin/JobManagement";
import AdminApplications from "@/pages/admin/Applications";
import AdminReports from "@/pages/admin/Reports";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminSettings from "@/pages/admin/Settings";

// Board pages
import BoardDashboard from "@/pages/board/Dashboard";
import BoardShortlisting from "@/pages/board/Shortlisting";
import BoardInterviews from "@/pages/board/Interviews";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/faqs" component={FAQs} />
      <Route path="/notices" component={Notices} />
      <Route path="/jobs" component={Jobs} />

      {/* Applicant routes */}
      <ProtectedRoute path="/dashboard" component={ApplicantDashboard} allowedRoles={["applicant"]} />
      <ProtectedRoute path="/profile" component={ApplicantProfile} allowedRoles={["applicant"]} />
      <ProtectedRoute path="/applications" component={ApplicantApplications} allowedRoles={["applicant"]} />
      <ProtectedRoute path="/documents" component={ApplicantDocuments} allowedRoles={["applicant"]} />

      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/jobs" component={AdminJobManagement} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/applications" component={AdminApplications} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/notifications" component={AdminNotifications} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} allowedRoles={["admin"]} />

      {/* Board routes */}
      <ProtectedRoute path="/board" component={BoardDashboard} allowedRoles={["board"]} />
      <ProtectedRoute path="/board/shortlisting" component={BoardShortlisting} allowedRoles={["board"]} />
      <ProtectedRoute path="/board/interviews" component={BoardInterviews} allowedRoles={["board"]} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
