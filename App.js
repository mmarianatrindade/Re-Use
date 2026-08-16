import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from 'react-native';
import SectionHeader from './components/SectionHeader';
import InfoCard from './components/InfoCard';

const stats = [
  { value: '1,2M', label: 'toneladas de resíduos geradas por ano', accent: '#217A5B' },
  { value: '73%', label: 'dos materiais podem ser reutilizados', accent: '#3C9C7A' },
  { value: '3x', label: 'mais impacto com separação correta', accent: '#76B98B' },
];

const features = [
  {
    title: 'Identificação',
    text: 'Reconheça os materiais e entenda como cada um deve ser descartado para evitar contaminação.',
  },
  {
    title: 'Separação',
    text: 'Organize recicláveis, reutilizáveis e orgânicos em categorias para facilitar o tratamento correto.',
  },
  {
    title: 'Destino ideal',
    text: 'Encontre pontos de coleta e canais de reciclagem mais próximos da sua rotina e da sua cidade.',
  },
];

const steps = [
  { icon: '1', title: 'Observe', text: 'Analise o material e escolha a categoria correta.' },
  { icon: '2', title: 'Separe', text: 'Mantenha os itens limpos e organizados em casa ou no trabalho.' },
  { icon: '3', title: 'Doe ou recicle', text: 'Leve ao ponto adequado e reduza o impacto ambiental.' },
];

const materials = [
  {
    id: 'papel',
    name: 'Papel',
    time: '2 a 6 meses',
    category: 'Reciclável',
    description: 'Papel, caixa de leite, embalagens achatadas e jornais devem ser secos e separados da sujeira.',
    disposal: 'Leve ao reciclável ou ao ecoponto mais próximo.',
    color: '#4AAE78',
  },
  {
    id: 'plastico',
    name: 'Plástico',
    time: '200 a 450 anos',
    category: 'Reciclável',
    description: 'Garrafas, potes, tampas e embalagens precisam ser lavados e retirados de resíduos orgânicos.',
    disposal: 'Coloque em recipiente próprio para plástico ou em coleta seletiva.',
    color: '#2E8B6A',
  },
  {
    id: 'metal',
    name: 'Metal',
    time: '50 a 500 anos',
    category: 'Reciclável',
    description: 'Latas, alumínio e ferro podem ser reutilizados em larga escala e têm grande valor de reciclagem.',
    disposal: 'Separe por tipo e entregue em pontos de coleta de metal.',
    color: '#7CCB8C',
  },
  {
    id: 'vidro',
    name: 'Vidro',
    time: 'mais de 1 milhão de anos',
    category: 'Reciclável',
    description: 'Garrafas e potes de vidro devem ser limpos e separados, sem mistura com outros resíduos.',
    disposal: 'Mantenha em saco ou caixa e entregue ao ponto de coleta de vidro.',
    color: '#4AC0D4',
  },
  {
    id: 'organico',
    name: 'Orgânico',
    time: '3 a 6 meses',
    category: 'Compostagem',
    description: 'Restos de alimentos e folhas secas podem virar adubo orgânico com compostagem.',
    disposal: 'Separe em um recipiente específico para compostagem ou coleta orgânica.',
    color: '#6CCB62',
  },
  {
    id: 'eletronico',
    name: 'E-lixo',
    time: 'varia conforme o componente',
    category: 'Especial',
    description: 'Pilhas, baterias e pequenos eletrônicos precisam de tratamento diferenciado para evitar contaminação.',
    disposal: 'Entregue em pontos de coleta de resíduos eletrônicos e baterias.',
    color: '#FFB65C',
  },
];

const decomposition = [
  { name: 'Papel', time: '2 a 6 meses' },
  { name: 'Orgânico', time: '3 a 6 meses' },
  { name: 'Metal', time: '50 a 500 anos' },
  { name: 'Plástico', time: '200 a 450 anos' },
  { name: 'Vidro', time: 'mais de 1 milhão de anos' },
];

export default function App() {
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0]);

  const selectedMaterialIndex = useMemo(
    () => materials.findIndex((material) => material.id === selectedMaterial.id),
    [selectedMaterial],
  );

  const handleHelpPress = () => {
    Alert.alert(
      'Dica ReUse',
      'Separe materiais recicláveis, reutilizáveis e orgânicos e leve para pontos de coleta apropriados.',
    );
  };

  const handleOpenGoogleMaps = () => {
    const url = 'https://www.google.com/maps/search/ecopontos+p%C3%BAblicos';
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#DDF5E8" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navbar}>
          <Text style={styles.brand}>ReUse</Text>
          <View style={styles.navLinks}>
            <Text style={styles.navLink}>Início</Text>
            <Text style={styles.navLink}>Materiais</Text>
            <Text style={styles.navLink}>Mapa</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGrid}>
            <View style={styles.heroContent}>
              <Text style={styles.badge}>Sustentabilidade urbana</Text>
              <Text style={styles.headline}>Descarte consciente e decomposição correta</Text>
              <Text style={styles.description}>
                A ReUse ajuda pessoas e comunidades a entender melhor o destino dos resíduos,
                reduzindo o impacto ambiental e incentivando escolhas mais inteligentes.
              </Text>

              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleHelpPress}>
                  <Text style={styles.primaryButtonText}>Ver dica</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => Alert.alert('Mais informações', 'Acesse os pontos de coleta e aprenda mais sobre reutilização.')}
                >
                  <Text style={styles.secondaryButtonText}>Saiba mais</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroVisual}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80' }}
                style={styles.planetImage}
              />
            </View>
          </View>
        </View>

        <SectionHeader
          title="Números que importam"
          subtitle="Pequenas mudanças de rotina fazem uma diferença enorme na saúde do planeta."
        />

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader
          title="Materiais e descarte"
          subtitle="Clique em cada material para entender como fazer a separação correta e quanto tempo ele leva para se decompor."
        />

        <View style={styles.materialSelector}>
          {materials.map((material) => {
            const isSelected = selectedMaterial.id === material.id;
            return (
              <TouchableOpacity
                key={material.id}
                activeOpacity={0.8}
                style={[styles.materialButton, isSelected && styles.materialButtonActive]}
                onPress={() => setSelectedMaterial(material)}
              >
                <Text style={[styles.materialButtonText, isSelected && styles.materialButtonTextActive]}>{material.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.materialDetail}>
          <View style={styles.materialHeaderRow}>
            <Text style={styles.materialName}>{selectedMaterial.name}</Text>
            <View style={[styles.materialBadge, { backgroundColor: selectedMaterial.color }]}>
              <Text style={styles.materialBadgeText}>{selectedMaterial.category}</Text>
            </View>
          </View>

          <View style={styles.materialProgressWrap}>
            <View style={styles.materialProgressTrack}>
              <View
                style={[
                  styles.materialProgressFill,
                  { width: `${((selectedMaterialIndex + 1) / materials.length) * 100}%`, backgroundColor: selectedMaterial.color },
                ]}
              />
            </View>
            <Text style={styles.materialProgressLabel}>Nível de cuidado: {selectedMaterialIndex + 1}/{materials.length}</Text>
          </View>

          <Text style={styles.materialTime}>Tempo estimado: {selectedMaterial.time}</Text>
          <Text style={styles.materialDescription}>{selectedMaterial.description}</Text>
          <Text style={styles.materialDisposal}>{selectedMaterial.disposal}</Text>

          <View style={styles.materialSteps}>
            <Text style={styles.materialStepTitle}>Como funciona o descarte:</Text>
            <Text style={styles.materialStep}>1. Seque ou lave o material antes de separar.</Text>
            <Text style={styles.materialStep}>2. Coloque na categoria correta.</Text>
            <Text style={styles.materialStep}>3. Leve ao ponto de coleta mais próximo.</Text>
          </View>
        </View>

        <View style={styles.benefitsGrid}>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🌱</Text>
            <Text style={styles.benefitTitle}>Menos lixo</Text>
            <Text style={styles.benefitText}>A separação correta reduz o volume de resíduos que vai para aterros.</Text>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>♻️</Text>
            <Text style={styles.benefitTitle}>Mais reciclagem</Text>
            <Text style={styles.benefitText}>Materiais limpos e organizados têm muito mais chance de serem reutilizados.</Text>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🌍</Text>
            <Text style={styles.benefitTitle}>Planeta mais saudável</Text>
            <Text style={styles.benefitText}>Ajudamos a reduzir a poluição, o desperdício e o impacto ambiental urbano.</Text>
          </View>
        </View>

        <SectionHeader
          title="Linha do tempo"
          subtitle="Quanto mais tempo o material leva para se decompor, maior o cuidado necessário com o descarte."
        />

        <View style={styles.timelineVisual}>
          <View style={styles.timelineRail} />
          {decomposition.map((item, index) => (
            <View key={item.name} style={[styles.timelinePointWrap, { left: `${(index / (decomposition.length - 1)) * 100}%` }]}>
              <View style={styles.timelineBubble}>
                <Text style={styles.timelineBubbleText}>{item.name}</Text>
                <Text style={styles.timelineBubbleTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.highlightBox}>
          <View style={styles.highlightContent}>
            <Text style={styles.highlightTag}>Impacto real</Text>
            <Text style={styles.highlightTitle}>A escolha certa reduz poluição e economiza recursos naturais.</Text>
            <Text style={styles.highlightText}>
              Quando o consumidor separa corretamente os materiais, o sistema de reciclagem funciona melhor,
              reduzindo enchentes, desperdício e emissão de gases nocivos.
            </Text>
          </View>
        </View>

        <SectionHeader
          title="Ecopontos públicos"
          subtitle="Veja os pontos de coleta públicos mais próximos e ajude a deixar a cidade mais limpa."
        />

        <View style={styles.mapCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.mapImage}
          />
          <Text style={styles.mapTitle}>Mapa do Google</Text>
          <Text style={styles.mapText}>
            Aqui você encontra ecopontos públicos disponíveis para coleta seletiva. Em breve, teremos também pontos particulares.
          </Text>
          <TouchableOpacity style={styles.mapButton} onPress={handleOpenGoogleMaps}>
            <Text style={styles.mapButtonText}>Abrir no Google Maps</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Pronto para agir?</Text>
          <Text style={styles.actionText}>
            Comece separando os resíduos da sua casa, use pontos de coleta e incentive outros a fazerem o mesmo.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleHelpPress}>
            <Text style={styles.primaryButtonText}>Quero aprender mais</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DDF5E8',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 18,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#164235',
    letterSpacing: 1,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  navLink: {
    fontSize: 14,
    color: '#2E5C4D',
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#F3FFF7',
    borderRadius: 30,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1B4A3E',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  heroContent: {
    flex: 1.2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E6B4F',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    fontWeight: '700',
    marginBottom: 16,
    overflow: 'hidden',
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#163F33',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#3B5E57',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1F5F47',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minWidth: 170,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E7DA',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minWidth: 170,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1D5A45',
    fontWeight: '800',
    fontSize: 15,
  },
  heroVisual: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: '#DDF7E8',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#496B62',
  },
  materialSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  materialButton: {
    backgroundColor: '#F2F8F4',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8EAE0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  materialButtonActive: {
    backgroundColor: '#1E6B4F',
    borderColor: '#1E6B4F',
  },
  materialButtonText: {
    fontWeight: '700',
    color: '#1C5143',
  },
  materialButtonTextActive: {
    color: '#FFFFFF',
  },
  materialDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  materialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#163F33',
  },
  materialBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  materialBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  materialProgressWrap: {
    marginBottom: 14,
  },
  materialProgressTrack: {
    height: 10,
    backgroundColor: '#DDEFE2',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  materialProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  materialProgressLabel: {
    fontSize: 12,
    color: '#4C726A',
    fontWeight: '700',
  },
  materialTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F5F47',
    marginBottom: 10,
  },
  materialDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#446860',
    marginBottom: 12,
  },
  materialDisposal: {
    fontSize: 15,
    lineHeight: 24,
    color: '#244F41',
    fontWeight: '700',
    marginBottom: 16,
  },
  materialSteps: {
    backgroundColor: '#F3FFF7',
    borderRadius: 18,
    padding: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
    marginBottom: 8,
  },
  benefitCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  benefitIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163F33',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A6B5F',
  },
  materialStepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163F33',
    marginBottom: 8,
  },
  materialStep: {
    fontSize: 14,
    lineHeight: 22,
    color: '#476B60',
    marginBottom: 4,
  },
  timelineVisual: {
    position: 'relative',
    height: 160,
    marginTop: 10,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#153E33',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  timelineRail: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '50%',
    height: 5,
    backgroundColor: '#D8EDE1',
    borderRadius: 10,
  },
  timelinePointWrap: {
    position: 'absolute',
    top: 20,
    width: 120,
    alignItems: 'center',
    transform: [{ translateX: -60 }],
  },
  timelineBubble: {
    backgroundColor: '#EAFBF0',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFEAD9',
  },
  timelineBubbleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F5F47',
  },
  timelineBubbleTime: {
    fontSize: 12,
    color: '#4E766A',
    marginTop: 4,
  },
  highlightBox: {
    backgroundColor: '#1E4F3F',
    borderRadius: 28,
    padding: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  highlightContent: {
    gap: 8,
  },
  highlightTag: {
    color: '#C7F0D4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  highlightTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  highlightText: {
    color: '#DAF4E6',
    fontSize: 15,
    lineHeight: 24,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  mapImage: {
    width: '100%',
    height: 180,
  },
  mapTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#164235',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  mapText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#476B60',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  mapButton: {
    backgroundColor: '#1F5F47',
    borderRadius: 999,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cardGrid: {
    gap: 14,
    marginTop: 8,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  stepCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E1F4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D5A45',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#143B32',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A6B5F',
    textAlign: 'center',
  },
  actionBox: {
    backgroundColor: '#F3FFF7',
    borderRadius: 26,
    padding: 22,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#D4E7DA',
    alignItems: 'flex-start',
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163F33',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3E5F57',
    marginBottom: 18,
  },
});
