const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.includes(".local")
);

config.resolver = config.resolver || {};
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  new RegExp(`${path.resolve(__dirname, ".local").replace(/\\/g, "\\\\")}.*`),
];

module.exports = withRorkMetro(config);
