import { z } from "zod";

/**
 * Zod schema for job data validation
 * Handles camelCase input and validates all fields
 */
export const jobSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  title: z.string().min(1, "title is required"),
  organization: z.string().optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  jobType: z.string().optional(),
  location: z.string().optional(),
  eligibility: z.string().optional(),
  qualification: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  preferredQualifications: z.string().optional(),
  requirements: z.string().optional(),
  skills: z.string().optional(),
  salary: z.string().optional(),
  applicants: z.string().optional(),
  responsibilities: z.string().optional(),
  description: z.string().optional(),
  applyLink: z.string().optional(),
  notificationPdf: z.string().optional(),
  postedDate: z.string().optional(),
  lastDate: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
});

