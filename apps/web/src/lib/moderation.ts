import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  type CheckIn,
  type Report,
  type UserProfile,
  type WithId,
} from '@repo/shared';

import { db } from '@/lib/firebase';

/** Aynı paylaşıma gelen şikâyetler; paylaşım sonradan silindiyse checkIn null olur. */
export type ReportGroup = {
  checkInId: string;
  checkIn: CheckIn | null;
  ownerName: string;
  reports: WithId<Report>[];
};

export async function fetchReportGroups(): Promise<ReportGroup[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.reports), orderBy('createdAt', 'desc'), limit(200))
  );
  const byCheckIn = new Map<string, WithId<Report>[]>();
  for (const d of snapshot.docs) {
    const report = { id: d.id, ...(d.data() as Report) };
    byCheckIn.set(report.checkInId, [...(byCheckIn.get(report.checkInId) ?? []), report]);
  }

  const groups = await Promise.all(
    [...byCheckIn.entries()].map(async ([checkInId, reports]) => {
      const checkInSnap = await getDoc(doc(db, COLLECTIONS.checkIns, checkInId));
      const checkIn = checkInSnap.exists() ? (checkInSnap.data() as CheckIn) : null;
      const owner = checkIn ? await getDoc(doc(db, COLLECTIONS.users, checkIn.userId)) : null;
      return {
        checkInId,
        checkIn,
        ownerName: (owner?.data() as UserProfile | undefined)?.displayName ?? '—',
        reports,
      };
    })
  );
  return groups.sort((a, b) => b.reports.length - a.reports.length);
}

/** Paylaşım kalır, şikâyetler kapatılır. */
export function dismissReports(group: ReportGroup) {
  const batch = writeBatch(db);
  for (const report of group.reports) batch.delete(doc(db, COLLECTIONS.reports, report.id));
  return batch.commit();
}

/** Paylaşımı kaldırır, sahibinin puanını ve ziyaretini geri alır, şikâyetleri kapatır. */
export function removeCheckIn(group: ReportGroup) {
  if (!group.checkIn) return dismissReports(group);
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.checkIns, group.checkInId));
  batch.update(doc(db, COLLECTIONS.users, group.checkIn.userId), {
    totalPoints: increment(-(group.checkIn.points ?? 0)),
    visitCount: increment(-1),
    lastDeletedCheckInId: group.checkInId,
  });
  for (const report of group.reports) batch.delete(doc(db, COLLECTIONS.reports, report.id));
  return batch.commit();
}
