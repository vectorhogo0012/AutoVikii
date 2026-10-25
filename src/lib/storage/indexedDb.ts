import { InspectionRecord, PhotoEvidence } from '../../types/inspection';

const DB_NAME = 'karshenas_vehicle_inspection_db';
const DB_VERSION = 1;

export const STORES = {
  INSPECTIONS: 'inspections',
  PHOTOS: 'photos',
} as const;

export interface StorageQuotaInfo {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
}

class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean;

  // Fallback in-memory map for environments without IDB support (e.g. Node tests)
  private memoryInspections: Map<string, InspectionRecord> = new Map();
  private memoryPhotos: Map<string, { meta: PhotoEvidence; blob?: Blob }> = new Map();

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isAvailable) {
      throw new Error('IndexedDB is not supported in this runtime environment');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Store: inspections
          if (!db.objectStoreNames.contains(STORES.INSPECTIONS)) {
            const inspStore = db.createObjectStore(STORES.INSPECTIONS, { keyPath: 'id' });
            inspStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            inspStore.createIndex('status', 'status', { unique: false });
            inspStore.createIndex('trackingCode', 'trackingCode', { unique: false });
          }

          // 2. Store: photos (with Blob binary data)
          if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
            const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
            photoStore.createIndex('inspectionId', 'inspectionId', { unique: false });
            photoStore.createIndex('itemId', 'itemId', { unique: false });
            photoStore.createIndex('inspection_item', ['inspectionId', 'itemId'], { unique: false });
            photoStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error || new Error('Failed to open IndexedDB'));
        };
      });
    }

    return this.dbPromise;
  }

  // ===================== INSPECTIONS =====================

  async saveInspection(record: InspectionRecord): Promise<void> {
    if (!this.isAvailable) {
      this.memoryInspections.set(record.id, JSON.parse(JSON.stringify(record)));
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readwrite');
      const store = tx.objectStore(STORES.INSPECTIONS);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getInspection(id: string): Promise<InspectionRecord | null> {
    if (!this.isAvailable) {
      const found = this.memoryInspections.get(id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readonly');
      const store = tx.objectStore(STORES.INSPECTIONS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllInspections(): Promise<InspectionRecord[]> {
    if (!this.isAvailable) {
      return Array.from(this.memoryInspections.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readonly');
      const store = tx.objectStore(STORES.INSPECTIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: InspectionRecord[] = req.result || [];
        records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteInspection(id: string): Promise<void> {
    if (!this.isAvailable) {
      this.memoryInspections.delete(id);
      for (const [photoId, photo] of this.memoryPhotos.entries()) {
        if (photo.meta.inspectionId === id) {
          this.memoryPhotos.delete(photoId);
        }
      }
      return;
    }

    const db = await this.getDB();

    // 1. Delete associated photos
    const photoIdsToDelete = await this.getPhotoIdsForInspection(id);
    if (photoIdsToDelete.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.PHOTOS, 'readwrite');
        const photoStore = tx.objectStore(STORES.PHOTOS);
        photoIdsToDelete.forEach(pId => photoStore.delete(pId));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    // 2. Delete the inspection record
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readwrite');
      const store = tx.objectStore(STORES.INSPECTIONS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ===================== PHOTOS =====================

  async savePhoto(photoMeta: PhotoEvidence, blob: Blob): Promise<void> {
    const recordToSave = {
      ...photoMeta,
      blob,
    };

    if (!this.isAvailable) {
      this.memoryPhotos.set(photoMeta.id, { meta: photoMeta, blob });
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const req = store.put(recordToSave);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPhotosForInspection(inspectionId: string): Promise<PhotoEvidence[]> {
    if (!this.isAvailable) {
      return Array.from(this.memoryPhotos.values())
        .filter(p => p.meta.inspectionId === inspectionId)
        .map(p => ({ ...p.meta, blob: p.blob }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const index = store.index('inspectionId');
      const req = index.getAll(inspectionId);

      req.onsuccess = () => {
        const results = (req.result || []).map(r => ({
          id: r.id,
          inspectionId: r.inspectionId,
          itemId: r.itemId,
          filename: r.filename,
          fileSize: r.fileSize,
          mimeType: r.mimeType,
          thumbnailDataUrl: r.thumbnailDataUrl,
          blob: r.blob,
          createdAt: r.createdAt,
          syncStatus: r.syncStatus || 'pending_sync',
        }));
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getPhotosForItem(inspectionId: string, itemId: string): Promise<PhotoEvidence[]> {
    const all = await this.getPhotosForInspection(inspectionId);
    return all.filter(p => p.itemId === itemId);
  }

  async getPhotoBlob(photoId: string): Promise<Blob | null> {
    if (!this.isAvailable) {
      const found = this.memoryPhotos.get(photoId);
      return found?.blob || null;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const req = store.get(photoId);

      req.onsuccess = () => {
        resolve(req.result?.blob || null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deletePhoto(photoId: string): Promise<void> {
    if (!this.isAvailable) {
      this.memoryPhotos.delete(photoId);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const req = store.delete(photoId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async getPhotoIdsForInspection(inspectionId: string): Promise<string[]> {
    const photos = await this.getPhotosForInspection(inspectionId);
    return photos.map(p => p.id);
  }

  // ===================== QUOTA & RESET =====================

  async getStorageQuota(): Promise<StorageQuotaInfo> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 1024 * 1024 * 100;
        const percentUsed = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
        return { usedBytes, quotaBytes, percentUsed };
      } catch {
        // Fallback
      }
    }

    return { usedBytes: 0, quotaBytes: 1024 * 1024 * 50, percentUsed: 0 };
  }

  async clearAll(): Promise<void> {
    this.memoryInspections.clear();
    this.memoryPhotos.clear();

    if (!this.isAvailable) return;

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INSPECTIONS, STORES.PHOTOS], 'readwrite');
      const inspStore = tx.objectStore(STORES.INSPECTIONS);
      const photoStore = tx.objectStore(STORES.PHOTOS);

      inspStore.clear();
      photoStore.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const indexedDbStorage = new IndexedDbService();
