/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Optimize for production
    swcMinify: true,

    // Environment variables available to client
    env: {
        TRON_WALLET_ADDRESS: process.env.TRON_WALLET_ADDRESS,
    },

    // Image optimization
    images: {
        domains: [],
    },
}

module.exports = nextConfig
