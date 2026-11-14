import { requireOptionalNativeModule } from 'expo';
import type { ImageSourcePropType } from 'react-native';

type AlternateAppIconsModule = {
  supportsAlternateIcons: boolean;
  setAlternateAppIcon(name: string | null): Promise<string | null>;
  getAppIconName(): string | null;
};

/**
 * `expo-alternate-app-icons`' native half, reached directly: the package's own entry
 * throws at import wherever the module is missing — Expo Go and web — and would take the
 * Settings tab down with it.
 */
export const appIconModule = requireOptionalNativeModule<AlternateAppIconsModule>(
  'ExpoAlternateAppIcons',
);

export type AppIcon = {
  label: string;
  /** The `app.json` plugin entry's name; absent for the primary icon. */
  name?: string;
  light: ImageSourcePropType;
  dark: ImageSourcePropType;
};

export const APP_ICONS: AppIcon[] = [
  {
    label: 'Full spectrum',
    light: require('../../assets/ios/light-hero.png'),
    dark: require('../../assets/ios/dark-hero.png'),
  },
  {
    label: 'Stage glow',
    name: 'Glow',
    light: require('../../assets/ios/light-glow.png'),
    dark: require('../../assets/ios/dark-glow.png'),
  },
  {
    label: 'Melancholy',
    name: 'Melancholy',
    light: require('../../assets/ios/light-melancholy.png'),
    dark: require('../../assets/ios/dark-melancholy.png'),
  },
  {
    label: 'Dreamy',
    name: 'Dreamy',
    light: require('../../assets/ios/light-dreamy.png'),
    dark: require('../../assets/ios/dark-dreamy.png'),
  },
  {
    label: 'Cozy',
    name: 'Cozy',
    light: require('../../assets/ios/light-cozy.png'),
    dark: require('../../assets/ios/dark-cozy.png'),
  },
  {
    label: 'Hopeful',
    name: 'Hopeful',
    light: require('../../assets/ios/light-hopeful.png'),
    dark: require('../../assets/ios/dark-hopeful.png'),
  },
  {
    label: 'Tense',
    name: 'Tense',
    light: require('../../assets/ios/light-tense.png'),
    dark: require('../../assets/ios/dark-tense.png'),
  },
  {
    label: 'Nostalgic',
    name: 'Nostalgic',
    light: require('../../assets/ios/light-nostalgic.png'),
    dark: require('../../assets/ios/dark-nostalgic.png'),
  },
];
