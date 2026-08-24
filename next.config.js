const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    // Backend entierement en Python (ai-service/) : ce rewrite est du routing
    // declaratif, pas de logique metier cote Node. Le navigateur ne voit que
    // l'origine Next.js, donc le cookie de session httpOnly pose par FastAPI
    // circule sans CORS ni assouplissement de SameSite.
    return [
      {
        source: "/api/:path*",
        destination: `${AI_SERVICE_URL}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
