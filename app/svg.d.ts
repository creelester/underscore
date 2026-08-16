/**
 * `react-native-svg-transformer` (wired up in `metro.config.js`) turns every imported
 * `.svg` into a react-native-svg component. Without this declaration TypeScript still
 * treats the import as an image asset and types it `any`.
 */
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
