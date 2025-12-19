import prisma from "../db/index.js";

/**
 * GET /api/user-stats
 * Get current user's own statistics with job post count and date-wise breakdown
 */
export async function getUserDailyStats(req, res) {
  try {
    const { date } = req.query;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Get only current user's data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        job_post_count: true,
        date: true,
        jobs: {
          select: {
            job_id: true,
            title: true,
            category: true,
            created_at: true,
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    // Group jobs by date
    const jobsByDate = {};
    
    user.jobs.forEach((job) => {
      const jobDate = new Date(job.created_at).toISOString().split("T")[0];
      
      if (!jobsByDate[jobDate]) {
        jobsByDate[jobDate] = [];
      }
      
      jobsByDate[jobDate].push({
        job_id: job.job_id,
        title: job.title,
        category: job.category || "Others",
        created_at: job.created_at,
      });
    });

    // Convert to array format with date, total count, and category breakdown
    let dailyBreakdown = Object.keys(jobsByDate)
      .sort()
      .reverse()
      .map((dateKey) => {
        const jobsForDate = jobsByDate[dateKey];

        const categoryMap = {};
        jobsForDate.forEach((job) => {
          const cat = job.category || "Others";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        const categories = Object.entries(categoryMap).map(([category, count]) => ({
          category,
          count,
        }));

        return {
          date: dateKey,
          jobs_posted: jobsForDate.length,
          jobs: jobsForDate,
          categories,
        };
      });

    // Filter by date if provided
    if (date) {
      dailyBreakdown = dailyBreakdown.filter((item) => item.date === date);
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        job_post_count: user.job_post_count,
        registration_date: user.date.toISOString().split("T")[0],
        daily_breakdown: dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * GET /api/user-stats/me
 * Get current user's own statistics (alias for /api/user-stats)
 */
export async function getMyStats(req, res) {
  // Redirect to getUserDailyStats logic
  return getUserDailyStats(req, res);
}

