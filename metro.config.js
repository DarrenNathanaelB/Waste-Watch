const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require("nativewind/metro");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver.resolverMainFields = [
    'react-native',
    'browser',
    'module',
    'main'
  ];

  
  withNativeWind(config, { input: "./global.css" });
  return config;
})();