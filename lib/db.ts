import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'DetectiveBoardDB';
const STORE_NAME = 'media';
const USER_STORE = 'users';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(USER_STORE)) {
        db.createObjectStore(USER_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function saveMediaLocal(mediaItem: any) {
  const db = await initDB();
  return db.put(STORE_NAME, {
    ...mediaItem,
    id: mediaItem.id || crypto.randomUUID(),
    created_at: new Date().toISOString(),
  });
}

export async function getLocalMedia() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}