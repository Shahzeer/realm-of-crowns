const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// Resolve @/ imports to the project root (Metro doesn't read tsconfig paths)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const relativePath = moduleName.slice(2);
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, relativePath) },
      path.join(projectRoot, relativePath),
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Watch shared files at the project root for hot reload
config.watchFolders = [...(config.watchFolders || []), projectRoot];

module.exports = withRorkMetro(config);
