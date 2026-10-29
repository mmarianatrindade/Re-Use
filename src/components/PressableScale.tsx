import { useRef, type ReactNode } from 'react';
import { Animated, Platform, Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface PressableScaleProps {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// Área tocável que encolhe levemente enquanto é pressionada: resposta ao toque, não animação automática.
export default function PressableScale({ children, onPress, style, accessibilityLabel, accessibilityRole = 'button' }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const animateTo = (value: number) => {
    if (reduceMotion) {
      return;
    }
    Animated.spring(scale, { toValue: value, speed: 40, bounciness: 4, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}
