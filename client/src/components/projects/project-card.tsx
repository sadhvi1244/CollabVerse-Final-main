import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Project, User, Team } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationForm } from "@/components/applications/application-form";
import {
  Calendar,
  ExternalLink,
  Users,
  Clock,
  LayersIcon,
  Target,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  showApplyButton?: boolean;
  isCreator?: boolean;
}

export function ProjectCard({
  project,
  showApplyButton = true,
  isCreator = false,
}: ProjectCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  
  // Fetch the project creator's data
  const { data: creatorData } = useQuery({
    queryKey: [`/api/users/${project.creatorId}`],
    queryFn: getQueryFn(),
    enabled: !!project.creatorId,
  });
  
  const creator = creatorData as User;
  
  // Fetch team members
  const { data: teamData } = useQuery({
    queryKey: [`/api/projects/${project.id}/team`],
    queryFn: getQueryFn(),
    enabled: !!project.id,
  });
  
  const teamMembers = (teamData || []) as Team[];
  
  // Get the maximum team size (for display purposes)
  const MAX_TEAM_SIZE = 4;
  
  // Determine the stage badge color
  const getStageBadgeStyle = () => {
    switch (project.stage) {
      case "ideation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "mvp":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "beta":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "scaling":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "";
    }
  };
  
  // Handle navigation to project details
  const navigateToProjectDetails = () => {
    navigate(`/projects/${project.id}`);
  };
  
  return (
    <Card className="w-full h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              {creator && (
                <div className="flex items-center">
                  <Avatar className="h-5 w-5 mr-1.5">
                    <AvatarFallback>
                      {creator.name?.substring(0, 2).toUpperCase() || 
                       creator.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                    {creator.profilePicture && <AvatarImage src={creator.profilePicture} alt={creator.name} />}
                  </Avatar>
                  {creator.name || creator.username}
                </div>
              )}
            </div>
          </div>
          
          <Badge className={getStageBadgeStyle()}>
            {project.stage?.charAt(0).toUpperCase() + project.stage?.slice(1) || "Ideation"}
          </Badge>
        </div>
        
        <CardDescription className="line-clamp-2 mt-1">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3 flex-grow">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.skillsNeeded?.map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-col space-y-2 text-sm">
          {project.timeline && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1.5" />
              {project.timeline}
            </div>
          )}
          
          {project.focus && (
            <div className="flex items-center text-muted-foreground">
              <Target className="h-4 w-4 mr-1.5" />
              {project.focus}
            </div>
          )}
          
          {project.website && (
            <a 
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Project Website
            </a>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Team Size: {teamMembers.length}/{MAX_TEAM_SIZE}
              </span>
            </div>
            
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 4).map((teamMember, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {teamMember.user?.name?.substring(0, 2).toUpperCase() || 
                     teamMember.user?.username?.substring(0, 2).toUpperCase() || 
                     "U"}
                  </AvatarFallback>
                  {teamMember.user?.profilePicture && (
                    <AvatarImage src={teamMember.user.profilePicture} alt={teamMember.user.name} />
                  )}
                </Avatar>
              ))}
              {teamMembers.length > 4 && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    +{teamMembers.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={navigateToProjectDetails}
          >
            View Details
          </Button>
          
          {showApplyButton && !isCreator && user && user.id !== project.creatorId && (
            <Button 
              className="flex-1"
              onClick={() => setIsApplicationModalOpen(true)}
            >
              Apply to Join
            </Button>
          )}
          
          {isCreator && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={navigateToProjectDetails}
            >
              Manage Project
            </Button>
          )}
        </div>
      </CardFooter>
      
      {user && (
        <ApplicationForm
          projectId={project.id}
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          projectSkills={project.skillsNeeded || []}
        />
      )}
    </Card>
  );
}