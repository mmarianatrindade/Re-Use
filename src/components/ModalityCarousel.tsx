import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import type { CartaoModalidade, CartaoModalidadeId } from '../data/reuseData';
import ModalityCard from './ModalityCard';
import SegmentedControl from './SegmentedControl';

interface ModalityCarouselProps {
  modalities: CartaoModalidade[];
  contentWidth: number;
  gutter: number;
  onSelect: (id: CartaoModalidadeId) => void;
}

const GAP = 14;

// Carrossel das modalidades para telas estreitas: encaixe em cada card e botões abaixo para escolher.
// Sem troca automática: o card só muda quando a pessoa pede (arrastando ou tocando num botão).
export default function ModalityCarousel({ modalities, contentWidth, gutter, onSelect }: ModalityCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Card de destino de uma rolagem feita pelo código; enquanto ela anda, o índice não é recalculado.
  const scrollTarget = useRef<number | null>(null);

  const cardWidth = Math.min(contentWidth * 0.86, 360);
  const interval = cardWidth + GAP;

  const goTo = (index: number) => {
    scrollTarget.current = index;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * interval, animated: true });
    // Garantia: no último card o scroll pode parar antes do destino exato (limite do conteúdo).
    setTimeout(() => {
      if (scrollTarget.current === index) {
        scrollTarget.current = null;
      }
    }, 700);
  };



  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / interval);
    const clamped = Math.max(0, Math.min(index, modalities.length - 1));
    if (scrollTarget.current !== null) {
      if (clamped === scrollTarget.current) {
        scrollTarget.current = null;
      }
      return;
    }
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
    }
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          scrollTarget.current = null;
        }}
        scrollEventThrottle={32}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.track, { paddingHorizontal: gutter }]}
      >
        {modalities.map((modality) => (
          <ModalityCard key={modality.id} modality={modality} onPress={() => onSelect(modality.id)} style={{ width: cardWidth }} />
        ))}
      </ScrollView>
      <SegmentedControl
        options={modalities.map((modality) => ({ id: modality.id, label: modality.title, color: modality.color, tag: modality.tag }))}
        value={modalities[activeIndex]?.id ?? modalities[0].id}
        onChange={(id) => {
          goTo(Math.max(0, modalities.findIndex((modality) => modality.id === id)));
        }}
        stretch
        size="sm"
        style={styles.buttons}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { marginTop: 18 },
  track: { gap: GAP },
});
