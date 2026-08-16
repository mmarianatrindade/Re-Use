import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#153E33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E6F0EA',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#164235',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#446860',
  },
});
