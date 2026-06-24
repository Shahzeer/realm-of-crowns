const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the project root so changes in shared folders are detected
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Resolve @/ imports to the project root (matches tsconfig paths)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const relativePath = moduleName.substring(2);
    let resolved = path.resolve(workspaceRoot, relativePath);

    // Metro resolves without extension by default; try common extensions
    const extensions = context.sourceExts || [".ts", ".tsx", ".js", ".jsx"];
    const fs = require("fs");

    // If path already has an extension that exists, use it
    if (fs.existsSync(resolved)) {
      return { filePath: resolved, type: "sourceFile" };
    }

    // Try adding extensions
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) {
        return { filePath: withExt, type: "sourceFile" };
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolved, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return { filePath: indexPath, type: "sourceFile" };
      }
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
