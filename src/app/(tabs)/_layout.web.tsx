import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/tabs';
import { useContext, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { radius, space, useColors } from '@/theme';

const icons = { index: 'home', practice: 'circle', progress: 'bar-chart-2', settings: 'settings' } as const;
const HEIGHT = 56;
const PAD = space[1];

// react-native-web passes these through to CSS; RN's types don't know them.
const css = (style: Record<string, string>) => style as object;

/** Frosted glass card floating over the content, with a lens that slides (and stretches) to the active tab. */
function GlassTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const onHeight = useContext(BottomTabBarHeightCallbackContext);
  // As wide as Screen's cards (560 column minus its space[5] padding).
  const barWidth = Math.min(width, 560) - 2 * space[5];
  const item = (barWidth - 2 * PAD) / state.routes.length;

  const x = useSharedValue(state.index * item);
  const stretch = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(state.index * item, { damping: 18, stiffness: 220, mass: 0.9 });
    stretch.value = withSequence(withTiming(1, { duration: 140 }), withSpring(0, { damping: 9, stiffness: 180 }));
  }, [state.index, item, x, stretch]);
  const lens = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scaleX: 1 + 0.3 * stretch.value }, { scaleY: 1 - 0.12 * stretch.value }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
      style={[
        styles.bar,
        {
          bottom: insets.bottom + space[4],
          width: barWidth,
          backgroundColor: c.isDark ? 'rgba(42, 34, 25, 0.6)' : 'rgba(251, 246, 238, 0.6)',
          borderColor: c.divider,
        },
        css({ backdropFilter: 'blur(20px) saturate(1.6)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }),
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.lens,
          { width: item, backgroundColor: c.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)' },
          css({
            boxShadow: c.isDark
              ? 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 10px rgba(0, 0, 0, 0.25)'
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 2px 10px rgba(45, 36, 25, 0.1)',
          }),
          lens,
        ]}
      />
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const press = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            aria-selected={focused}
            accessibilityLabel={descriptors[route.key].options.title}
            onPress={press}
            style={styles.item}>
            <Feather name={icons[route.name as keyof typeof icons]} size={22} color={focused ? c.primary : c.text3} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="practice" options={{ title: t('tabs.practice') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEIGHT,
    marginHorizontal: 'auto',
    padding: PAD,
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  lens: { position: 'absolute', top: PAD, left: PAD, bottom: PAD, borderRadius: radius.lg - PAD },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
