import type { FirestoreTimestamp } from '@repo/shared';

/** Firestore zaman damgasını "12.10.2026" biçiminde gösterir; henüz yazılmadıysa "...". */
export function formatDate(timestamp: FirestoreTimestamp | null | undefined) {
  if (!timestamp?.toDate) return '...';
  return timestamp.toDate().toLocaleDateString('tr-TR');
}
