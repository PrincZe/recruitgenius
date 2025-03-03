/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comment out static export to allow API routes to work
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  output: undefined, // Always use server rendering to enable API routes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Only use unoptimized images for static export
    unoptimized: process.env.NODE_ENV === 'production',
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: "/api/:path*",
          destination: "https://api.openai.com/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
