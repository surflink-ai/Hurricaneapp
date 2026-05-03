/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storms.ngs.noaa.gov" },
      { protocol: "https", hostname: "earthobservatory.nasa.gov" },
      { protocol: "https", hostname: "**.maxar.com" },
      { protocol: "https", hostname: "api.mapbox.com" }
    ]
  }
};

export default nextConfig;
