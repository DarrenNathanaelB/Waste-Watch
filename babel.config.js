module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
      'module:metro-react-native-babel-preset'
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true
      }],
      'react-native-reanimated/plugin',
    ]
  };
};