import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOTION } from '@/lib/theme';

/**
 * The bottom sheet every playlist action opens on: scrim, panel, grabber, and the
 * design's `us-rise` enter.
 *
 * An overlay rather than an expo-router `formSheet`, which renders as a plain stack route
 * on web — and the e2e suite drives the web build. The design's own prototype treats
 * these as overlays on the screen beneath, not as destinations, so nothing is lost.
 */

/** The design's `us-rise` travel. */
const TRAVEL = 24;
const RISE_MS = 240;

/** The design's sheet corner, which is not one of the radius tokens. */
const CORNER = 24;

export function Sheet({
  isOpen,
  onClose,
  children,
  label,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Names the sheet for assistive tech — the panel itself is only a shape. */
  label: string;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(isOpen ? 1 : 0, {
        duration: reduceMotion ? 0 : RISE_MS,
        easing: Easing.bezier(...MOTION.easeStandard),
      })
    );
  }, [isOpen, progress, reduceMotion]);

  // Layout lives inside the animated style: Reanimated 4 drops the static half of
  // `style={[layout, animated]}`, which here would leave the panel unpositioned.
  const rise = useAnimatedStyle(() => ({
    width: '100%',
    transform: [{ translateY: (1 - progress.get()) * TRAVEL }],
  }));

  const scrim = useAnimatedStyle(() => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8,3,12,0.6)',
    opacity: progress.get(),
  }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Animated.View style={scrim}>
        {/* The scrim dismisses; the panel above it swallows the press. */}
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Dismiss" />

        <Animated.View style={rise}>
          <View
            accessibilityViewIsModal
            aria-label={label}
            className="border-border bg-surface border-t px-screen"
            style={{
              borderTopLeftRadius: CORNER,
              borderTopRightRadius: CORNER,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 26),
            }}>
            <View className="bg-border-strong mb-[14px] h-1 w-10 self-center rounded-pill" />
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
