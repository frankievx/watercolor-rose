import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Add raw-loader for .glsl, .vert, and .frag files
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      use: [
        {
          loader: 'raw-loader',
        },
        {
          loader: 'glslify-loader',
        },
      ],
    });

    return config;
  },
  // Turbopack configuration for dev mode
  turbopack: {
    rules: {
      '*.vert': {
        loaders: ['raw-loader', 'glslify-loader'],
        as: '*.js',
      },
      '*.frag': {
        loaders: ['raw-loader', 'glslify-loader'],
        as: '*.js',
      },
      '*.glsl': {
        loaders: ['raw-loader', 'glslify-loader'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
