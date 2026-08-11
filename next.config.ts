import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// AVIF first (~25-35% smaller than WebP on these screenshots), WebP as
		// the fallback for browsers that don't take it.
		formats: ["image/avif", "image/webp"],
		// Optimized variants are content-hashed by the source file, so they can
		// be cached for a year.
		minimumCacheTTL: 60 * 60 * 24 * 365,
	},
};

export default nextConfig;
