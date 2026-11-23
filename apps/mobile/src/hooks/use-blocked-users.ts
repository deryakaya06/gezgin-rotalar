import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth';
import { subscribeBlockedIds } from '@/services/blocks';

const NONE: string[] = [];

/** Giriş yapmış kullanıcının engelledikleri; listeler bunları göstermemek için kullanır. */
export function useBlockedUsers() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<{ uid: string; ids: string[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeBlockedIds(
      uid,
      (ids) => setState({ uid, ids }),
      (error) => console.log('Engel listesi alınamadı:', error.message)
    );
  }, [uid]);

  const ids = state && state.uid === uid ? state.ids : NONE;
  const blockedIds = useMemo(() => new Set(ids), [ids]);
  return { ids, blockedIds };
}
