import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertProjectSchema, 
  insertApplicationSchema, 
  insertTaskSchema, 
  insertMessageSchema, 
  insertCalendarEventSchema 
} from "@shared/schema";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    console.log(`Authenticated request from user ID: ${(req.user as any).id}`);
    return next();
  }
  console.log('Authentication failed - user not authenticated');
  res.status(401).json({ message: "Unauthorized" });
}

type WebSocketMessage = {
  type: string;
  projectId?: number;
  data: any;
};

// Send notification to user via WebSocket
const sendWebSocketNotification = (
  userClients: Map<number, WebSocket[]>,
  userId: number,
  notification: any
) => {
  const clients = userClients.get(userId) || [];
  const notificationData = JSON.stringify({
    type: 'new-notification',
    data: notification
  });
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(notificationData);
    }
  }
};

// Setup multer for file uploads
const uploadDir = "./uploads";

// Ensure upload directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(`${uploadDir}/profiles`)) {
  fs.mkdirSync(`${uploadDir}/profiles`, { recursive: true });
}

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${uploadDir}/profiles`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients by projectId and userId
  const projectClients = new Map<number, WebSocket[]>();
  const userClients = new Map<number, WebSocket[]>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        
        // Handle different message types
        if (parsedMessage.type === 'join-project') {
          const userId = parsedMessage.data.userId;
          const projectId = parsedMessage.projectId;
          
          if (userId && projectId) {
            // Add client to project room
            if (!projectClients.has(projectId)) {
              projectClients.set(projectId, []);
            }
            
            projectClients.get(projectId)?.push(ws);
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'joined',
              projectId,
              message: 'Successfully joined project room'
            }));
          }
        }
        else if (parsedMessage.type === 'user-connect') {
          const userId = parsedMessage.data.userId;
          
          if (userId) {
            // Register client for user-specific notifications
            if (!userClients.has(userId)) {
              userClients.set(userId, []);
            }
            
            userClients.get(userId)?.push(ws);
            console.log(`User ${userId} connected for real-time notifications`);
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'user-connected',
              message: 'Successfully connected for user notifications',
              data: { userId }
            }));
            
            // Send any unread notifications count
            const notifications = await storage.getNotificationsByUser(userId);
            const unreadCount = notifications.filter(n => !n.isRead).length;
            
            ws.send(JSON.stringify({
              type: 'notification-count',
              data: { count: unreadCount }
            }));
          }
        }
        else if (parsedMessage.type === 'chat-message' && parsedMessage.projectId) {
          try {
            // Validate message data
            if (!parsedMessage.data || !parsedMessage.data.senderId || !parsedMessage.data.content) {
              console.error('Invalid chat message format:', parsedMessage);
              return;
            }
            
            // Store message in database
            const messageData = parsedMessage.data;
            console.log(`Storing message in DB: Project ${parsedMessage.projectId}, Sender ${messageData.senderId}`);
            
            const newMessage = await storage.createMessage({
              projectId: parsedMessage.projectId,
              senderId: messageData.senderId,
              content: messageData.content
            });
            
            console.log(`Message stored with ID: ${newMessage.id}`);
            
            // Broadcast message to all clients in this project
            const chatClientsArray = projectClients.get(parsedMessage.projectId) || [];
            console.log(`Broadcasting message to ${chatClientsArray.length} clients in project room`);
            
            const messageToSend = JSON.stringify({
              type: 'chat-message',
              projectId: parsedMessage.projectId,
              data: {
                ...messageData,
                id: newMessage.id,
                timestamp: newMessage.timestamp || new Date().toISOString()
              }
            });
            
            let successCount = 0;
            for (const client of chatClientsArray) {
              if (client.readyState === WebSocket.OPEN) {
                try {
                  client.send(messageToSend);
                  successCount++;
                } catch (err) {
                  console.error('Error sending message to client:', err);
                }
              }
            }
            
            console.log(`Successfully sent message to ${successCount}/${chatClientsArray.length} clients`);
          } catch (err) {
            console.error('Error processing chat message:', err);
          }
        }
        else if (parsedMessage.type === 'task-update' && parsedMessage.projectId) {
          // Broadcast task update to all clients in this project
          const taskClients = projectClients.get(parsedMessage.projectId) || [];
          for (const client of taskClients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          }
        }
        else if (parsedMessage.type === 'application-update' && parsedMessage.data) {
          // Handle application status update notification
          const { applicationId, status, projectId, userId, creatorId } = parsedMessage.data;
          
          // Notify the applicant about application status change
          const applicantClients = userClients.get(userId) || [];
          
          const notificationData = JSON.stringify({
            type: 'new-notification',
            data: {
              message: `Your application status has been updated to: ${status}`,
              type: 'application_' + status,
              relatedId: projectId,
              applicationId
            }
          });
          
          for (const client of applicantClients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(notificationData);
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    ws.on('close', () => {
      // Remove client from all project rooms
      projectClients.forEach((clients, id) => {
        const index = clients.indexOf(ws);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });
      
      // Remove from user connections too
      userClients.forEach((clients, id) => {
        const index = clients.indexOf(ws);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });
    });
  });

  // API Routes
  // Projects
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        creatorId: userId
      });
      
      const project = await storage.createProject(projectData);
      
      // Automatically add creator as team owner
      await storage.createTeamMember({
        projectId: project.id,
        userId,
        role: 'owner'
      });
      
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: 'Invalid project data', errors: err.errors });
      } else {
        res.status(500).json({ message: 'Failed to create project' });
      }
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user is creator or admin
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const team = await storage.getTeamMember(projectId, userId);
      if (!team || (team.role !== 'owner' && team.role !== 'admin')) {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  // Applications
  app.post('/api/applications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        userId,
      });

      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: 'Invalid application data', errors: err.errors });
      } else {
        console.error('Error creating application:', err);
        res.status(500).json({ message: 'Failed to create application' });
      }
    }
  });

  // Support both PUT and PATCH for application updates
  app.put('/api/applications/:id', isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, feedback } = req.body;
      
      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Check if user is project creator
      const project = await storage.getProject(application.projectId);
      if (!project || project.creatorId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this application' });
      }
      
      // Update with feedback if provided
      const updateData = { 
        status,
        ...(feedback && { feedback }) 
      };
      
      const updatedApplication = await storage.updateApplication(applicationId, updateData);
      
      // If accepted, add user to team
      if (status === 'accepted') {
        await storage.createTeamMember({
          projectId: application.projectId,
          userId: application.userId,
          role: 'member'
        });
        
        // Create notification for applicant
        const notification = await storage.createNotification({
          userId: application.userId,
          type: 'application_accepted',
          message: `Your application for "${project.title}" was accepted! You can now access the project dashboard.`,
          relatedId: project.id
        });
        
        // Send real-time notification to applicant
        sendWebSocketNotification(
          userClients,
          application.userId, 
          {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: notification.isRead,
            applicationStatus: 'accepted',
            projectId: project.id,
            applicationId
          }
        );
      } else {
        // Create notification for rejected application with feedback if available
        let rejectMessage = `Your application for "${project.title}" was declined.`;
        
        if (feedback) {
          rejectMessage += ` Feedback: ${feedback}`;
        } else {
          rejectMessage += " Your skills may not match the project requirements.";
        }
        
        const notification = await storage.createNotification({
          userId: application.userId,
          type: 'application_rejected',
          message: rejectMessage,
          relatedId: project.id
        });
        
        // Send real-time notification to applicant
        sendWebSocketNotification(
          userClients,
          application.userId, 
          {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: notification.isRead,
            applicationStatus: 'rejected',
            projectId: project.id,
            applicationId
          }
        );
      }
      
      res.json(updatedApplication);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update application' });
    }
  });
  
  // PATCH endpoint for application updates (same logic as PUT)
  app.patch('/api/applications/:id', isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, feedback } = req.body;
      
      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Check if user is project creator
      const project = await storage.getProject(application.projectId);
      if (!project || project.creatorId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this application' });
      }
      
      // Update with feedback if provided
      const updateData = { 
        status,
        ...(feedback && { feedback }) 
      };
      
      const updatedApplication = await storage.updateApplication(applicationId, updateData);
      
      // If accepted, add user to team
      if (status === 'accepted') {
        await storage.createTeamMember({
          projectId: application.projectId,
          userId: application.userId,
          role: 'member'
        });
        
        // Create notification for applicant
        const notification = await storage.createNotification({
          userId: application.userId,
          type: 'application_accepted',
          message: `Your application for "${project.title}" was accepted! You can now access the project dashboard.`,
          relatedId: project.id
        });
        
        // Send real-time notification to applicant
        sendWebSocketNotification(
          userClients,
          application.userId, 
          {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: notification.isRead,
            applicationStatus: 'accepted',
            projectId: project.id,
            applicationId
          }
        );
      } else {
        // Create notification for rejected application with feedback if available
        let rejectMessage = `Your application for "${project.title}" was declined.`;
        
        if (feedback) {
          rejectMessage += ` Feedback: ${feedback}`;
        } else {
          rejectMessage += " Your skills may not match the project requirements.";
        }
        
        const notification = await storage.createNotification({
          userId: application.userId,
          type: 'application_rejected',
          message: rejectMessage,
          relatedId: project.id
        });
        
        // Send real-time notification to applicant
        sendWebSocketNotification(
          userClients,
          application.userId, 
          {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: notification.isRead,
            applicationStatus: 'rejected',
            projectId: project.id,
            applicationId
          }
        );
      }
      
      res.json(updatedApplication);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update application' });
    }
  });
  
  // Get applications for a specific project
  app.get('/api/projects/:id/applications', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user is project creator or team member
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.creatorId !== userId) {
        // Check if user is a team member with admin role
        const team = await storage.getTeamMember(projectId, userId);
        if (!team || team.role !== 'admin') {
          return res.status(403).json({ message: 'Not authorized to view applications for this project' });
        }
      }
      
      const applications = await storage.getApplicationsByProject(projectId);
      
      // Fetch user details for each application
      const enhancedApplications = await Promise.all(applications.map(async (app) => {
        const user = await storage.getUser(app.userId);
        return { ...app, user };
      }));
      
      res.json(enhancedApplications);
    } catch (err) {
      console.error('Error fetching project applications:', err);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });
  
  // Get applications for the authenticated user
  app.get('/api/applications/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const applications = await storage.getApplicationsByUser(userId);
      
      // Fetch project details for each application
      const enhancedApplications = await Promise.all(applications.map(async (app) => {
        const project = await storage.getProject(app.projectId);
        return { ...app, project };
      }));
      
      res.json(enhancedApplications);
    } catch (err) {
      console.error('Error fetching user applications:', err);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  // Tasks
  app.get('/api/projects/:id/tasks', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(projectId, req.user!.id);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
      }
      
      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const taskData = insertTaskSchema.parse(req.body);
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(taskData.projectId, userId);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to create tasks for this project' });
      }
      
      const task = await storage.createTask(taskData);
      
      // If task is assigned to someone, create notification
      if (task.assignedTo) {
        const notification = await storage.createNotification({
          userId: task.assignedTo,
          type: 'task_assigned',
          message: `You've been assigned a new task: "${task.title}"`,
          relatedId: task.id
        });
        
        // Send real-time notification to assigned user
        sendWebSocketNotification(
          userClients,
          task.assignedTo, 
          {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: notification.isRead,
            taskId: task.id,
            projectId: task.projectId
          }
        );
      }
      
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: 'Invalid task data', errors: err.errors });
      } else {
        res.status(500).json({ message: 'Failed to create task' });
      }
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const taskData = req.body;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(task.projectId, req.user!.id);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to update tasks for this project' });
      }
      
      const updatedTask = await storage.updateTask(taskId, {
        ...taskData,
        updatedAt: new Date()
      });
      
      // Broadcast task update to all connected clients
      const taskClientsArray = projectClients.get(task.projectId) || [];
      const messageToSend = JSON.stringify({
        type: 'task-update',
        projectId: task.projectId,
        data: updatedTask
      });
      
      for (const client of taskClientsArray) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageToSend);
        }
      }
      
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  // PATCH for task updates
  app.patch('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const taskData = req.body;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(task.projectId, req.user!.id);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to update tasks for this project' });
      }
      
      const updatedTask = await storage.updateTask(taskId, {
        ...taskData,
        updatedAt: new Date()
      });
      
      // Broadcast task update to all connected clients
      const taskClientsArray = projectClients.get(task.projectId) || [];
      const messageToSend = JSON.stringify({
        type: 'task-update',
        projectId: task.projectId,
        data: updatedTask
      });
      
      for (const client of taskClientsArray) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageToSend);
        }
      }
      
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  // Messages
  app.get('/api/projects/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(projectId, req.user!.id);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to view messages for this project' });
      }
      
      const messages = await storage.getMessagesByProject(projectId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId
      });
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(messageData.projectId, userId);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to send messages to this project' });
      }
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: 'Invalid message data', errors: err.errors });
      } else {
        res.status(500).json({ message: 'Failed to create message' });
      }
    }
  });

  // Calendar Events
  app.get('/api/projects/:id/events', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(projectId, req.user!.id);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to view events for this project' });
      }
      
      const events = await storage.getEventsByProject(projectId);
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.post('/api/events', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const eventData = insertCalendarEventSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      // Check if user is part of the team
      const team = await storage.getTeamMember(eventData.projectId, userId);
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to create events for this project' });
      }
      
      const event = await storage.createEvent(eventData);
      
      // Get all team members to notify them
      const teamMembers = await storage.getTeamMembersByProject(eventData.projectId);
      
      // Create notifications for all team members except the creator
      for (const member of teamMembers) {
        if (member.userId !== userId) {
          const notification = await storage.createNotification({
            userId: member.userId,
            type: 'event_created',
            message: `New event: "${event.title}" has been scheduled`,
            relatedId: event.id
          });
          
          // Send real-time notification to team member
          sendWebSocketNotification(
            userClients,
            member.userId, 
            {
              id: notification.id,
              message: notification.message,
              type: notification.type,
              relatedId: notification.relatedId,
              isRead: notification.isRead,
              eventId: event.id,
              projectId: event.projectId
            }
          );
        }
      }
      
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: 'Invalid event data', errors: err.errors });
      } else {
        res.status(500).json({ message: 'Failed to create event' });
      }
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Check if notification belongs to user
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this notification' });
      }
      
      const updatedNotification = await storage.updateNotification(notificationId, { isRead: true });
      res.json(updatedNotification);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  // Search/Filter Projects
  app.get('/api/search/projects', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      const skills = req.query.skills ? (req.query.skills as string).split(',') : undefined;
      
      const projects = await storage.searchProjects(query, skills);
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: 'Failed to search projects' });
    }
  });

  // User Profile
  // Get user by ID (for public profiles and project creator info)
  app.get('/api/user/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return public user info (omit password)
      const { password, ...publicUserInfo } = user;
      res.json(publicUserInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Profile request for user ID:", userId);
      
      // Fetch the most up-to-date user data from the database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Handle potential database errors by using empty arrays as fallbacks
      let userProjects: { id: number }[] = [];
      let userApplications: any[] = [];
      let userNotifications: any[] = [];
      let teamMemberships = [];
      let joinedProjects = []; // Projects where user is a team member
      
      try {
        userProjects = await storage.getProjectsByUser(userId);
      } catch (error) {
        console.error("Error fetching user projects:", error);
      }
      
      try {
        userApplications = await storage.getApplicationsByUser(userId);
        
        // For accepted applications, get the corresponding projects
        const acceptedApplications = userApplications.filter(app => app.status === "accepted");
        
        for (const app of acceptedApplications) {
          try {
            const project = await storage.getProject(app.projectId);
            if (project && !userProjects.some(p => p.id === project.id)) {
              joinedProjects.push(project);
            }
          } catch (error) {
            console.error(`Error fetching project ${app.projectId} for accepted application:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching user applications:", error);
      }
      
      try {
        userNotifications = await storage.getNotificationsByUser(userId);
      } catch (error) {
        console.error("Error fetching user notifications:", error);
      }
      
      // Get team memberships for all projects (created and joined)
      const allProjects = [...userProjects, ...joinedProjects];
      
      for (const project of allProjects) {
        try {
          const team = await storage.getTeamMembersByProject(project.id);
          teamMemberships.push({
            projectId: project.id,
            members: team
          });
        } catch (error) {
          console.error(`Error fetching team for project ${project.id}:`, error);
        }
      }
      
      // Debug logs
      console.log(`Found ${userProjects.length} projects, ${joinedProjects.length} joined projects, and ${userApplications.length} applications for user ${userId}`);
      
      // Check if profile is complete for onboarding flow
      const isProfileComplete = !!(
        user.role && 
        user.skills && user.skills.length > 0 && 
        user.interests && user.interests.length > 0 && 
        user.experienceLevel && 
        user.weeklyAvailability !== null
      );
      
      res.json({
        user,
        projects: [...userProjects, ...joinedProjects], // Combine created and joined projects
        joinedProjects, // Separate array of just joined projects
        applications: userApplications,
        notifications: userNotifications,
        teams: teamMemberships,
        profileComplete: isProfileComplete
      });
    } catch (err) {
      console.error("Error fetching profile data:", err);
      res.status(500).json({ message: 'Failed to fetch profile data' });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userData = req.body;
      
      // Don't allow updating username or password through this endpoint
      delete userData.username;
      delete userData.password;
      
      // Validate role
      if (userData.role && !['creator', 'joiner', 'both'].includes(userData.role)) {
        return res.status(400).json({ message: 'Invalid role. Must be creator, joiner, or both.' });
      }
      
      // Handle arrays properly for skills and interests
      if (typeof userData.skills === 'string') {
        userData.skills = userData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      if (typeof userData.interests === 'string') {
        userData.interests = userData.interests.split(',').map((i: string) => i.trim()).filter(Boolean);
      }
      
      // Validate experience level
      if (userData.experienceLevel && 
          !['beginner', 'intermediate', 'advanced', 'expert'].includes(userData.experienceLevel)) {
        return res.status(400).json({ 
          message: 'Invalid experience level. Must be beginner, intermediate, advanced, or expert.' 
        });
      }
      
      // Validate weekly availability
      if (userData.weeklyAvailability !== undefined && userData.weeklyAvailability !== null) {
        const hours = Number(userData.weeklyAvailability);
        if (isNaN(hours) || hours < 0 || hours > 168) { // Max hours in a week
          return res.status(400).json({ 
            message: 'Weekly availability must be a number between 0 and 168 hours.' 
          });
        }
        userData.weeklyAvailability = hours;
      }
      
      console.log("Updating user profile:", userData);
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Check if this completes the onboarding flow
      const isProfileComplete = !!(
        updatedUser.role && 
        updatedUser.skills && updatedUser.skills.length > 0 && 
        updatedUser.interests && updatedUser.interests.length > 0 && 
        updatedUser.experienceLevel && 
        updatedUser.weeklyAvailability !== null
      );
      
      res.json({
        ...updatedUser,
        profileComplete: isProfileComplete
      });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
  
  // Profile photo upload endpoint
  app.post('/api/profile/upload-photo', isAuthenticated, profileUpload.single('photo'), async (req, res) => {
    try {
      const userId = parseInt(req.body.userId || "") || req.user!.id;
      
      // Make sure the user can only update their own profile photo unless they're an admin
      if (userId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const filePath = `/uploads/profiles/${req.file.filename}`;
      console.log(`Profile photo uploaded: ${filePath} for user ${userId}`);
      
      // Update user profile with photo URL
      const updatedUser = await storage.updateUser(userId, {
        profilePicture: filePath
      });
      
      res.json({ 
        success: true, 
        profilePicture: filePath,
        message: 'Profile photo updated successfully' 
      });
    } catch (err) {
      console.error('Profile photo upload error:', err);
      res.status(500).json({ message: 'Failed to update profile photo' });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotificationsByUser(userId);
      
      // Sort by creation date, newest first
      notifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify notification belongs to user
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to modify this notification' });
      }
      
      // Mark as read
      const updatedNotification = await storage.updateNotification(notificationId, { isRead: true });
      res.json(updatedNotification);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });
  
  // Mark all notifications as read
  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotificationsByUser(userId);
      
      // Mark each unread notification as read
      const updates = notifications
        .filter(n => !n.isRead)
        .map(n => storage.updateNotification(n.id, { isRead: true }));
      
      await Promise.all(updates);
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  });

  return httpServer;
}
