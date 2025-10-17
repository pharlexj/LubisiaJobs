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
import AdminSMSCommunications from "@/pages/admin/SMSCommunications";

// Board pages
import BoardDashboard from "@/pages/board/Dashboard";
import BoardShortlisting from "@/pages/board/Shortlisting";
import BoardInterviews from "@/pages/board/Interviews";
import BoardScheduling from "@/pages/board/Scheduling";
import BoardScoring from "@/pages/board/Scoring";
import BoardReports from "@/pages/board/Reports";

// Accountant pages
import AccountantDashboard from "@/pages/accountant/Dashboard";
import AccountantClaims from "@/pages/accountant/Claims";
import AccountantPayments from "@/pages/accountant/Payments";
import AccountantMIR from "@/pages/accountant/MIR";
import AccountantVote from "@/pages/accountant/Vote";
import AccountantBudget from "@/pages/accountant/Budget";
import AccountantEmployees from "@/pages/accountant/Employees";
import AccountantReports from "@/pages/accountant/Reports";
import AccountantCharts from "@/pages/accountant/Charts";
import AccountantSettings from "@/pages/accountant/Settings";

// A.I.E Holder pages
import AIEDashboard from "@/pages/aie/Dashboard";
import AIERequests from "@/pages/aie/Requests";
import AIEMIRR from "@/pages/aie/MIR";

import { useEffect } from "react";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import AuthDrawer from "@/components/layout/AuthDrawer";

function Router() {
  useEffect(() => {
    document.title = "County Website";

    // Set favicon dynamically from uploads
    const setFavicon = () => {
      // Remove any existing favicon links
      const existingLinks = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"]'
      );
      existingLinks.forEach((link) => link.remove());

      // Create new favicon link
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      link.href = "/uploads/favicon.ico";

      // Add fallback if favicon doesn't exist
      link.onerror = () => {
        link.href =
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏛️</text></svg>';
      };

      document.head.appendChild(link);
    };

    setFavicon();
  }, []);

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
      <ProtectedRoute
        path="/dashboard"
        component={ApplicantDashboard}
        allowedRoles={["applicant"]}
      />
      <ProtectedRoute
        path="/profile"
        component={ApplicantProfile}
        allowedRoles={["applicant"]}
      />
      <ProtectedRoute
        path="/applications"
        component={ApplicantApplications}
        allowedRoles={["applicant"]}
      />
      <ProtectedRoute
        path="/documents"
        component={ApplicantDocuments}
        allowedRoles={["applicant"]}
      />

      {/* Admin routes */}
      <ProtectedRoute
        path="/admin"
        component={AdminDashboard}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/jobs"
        component={AdminJobManagement}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/applications"
        component={AdminApplications}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/reports"
        component={AdminReports}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/notifications"
        component={AdminNotifications}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/sms"
        component={AdminSMSCommunications}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/settings"
        component={AdminSettings}
        allowedRoles={["admin"]}
      />

      {/* Board routes */}
      <ProtectedRoute
        path="/board"
        component={BoardDashboard}
        allowedRoles={["board"]}
      />
      <ProtectedRoute
        path="/board/schedule"
        component={BoardScheduling}
        allowedRoles={["board"]}
      />
      <ProtectedRoute
        path="/board/shortlisting"
        component={BoardShortlisting}
        allowedRoles={["board"]}
      />
      <ProtectedRoute
        path="/board/interviews"
        component={BoardInterviews}
        allowedRoles={["board"]}
      />
      <ProtectedRoute
        path="/board/scoring"
        component={BoardScoring}
        allowedRoles={["board"]}
      />
      <ProtectedRoute
        path="/board/reports"
        component={BoardReports}
        allowedRoles={["board"]}
      />

      {/* Accountant routes */}
      <ProtectedRoute
        path="/accountant"
        component={AccountantDashboard}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/claims"
        component={AccountantClaims}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/payments"
        component={AccountantPayments}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/mir"
        component={AccountantMIR}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/vote"
        component={AccountantVote}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/budget"
        component={AccountantBudget}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/employees"
        component={AccountantEmployees}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/reports"
        component={AccountantReports}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/charts"
        component={AccountantCharts}
        allowedRoles={["accountant"]}
      />
      <ProtectedRoute
        path="/accountant/settings"
        component={AccountantSettings}
        allowedRoles={["accountant"]}
      />

      {/* A.I.E Holder routes */}
      <ProtectedRoute
        path="/aie"
        component={AIEDashboard}
        allowedRoles={["a.i.e Holder"]}
      />
      <ProtectedRoute
        path="/aie/requests"
        component={AIERequests}
        allowedRoles={["a.i.e Holder"]}
      />
      <ProtectedRoute
        path="/aie/mir"
        component={AIEMIRR}
        allowedRoles={["a.i.e Holder"]}
      />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthDrawerWrapper() {
  const { open, closeAuth, mode, openAuth, handleClick } = useAuthContext();
  return (
    <AuthDrawer
      open={open}
      onOpenChange={(val) => (val ? null : closeAuth())}
      mode={mode ?? "login"}
      onModeChange={(m) => openAuth(m)}
      handleClick={() => handleClick()}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          {/* ✅ Auth context now wraps everything */}
          <Router />
          <AuthDrawerWrapper />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

