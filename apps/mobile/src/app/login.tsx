import { useState } from 'react';
import { StyleSheet, Button, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { auth, db } from '@/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('couple');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    if (!email || !password) {
      setMessage('Email ve şifre boş bırakılamaz.');
      return;
    }

    if (mode === 'register') {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const uid = userCredential.user.uid;
          return setDoc(doc(db, 'users', uid), {
            email,
            accountType,
            points: 0,
            createdAt: new Date().toISOString(),
          }).then(() => {
            router.replace('/welcome');
          });
        })
        .catch((error) => {
          setMessage('Hata: ' + error.message);
        });
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          router.replace('/(tabs)');
        })
        .catch((error) => {
          setMessage('Hata: ' + error.message);
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
        <ThemedText type="title" style={styles.title}>
          {mode === 'register' ? 'Gezgin Rotalar\'a Kayıt Ol' : 'Giriş Yap'}
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Şifre (en az 6 karakter)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === 'register' && (
          <ThemedView style={styles.typeRow}>
            <Pressable
              onPress={() => setAccountType('couple')}
              style={[
                styles.typeButton,
                accountType === 'couple' && styles.typeButtonSelected,
              ]}
            >
              <ThemedText>Çift</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setAccountType('friends')}
              style={[
                styles.typeButton,
                accountType === 'friends' && styles.typeButtonSelected,
              ]}
            >
              <ThemedText>Arkadaşlar</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Button
          title={mode === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}
          onPress={handleSubmit}
        />

        <Pressable onPress={toggleMode}>
          <ThemedText style={styles.switchText}>
            {mode === 'register'
              ? 'Zaten hesabın var mı? Giriş yap'
              : 'Hesabın yok mu? Kayıt ol'}
          </ThemedText>
        </Pressable>

        {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { textAlign: 'center', marginBottom: Spacing.three },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  typeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  typeButtonSelected: { borderColor: '#3B82F6', borderWidth: 2 },
  switchText: { textAlign: 'center', textDecorationLine: 'underline' },
  message: { marginTop: Spacing.three, textAlign: 'center' },
});