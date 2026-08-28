import React, { useState } from 'react';
import {
  Alert,
  Button,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SectionHeader from './components/SectionHeader';
import InfoCard from './components/InfoCard';
import StepCard from './components/StepCard';
import { benefits, materials, problemCards, steps } from './data/reuseData';

export default function App() {
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0]);

  const handleTipPress = () => {
    Alert.alert(
      'Dica ReUse',
      'Antes de descartar, pergunte: posso reutilizar, consertar ou doar este item? Se não, procure o destino correto para o material.',
    );
  };

  const handleOpenMaps = async () => {
    const url = 'https://www.google.com/maps/search/ecopontos+p%C3%BAblicos';

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Não foi possível abrir o mapa', 'Procure por ecopontos públicos no aplicativo de mapas do seu celular.');
      }
    } catch (error) {
      Alert.alert('Não foi possível abrir o mapa', 'Tente novamente ou pesquise por ecopontos públicos no seu aplicativo de mapas.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#DDF5E8" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>ReUse</Text>
            <Text style={styles.brandSubtitle}>Consumo consciente começa antes do descarte.</Text>
          </View>
          <View style={styles.brandTag}>
            <Text style={styles.brandTagText}>Eco+</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>Sustentabilidade no dia a dia</Text>
          <Text style={styles.headline}>Reutilize mais. Descarte melhor.</Text>
          <Text style={styles.description}>
            A ReUse ajuda pessoas a identificar o que pode ser reutilizado, doado ou reciclado, orientando o destino mais responsável para cada produto.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleTipPress} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Ver uma dica sustentável</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader
          title="Qual problema queremos resolver?"
          subtitle="O descarte incorreto começa, muitas vezes, pela falta de informação sobre o que fazer com um produto que deixou de ser útil."
        />

        {problemCards.map((item) => (
          <InfoCard key={item.title} icon={item.icon} title={item.title} text={item.text} />
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightLabel}>PROPOSTA DE VALOR</Text>
          <Text style={styles.highlightTitle}>Dar uma nova chance aos produtos antes de transformá-los em resíduos.</Text>
          <Text style={styles.highlightText}>
            A plataforma organiza orientações simples para ajudar o usuário a decidir entre reutilizar, doar e reciclar.
          </Text>
        </View>

        <SectionHeader
          title="Como a ReUse funciona"
          subtitle="Um fluxo simples para apoiar decisões mais conscientes no cotidiano."
        />

        {steps.map((step) => (
          <StepCard key={step.title} icon={step.icon} title={step.title} text={step.text} />
        ))}

        <SectionHeader
          title="Consulte por material"
          subtitle="Selecione uma categoria para ver uma orientação rápida de reuso e descarte."
        />

        <View style={styles.materialSelector}>
          {materials.map((material) => {
            const isSelected = material.id === selectedMaterial.id;

            return (
              <TouchableOpacity
                key={material.id}
                style={[styles.materialButton, isSelected && styles.materialButtonActive]}
                onPress={() => setSelectedMaterial(material)}
                activeOpacity={0.8}
              >
                <Text style={[styles.materialButtonText, isSelected && styles.materialButtonTextActive]}>
                  {material.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.materialCard}>
          <View style={styles.materialHeader}>
            <Text style={styles.materialName}>{selectedMaterial.name}</Text>
            <View style={[styles.materialBadge, { backgroundColor: selectedMaterial.color }]}>
              <Text style={styles.materialBadgeText}>{selectedMaterial.category}</Text>
            </View>
          </View>

          <Text style={styles.materialDescription}>{selectedMaterial.description}</Text>

          <View style={styles.materialTip}>
            <Text style={styles.materialTipTitle}>Antes de descartar</Text>
            <Text style={styles.materialTipText}>{selectedMaterial.reuse}</Text>
          </View>

          <View style={styles.materialTip}>
            <Text style={styles.materialTipTitle}>Destino recomendado</Text>
            <Text style={styles.materialTipText}>{selectedMaterial.disposal}</Text>
          </View>
        </View>

        <SectionHeader
          title="Por que reutilizar?"
          subtitle="A ReUse incentiva decisões simples que prolongam a vida útil dos produtos e reduzem desperdícios."
        />

        {benefits.map((item) => (
          <InfoCard key={item.title} icon={item.icon} title={item.title} text={item.text} />
        ))}

        <SectionHeader
          title="Encontre um ecoponto"
          subtitle="Quando o item não puder ser reutilizado ou doado, procure um ponto de coleta adequado na sua região."
        />

        <View style={styles.mapCard}>
          <Text style={styles.mapIcon}>📍</Text>
          <Text style={styles.mapTitle}>Pontos de coleta</Text>
          <Text style={styles.mapText}>
            A busca abre o Google Maps com ecopontos públicos. Nesta Sprint, não utilizamos backend, banco de dados ou APIs externas.
          </Text>
          <View style={styles.nativeButtonWrap}>
            <Button title="Buscar ecopontos" color="#1F5F47" onPress={handleOpenMaps} />
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Pequenas escolhas, novos ciclos.</Text>
          <Text style={styles.footerText}>
            Reutilizar primeiro e descartar corretamente depois é uma forma simples de tornar o consumo mais consciente.
          </Text>
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#164235',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    maxWidth: 260,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#4A6B5F',
  },
  brandTag: {
    backgroundColor: '#F1FFF6',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#CFE8D8',
  },
  brandTagText: {
    color: '#1F5F47',
    fontWeight: '800',
    fontSize: 12,
  },
  hero: {
    backgroundColor: '#F7FFF9',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#D7F0E0',
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E1F4E8',
    color: '#1D5A45',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    fontWeight: '800',
    fontSize: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: '#163F33',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3F5F58',
    marginBottom: 20,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F5F47',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  highlightBox: {
    backgroundColor: '#163F33',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  highlightLabel: {
    color: '#BFE7CD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  highlightTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    marginBottom: 9,
  },
  highlightText: {
    color: '#DCF2E4',
    fontSize: 14,
    lineHeight: 22,
  },
  materialSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  materialButton: {
    backgroundColor: '#F4FAF6',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5E8DC',
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  materialButtonActive: {
    backgroundColor: '#1F5F47',
    borderColor: '#1F5F47',
  },
  materialButtonText: {
    color: '#245443',
    fontSize: 13,
    fontWeight: '800',
  },
  materialButtonTextActive: {
    color: '#FFFFFF',
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 19,
    borderWidth: 1,
    borderColor: '#DDECE2',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#163F33',
  },
  materialBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  materialBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  materialDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#496B62',
    marginBottom: 14,
  },
  materialTip: {
    backgroundColor: '#F4FBF6',
    borderRadius: 16,
    padding: 14,
    marginTop: 9,
  },
  materialTipTitle: {
    color: '#1A5541',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },
  materialTipText: {
    color: '#476B60',
    fontSize: 13,
    lineHeight: 20,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDECE2',
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#164235',
    marginBottom: 7,
  },
  mapText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#496B62',
    marginBottom: 16,
  },
  nativeButtonWrap: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 10,
  },
  footerCard: {
    backgroundColor: '#EAF9EF',
    borderRadius: 22,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#CEE7D7',
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#164235',
    marginBottom: 7,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#496B62',
  },
});
