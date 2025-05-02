import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/dashboard/project-card";
import { useLocation } from "wouter";
import { Loader2, Filter, X, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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

export default function ProjectDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch all available projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Extract all unique skills from projects for filter dropdown
  const allSkills = projects
    ? [...new Set(projects.flatMap((project) => project.skillsNeeded || []))]
    : [];

  // Filter projects based on search query and selected skills
  const filteredProjects = projects
    ? projects.filter((project) => {
        const matchesSearch =
          searchQuery === "" ||
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSkills =
          selectedSkills.length === 0 ||
          selectedSkills.some((skill) => project.skillsNeeded?.includes(skill));

        return matchesSearch && matchesSkills;
      })
    : [];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Discover Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Find projects that match your skills and interests
            </p>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search by title or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[160px]">
                  <Filter className="h-4 w-4" />
                  Filter by Skills
                  {selectedSkills.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSkills.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Skills</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allSkills.length > 0 ? (
                  allSkills.map((skill) => (
                    <DropdownMenuCheckboxItem
                      key={skill}
                      checked={selectedSkills.includes(skill)}
                      onCheckedChange={() => toggleSkill(skill)}
                    >
                      {skill}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No skills available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {(searchQuery || selectedSkills.length > 0) && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {selectedSkills.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => toggleSkill(skill)}
                    className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 h-4 w-4 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  showApplyButton
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No matching projects found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg">
                  {searchQuery || selectedSkills.length > 0
                    ? "Try adjusting your search terms or filters to find more projects."
                    : "There are no available projects at the moment. Check back soon!"}
                </p>
                {(searchQuery || selectedSkills.length > 0) && (
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
