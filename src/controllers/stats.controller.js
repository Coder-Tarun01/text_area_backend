import prisma from "../db/index.js";

/**
 * GET /api/stats/daily
 * Get statistics: how many members posted how many jobs per day
 */
export async function getDailyStats(req, res) {
  try {
    const { date } = req.query;
    
    // If date is provided, filter by that date, otherwise get all time stats
    let dateFilter = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter = {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Get jobs grouped by user and date
    const jobs = await prisma.job.findMany({
      where: {
        ...dateFilter,
        user_id: { not: null },
      },
      select: {
        user_id: true,
        created_at: true,
        job_id: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Group by date and user
    const statsByDate = {};
    
    jobs.forEach((job) => {
      const dateKey = new Date(job.created_at).toISOString().split("T")[0];
      
      if (!statsByDate[dateKey]) {
        statsByDate[dateKey] = {};
      }
      
      if (!statsByDate[dateKey][job.user_id]) {
        statsByDate[dateKey][job.user_id] = {
          user_id: job.user_id,
          username: job.user?.username || "Unknown",
          email: job.user?.email || "Unknown",
          job_count: 0,
          jobs: [],
        };
      }
      
      statsByDate[dateKey][job.user_id].job_count++;
      statsByDate[dateKey][job.user_id].jobs.push({
        job_id: job.job_id,
        created_at: job.created_at,
      });
    });

    // Convert to array format
    const result = Object.keys(statsByDate).map((date) => ({
      date,
      total_jobs: Object.values(statsByDate[date]).reduce((sum, user) => sum + user.job_count, 0),
      total_members: Object.keys(statsByDate[date]).length,
      members: Object.values(statsByDate[date]).map(({ jobs, ...user }) => ({
        ...user,
        job_count: user.job_count,
      })),
    }));

    // Get summary statistics
    const totalJobs = jobs.length;
    const uniqueUsers = new Set(jobs.map((job) => job.user_id)).size;
    const totalMembers = await prisma.user.count();

    return res.json({
      success: true,
      summary: {
        total_jobs: totalJobs,
        total_members: totalMembers,
        active_members_today: uniqueUsers,
      },
      daily_stats: result,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * GET /api/stats/user/:userId
 * Get statistics for a specific user
 */
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        job_post_count: true,
        date: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    const jobs = await prisma.job.findMany({
      where: { user_id: userId },
      select: {
        job_id: true,
        title: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Group by date
    const jobsByDate = {};
    jobs.forEach((job) => {
      const dateKey = new Date(job.created_at).toISOString().split("T")[0];
      if (!jobsByDate[dateKey]) {
        jobsByDate[dateKey] = [];
      }
      jobsByDate[dateKey].push(job);
    });

    const dailyStats = Object.keys(jobsByDate).map((date) => ({
      date,
      job_count: jobsByDate[date].length,
      jobs: jobsByDate[date],
    }));

    return res.json({
      success: true,
      user,
      total_jobs: jobs.length,
      daily_stats: dailyStats,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

