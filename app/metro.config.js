const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const projectRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// Teach Metro to resolve @/ → project root (mirrors tsconfig.json paths)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const relativePath = moduleName.slice(2);
    return context.resolveRequest(context, path.join(projectRoot, relativePath), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
