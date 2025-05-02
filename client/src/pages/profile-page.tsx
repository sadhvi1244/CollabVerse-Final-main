import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PencilLine, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Waves } from "@/components/ui/waves-background";

function WavesDemo() {
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-[400px] bg-background/80 rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <Waves
          lineColor={
            theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
          }
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <div className="relative z-10 p-8">
        <h3 className="text-2xl font-bold">Interactive Waves</h3>
        <p className="text-muted-foreground">
          Move your mouse to interact with the waves
        </p>
      </div>
    </div>
  );
}

export { WavesDemo };
interface CreatorDashboardProps {
  inTabView?: boolean;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    skills: [] as string[],
    interests: [] as string[],
    experienceLevel: "",
    weeklyAvailability: 0,
    profilePicture: "",
  });

  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    onSuccess: (data) => {
      if (data?.user) {
        setProfileData({
          name: data.user.name || "",
          email: data.user.email || "",
          skills: data.user.skills || [],
          interests: data.user.interests || [],
          experienceLevel: data.user.experienceLevel || "",
          weeklyAvailability: data.user.weeklyAvailability || 0,
          profilePicture: data.user.profilePicture || "",
        });
      }
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsString = e.target.value;
    const skillsArray = skillsString
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    setProfileData((prev) => ({ ...prev, skills: skillsArray }));
  };

  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interestsString = e.target.value;
    const interestsArray = interestsString
      .split(",")
      .map((interest) => interest.trim())
      .filter(Boolean);
    setProfileData((prev) => ({ ...prev, interests: interestsArray }));
  };

  const handleSaveProfile = () => {
    updateMutation.mutate(profileData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarFallback className="text-2xl">
                      {profileData.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                    {profileData.profilePicture && (
                      <AvatarImage
                        src={profileData.profilePicture}
                        alt={profileData.name}
                      />
                    )}
                  </Avatar>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!isEditing}
                  >
                    Change Photo
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Projects Created
                      </p>
                      <p className="text-2xl font-semibold">
                        {userData?.projects?.filter(
                          (p) => p.creatorId === userData.user.id
                        ).length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Projects Joined
                      </p>
                      <p className="text-2xl font-semibold">
                        {userData?.projects?.filter(
                          (p) => p.creatorId !== userData.user.id
                        ).length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Applications
                      </p>
                      <p className="text-2xl font-semibold">
                        {userData?.applications?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => (window.location.href = "/settings")}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Account Preferences</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Theme, notifications, security
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() =>
                        (window.location.href = "/settings?tab=security")
                      }
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Security Settings</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Change password, security options
                        </span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and preferences
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() =>
                      isEditing ? handleSaveProfile() : setIsEditing(true)
                    }
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      {isEditing ? (
                        <Input
                          id="skills"
                          name="skills"
                          value={profileData.skills.join(", ")}
                          onChange={handleSkillsChange}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2 py-2">
                          {profileData.skills.length > 0 ? (
                            profileData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              No skills added yet
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interests">
                        Interests (comma separated)
                      </Label>
                      {isEditing ? (
                        <Input
                          id="interests"
                          name="interests"
                          value={profileData.interests.join(", ")}
                          onChange={handleInterestsChange}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2 py-2">
                          {profileData.interests.length > 0 ? (
                            profileData.interests.map((interest, index) => (
                              <Badge key={index} variant="outline">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              No interests added yet
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="experienceLevel">
                          Experience Level
                        </Label>
                        <select
                          id="experienceLevel"
                          name="experienceLevel"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={profileData.experienceLevel}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weeklyAvailability">
                          Weekly Availability (hours)
                        </Label>
                        <Input
                          id="weeklyAvailability"
                          name="weeklyAvailability"
                          type="number"
                          min="1"
                          max="60"
                          value={profileData.weeklyAvailability}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
