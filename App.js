import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, View, Text, StyleSheet, Button, Alert } from 'react-native';
import SectionHeader from './components/SectionHeader';
import InfoCard from './components/InfoCard';

export default function App() {
  const handleHelpPress = () => {
    Alert.alert(
      'Dica ReUse',
      'Separe materiais recicláveis, reutilizáveis ou orgânicos e leve para pontos de coleta apropriados.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#D7F3E5" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.badge}>ReUse</Text>
          <Text style={styles.headline}>Descarte consciente e decomposição correta</Text>
          <Text style={styles.description}>
            Uma plataforma para mostrar onde descartar materiais e entender quanto tempo cada item leva para se decompor.
          </Text>
        </View>

        <SectionHeader
          title="Nossa proposta"
          subtitle="Ajude a construir um futuro sustentável com informações claras sobre reciclagem e decomposição."
        />

        <InfoCard title="O problema">
          O descarte incorreto causa poluição, entupimento de rios e aumenta o volume de lixo que demora décadas para desaparecer.
        </InfoCard>

        <InfoCard title="Como funciona">
          1. Identifique o material{`\n`}2. Separe corretamente{`\n`}3. Leve ao ponto de coleta ideal
        </InfoCard>

        <InfoCard title="Decomposição de materiais">
          Papel: 2 a 6 meses{`\n`}Plástico: 200 a 450 anos{`\n`}Vidro: mais de 1 milhão de anos{`\n`}Metal: 50 a 500 anos{`\n`}Orgânico: 3 a 6 meses
        </InfoCard>

        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Primeiro contato mobile</Text>
          <Text style={styles.actionText}>
            Esta tela inicial foi pensada para ser simples, clara e útil, com componentes reutilizáveis e foco na mensagem do ReUse.
          </Text>
          <Button title="Ver dica" onPress={handleHelpPress} color="#276A4A" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D7F3E5',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: '#EFFBF4',
    borderRadius: 30,
    padding: 24,
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#276A4A',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  headline: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: '#164235',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3B5E57',
  },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#164235',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3F5C57',
    marginBottom: 14,
  },
});
