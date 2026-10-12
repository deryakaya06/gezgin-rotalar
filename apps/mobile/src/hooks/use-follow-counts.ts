import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { collection, getCountFromServer } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { db } from '@/firebase';

/**
 * Takipçi/takip sayılarını count() sorgusuyla hesaplar (her 1000 kayıt 1 okuma).
 * Ekran odaklandığında ve refreshKey değiştiğinde yeniden sayar.
 */
export function useFollowCounts(uid: string | undefined, refreshKey?: unknown) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  const load = useCallback(() => {
    if (!uid) return;
    Promise.all([
      getCountFromServer(collection(db, COLLECTIONS.users, uid, 'followers')),
      getCountFromServer(collection(db, COLLECTIONS.users, uid, 'following')),
    ])
      .then(([followers, following]) => {
        setCounts({ followers: followers.data().count, following: following.data().count });
      })
      .catch((error) => {
        console.log('Takip sayilari alinamadi:', error.message);
      });
    // refreshKey yalnızca yeniden saymayı tetiklemek için bağımlılıkta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, refreshKey]);

  useFocusEffect(load);

  return counts;
}
