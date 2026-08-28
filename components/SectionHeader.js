import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#183F34',
  },
  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 22,
    color: '#3F5F58',
  },
});
