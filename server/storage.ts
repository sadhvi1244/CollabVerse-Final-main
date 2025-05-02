import { 
  User, InsertUser, 
  Project, InsertProject,
  Application, InsertApplication,
  Team, InsertTeam,
  Task, InsertTask,
  Message, InsertMessage,
  CalendarEvent, InsertCalendarEvent,
  Notification, InsertNotification,
  users, projects, applications, teams, tasks, messages, calendarEvents, notifications
} from "@shared/schema";
import { db, pool } from './db';
import { eq, and, like, desc, asc, or, inArray } from 'drizzle-orm';
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project>;
  searchProjects(query?: string, skills?: string[]): Promise<Project[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByUser(userId: number): Promise<Application[]>;
  getApplicationsByProject(projectId: number): Promise<Application[]>;
  getApplicationByUserAndProject(userId: number, projectId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, applicationData: Partial<Application>): Promise<Application>;
  
  // Team operations
  getTeamMember(projectId: number, userId: number): Promise<Team | undefined>;
  getTeamMembersByProject(projectId: number): Promise<Team[]>;
  createTeamMember(team: InsertTeam): Promise<Team>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task>;
  
  // Message operations
  getMessagesByProject(projectId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Event operations
  getEventsByProject(projectId: number): Promise<CalendarEvent[]>;
  createEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private applications: Map<number, Application>;
  private teams: Map<number, Team>;
  private tasks: Map<number, Task>;
  private messages: Map<number, Message>;
  private events: Map<number, CalendarEvent>;
  private notifications: Map<number, Notification>;
  
  sessionStore: session.Store;
  private userIdCounter: number;
  private projectIdCounter: number;
  private applicationIdCounter: number;
  private teamIdCounter: number;
  private taskIdCounter: number;
  private messageIdCounter: number;
  private eventIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.applications = new Map();
    this.teams = new Map();
    this.tasks = new Map();
    this.messages = new Map();
    this.events = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.applicationIdCounter = 1;
    this.teamIdCounter = 1;
    this.taskIdCounter = 1;
    this.messageIdCounter = 1;
    this.eventIdCounter = 1;
    this.notificationIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    
    // Ensure all fields have proper default values to match the schema
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      skills: insertUser.skills || null,
      interests: insertUser.interests || null,
      experienceLevel: insertUser.experienceLevel || null,
      weeklyAvailability: insertUser.weeklyAvailability || null,
      profilePicture: insertUser.profilePicture || null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get projects created by user
    const createdProjects = Array.from(this.projects.values()).filter(
      (project) => project.creatorId === userId
    );
    
    // Get projects where user is a team member
    const teamMemberships = Array.from(this.teams.values()).filter(
      (team) => team.userId === userId
    );
    
    const teamProjectIds = teamMemberships.map(team => team.projectId);
    const teamProjects = Array.from(this.projects.values()).filter(
      (project) => teamProjectIds.includes(project.id) && project.creatorId !== userId
    );
    
    return [...createdProjects, ...teamProjects];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const createdAt = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt, 
      skillsNeeded: insertProject.skillsNeeded ?? null,
      timeline: insertProject.timeline ?? null,
      coverImage: insertProject.coverImage ?? null,
      stage: insertProject.stage ?? null,
      focus: insertProject.focus ?? null,
      website: insertProject.website ?? null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async searchProjects(query?: string, skills?: string[]): Promise<Project[]> {
    let filteredProjects = Array.from(this.projects.values());
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredProjects = filteredProjects.filter(
        (project) => 
          project.title.toLowerCase().includes(lowerQuery) || 
          project.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (skills && skills.length > 0) {
      filteredProjects = filteredProjects.filter(
        (project) => {
          if (!project.skillsNeeded) return false;
          return skills.some(skill => 
            project.skillsNeeded!.some(
              projectSkill => projectSkill.toLowerCase() === skill.toLowerCase()
            )
          );
        }
      );
    }
    
    return filteredProjects;
  }

  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByUser(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === userId
    );
  }

  async getApplicationsByProject(projectId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.projectId === projectId
    );
  }

  async getApplicationByUserAndProject(userId: number, projectId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      (application) => application.userId === userId && application.projectId === projectId
    );
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const createdAt = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: 'pending', 
      createdAt,
      skills: insertApplication.skills ?? null,
      feedback: insertApplication.feedback ?? null,
      resumeLink: insertApplication.resumeLink ?? null,
      linkedinProfile: insertApplication.linkedinProfile ?? null,
      githubLink: insertApplication.githubLink ?? null,
      weeklyAvailability: insertApplication.weeklyAvailability ?? null
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const updatedApplication = { ...application, ...applicationData };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Team methods
  async getTeamMember(projectId: number, userId: number): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(
      (team) => team.projectId === projectId && team.userId === userId
    );
  }

  async getTeamMembersByProject(projectId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.projectId === projectId
    );
  }

  async createTeamMember(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const joinedAt = new Date();
    const team: Team = { ...insertTeam, id, joinedAt };
    this.teams.set(id, team);
    return team;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const createdAt = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      status: insertTask.status || 'todo',
      createdAt,
      updatedAt: createdAt,
      description: insertTask.description ?? null,
      assignedTo: insertTask.assignedTo ?? null,
      priority: insertTask.priority ?? null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { 
      ...task, 
      ...taskData,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Message methods
  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => {
        const aTime = a.timestamp ? a.timestamp.getTime() : 0;
        const bTime = b.timestamp ? b.timestamp.getTime() : 0;
        return aTime - bTime;
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    this.messages.set(id, message);
    return message;
  }

  // Event methods
  async getEventsByProject(projectId: number): Promise<CalendarEvent[]> {
    return Array.from(this.events.values())
      .filter((event) => event.projectId === projectId)
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  }

  async createEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.eventIdCounter++;
    const createdAt = new Date();
    const event: CalendarEvent = { 
      ...insertEvent, 
      id, 
      createdAt, 
      description: insertEvent.description ?? null 
    };
    this.events.set(id, event);
    return event;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      isRead: false,
      createdAt,
      relatedId: insertNotification.relatedId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    const updatedNotification = { ...notification, ...notificationData };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

// DatabaseStorage implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresStore({
      pool, 
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || undefined;
    } catch (error) {
        console.error('Error in getUserByUsername:', error);
        throw error;
    }
}

  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get projects created by the user
    const userCreatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.creatorId, userId));
    
    // Get projects where the user is a team member
    const userTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.userId, userId));
    
    // If user is not part of any teams, just return the created projects
    if (userTeams.length === 0) {
      return userCreatedProjects;
    }
    
    // Get projects where the user is a team member
    const teamProjectIds = userTeams.map(team => team.projectId);
    const teamProjects = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, teamProjectIds));
    
    // Combine and deduplicate
    const allProjects = [...userCreatedProjects, ...teamProjects];
    const uniqueProjects = Array.from(
      new Map(allProjects.map(project => [project.id, project])).values()
    );
    
    return uniqueProjects;
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async searchProjects(query?: string, skills?: string[]): Promise<Project[]> {
    // Start with a base query
    let projectQuery = db.select().from(projects);
    
    // Filter by text search if query is provided
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
        const queryResult = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          skillsNeeded: projects.skillsNeeded,
          createdAt: projects.createdAt,
          creatorId: projects.creatorId,
          timeline: projects.timeline ?? null,
          coverImage: projects.coverImage ?? null,
          stage: projects.stage ?? null,
          focus: projects.focus ?? null,
          website: projects.website ?? null,
        })
        .from(projects)
        .where(
          or(
            like(projects.title, searchTerm),
            like(projects.description, searchTerm)
          )
        );
      return queryResult;
    }
    
    // Execute the query
    const result = await projectQuery;
    
    // Filter by skills in memory since array contains logic is harder in SQL
    if (skills && skills.length > 0) {
      return result.filter(project => {
        if (!project.skillsNeeded) return false;
        
        return skills.some(skill => 
          project.skillsNeeded?.some(
            projectSkill => projectSkill.toLowerCase() === skill.toLowerCase()
          )
        );
      });
    }
    
    return result;
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application;
  }
  
  async getApplicationsByUser(userId: number): Promise<Application[]> {
    try {
      return await db
        .select()
        .from(applications)
        .where(eq(applications.userId, userId));
    } catch (err) {
      console.error('Error fetching applications by user:', err);
      // In case the columns don't exist yet, return an empty array
      return [];
    }
  }
  
  async getApplicationsByProject(projectId: number): Promise<Application[]> {
    try {
      return await db
        .select()
        .from(applications)
        .where(eq(applications.projectId, projectId));
    } catch (err) {
      console.error('Error fetching applications by project:', err);
      // In case the columns don't exist yet, return an empty array
      return [];
    }
  }
  
  async getApplicationByUserAndProject(userId: number, projectId: number): Promise<Application | undefined> {
    try {
      const [application] = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.userId, userId),
            eq(applications.projectId, projectId)
          )
        );
      return application;
    } catch (err) {
      console.error('Error fetching application by user and project:', err);
      // In case the columns don't exist yet, return undefined
      return undefined;
    }
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const baseApplicationData = {
      userId: insertApplication.userId,
      projectId: insertApplication.projectId,
      message: insertApplication.message,
      resumeLink: insertApplication.resumeLink,
      linkedinProfile: insertApplication.linkedinProfile,
      githubLink: insertApplication.githubLink,
      status: "pending" as const,
      skills: insertApplication.skills, // Include skills field
      weeklyAvailability: insertApplication.weeklyAvailability, // Include weeklyAvailability field
    
    };

    try {
      const [application] = await db
        .insert(applications)
        .values({
          ...baseApplicationData,
          ...(insertApplication as any).preferredRole ? { preferredRole: insertApplication.preferredRole } : {},
          ...(insertApplication as any).previousExperience ? { previousExperience: insertApplication.previousExperience } : {},
          ...(insertApplication as any).nitProof ? { nitProof: insertApplication.nitProof } : {},
        })
        .returning();

      return application;
    } catch (err) {
      console.error("Error inserting full application, retrying with base fields:", err);

      // Retry with only base fields if the full insert fails
      const [fallbackApplication] = await db
        .insert(applications)
        .values(baseApplicationData)
        .returning();

      return fallbackApplication;
    }
  }
  
  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application> {
    try {
      // Create a safe copy of the data without potential problematic fields
      const safeData: Record<string, any> = {};
      
      // Only copy fields we know exist in the base schema
      if ('userId' in applicationData) safeData.userId = applicationData.userId;
      if ('projectId' in applicationData) safeData.projectId = applicationData.projectId;
      if ('message' in applicationData) safeData.message = applicationData.message;
      if ('resumeLink' in applicationData) safeData.resumeLink = applicationData.resumeLink;
      if ('linkedinProfile' in applicationData) safeData.linkedinProfile = applicationData.linkedinProfile;
      if ('githubLink' in applicationData) safeData.githubLink = applicationData.githubLink;
      if ('status' in applicationData) safeData.status = applicationData.status;
      if ('feedback' in applicationData) safeData.feedback = applicationData.feedback;
      
      // Try to update with all fields including optional ones
      try {
        // Optional fields - only add if in the input data
        if ('preferredRole' in applicationData) safeData.preferredRole = (applicationData as any).preferredRole;
        if ('previousExperience' in applicationData) safeData.previousExperience = (applicationData as any).previousExperience;
        if ('nitProof' in applicationData) safeData.nitProof = (applicationData as any).nitProof;
        
        const [updatedApplication] = await db
          .update(applications)
          .set(safeData)
          .where(eq(applications.id, id))
          .returning();
        return updatedApplication;
      } catch (innerErr) {
        // If failed with additional fields, try with base fields only
        console.warn('Falling back to base application fields only for update');
        const [updatedApplication] = await db
          .update(applications)
          .set(safeData)
          .where(eq(applications.id, id))
          .returning();
        return updatedApplication;
      }
    } catch (err) {
      console.error('Error updating application:', err);
      throw err;
    }
  }
  
  // Team operations
  async getTeamMember(projectId: number, userId: number): Promise<Team | undefined> {
    const [teamMember] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.projectId, projectId),
          eq(teams.userId, userId)
        )
      );
    return teamMember;
  }
  
  async getTeamMembersByProject(projectId: number): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.projectId, projectId));
  }
  
  async createTeamMember(insertTeam: InsertTeam): Promise<Team> {
    const [teamMember] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return teamMember;
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    // Fetch tasks for the project
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    // Sort tasks in memory
    return projectTasks.sort((a, b) => {
      // First sort by status (todo -> inProgress -> done)
      const statusOrder = { todo: 0, inProgress: 1, done: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Then by priority (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
      // Need to handle null properly
      const aPriority = a.priority || 'null';
      const bPriority = b.priority || 'null';
      
      // Using type assertion to avoid TypeScript errors
      const priorityDiff = priorityOrder[aPriority as keyof typeof priorityOrder] - 
                          priorityOrder[bPriority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by creation date (newer first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const taskData = {
      ...insertTask,
      status: insertTask.status || "todo" as const
    };
    
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const updatedData = {
      ...taskData,
      updatedAt: new Date()
    };
    
    const [updatedTask] = await db
      .update(tasks)
      .set(updatedData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  // Message operations
  async getMessagesByProject(projectId: number): Promise<Message[]> {
    const projectMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(asc(messages.timestamp));
    
    return projectMessages;
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
  
  // Event operations
  async getEventsByProject(projectId: number): Promise<CalendarEvent[]> {
    const projectEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.projectId, projectId))
      .orderBy(asc(calendarEvents.datetime));
    
    return projectEvents;
  }
  
  async createEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(insertEvent)
      .returning();
    return event;
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return userNotifications;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notificationData = {
      ...insertNotification,
      isRead: false
    };
    
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }
  
  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set(notificationData)
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
