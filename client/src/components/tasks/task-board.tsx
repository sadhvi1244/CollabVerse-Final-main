import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { Task } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TaskBoardProps {
  projectId: number;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("medium");
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
  });

  // Create new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      projectId: number;
      title: string;
      description: string;
      priority: string;
    }) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "tasks"],
      });
      setNewTaskDialogOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
    },
    onError: (error: Error) => {
      toast({
        title: "Task Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: number;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "tasks"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Task Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    createTaskMutation.mutate({
      projectId,
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("taskId"));
    updateTaskMutation.mutate({ taskId, status });
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "text-rose-500 bg-rose-100 hover:bg-rose-200";
      case "medium":
        return "text-amber-500 bg-amber-100 hover:bg-amber-200";
      case "low":
        return "text-emerald-500 bg-emerald-100 hover:bg-emerald-200";
      default:
        return "text-gray-500 bg-gray-100 hover:bg-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Button onClick={() => setNewTaskDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* To Do Column */}
        <div
          className="bg-gray-50 rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "todo")}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">To Do</h3>
            <Badge variant="outline" className="bg-gray-200">
              {getTasksByStatus("todo").length}
            </Badge>
          </div>
          <div className="space-y-3">
            {getTasksByStatus("todo").map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-md p-3 shadow-sm border border-gray-200 cursor-grab"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
            {getTasksByStatus("todo").length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div
          className="bg-gray-50 rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "inProgress")}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">In Progress</h3>
            <Badge variant="outline" className="bg-gray-200">
              {getTasksByStatus("inProgress").length}
            </Badge>
          </div>
          <div className="space-y-3">
            {getTasksByStatus("inProgress").map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-md p-3 shadow-sm border border-gray-200 cursor-grab"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
            {getTasksByStatus("inProgress").length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No tasks in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div
          className="bg-gray-50 rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "done")}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Done</h3>
            <Badge variant="outline" className="bg-gray-200">
              {getTasksByStatus("done").length}
            </Badge>
          </div>
          <div className="space-y-3">
            {getTasksByStatus("done").map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-md p-3 shadow-sm border border-gray-200 cursor-grab"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
            {getTasksByStatus("done").length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No completed tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the project board. Tasks can be dragged between columns as their status changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title
              </label>
              <Input
                id="title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select
                value={newTaskPriority}
                onValueChange={setNewTaskPriority}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Priority Level</SelectLabel>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}