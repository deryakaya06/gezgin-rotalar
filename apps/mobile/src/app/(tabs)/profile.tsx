import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ProfileSummary } from '@/components/profile-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useProfilePhoto } from '@/hooks/use-profile-photo';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { photoBusy, editPhoto } = useProfilePhoto();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle">Profil</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ayarlar ve gizlilik"
              hitSlop={10}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Ionicons name="menu" size={30} color={theme.text} />
            </Pressable>
          </View>

          <ProfileSummary uid={user?.uid} profile={profile} onEditPhoto={editPhoto} photoBusy={photoBusy}>
            <ThemedText type="caption" themeColor="textSecondary">
              {user?.email}
            </ThemedText>
          </ProfileSummary>

          <Button title="Profili Düzenle" variant="outline" onPress={() => router.push('/settings/edit-profile')} />
          <Button title="Lider Tablosunu Gör" onPress={() => router.push('/leaderboard')} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pressed: { opacity: 0.6 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
});
