const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// SVGs are compiled into React components rather than loaded as image assets, so the
// logo lockups can take a size and inherit theme colours. That means moving `svg` out
// of assetExts (where Expo puts it by default) and into sourceExts — leaving it in both
// would let the asset resolver win and hand back a URI instead of a component.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
