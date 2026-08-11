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
  // Every entry here is also a permitted recipient of the session token: the Expo
  // plugin appends the session cookie to the post-OAuth redirect URL, gated only by
  // isTrustedOrigin. Keep this list exact — no wildcards. Expo Go's exp:// origin is
  // added by the plugin itself when NODE_ENV === "development".
  trustedOrigins: [`${env.APP_SCHEME}://`, env.APP_ORIGIN],
  plugins: [expo()],
  // Production only. Locally and under test the throttle is pure friction: it
  // locks the shared seed account out after a few deliberate bad-password
  // attempts, and because storage is "database" that counter outlives the
  // process. Railway's startCommand hardcodes NODE_ENV=production, so any deploy
  // through railway.json gets it; a deploy path that omits NODE_ENV would not.
  // Database storage survives Railway restarts and works across replicas.
  rateLimit: {
    enabled: env.NODE_ENV === "production",
    storage: "database",
  },
  advanced: {
    ipAddress: {
      // Railway sets x-real-ip as a single value it controls at the edge. The
      // default (x-forwarded-for) arrives as a multi-hop chain, which Better Auth
      // refuses to parse without trustedProxies — it would then key every request
      // into one shared bucket, making 3 failed logins lock out all users.
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
