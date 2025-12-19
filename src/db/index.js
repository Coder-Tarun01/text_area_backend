import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Construct DATABASE_URL from individual env variables if DATABASE_URL is not set
const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;

