import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'collabverse-secret-key',
    resave: true, // Change to true to ensure sessions are saved
    rolling: true, // This will reset the cookie expiration on activity
    saveUninitialized: false, // Only save initialized sessions
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production', // Secure in production
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    },
    name: 'collabverse.sid'
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user with ID: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user with ID: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`User with ID ${id} not found during deserialization`);
        return done(null, false);
      }
      
      console.log(`User ${user.username} successfully deserialized`);
      done(null, user);
    } catch (err) {
      console.error(`Error deserializing user with ID ${id}:`, err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const userWithEmail = await storage.getUserByEmail(req.body.email);
      if (userWithEmail) {
        return res.status(400).send("Email already in use");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        console.log("Login successful for user:", user.username);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("API user request - not authenticated");
      return res.sendStatus(401);
    }
    
    try {
      // Get the most up-to-date user data from the database
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        console.log(`API user request - user with ID ${req.user!.id} not found`);
        // Session contains a user that no longer exists in the database
        req.logout((err) => {
          if (err) console.error("Error logging out non-existent user:", err);
          return res.sendStatus(401);
        });
        return;
      }
      
      // Check if profile is complete for onboarding flow
      const isProfileComplete = !!(
        user.role && 
        user.skills && user.skills.length > 0 && 
        user.interests && user.interests.length > 0 && 
        user.experienceLevel && 
        user.weeklyAvailability !== null
      );
      
      console.log(`API user request - found user ${user.username}, profile complete: ${isProfileComplete}`);
      res.json({
        ...user,
        profileComplete: isProfileComplete
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
}
