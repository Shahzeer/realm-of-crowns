const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// Resolve @/ imports to the project root (tsconfig paths alias)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const relativePath = moduleName.slice(2);
    const resolved = context.resolveRequest
      ? context.resolveRequest(context, path.join(projectRoot, relativePath), platform)
      : require("metro-resolver").resolve(
          { ...context, originModulePath: path.join(projectRoot, relativePath) },
          path.join(projectRoot, relativePath),
          platform,
        );
    return resolved;
  }

  return context.resolveRequest
    ? context.resolveRequest(context, moduleName, platform)
    : require("metro-resolver").resolve(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
