import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Halaman Tidak Ditemukan' }} />

      <View style={styles.container}>
        <Text style={styles.code}>404</Text>

        <Text style={styles.title}>
          Halaman tidak ditemukan
        </Text>

        <Text style={styles.subtitle}>
          Halaman yang kamu cari tidak tersedia.
        </Text>

        <Link href="/" style={styles.link}>
          Kembali ke Beranda
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  code: {
    fontSize: 64,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
  },
});