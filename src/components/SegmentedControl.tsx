import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import type { ConteudoTag } from '../data/reuseData';
import { useReduceMotion } from '../hooks/useReduceMotion';
import TagIcon from './TagIcon';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  color?: string;
  tag?: ConteudoTag;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // Opções com a mesma largura, ocupando toda a linha.
  stretch?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

interface Slot {
  x: number;
  width: number;
}

// Controle segmentado com indicador que desliza até a opção escolhida (movimento que responde ao toque).
export default function SegmentedControl<T extends string>({ options, value, onChange, stretch = false, size = 'md', style }: SegmentedControlProps<T>) {
  const reduceMotion = useReduceMotion();
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const hasPositioned = useRef(false);

  const activeOption = options.find((option) => option.id === value);
  const activeSlot = slots[value];

  useEffect(() => {
    if (!activeSlot) {
      return;
    }

    // Primeira medição: posiciona sem animar; depois, desliza.
    if (!hasPositioned.current || reduceMotion) {
      indicatorX.setValue(activeSlot.x);
      indicatorWidth.setValue(activeSlot.width);
      hasPositioned.current = true;
      return;
    }

    Animated.parallel([
      Animated.spring(indicatorX, { toValue: activeSlot.x, speed: 22, bounciness: 5, useNativeDriver: false }),
      Animated.spring(indicatorWidth, { toValue: activeSlot.width, speed: 22, bounciness: 5, useNativeDriver: false }),
    ]).start();
  }, [activeSlot?.x, activeSlot?.width, reduceMotion]);

  const handleLayout = (id: T) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setSlots((current) => (current[id]?.x === x && current[id]?.width === width ? current : { ...current, [id]: { x, width } }));
  };

  const isSmall = size === 'sm';

  return (
    <View style={[styles.track, stretch && styles.trackStretch, style]} accessibilityRole="tablist">
      {activeSlot ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { backgroundColor: activeOption?.color ?? colors.primary, width: indicatorWidth, transform: [{ translateX: indicatorX }] },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const isActive = option.id === value;

        return (
          <Pressable
            key={option.id}
            onLayout={handleLayout(option.id)}
            onPress={() => onChange(option.id)}
            style={[styles.option, isSmall && styles.optionSmall, stretch && styles.optionStretch]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
          >
            {option.tag ? (
              <TagIcon {...option.tag} size={isSmall ? 18 : 22} style={styles.tag} />
            ) : null}
            <Text
              style={[
                styles.label,
                isSmall && styles.labelSmall,
                { color: isActive ? colors.textOnDark : option.color ?? colors.text },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  trackStretch: { alignSelf: 'stretch' },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: radii.pill },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 16, borderRadius: radii.pill },
  optionSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  // Ocupa a linha toda, mas cada opção parte da largura do próprio texto (sem cortar rótulos mais longos, como "Doação").
  optionStretch: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingHorizontal: 8 },
  tag: { marginRight: 5, marginVertical: -4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14 },
  labelSmall: { fontSize: 13 },
});
