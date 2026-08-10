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
  // Enabled in every environment rather than relying on Better Auth's
  // production-only default, so the throttle can't vanish if NODE_ENV drifts.
  // Database storage survives Railway restarts and works across replicas.
  rateLimit: {
    enabled: true,
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
