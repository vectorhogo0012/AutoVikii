import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  InspectionRecord,
  VehicleInfo,
  ItemStatus,
  ChecklistCategory,
  ScoreResult,
  PhotoEvidence,
  SaveStatus,
  SyncStatus,
  ConflictRecordInfo,
  HandoverEquipmentItem,
  HandoverItemStatus,
} from '../../types/inspection';
import { inspectionRepository } from '../../lib/repository/inspectionRepository';
import { calculateInspectionScore } from '../scoring/scoringEngine';
import { createDefaultHandoverItems } from '../checklist/handoverTemplates';
import { compressImage } from '../../lib/media/imageCompression';
import { StorageQuotaInfo, indexedDbStorage } from '../../lib/storage/indexedDb';
import { syncEngine, SyncEngineState } from '../../lib/sync/syncEngine';
import { useAuth } from '../auth/AuthContext';

interface InspectionContextType {
  inspections: InspectionRecord[];
  currentInspection: InspectionRecord | null;
  scoreResult: ScoreResult | null;
  activeCategory: ChecklistCategory;
  photos: PhotoEvidence[];
  saveStatus: SaveStatus;
  cloudSyncState: SyncEngineState;
  syncMessage: string | null;
  activeConflict: ConflictRecordInfo | null;
  lastSavedAt: string | null;
  isOnline: boolean;
  storageQuota: StorageQuotaInfo | null;
  isLoading: boolean;
  setActiveCategory: (category: ChecklistCategory) => void;
  selectInspection: (id: string) => Promise<void>;
  createInspection: (vehicle: VehicleInfo, notes?: string) => Promise<string>;
  updateVehicle: (vehicle: VehicleInfo) => Promise<void>;
  setItemStatus: (itemId: string, status: ItemStatus) => void;
  setItemNote: (itemId: string, note: string) => void;
  setHandoverItemStatus: (itemId: string, status: HandoverItemStatus) => void;
  setHandoverItemNote: (itemId: string, note: string) => void;
  setInspectionStatus: (status: 'in_progress' | 'completed' | 'draft') => Promise<void>;
  deleteInspectionRecord: (id: string) => Promise<boolean>;
  addPhotoToItem: (itemId: string, file: File) => Promise<PhotoEvidence>;
  removePhoto: (photoId: string, itemId: string) => Promise<void>;
  getItemPhotos: (itemId: string) => PhotoEvidence[];
  triggerCloudSync: () => Promise<void>;
  resolveConflict: (resolvedRecord: InspectionRecord) => Promise<void>;
  dismissConflict: () => void;
  refreshInspections: () => Promise<void>;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

const LAST_ACTIVE_INSPECTION_KEY = 'karshenas_active_inspection_id';

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safely consume AuthContext (with fallback if tested without AuthProvider)
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch {
    authContext = null;
  }

  const activeWorkspace = authContext?.activeWorkspace || null;
  const user = authContext?.user || null;

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(null);
  const [photos, setPhotos] = useState<PhotoEvidence[]>([]);
  const [activeCategory, setActiveCategory] = useState<ChecklistCategory>('body_paint');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [cloudSyncState, setCloudSyncState] = useState<SyncEngineState>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<ConflictRecordInfo | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [storageQuota, setStorageQuota] = useState<StorageQuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to SyncEngine notifications
  useEffect(() => {
    const unsubStatus = syncEngine.subscribeStatus((state, msg) => {
      setCloudSyncState(state);
      if (msg) setSyncMessage(msg);
      if (state === 'synced') {
        setSaveStatus('synced');
      } else if (state === 'syncing') {
        setSaveStatus('syncing');
      }
    });

    const unsubConflict = syncEngine.subscribeConflict(conflict => {
      setActiveConflict(conflict);
    });

    return () => {
      unsubStatus();
      unsubConflict();
    };
  }, []);

  // Monitor online / offline status & auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (activeWorkspace) {
        syncEngine.syncAll(activeWorkspace.id, user?.uid);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeWorkspace, user]);

  // Update storage quota info
  const refreshStorageQuota = useCallback(async () => {
    try {
      const quota = await inspectionRepository.getStorageQuota();
      setStorageQuota(quota);
    } catch {
      // Ignore
    }
  }, []);

  // Load photos whenever current inspection changes
  const loadInspectionPhotos = useCallback(async (inspectionId: string) => {
    try {
      const records = await inspectionRepository.getPhotosForInspection(inspectionId);
      setPhotos(records);
    } catch {
      setPhotos([]);
    }
  }, []);

  // Initialize and load drafts from IndexedDB
  const refreshInspections = useCallback(async () => {
    try {
      const records = await inspectionRepository.getAll();
      setInspections(records);

      let targetRecord: InspectionRecord | null = null;

      try {
        const storedActiveId = localStorage.getItem(LAST_ACTIVE_INSPECTION_KEY);
        if (storedActiveId) {
          targetRecord = records.find(r => r.id === storedActiveId) || null;
        }
      } catch {
        // LocalStorage access failure
      }

      if (!targetRecord && records.length > 0) {
        targetRecord = records[0];
      }

      if (targetRecord) {
        if (!targetRecord.handoverItems || targetRecord.handoverItems.length === 0) {
          targetRecord = { ...targetRecord, handoverItems: createDefaultHandoverItems() };
        }
        setCurrentInspection(targetRecord);
        await loadInspectionPhotos(targetRecord.id);
      }
      await refreshStorageQuota();
    } finally {
      setIsLoading(false);
    }
  }, [loadInspectionPhotos, refreshStorageQuota]);

  useEffect(() => {
    refreshInspections();
  }, [refreshInspections]);

  // Automatically trigger sync when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace && isOnline) {
      syncEngine.syncAll(activeWorkspace.id, user?.uid).then(() => {
        refreshInspections();
      });
    }
  }, [activeWorkspace, isOnline, user, refreshInspections]);

  const triggerCloudSync = useCallback(async () => {
    if (!activeWorkspace) return;
    await syncEngine.syncAll(activeWorkspace.id, user?.uid);
    await refreshInspections();
  }, [activeWorkspace, user, refreshInspections]);

  const selectInspection = useCallback(async (id: string) => {
    const record = await inspectionRepository.getById(id);
    if (record) {
      const ensuredRecord = (!record.handoverItems || record.handoverItems.length === 0)
        ? { ...record, handoverItems: createDefaultHandoverItems() }
        : record;
      setCurrentInspection(ensuredRecord);
      try {
        localStorage.setItem(LAST_ACTIVE_INSPECTION_KEY, ensuredRecord.id);
      } catch {
        // Ignore
      }
      await loadInspectionPhotos(ensuredRecord.id);
      await refreshStorageQuota();
    }
  }, [loadInspectionPhotos, refreshStorageQuota]);

  const createInspection = useCallback(async (vehicle: VehicleInfo, notes = ''): Promise<string> => {
    setSaveStatus('saving');
    try {
      const newRecord = await inspectionRepository.create(vehicle, notes);
      if (activeWorkspace) {
        newRecord.workspaceId = activeWorkspace.id;
      }
      newRecord.revision = 1;
      newRecord.syncStatus = 'pending_sync';
      await inspectionRepository.save(newRecord);

      await refreshInspections();
      setCurrentInspection(newRecord);
      setPhotos([]);
      setActiveCategory('body_paint');
      try {
        localStorage.setItem(LAST_ACTIVE_INSPECTION_KEY, newRecord.id);
      } catch {
        // Ignore
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

      // Non-blocking background sync
      if (activeWorkspace && isOnline) {
        syncEngine.syncAll(activeWorkspace.id, user?.uid);
      }

      return newRecord.id;
    } catch (err) {
      setSaveStatus('error');
      throw err;
    }
  }, [refreshInspections, activeWorkspace, isOnline, user]);

  const updateVehicle = useCallback(async (vehicle: VehicleInfo) => {
    if (!currentInspection) return;
    setSaveStatus('saving');
    try {
      const updated: InspectionRecord = {
        ...currentInspection,
        vehicle,
        revision: (currentInspection.revision || 1) + 1,
        syncStatus: 'pending_sync',
        updatedAt: new Date().toISOString(),
      };
      await inspectionRepository.save(updated);
      setCurrentInspection(updated);
      setInspections(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

      if (activeWorkspace && isOnline) {
        syncEngine.syncAll(activeWorkspace.id, user?.uid);
      }
    } catch {
      setSaveStatus('error');
    }
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const setItemStatus = useCallback((itemId: string, status: ItemStatus) => {
    if (!currentInspection) return;

    setSaveStatus('saving');

    const updatedItems = currentInspection.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedRecord: InspectionRecord = {
      ...currentInspection,
      items: updatedItems,
      revision: (currentInspection.revision || 1) + 1,
      syncStatus: 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    setCurrentInspection(updatedRecord);

    inspectionRepository.save(updatedRecord)
      .then(() => {
        setInspections(prev => prev.map(r => (r.id === updatedRecord.id ? updatedRecord : r)));
        setSaveStatus('saved');
        setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

        if (activeWorkspace && isOnline) {
          syncEngine.syncAll(activeWorkspace.id, user?.uid);
        }
      })
      .catch(() => setSaveStatus('error'));
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const setItemNote = useCallback((itemId: string, note: string) => {
    if (!currentInspection) return;

    const updatedItems = currentInspection.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          note,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedRecord: InspectionRecord = {
      ...currentInspection,
      items: updatedItems,
      revision: (currentInspection.revision || 1) + 1,
      syncStatus: 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    setCurrentInspection(updatedRecord);
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      inspectionRepository.save(updatedRecord)
        .then(() => {
          setInspections(prev => prev.map(r => (r.id === updatedRecord.id ? updatedRecord : r)));
          setSaveStatus('saved');
          setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

          if (activeWorkspace && isOnline) {
            syncEngine.syncAll(activeWorkspace.id, user?.uid);
          }
        })
        .catch(() => setSaveStatus('error'));
    }, 450);
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const setHandoverItemStatus = useCallback((itemId: string, status: HandoverItemStatus) => {
    if (!currentInspection) return;
    setSaveStatus('saving');

    const currentHandover = currentInspection.handoverItems?.length
      ? currentInspection.handoverItems
      : createDefaultHandoverItems();

    const updatedHandover = currentHandover.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedRecord: InspectionRecord = {
      ...currentInspection,
      handoverItems: updatedHandover,
      revision: (currentInspection.revision || 1) + 1,
      syncStatus: 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    setCurrentInspection(updatedRecord);

    inspectionRepository.save(updatedRecord)
      .then(() => {
        setInspections(prev => prev.map(r => (r.id === updatedRecord.id ? updatedRecord : r)));
        setSaveStatus('saved');
        setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

        if (activeWorkspace && isOnline) {
          syncEngine.syncAll(activeWorkspace.id, user?.uid);
        }
      })
      .catch(() => setSaveStatus('error'));
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const setHandoverItemNote = useCallback((itemId: string, note: string) => {
    if (!currentInspection) return;

    const currentHandover = currentInspection.handoverItems?.length
      ? currentInspection.handoverItems
      : createDefaultHandoverItems();

    const updatedHandover = currentHandover.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          note,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedRecord: InspectionRecord = {
      ...currentInspection,
      handoverItems: updatedHandover,
      revision: (currentInspection.revision || 1) + 1,
      syncStatus: 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    setCurrentInspection(updatedRecord);
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      inspectionRepository.save(updatedRecord)
        .then(() => {
          setInspections(prev => prev.map(r => (r.id === updatedRecord.id ? updatedRecord : r)));
          setSaveStatus('saved');
          setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

          if (activeWorkspace && isOnline) {
            syncEngine.syncAll(activeWorkspace.id, user?.uid);
          }
        })
        .catch(() => setSaveStatus('error'));
    }, 450);
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const setInspectionStatus = useCallback(async (status: 'in_progress' | 'completed' | 'draft') => {
    if (!currentInspection) return;
    setSaveStatus('saving');
    try {
      const updated: InspectionRecord = {
        ...currentInspection,
        status,
        revision: (currentInspection.revision || 1) + 1,
        syncStatus: 'pending_sync',
        updatedAt: new Date().toISOString(),
      };
      await inspectionRepository.save(updated);
      setCurrentInspection(updated);
      setInspections(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

      if (activeWorkspace && isOnline) {
        syncEngine.syncAll(activeWorkspace.id, user?.uid);
      }
    } catch {
      setSaveStatus('error');
    }
  }, [currentInspection, activeWorkspace, isOnline, user]);

  const deleteInspectionRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const recordToDelete = await inspectionRepository.getById(id);
      if (recordToDelete) {
        // Mark deleted with tombstone for cloud sync
        recordToDelete.isDeleted = true;
        recordToDelete.deletedAt = new Date().toISOString();
        recordToDelete.syncStatus = 'pending_sync';
        await inspectionRepository.save(recordToDelete);
      }

      const success = await inspectionRepository.delete(id);
      if (success) {
        const remaining = await inspectionRepository.getAll();
        setInspections(remaining);
        if (currentInspection?.id === id) {
          const next = remaining.length > 0 ? remaining[0] : null;
          setCurrentInspection(next);
          if (next) {
            await loadInspectionPhotos(next.id);
            try {
              localStorage.setItem(LAST_ACTIVE_INSPECTION_KEY, next.id);
            } catch {
              // Ignore
            }
          } else {
            setPhotos([]);
            try {
              localStorage.removeItem(LAST_ACTIVE_INSPECTION_KEY);
            } catch {
              // Ignore
            }
          }
        }
        await refreshStorageQuota();

        // Push deletion tombstone to workspace in cloud
        if (activeWorkspace && isOnline) {
          syncEngine.syncAll(activeWorkspace.id, user?.uid);
        }
      }
      return success;
    } catch {
      return false;
    }
  }, [currentInspection, loadInspectionPhotos, refreshStorageQuota, activeWorkspace, isOnline, user]);

  // ===================== PHOTOS =====================

  const addPhotoToItem = useCallback(async (itemId: string, file: File): Promise<PhotoEvidence> => {
    if (!currentInspection) {
      throw new Error('پرونده فعالی انتخاب نشده است.');
    }

    setSaveStatus('saving');

    try {
      const compressed = await compressImage(file);

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const photoMeta: PhotoEvidence = {
        id: photoId,
        inspectionId: currentInspection.id,
        itemId,
        filename: file.name,
        fileSize: compressed.compressedSize,
        mimeType: compressed.mimeType,
        thumbnailDataUrl: compressed.thumbnailDataUrl,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending_sync',
      };

      await inspectionRepository.savePhoto(photoMeta, compressed.fullBlob);
      setPhotos(prev => [...prev, photoMeta]);

      const refreshedInspection = await inspectionRepository.getById(currentInspection.id);
      if (refreshedInspection) {
        refreshedInspection.revision = (refreshedInspection.revision || 1) + 1;
        refreshedInspection.syncStatus = 'pending_sync';
        await inspectionRepository.save(refreshedInspection);

        setCurrentInspection(refreshedInspection);
        setInspections(prev => prev.map(r => (r.id === refreshedInspection.id ? refreshedInspection : r)));
      }

      await refreshStorageQuota();
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

      // Non-blocking upload to Cloud Storage
      if (activeWorkspace && isOnline) {
        syncEngine.syncPhotosForInspection(activeWorkspace.id, currentInspection.id);
      }

      return photoMeta;
    } catch (err) {
      setSaveStatus('error');
      throw err;
    }
  }, [currentInspection, refreshStorageQuota, activeWorkspace, isOnline]);

  const removePhoto = useCallback(async (photoId: string, itemId: string) => {
    if (!currentInspection) return;
    setSaveStatus('saving');

    try {
      await inspectionRepository.deletePhoto(photoId, currentInspection.id, itemId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));

      const refreshed = await inspectionRepository.getById(currentInspection.id);
      if (refreshed) {
        refreshed.revision = (refreshed.revision || 1) + 1;
        refreshed.syncStatus = 'pending_sync';
        await inspectionRepository.save(refreshed);

        setCurrentInspection(refreshed);
        setInspections(prev => prev.map(r => (r.id === refreshed.id ? refreshed : r)));
      }

      await refreshStorageQuota();
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));

      if (activeWorkspace && isOnline) {
        syncEngine.syncAll(activeWorkspace.id, user?.uid);
      }
    } catch {
      setSaveStatus('error');
    }
  }, [currentInspection, refreshStorageQuota, activeWorkspace, isOnline, user]);

  const getItemPhotos = useCallback((itemId: string): PhotoEvidence[] => {
    return photos.filter(p => p.itemId === itemId);
  }, [photos]);

  const resolveConflict = useCallback(async (resolvedRecord: InspectionRecord) => {
    await inspectionRepository.save(resolvedRecord);
    setCurrentInspection(resolvedRecord);
    setInspections(prev => prev.map(r => (r.id === resolvedRecord.id ? resolvedRecord : r)));
    setActiveConflict(null);
    if (activeWorkspace && isOnline) {
      await syncEngine.syncAll(activeWorkspace.id, user?.uid);
    }
  }, [activeWorkspace, isOnline, user]);

  const dismissConflict = useCallback(() => {
    setActiveConflict(null);
  }, []);

  // Real-time calculation of transparent scores
  const scoreResult = useMemo(() => {
    if (!currentInspection || !currentInspection.items) return null;
    return calculateInspectionScore(currentInspection.items);
  }, [currentInspection]);

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        currentInspection,
        scoreResult,
        activeCategory,
        photos,
        saveStatus,
        cloudSyncState,
        syncMessage,
        activeConflict,
        lastSavedAt,
        isOnline,
        storageQuota,
        isLoading,
        setActiveCategory,
        selectInspection,
        createInspection,
        updateVehicle,
        setItemStatus,
        setItemNote,
        setHandoverItemStatus,
        setHandoverItemNote,
        setInspectionStatus,
        deleteInspectionRecord,
        addPhotoToItem,
        removePhoto,
        getItemPhotos,
        triggerCloudSync,
        resolveConflict,
        dismissConflict,
        refreshInspections,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

export function useInspection(): InspectionContextType {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
}
