import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import type { AccountType } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { auth } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { createUserProfile } from '@/services/users';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Geçerli bir email adresi gir.',
  'auth/email-already-in-use': 'Bu email ile zaten bir hesap var. Giriş yapmayı dene.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/invalid-credential': 'Email veya şifre hatalı.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
  'auth/network-request-failed': 'İnternet bağlantını kontrol et.',
};

function authErrorMessage(error: { code?: string; message: string }) {
  return AUTH_ERRORS[error.code ?? ''] ?? 'Bir hata oluştu: ' + error.message;
}

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('couple');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!email || !password) {
      setMessage('Email ve şifre boş bırakılamaz.');
      return;
    }

    setMessage('');

    if (mode === 'register') {
      const name = displayName.trim();
      if (name.length < 2) {
        setMessage('Görünen ad en az 2 karakter olmalı.');
        return;
      }

      setSubmitting(true);
      createUserWithEmailAndPassword(auth, email.trim(), password)
        .then((userCredential) =>
          createUserProfile(userCredential.user.uid, { displayName: name, accountType })
        )
        .then(() => {
          router.replace('/welcome');
        })
        .catch((error) => {
          setMessage(authErrorMessage(error));
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      // Yönlendirmeyi _layout'taki Stack.Protected yapar.
      setSubmitting(true);
      signInWithEmailAndPassword(auth, email.trim(), password)
        .catch((error) => {
          setMessage(authErrorMessage(error));
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }

  function toggleMode() {
    setMode(mode === 'register' ? 'login' : 'register');
    setMessage('');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle" style={styles.title}>
              {mode === 'register' ? "Gezgin Rotalar'a Kayıt Ol" : 'Giriş Yap'}
            </ThemedText>

            {mode === 'register' && (
              <TextField
                placeholder="Görünen ad (ör. Ayşe & Mehmet)"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={40}
                textContentType="nickname"
              />
            )}

            <TextField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <TextField
              placeholder="Şifre (en az 6 karakter)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
            />

            {mode === 'register' && (
              <View style={styles.typeRow}>
                <Chip
                  label="💑 Çift"
                  selected={accountType === 'couple'}
                  onPress={() => setAccountType('couple')}
                />
                <Chip
                  label="👥 Arkadaşlar"
                  selected={accountType === 'friends'}
                  onPress={() => setAccountType('friends')}
                />
              </View>
            )}

            <Button
              title={
                submitting ? 'Bekleyin...' : mode === 'register' ? 'Kayıt Ol' : 'Giriş Yap'
              }
              onPress={handleSubmit}
              disabled={submitting}
            />

            <Pressable onPress={toggleMode} hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.switchText}>
                {mode === 'register'
                  ? 'Zaten hesabın var mı? Giriş yap'
                  : 'Hesabın yok mu? Kayıt ol'}
              </ThemedText>
            </Pressable>

            {message ? (
              <ThemedText type="small" style={[styles.message, { color: theme.danger }]}>
                {message}
              </ThemedText>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { textAlign: 'center', marginBottom: Spacing.three },
  typeRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  switchText: { textAlign: 'center', textDecorationLine: 'underline' },
  message: { textAlign: 'center' },
});
