import { StyleSheet, Text, View } from 'react-native';

// ponytail: placeholder screen for step 0 (pipeline check); replaced by tabs in step 1
export default function Home() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Gvozdi</Text>
      <Text style={styles.sub}>Stand on nails. Calmly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5efe6' },
  title: { fontSize: 40, color: '#2d2419' },
  sub: { marginTop: 8, fontSize: 16, color: '#7a6b54' },
});
