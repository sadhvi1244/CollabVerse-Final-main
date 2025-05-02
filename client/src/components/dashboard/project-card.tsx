import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@shared/schema";
import { CalendarClock, Users, Layers, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const PROJECT_STAGES = {
  ideation: {
    label: "Ideation",
    color: "from-purple-600 to-purple-400",
    bg: "bg-purple-100/80 dark:bg-purple-900/30",
  },
  mvp: {
    label: "MVP",
    color: "from-blue-600 to-blue-400",
    bg: "bg-blue-100/80 dark:bg-blue-900/30",
  },
  beta: {
    label: "Beta",
    color: "from-amber-600 to-amber-400",
    bg: "bg-amber-100/80 dark:bg-amber-900/30",
  },
  scaling: {
    label: "Scaling",
    color: "from-green-600 to-green-400",
    bg: "bg-green-100/80 dark:bg-green-900/30",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  hover: { scale: 1.02 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  showApplyButton?: boolean;
  creatorName?: string;
}

export function ProjectCard({
  project,
  onClick,
  showApplyButton,
  creatorName,
}: ProjectCardProps) {
  const cardRef = useRef(null);
  const { user } = useAuth();
  const stage = project.stage || "ideation";
  const stageInfo = PROJECT_STAGES[stage as keyof typeof PROJECT_STAGES];
  const isCreator = user?.id === project.creatorId;

  useEffect(() => {
    // GSAP animation for subtle background gradient movement
    gsap.to(cardRef.current, {
      backgroundPosition: "100% 50%",
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "none",
    });
  }, []);

  const getCreatorLabel = () => {
    if (isCreator) return "Your Project";
    if (creatorName) return `by ${creatorName}`;
    return `by User ${project.creatorId}`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      className="relative overflow-hidden group"
    >
      <div
        ref={cardRef}
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-10 group-hover:opacity-20 transition-opacity",
          stageInfo.color
        )}
      />

      <Card
        className={cn(
          "relative backdrop-blur-sm bg-background/70 dark:bg-background/80",
          stageInfo.bg
        )}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-start gap-2"
          >
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {project.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className="truncate">{getCreatorLabel()}</span>
                <span>•</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </p>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Badge className="flex items-center gap-1 py-1 rounded-lg bg-gradient-to-r shadow-sm backdrop-blur-sm">
                <Layers className="h-4 w-4" />
                <span className="font-semibold">{stageInfo.label}</span>
              </Badge>
            </motion.div>
          </motion.div>
        </CardHeader>

        <CardContent className="px-4 py-2">
          <AnimatePresence>
            {project.focus && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium mb-2 inline-flex items-center gap-2"
              >
                <span className="bg-primary/10 px-2 py-1 rounded-md text-primary">
                  {project.focus}
                </span>
              </motion.p>
            )}
          </AnimatePresence>

          <motion.p
            variants={itemVariants}
            className="text-sm text-foreground/80 mb-4 line-clamp-3 leading-relaxed"
          >
            {project.description}
          </motion.p>

          {project.skillsNeeded?.length > 0 && (
            <motion.div variants={itemVariants} className="mb-4">
              <div className="text-xs font-medium mb-2 text-muted-foreground">
                Required Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {project.skillsNeeded.slice(0, 4).map((skill, i) => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Badge
                      variant="outline"
                      className="px-3 py-1 rounded-full bg-background/50 backdrop-blur-sm shadow-sm"
                    >
                      {skill}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-4 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>1-4 members</span>
            </div>
            {project.timeline && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>{project.timeline}</span>
              </div>
            )}
          </motion.div>
        </CardContent>

        <CardFooter className="px-4 pb-3 pt-1">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              onClick={onClick}
              className="w-full rounded-lg py-5 font-semibold transition-all"
              variant="gradient"
            >
              {showApplyButton ? "Explore Opportunity" : "View Details"}
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
