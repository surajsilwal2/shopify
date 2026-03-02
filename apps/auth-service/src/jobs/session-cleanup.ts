import { prisma } from "database";
import cron from "node-cron";


export const initSessionCleanup = () => {
  // Runs every day at midnight ('0 0 * * *')
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled session cleanup...");

    try {
      const deleted = await (prisma as any).session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(), // Deletes all sessions where expiresAt < now
          },
        },
      });

      console.log(`Successfully cleared ${deleted.count} expired sessions.`);
    } catch (error) {
      console.error("Session cleanup failed:", error);
    }
  });
};
