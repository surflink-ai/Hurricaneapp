const isStatic = process.env.NEXT_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStatic ? { output: "export", trailingSlash: true, distDir: "out" } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "storms.ngs.noaa.gov" },
      { protocol: "https", hostname: "earthobservatory.nasa.gov" },
      { protocol: "https", hostname: "**.maxar.com" },
      { protocol: "https", hostname: "api.mapbox.com" }
    ]
  }
};

export default nextConfig;
