/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RAINBOWKIT_PROJECT_ID: process.env.RAINBOWKIT_PROJECT_ID,
    R2_BUCKET_URL: process.env.R2_BUCKET_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev",
      },
    ],
  },
};

export default nextConfig;
