/** @type {import('next').NextConfig} */
const nextConfig = {
  // geoip-lite reads its GeoLite database from node_modules at runtime.
  serverExternalPackages: ['geoip-lite'],
};

export default nextConfig;
