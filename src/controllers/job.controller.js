import prisma from "../db/index.js";
import { jobSchema } from "../validators/job.schema.js";
import { safeDate, normalizeValue } from "../utils/safeDate.js";
import { detectDuplicates } from "../utils/duplicateDetection.js";

/**
 * POST /api/jobs/check-duplicate
 * Check if a job is duplicate before posting
 */
export async function checkDuplicate(req, res) {
  try {
    // Parse JSON string from request body
    let jobData;
    try {
      if (typeof req.body === "string") {
        jobData = JSON.parse(req.body);
      } else {
        jobData = req.body;
      }
    } catch (parseError) {
      return res.status(400).json({
        error: "Invalid JSON format",
        message: parseError.message,
      });
    }

    // Validate schema
    const validationResult = jobSchema.safeParse(jobData);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
    }

    const validatedData = validationResult.data;

    // Normalize data
    const normalizedData = {
      job_id: validatedData.jobId,
      title: validatedData.title,
      organization: normalizeValue(validatedData.organization),
      posted_date: safeDate(validatedData.postedDate),
      apply_link: normalizeValue(validatedData.applyLink),
      source_url: normalizeValue(validatedData.sourceUrl),
    };

    // Check for duplicates
    const duplicateCheck = await detectDuplicates(normalizedData, prisma);

    return res.json({
      success: true,
      is_duplicate: duplicateCheck.isDuplicate,
      reason: duplicateCheck.reason,
      matches: duplicateCheck.matches.map((match) => ({
        job_id: match.job.job_id,
        title: match.job.title,
        organization: match.job.organization,
        match_type: match.type,
        similarity: match.similarity,
        created_at: match.job.created_at,
      })),
    });
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * POST /api/jobs
 * Validates, normalizes, and saves job data to PostgreSQL
 */
export async function createJob(req, res) {
  try {
    // Parse JSON string from request body
    let jobData;
    try {
      if (typeof req.body === "string") {
        jobData = JSON.parse(req.body);
      } else {
        jobData = req.body;
      }
    } catch (parseError) {
      return res.status(400).json({
        error: "Invalid JSON format",
        message: parseError.message,
      });
    }

    // Validate schema
    const validationResult = jobSchema.safeParse(jobData);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
    }

    const validatedData = validationResult.data;

    // Normalize and map camelCase to snake_case
    const normalizedData = {
      job_id: validatedData.jobId,
      title: validatedData.title,
      organization: normalizeValue(validatedData.organization),
      department: normalizeValue(validatedData.department),
      category: normalizeValue(validatedData.category),
      job_type: normalizeValue(validatedData.jobType),
      location: normalizeValue(validatedData.location),
      eligibility: normalizeValue(validatedData.eligibility),
      qualification: normalizeValue(validatedData.qualification),
      education: normalizeValue(validatedData.education),
      experience: normalizeValue(validatedData.experience),
      preferred_qualifications: normalizeValue(validatedData.preferredQualifications),
      requirements: normalizeValue(validatedData.requirements),
      skills: normalizeValue(validatedData.skills),
      salary: normalizeValue(validatedData.salary),
      applicants: normalizeValue(validatedData.applicants),
      responsibilities: normalizeValue(validatedData.responsibilities),
      description: normalizeValue(validatedData.description),
      apply_link: normalizeValue(validatedData.applyLink),
      notification_pdf: normalizeValue(validatedData.notificationPdf),
      posted_date: safeDate(validatedData.postedDate),
      last_date: safeDate(validatedData.lastDate),
      source: normalizeValue(validatedData.source),
      source_url: normalizeValue(validatedData.sourceUrl),
      user_id: req.user?.user_id || null, // Track which user posted the job (user_id in jobs table references User.id)
    };

    // Check for duplicates using enhanced detection
    const duplicateCheck = await detectDuplicates(normalizedData, prisma);

    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        error: "Duplicate job detected",
        message: duplicateCheck.reason,
        duplicate_type: duplicateCheck.matches[0]?.type || "unknown",
        matches: duplicateCheck.matches.map((match) => ({
          job_id: match.job.job_id,
          title: match.job.title,
          organization: match.job.organization,
          match_type: match.type,
          similarity: match.similarity,
          created_at: match.job.created_at,
        })),
      });
    }

    // Insert into database
    const createdJob = await prisma.job.create({
      data: normalizedData,
    });

    // Update job_post_count in user table when job is posted
    if (req.user?.user_id) {
      await prisma.user.update({
        where: {
          id: req.user.user_id,
        },
        data: {
          job_post_count: {
            increment: 1,
          },
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Job saved successfully",
      data: {
        job_id: createdJob.job_id,
        title: createdJob.title,
      },
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
