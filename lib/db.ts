import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'DetectiveBoardDB';
const PIN_STORE = 'pins';
const LINK_STORE = 'links';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PIN_STORE)) {
        db.createObjectStore(PIN_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LINK_STORE)) {
        db.createObjectStore(LINK_STORE, { keyPath: 'id' });
      }
    },
  });
}

export const dbLocal = {
  async getAllPins() {
    const db = await initDB();
    return db.getAll(PIN_STORE);
  },
  async savePin(pin: any) {
    const db = await initDB();
    return db.put(PIN_STORE, { ...pin, id: pin.id || crypto.randomUUID() });
  },
  async deletePin(id: string) {
    const db = await initDB();
    await db.delete(PIN_STORE, id);
    // Also cleanup associated links
    const links = await db.getAll(LINK_STORE);
    for (const link of links) {
      if (link.pin_a_id === id || link.pin_b_id === id) {
        await db.delete(LINK_STORE, link.id);
      }
    }
  },
  async getAllLinks() {
    const db = await initDB();
    return db.getAll(LINK_STORE);
  },
  async saveLink(link: any) {
    const db = await initDB();
    return db.put(LINK_STORE, { ...link, id: link.id || crypto.randomUUID() });
  },
  async deleteLink(id: string) {
    const db = await initDB();
    return db.delete(LINK_STORE, id);
  }
};