/**
 * Utility functions for detecting duplicate jobs
 */

/**
 * Normalize string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}


/**
 * Check for duplicate jobs based on job_id, title, and posted_date only
 * @param {Object} jobData - Normalized job data
 * @param {Object} prisma - Prisma client instance
 * @returns {Object} - { isDuplicate: boolean, matches: Array, reason: string }
 */
export async function detectDuplicates(jobData, prisma) {
  const matches = [];
  let isDuplicate = false;
  let reason = "";

  // 1. Check for exact job_id match
  const exactMatch = await prisma.job.findUnique({
    where: { job_id: jobData.job_id },
    select: {
      job_id: true,
      title: true,
      posted_date: true,
      created_at: true,
    },
  });

  if (exactMatch) {
    matches.push({
      type: "exact_job_id",
      job: exactMatch,
      similarity: 1.0,
    });
    isDuplicate = true;
    reason = `Duplicate detected: Job with job_id "${jobData.job_id}" already exists`;
  }

  // 2. Check for same title + posted_date (case-insensitive title match)
  if (jobData.title && jobData.posted_date) {
    // Get all jobs with same posted_date first, then filter in memory for case-insensitive title match
    const candidates = await prisma.job.findMany({
      where: {
        posted_date: jobData.posted_date,
      },
      select: {
        job_id: true,
        title: true,
        posted_date: true,
        created_at: true,
      },
    });

    // Filter for case-insensitive title match
    const titleDateMatches = candidates.filter((job) => {
      const titleMatch = normalizeString(job.title) === normalizeString(jobData.title);
      return titleMatch;
    });

    if (titleDateMatches.length > 0) {
      matches.push(
        ...titleDateMatches.map((job) => ({
          type: "title_posted_date",
          job,
          similarity: 1.0,
        }))
      );
      isDuplicate = true;
      reason = `Duplicate detected: Same title and posted date already exists`;
    }
  }

  // Remove duplicates from matches array (same job_id)
  const uniqueMatches = matches.reduce((acc, match) => {
    if (!acc.find((m) => m.job.job_id === match.job.job_id)) {
      acc.push(match);
    }
    return acc;
  }, []);

  return {
    isDuplicate,
    matches: uniqueMatches,
    reason: reason || (uniqueMatches.length > 0 ? "Similar jobs found" : ""),
  };
}



