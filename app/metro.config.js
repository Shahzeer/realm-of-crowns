const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const projectRoot = __dirname;
const parentRoot = path.resolve(projectRoot, "..");

let config = getDefaultConfig(projectRoot);

config.watchFolders = [
  ...(config.watchFolders || []),
  parentRoot,
].filter(
  (folder) => !folder.includes(".local")
);

config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(parentRoot, "node_modules"),
];

config = withRorkMetro(config);

module.exports = config;
