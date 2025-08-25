import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL!,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "default-session-secret-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production
      maxAge: sessionTtl,
    },
  });
}
function updateUserSession(user: any, profile: any) {
  user.email = profile.emails?.[0]?.value;
  user.firstName = profile.name?.givenName;
  user.lastName = profile.name?.familyName;
  user.profileImageUrl = profile.photos?.[0]?.value;
  user.googleId = profile.id;
}
async function upsertUser(profile: any) {
  await storage.upsertUser({
    ...profile,
    email: profile.emails?.[0]?.value,
    firstName: profile.name?.givenName,
    lastName: profile.name?.familyName,
    profileImageUrl: profile.photos?.[0]?.value,
  });
}
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

passport.use(new LocalStrategy(
  { usernameField: "email" },
  async (email, password, done) => {
    const user = await storage.getUserByEmail(email);
    if (!user) return done(null, false, { message: "Invalid email" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return done(null, false, { message: "Invalid password" });
    return done(null, user);
  }
));

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT!,
        clientSecret: process.env.GOOGLE_SECRET!,
        callbackURL: `http://${process.env.REPLIT_DOMAINS}/api/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        const user: any = {};
        updateUserSession(user, profile);
        await upsertUser(profile);
        done(null, user);
      }
    )
  );

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user||null));

  app.get("/api/google/login", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/google/callback", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/api/login",
  }));

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
}
export const  isAuthenticated: RequestHandler = (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
export async function insertLogin(data:any) {
  await storage.upsertUser(data);
}