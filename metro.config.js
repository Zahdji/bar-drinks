const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve explicit extension paths used by @supabase/realtime-js
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs', 'js'];

module.exports = config;
