import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoCard({ icon, title, text }) {
  return (
    <View style={styles.card}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDECE2',
    shadowColor: '#153E33',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  icon: {
    fontSize: 26,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#164235',
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#496B62',
  },
});
