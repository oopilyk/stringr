import { View, Text, StyleSheet } from 'react-native'

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RallyStrings</Text>
      <Text style={styles.subtitle}>Discover Local Tennis Stringers</Text>
      <Text style={styles.description}>
        Welcome to RallyStrings! This mobile app mirrors the functionality of the web app.
        Find local tennis stringers, create restring requests, and manage your tennis equipment needs.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
})
