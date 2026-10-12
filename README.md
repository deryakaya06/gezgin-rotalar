# Gezgin Rotalar

Çiftlerin ve arkadaş gruplarının gezdikleri yerlerde check-in yapıp puan topladığı, birbirlerinin rotalarını takip ettiği mobil uygulama.

## Yapı

| Klasör | İçerik |
|---|---|
| `apps/mobile` | Expo / React Native uygulaması (Expo Router) |
| `packages/shared` | Ortak Firestore tipleri ve sabitler (`@repo/shared`) |
| `packages/ui`, `packages/eslint-config`, `packages/typescript-config` | Turborepo paketleri |
| `firestore.rules`, `firestore.indexes.json` | Firestore güvenlik kuralları ve indexler |
| `firestore-tests` | Kuralların emülatör testleri |
| `scripts` | Başlangıç mekan verisi (`locations.json`) ve yükleme betiği |

## Başlangıç

Gereksinimler: Node.js 24+, npm 11. Kural testleri için Java.

```sh
npm install
cd apps/mobile && npx expo start
```

## Firebase

Proje ücretsiz **Spark** planında; Cloud Functions kullanılmıyor. Puan ve sayaç güncellemelerini istemci tek bir batch ile yazar, `firestore.rules` bu yazımların tutarlı olduğunu doğrular.

```sh
# Kural testleri (emülatörde)
cd firestore-tests && npm install && npm test

# Kuralları ve indexleri yayınlama
npx firebase-tools deploy --only firestore
```

## Mekanlar

`locations` koleksiyonuna yalnızca admin yazabilir. Bir hesabı admin yapmak için Firebase Console'da o hesabın `users/{uid}` dokümanına `role` = `admin` (string) alanı ekle. Kullanıcılar bu alanı kendileri ekleyemez.

```sh
# scripts/locations.json içindeki mekanları yükler/günceller (tekrar çalıştırmak güvenli)
ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:locations
```

## Tema

Renkler yalnızca `apps/mobile/src/constants/theme.ts` içinde tanımlanır (açık/koyu). Bileşenler renkleri `useTheme()` ile okur; ortak arayüz parçaları `apps/mobile/src/components/ui/` altındadır.
