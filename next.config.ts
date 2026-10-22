import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las imágenes ya se achican en el navegador (src/lib/compress-image.ts),
      // pero dejamos margen para un logo o foto que no se haya podido
      // comprimir. Vercel corta igual todo pedido de más de 4,5 MB.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
