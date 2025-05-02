import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskCard } from "@/components/dashboard/task-card";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Loader2 } from "lucide-react";

// Import react-beautiful-dnd dynamically to avoid SSR issues
const ReactBeautifulDND = () => import('react-beautiful-dnd').then(mod => {
  const { DragDropContext, Droppable, Draggable } = mod;
  return { DragDropContext, Droppable, Draggable };
});

interface KanbanBoardProps {
  projectId: number;
  isCreator?: boolean;
}

type TaskStatus = "todo" | "inProgress" | "done";

export function KanbanBoard({ projectId, isCreator = false }: KanbanBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: undefined as number | undefined,
  });
  const [localTasks, setLocalTasks] = useState<{
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  }>({
    todo: [],
    inProgress: [],
    done: [],
  });
  
  // Connect to WebSocket for real-time updates
  const { socket, connected } = useWebSocket();
  
  // Fetch tasks from the API
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
    onSuccess: (data) => {
      // Group tasks by status
      const groupedTasks = {
        todo: data.filter((task) => task.status === "todo"),
        inProgress: data.filter((task) => task.status === "inProgress"),
        done: data.filter((task) => task.status === "done"),
      };
      setLocalTasks(groupedTasks);
    },
  });
  
  // Listen for task updates via WebSocket
  useEffect(() => {
    if (socket && connected) {
      // Join the project room for task updates
      socket.send(JSON.stringify({
        type: 'join-project',
        projectId,
        data: { userId: user?.id }
      }));
      
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'task-update' && data.projectId === projectId) {
            // Update the task in the local state
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      socket.addEventListener('message', handleMessage);
      
      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, connected, projectId, user, queryClient]);
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/tasks", {
        projectId,
        title: newTask.title,
        description: newTask.description,
        status: "todo",
        priority: newTask.priority,
        assignedTo: newTask.assignedTo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setShowAddTaskDialog(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: undefined,
      });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message || "There was an error creating your task.",
        variant: "destructive",
      });
    },
  });
  
  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      return await apiRequest("PUT", `/api/tasks/${taskId}`, {
        status,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      // The local state will be updated by the drag handler
      if (!connected) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      }
    },
    onError: (error: Error) => {
      // Revert the change if the API call fails
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      toast({
        title: "Failed to update task",
        description: error.message || "There was an error updating the task status.",
        variant: "destructive",
      });
    },
  });
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // If there's no destination or the item was dropped back in the same place
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // Get the task that was dragged
    const taskId = parseInt(draggableId.split('-')[1]);
    const sourceStatus = source.droppableId as TaskStatus;
    const destinationStatus = destination.droppableId as TaskStatus;
    
    // Update local state first for immediate feedback
    const newLocalTasks = { ...localTasks };
    const [movedTask] = newLocalTasks[sourceStatus].splice(source.index, 1);
    movedTask.status = destinationStatus;
    newLocalTasks[destinationStatus].splice(destination.index, 0, movedTask);
    setLocalTasks(newLocalTasks);
    
    // Then update the server
    updateTaskStatusMutation.mutate({ 
      taskId, 
      status: destinationStatus 
    });
    
    // If WebSocket is connected, broadcast the update
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'task-update',
        projectId,
        data: {
          ...movedTask,
          status: destinationStatus,
          updatedAt: new Date().toISOString()
        }
      }));
    }
  };
  
  const getColumnTitle = (status: TaskStatus): string => {
    switch (status) {
      case "todo": return "To Do";
      case "inProgress": return "In Progress";
      case "done": return "Done";
      default: return "";
    }
  };
  
  // For server-side rendering compatibility
  const [isDndReady, setIsDndReady] = useState(false);
  useEffect(() => {
    setIsDndReady(true);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Task Board</h2>
        <Button onClick={() => setShowAddTaskDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
      
      {isDndReady ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["todo", "inProgress", "done"] as TaskStatus[]).map((status) => (
              <div key={status} className="flex flex-col">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-md font-medium">
                      {getColumnTitle(status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({localTasks[status].length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Droppable droppableId={status}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="min-h-[200px]"
                        >
                          {localTasks[status].map((task, index) => (
                            <Draggable 
                              key={`task-${task.id}`} 
                              draggableId={`task-${task.id}`} 
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    projectId={projectId}
                                    onEdit={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] })}
                                    onDelete={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] })}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Add Task Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createTaskMutation.mutate()}
              disabled={!newTask.title.trim() || createTaskMutation.isPending}
            >
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
