import { prisma } from "./prisma";

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Better Auth deletes an expired session only when that same token is presented again, so a
// device that never comes back leaves its row behind forever. It ships no cleanup job.
export function startExpiredRowReaper() {
  const sweep = async () => {
    const now = new Date();
    try {
      const [sessions, verifications] = await Promise.all([
        prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
        prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
      ]);
      if (sessions.count || verifications.count) {
        console.log(`[reaper] deleted ${sessions.count} sessions, ${verifications.count} verifications`);
      }
    } catch (err) {
      // Nothing awaits this, so an escaping rejection would be fatal. The next sweep retries.
      console.error("[reaper] sweep failed", err);
    }
  };

  void sweep();
  // Never hold the process open: the e2e stack has to be able to tear down.
  return setInterval(() => void sweep(), SWEEP_INTERVAL_MS).unref();
}
