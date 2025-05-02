import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  BarChart3,
  Briefcase,
  Calendar,
  Edit,
  Trophy,
  User as UserIcon,
} from "lucide-react";

interface UserProfileSummaryProps {
  compact?: boolean;
}

export function UserProfileSummary({
  compact = false,
}: UserProfileSummaryProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  // Format user role for display
  const formatRole = (role: string) => {
    switch (role) {
      case "creator":
        return {
          label: "Project Creator",
          icon: <Briefcase className="h-4 w-4 mr-1.5" />,
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        };
      case "joiner":
        return {
          label: "Project Joiner",
          icon: <UserIcon className="h-4 w-4 mr-1.5" />,
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
      case "both":
        return {
          label: "Creator & Joiner",
          icon: <Trophy className="h-4 w-4 mr-1.5" />,
          color:
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        };
      default:
        return {
          label: "User",
          icon: <UserIcon className="h-4 w-4 mr-1.5" />,
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        };
    }
  };

  // Format experience level for display
  const formatExperience = (level: string) => {
    switch (level) {
      case "beginner":
        return {
          label: "Beginner",
          color:
            "bg-green-400 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
      case "intermediate":
        return {
          label: "Intermediate",
          color:
            "bg-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      case "advanced":
        return {
          label: "Advanced",
          color:
            "bg-orange-400 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        };
      case "expert":
        return {
          label: "Expert",
          color: "bg-red-400 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
      default:
        return {
          label: "Not specified",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        };
    }
  };

  const role = formatRole(user.role || "");
  const experience = formatExperience(user.experienceLevel || "");

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || user.username}
                  className="w-full h-full object-cover"
                />
              ) : user.role === "creator" ? (
                <Briefcase className="h-5 w-5" />
              ) : user.role === "joiner" ? (
                <UserIcon className="h-5 w-5" />
              ) : (
                <Trophy className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {user.name || user.username}
              </h3>
              <Badge variant="outline" className={`text-xs ${role.color}`}>
                {role.icon}
                {role.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="h-7 w-7" />
              )}
            </div>
            <div>
              <CardTitle>{user.name || user.username}</CardTitle>
              <CardDescription>
                {user.bio || "No bio provided yet"}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={role.color}>
            {role.icon}
            {role.label}
          </Badge>
          {user.experienceLevel && (
            <Badge variant="outline" className={experience.color}>
              {experience.label}
            </Badge>
          )}
          {user.weeklyAvailability && (
            <Badge variant="outline">
              <Calendar className="h-4 w-4 mr-1.5" />
              {user.weeklyAvailability} hrs/week
            </Badge>
          )}
        </div>

        {user.skills && user.skills.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {user.interests && user.interests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Interests</h4>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/profile")}
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
