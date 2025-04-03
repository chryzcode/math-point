import type { NextConfig } from "next";
import { startWeeklyResetJob } from "./src/middleware/createClassLimits";

const nextConfig: NextConfig = {

  /* config options here */
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    
  },
};

startWeeklyResetJob();

export default nextConfig;
