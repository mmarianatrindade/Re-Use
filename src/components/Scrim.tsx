import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

interface ScrimProps {
  from?: number;
  to?: number;
}

const STEPS = 56;

// Degradê vertical feito com faixas de opacidade crescente, sem dependência de biblioteca de gradiente.
export default function Scrim({ from = 0.35, to = 0.9 }: ScrimProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: STEPS }, (_, index) => {
        const opacity = from + (to - from) * (index / (STEPS - 1));
        return <View key={index} style={[styles.band, { backgroundColor: `rgba(${colors.overlayRgb}, ${opacity.toFixed(3)})` }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flex: 1 },
});
