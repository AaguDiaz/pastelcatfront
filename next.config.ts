import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kpfoegpgyqmucgfiyrrm.supabase.co', // El mismo dominio que tenías antes
        port: '',
        pathname: '/**', // Permite cualquier ruta de imagen dentro de ese dominio
      },
    ],
  },
};

export default nextConfig;
