import { Application, Project, Task, Team } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  Clock,
  UsersRound,
  FolderKanban,
  Briefcase,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  projects?: Project[];
  applications?: Application[];
  team?: Team[];
  tasks?: Task[];
  userRole?: string | null;
}

export function DashboardStats({
  projects = [],
  applications = [],
  team = [],
  tasks = [],
  userRole = null,
}: DashboardStatsProps) {
  // Count projects by status
  const projectsCreated = projects.filter(
    (p) => p.creatorId === (userRole === "creator" || userRole === "both")
  ).length;
  const projectsJoined = projects.filter(
    (p) => p.creatorId !== (userRole === "joiner" || userRole === "both")
  ).length;

  // Count applications by status
  const pendingApplications = applications.filter(
    (a) => a.status === "pending"
  ).length;
  const acceptedApplications = applications.filter(
    (a) => a.status === "accepted"
  ).length;

  // Count tasks by status
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "inProgress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  // Determine which stats to display based on user role
  const isCreator = userRole === "creator" || userRole === "both";
  const isJoiner = userRole === "joiner" || userRole === "both";

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    className,
    children,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: "positive" | "negative" | "neutral";
    className?: string;
    children?: React.ReactNode;
  }) => (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow duration-200",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );

  const StatusIndicator = ({
    color,
    text,
    count,
  }: {
    color: string;
    text: string;
    count: number;
  }) => (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm text-muted-foreground">{text}</span>
      <span className="font-medium">{count}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isCreator && (
        <StatCard
          title="Projects Created"
          value={projectsCreated}
          icon={Briefcase}
          className="border-blue-200 bg-blue-50/50"
        />
      )}

      {isJoiner && (
        <StatCard
          title="Projects Joined"
          value={projectsJoined}
          icon={UsersRound}
          className="border-green-200 bg-green-50/50"
        />
      )}

      <StatCard
        title="Total Applications"
        value={applications.length}
        icon={FolderKanban}
        className="border-purple-200 bg-purple-50/50"
      >
        <div className="space-y-2">
          <StatusIndicator
            color="bg-amber-500"
            text="Pending"
            count={pendingApplications}
          />
          <StatusIndicator
            color="bg-emerald-500"
            text="Accepted"
            count={acceptedApplications}
          />
        </div>
      </StatCard>

      <StatCard
        title="Total Tasks"
        value={tasks.length}
        icon={Activity}
        className="border-rose-200 bg-rose-50/50"
      >
        <div className="space-y-2">
          <StatusIndicator color="bg-sky-500" text="Todo" count={todoTasks} />
          <StatusIndicator
            color="bg-violet-500"
            text="In Progress"
            count={inProgressTasks}
          />
          <StatusIndicator
            color="bg-teal-500"
            text="Completed"
            count={completedTasks}
          />
        </div>
      </StatCard>

      {team.length > 0 && (
        <StatCard
          title="Team Members"
          value={team.length}
          icon={UsersRound}
          className="border-amber-200 bg-amber-50/50"
        />
      )}
    </div>
  );
}
