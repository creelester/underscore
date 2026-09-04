import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  // Every entry is also a permitted recipient of the session token: the Expo plugin
  // appends the session cookie to the post-OAuth redirect URL, gated only by
  // isTrustedOrigin. Keep it exact — no wildcards.
  trustedOrigins: [`${env.APP_SCHEME}://`, env.APP_ORIGIN],
  plugins: [expo()],
  // Production only: under test the throttle locks the shared seed account out after a
  // few deliberate bad-password attempts, and database storage outlives the process.
  // Railway's startCommand hardcodes NODE_ENV=production; a deploy path that omits it
  // would not get rate limiting.
  rateLimit: {
    enabled: env.NODE_ENV === "production",
    storage: "database",
  },
  advanced: {
    ipAddress: {
      // Railway controls x-real-ip at the edge. The default x-forwarded-for arrives as
      // a multi-hop chain Better Auth refuses to parse without trustedProxies, keying
      // every request into one bucket — 3 failed logins would lock out all users.
      ipAddressHeaders: ["x-real-ip"],
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    spotify: {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
    },
  },
});
