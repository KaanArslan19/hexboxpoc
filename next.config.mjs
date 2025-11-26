import {withSentryConfig} from "@sentry/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  experimental: {
    esmExternals: true,
  },
  env: {
    // RAINBOWKIT_PROJECT_ID: process.env.RAINBOWKIT_PROJECT_ID,
    // R2_BUCKET_URL: process.env.R2_BUCKET_URL,
    // R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    // R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    // R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    // R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    // NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // MONGODB_URI: process.env.MONGODB_URI,
    // NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    // process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    // JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    // NEXT_PUBLIC_TESTNET_RPC_URL: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    // DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
  },
  productionBrowserSourceMaps: false, //added to fix the source Map ERR
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "heubel",

  project: "test-hexbox",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});