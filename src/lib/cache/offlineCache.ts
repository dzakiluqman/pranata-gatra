import { QueryClient } from '@tanstack/react-query';

const CACHE_STORAGE_KEY = 'PRANATA_GATRA_QUERY_SNAPSHOT_V1';

// Daftar queryKey prefix yang penting untuk disimpan secara statis offline
const PERSISTED_QUERY_KEYS = [
  'workspaces',
  'workspace',
  'workspace-members',
  'subjects',
  'subject',
  'schedules',
  'tasks',
  'today-schedules',
  'my-workspace-invitations',
];

interface SerializedQuery {
  queryKey: readonly unknown[];
  data: unknown;
  timestamp: number;
}

/**
 * Menyimpan snapshot query cache ke localStorage (didukung SQLite via expo-sqlite)
 */
export function saveQuerySnapshot(queryClient: QueryClient) {
  try {
    if (typeof localStorage === 'undefined') return;

    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const snapshot: SerializedQuery[] = [];

    for (const query of queries) {
      const keyStr = String(query.queryKey[0]);
      if (
        PERSISTED_QUERY_KEYS.includes(keyStr) &&
        query.state.data !== undefined &&
        query.state.status === 'success'
      ) {
        snapshot.push({
          queryKey: query.queryKey,
          data: query.state.data,
          timestamp: query.state.dataUpdatedAt,
        });
      }
    }

    if (snapshot.length > 0) {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch (err) {
    console.warn('[OfflineCache] Failed to save snapshot:', err);
  }
}

/**
 * Memulihkan data snapshot query cache dari localStorage ke QueryClient
 */
export function restoreQuerySnapshot(queryClient: QueryClient) {
  try {
    if (typeof localStorage === 'undefined') return;

    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;

    const snapshot = JSON.parse(raw) as SerializedQuery[];
    if (!Array.isArray(snapshot)) return;

    for (const item of snapshot) {
      // Hanya isi jika data belum ada di cache memory
      const existing = queryClient.getQueryData(item.queryKey);
      if (existing === undefined && item.data !== undefined) {
        queryClient.setQueryData(item.queryKey, item.data, {
          updatedAt: item.timestamp,
        });
      }
    }
  } catch (err) {
    console.warn('[OfflineCache] Failed to restore snapshot:', err);
  }
}
