/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ignorar errores de TypeScript durante el build
    typescript: {
      ignoreBuildErrors: true,
    },
    // Ignorar errores de ESLint (como lo de las imágenes)
    eslint: {
      ignoreDuringBuilds: true,
    },
  }
  
  module.exports = nextConfig