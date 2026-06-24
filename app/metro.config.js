const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// Watch shared files at the project root so Metro picks up changes
config.watchFolders = [
  ...(config.watchFolders || []),
  projectRoot,
];

// Resolve @/ path aliases to the project root (matches tsconfig.json paths)
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const resolvedPath = path.resolve(projectRoot, moduleName.slice(2));
    return { filePath: resolvedPath, type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
