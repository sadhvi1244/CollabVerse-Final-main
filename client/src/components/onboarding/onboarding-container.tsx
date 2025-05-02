import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import UserOnboarding from "./user-onboarding";
import { getQueryFn } from "@/lib/queryClient";

type ProfileData = {
  user: any;
  projects: any[];
  applications: any[];
  notifications: any[];
  teams: any[];
  profileComplete: boolean;
};

export default function OnboardingContainer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Fetch profile data to check if onboarding is needed
  const { data, isLoading, error } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Only fetch when user is logged in
    enabled: !!user,
  });
  
  useEffect(() => {
    if (!isLoading && data) {
      setShowOnboarding(!data.profileComplete);
      setIsLoaded(true);
    }
  }, [isLoading, data]);
  
  // Function to handle completion of onboarding
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  
  // Show loading state while checking profile
  if (user && !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }
  
  // Show onboarding if profile is incomplete
  if (showOnboarding) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
  }
  
  // Otherwise show children (normal app content)
  return <>{children}</>;
}