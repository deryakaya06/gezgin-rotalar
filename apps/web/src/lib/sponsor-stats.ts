import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS, type CheckIn, type Location, type WithId } from '@repo/shared';

import { db } from '@/lib/firebase';

const RECENT_DAYS = 30;

export type SponsorStats = {
  location: WithId<Location>;
  checkIns: number;
  recentCheckIns: number;
  visitors: number;
  likes: number;
  lastCheckIn: Date | null;
};

/** Sponsorlu mekanların check-in istatistikleri, en çok check-in alan önce. */
export async function fetchSponsorStats(locations: WithId<Location>[]): Promise<SponsorStats[]> {
  const since = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const stats = await Promise.all(
    locations
      .filter((location) => location.isSponsored)
      .map(async (location) => {
        const snapshot = await getDocs(
          query(collection(db, COLLECTIONS.checkIns), where('locationId', '==', location.id))
        );
        const items = snapshot.docs.map((d) => d.data() as CheckIn);
        const times = items.flatMap((item) => item.createdAt?.toDate?.().getTime() ?? []);
        return {
          location,
          checkIns: items.length,
          recentCheckIns: times.filter((time) => time >= since).length,
          visitors: new Set(items.map((item) => item.userId)).size,
          likes: items.reduce((sum, item) => sum + (item.likeCount ?? 0), 0),
          lastCheckIn: times.length ? new Date(Math.max(...times)) : null,
        };
      })
  );
  return stats.sort((a, b) => b.checkIns - a.checkIns);
}
