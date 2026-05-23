/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: output: 'standalone' é para Docker/self-hosted.
  // Na Vercel, o output padrão (sem esta opção) é o correto.

  experimental: {
    // Impede o Next.js de fazer bundle de módulos nativos como argon2
    serverComponentsExternalPackages: ["argon2"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Remove o header X-Powered-By por segurança
  poweredByHeader: false,

  // Permite imagens de qualquer origem (útil para avatares externos)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
