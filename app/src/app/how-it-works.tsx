import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { ProgressDots } from '@/components/ui/progress-dots';
import { Text } from '@/components/ui/text';
import { moodGradient, type Mood } from '@/lib/gradients';
import { useTheme } from '@/lib/use-theme';

/**
 * Onboarding screen 2 — three swipeable, always skippable pages, each a heading, a
 * line of copy and a mood-gradient panel standing in for artwork.
 */
const PAGES: readonly {
  eyebrow: string;
  title: string;
  body: string;
  mood: Mood;
}[] = [
  {
    eyebrow: 'Step 01 · How it works',
    title: 'Say what you’re reading.',
    body: "Search any title or author. Under Score pulls the blurb, the genre and the era — you never fill in a form. If you can't find your book, you can still dial in the mood and genre manually.",
    mood: 'dreamy',
  },
  {
    eyebrow: 'Step 02 · How it works',
    title: 'It reads the mood.',
    body: 'Pacing, tone, setting — said back to you in one sentence, so you can correct it if it lands wrong.',
    mood: 'melancholy',
  },
  {
    eyebrow: 'Step 03 · How it works',
    title: 'Press play.',
    body: 'Thirty tracks, scored to where you are in the story, sent straight to your favorite streaming platform. Elevate your book to a cinematic experience.',
    mood: 'cozy',
  },
];

export default function HowItWorksScreen() {
  const insets = useSafeAreaInsets();
  const { shadows } = useTheme();
  const { width } = useWindowDimensions();

  // Every file under app/ is addressable, so a reload or deep link can open this screen
  // directly. Arriving from the splash leaves something to go back to; arriving directly
  // never does. Read once at mount — it is a fact about how the screen was entered.
  const [openedDirectly] = useState(() => !router.canGoBack());

  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lastPage = page === PAGES.length - 1;

  // From the scroll offset, not momentum events: react-native-web pages with CSS scroll
  // snap and never fires onMomentumScrollEnd.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const measured = event.nativeEvent.layoutMeasurement.width;
    if (!measured) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / measured);
    setPage(Math.min(Math.max(next, 0), PAGES.length - 1));
  };

  const advance = () => {
    if (lastPage) {
      router.push('/connect-music');
      return;
    }
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  // The flow starts at the splash, so a direct arrival goes back there.
  if (openedDirectly) return <Redirect href='/splash' />;

  return (
    <View
      className='flex-1'
      style={{
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom, 34),
      }}
    >
      <AppBackdrop />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className='flex-1'
      >
        {PAGES.map(({ eyebrow, title, body, mood }) => (
          <View
            key={eyebrow}
            className='px-screen-wide gap-[22px]'
            style={{ width }}
          >
            <View className='flex-row items-center justify-between'>
              <Text className='text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase'>
                {eyebrow}
              </Text>
              <Button
                variant='text'
                onPress={() => router.push('/connect-music')}
              >
                <Text>Skip</Text>
              </Button>
            </View>
            <Text className='text-foreground font-display tracking-tight text-[30px] leading-[34.5px]'>
              {title}
            </Text>
            <Text className='text-ink-muted font-body text-body-lg'>
              {body}
            </Text>
            <View
              className='rounded-card h-[236px] overflow-hidden'
              style={{ boxShadow: shadows.soft }}
            >
              <LinearGradient
                {...moodGradient([mood])}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View className='px-screen-wide gap-[22px] pt-[22px]'>
        <View className='items-center'>
          <ProgressDots count={PAGES.length} active={page} />
        </View>
        <Button size='lg' onPress={advance}>
          <Text>{lastPage ? 'Connect music →' : 'Next →'}</Text>
        </Button>
      </View>
    </View>
  );
}
