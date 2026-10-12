import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { followUser, unfollowUser } from '@/services/follows';

/** Giriş yapmış kullanıcının targetId'yi takip edip etmediğini canlı izler. */
export function useFollow(targetId: string | undefined) {
  const { user } = useAuth();
  const me = user?.uid;
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me || !targetId || me === targetId) return;
    // Yalnızca sunucuya ulaşmış durumu yansıt; böylece isFollowing değiştiğinde
    // yapılan count() sorguları güncel sayıyı görür.
    return onSnapshot(
      doc(db, COLLECTIONS.users, me, 'following', targetId),
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.metadata.hasPendingWrites) setIsFollowing(snap.exists());
      }
    );
  }, [me, targetId]);

  function toggle() {
    if (!me || !targetId || busy) return;
    setBusy(true);
    const action = isFollowing ? unfollowUser : followUser;
    action(me, targetId)
      .catch((error) => {
        console.log('Takip islemi basarisiz:', error.message);
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return { isFollowing, busy, toggle, isSelf: !!me && me === targetId };
}
