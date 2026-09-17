import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { env } from "../config/env";
import { sendEmail } from "./mailer";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  // Every entry is also a permitted recipient of the session token: the Expo plugin
  // appends the session cookie to the post-OAuth redirect URL, gated only by
  // isTrustedOrigin. Keep it exact — no wildcards.
  trustedOrigins: [`${env.APP_SCHEME}://`, env.APP_ORIGIN],
  plugins: [
    expo(),
    emailOTP({
      // Makes `emailVerification.sendOnSignUp` below emit a code rather than Better Auth's
      // default link, which would have to be absolute to survive a desktop mail client and
      // so could never come back into the app.
      overrideDefaultEmailVerification: true,
      // Defaults to "plain", which leaves a live code readable in the database.
      storeOTP: "hashed",
      sendVerificationOTP: async ({ email, otp }) => {
        await sendEmail({
          to: email,
          subject: "Your Under Score confirmation code",
          text: `Your confirmation code is ${otp}.\n\nIt expires in five minutes.`,
        });
      },
    }),
  ],
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
  // Sign-in is deliberately not gated on this. Verifying is what lets a social provider link
  // into an existing password account: Better Auth refuses that link while the local address
  // is unverified, which is what made Google sign-in fail with `account_not_linked`.
  emailVerification: {
    sendOnSignUp: true,
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
