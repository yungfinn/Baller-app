import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Preferences from "@/pages/preferences";
import CreateEvent from "@/pages/create-event";
import MyEvents from "@/pages/my-events";
import Profile from "@/pages/profile";
import VerifyIdentity from "@/pages/verify-identity";
import IdentityVerification from "@/pages/identity-verification";
import SubmitLocation from "@/pages/submit-location";
import TermsOfUse from "@/pages/terms-of-use";
import EventCreated from "@/pages/event-created";
import EventChat from "@/pages/event-chat";
import AdminPanel from "@/pages/admin-panel";
import AdminQuickApprove from "@/pages/admin-quick-approve";
import TestUpload from "@/pages/test-upload";
import UploadTest from "@/pages/upload-test";
import AdminSimple from "@/pages/admin-simple";
import TestCreateEvent from "@/pages/test-create";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-futbol text-white text-sm"></i>
          </div>
          <div className="text-xl font-bold text-gray-900 mb-2">SportMate</div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/terms" component={TermsOfUse} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      {/* Public routes available without authentication */}
      <Route path="/admin-panel" component={AdminSimple} />
      <Route path="/upload-test" component={UploadTest} />
      <Route path="/test-create" component={TestCreateEvent} />
      <Route path="/identity-verification" component={IdentityVerification} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/preferences" component={Preferences} />
          <Route path="/create" component={CreateEvent} />
          <Route path="/create-event" component={CreateEvent} />
          <Route path="/my-events" component={MyEvents} />
          <Route path="/profile" component={Profile} />
          <Route path="/verify-identity" component={VerifyIdentity} />
          <Route path="/identity-verification" component={IdentityVerification} />
          <Route path="/submit-location" component={SubmitLocation} />
          <Route path="/event-created" component={EventCreated} />
          <Route path="/event/:id/chat" component={EventChat} />
          <Route path="/admin-quick" component={AdminQuickApprove} />
          <Route path="/test-upload" component={TestUpload} />
        </>
      )}
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
