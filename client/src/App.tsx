import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import OnboardingContainer from "@/components/onboarding/onboarding-container";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CreatorDashboard from "@/pages/creator-dashboard";
import JoinerDashboard from "@/pages/joiner-dashboard";
import ProjectDiscovery from "@/pages/project-discovery";
import ProjectDetail from "@/pages/project-detail";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";

// Wrapped protected content with onboarding container
function ProtectedContent({ children }: { children: React.ReactNode }) {
  return <OnboardingContainer>{children}</OnboardingContainer>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute
        path="/dashboard"
        component={() => (
          <ProtectedContent>
            <Dashboard />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/creator"
        component={() => (
          <ProtectedContent>
            <CreatorDashboard inTabView={false} />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/joiner"
        component={() => (
          <ProtectedContent>
            <JoinerDashboard inTabView={false} />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/discover"
        component={() => (
          <ProtectedContent>
            <ProjectDiscovery />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/projects/:id"
        component={() => (
          <ProtectedContent>
            <ProjectDetail />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/profile"
        component={() => (
          <ProtectedContent>
            <ProfilePage />
          </ProtectedContent>
        )}
      />
      <ProtectedRoute
        path="/settings"
        component={() => (
          <ProtectedContent>
            <SettingsPage />
          </ProtectedContent>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
