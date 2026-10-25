import { inspectionRepository } from '../repository/inspectionRepository';
import { workspaceService } from '../firebase/workspaceService';
import { indexedDbStorage } from '../storage/indexedDb';
import {
  InspectionRecord,
  PhotoEvidence,
  SyncStatus,
  ConflictRecordInfo,
} from '../../types/inspection';
import { mergeInspectionRecords } from './conflictResolver';

export type SyncEngineState = 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';

export type SyncListener = (state: SyncEngineState, message?: string) => void;
export type ConflictListener = (conflict: ConflictRecordInfo) => void;

export class SyncEngine {
  private isRunning = false;
  private syncListeners: Set<SyncListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private currentStatus: SyncEngineState = 'idle';

  subscribeStatus(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.currentStatus);
    return () => this.syncListeners.delete(listener);
  }

  subscribeConflict(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => this.conflictListeners.delete(listener);
  }

  private notifyStatus(state: SyncEngineState, msg?: string) {
    this.currentStatus = state;
    this.syncListeners.forEach(fn => fn(state, msg));
  }

  private notifyConflict(conflict: ConflictRecordInfo) {
    this.currentStatus = 'conflict';
    this.conflictListeners.forEach(fn => fn(conflict));
  }

  /**
   * Main synchronization loop for active workspace
   */
  async syncAll(workspaceId: string, currentUserId?: string): Promise<void> {
    if (this.isRunning || !workspaceId) return;

    // Check online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('idle', 'آفلاین (ذخیره در حافظه محلی)');
      return;
    }

    this.isRunning = true;
    this.notifyStatus('syncing', 'در حال همگام‌سازی با فضای ابری...');

    try {
      // 1. Fetch all local inspections
      const localRecords = await inspectionRepository.getAll();

      // 2. Fetch all cloud inspections for this workspace
      const cloudRecords = await workspaceService.getWorkspaceInspections(workspaceId);
      const cloudMap = new Map<string, InspectionRecord>();
      cloudRecords.forEach(c => cloudMap.set(c.id, c));

      // 3. Process local records to push or detect conflicts
      for (const local of localRecords) {
        // If marked deleted locally, sync tombstone to cloud
        if (local.isDeleted) {
          await workspaceService.deleteInspection(workspaceId, local.id);
          continue;
        }

        const cloud = cloudMap.get(local.id);

        if (!cloud) {
          // New record on local device: push to cloud
          const updatedLocal: InspectionRecord = {
            ...local,
            workspaceId,
            revision: local.revision || 1,
            lastModifiedBy: currentUserId || local.inspectorName,
            syncStatus: 'synced',
          };
          await workspaceService.saveInspection(workspaceId, updatedLocal);
          await inspectionRepository.save(updatedLocal);

          // Upload pending photos for this record
          await this.syncPhotosForInspection(workspaceId, local.id);
        } else {
          // Record exists on both local and cloud: check revisions
          const localRev = local.revision || 1;
          const cloudRev = cloud.revision || 1;

          if (cloudRev > localRev) {
            // Cloud has newer changes: merge
            const mergeResult = mergeInspectionRecords(local, cloud);

            if (mergeResult.hasConflicts) {
              this.notifyConflict({
                inspectionId: local.id,
                localRecord: local,
                cloudRecord: cloud,
                conflictedItems: mergeResult.conflicts,
              });
              // Stop processing this record until user resolves
              continue;
            } else {
              // Auto-merge succeeded without conflict
              await inspectionRepository.save(mergeResult.mergedRecord);
              await workspaceService.saveInspection(workspaceId, mergeResult.mergedRecord);
            }
          } else if (localRev > cloudRev || local.syncStatus === 'pending_sync') {
            // Local has newer changes: push to cloud
            const toPush: InspectionRecord = {
              ...local,
              workspaceId,
              revision: Math.max(localRev, cloudRev) + 1,
              lastModifiedBy: currentUserId || local.inspectorName,
              syncStatus: 'synced',
            };
            await workspaceService.saveInspection(workspaceId, toPush);
            await inspectionRepository.save(toPush);

            // Sync photos
            await this.syncPhotosForInspection(workspaceId, local.id);
          }
        }
      }

      // 4. Download new inspections created on other devices in this workspace
      const localMap = new Map<string, InspectionRecord>();
      localRecords.forEach(l => localMap.set(l.id, l));

      for (const cloud of cloudRecords) {
        if (!localMap.has(cloud.id) && !cloud.isDeleted) {
          // Save cloud record to IndexedDB
          await inspectionRepository.save({
            ...cloud,
            syncStatus: 'synced',
          });
        }
      }

      this.notifyStatus('synced', 'همگام‌سازی ابری کامل شد');
    } catch (error) {
      console.warn('Sync engine run error:', error);
      this.notifyStatus('error', 'خطا در اتصال یا همگام‌سازی ابری');
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Uploads any pending photo blobs for an inspection to Cloud Storage
   */
  async syncPhotosForInspection(workspaceId: string, inspectionId: string): Promise<void> {
    try {
      const photos = await inspectionRepository.getPhotosForInspection(inspectionId);
      for (const photo of photos) {
        if (photo.syncStatus === 'pending_sync' || !photo.storagePath) {
          const blob = await indexedDbStorage.getPhotoBlob(photo.id);
          if (blob) {
            const storagePath = await workspaceService.uploadPhoto(
              workspaceId,
              inspectionId,
              photo,
              blob
            );
            const updatedPhoto: PhotoEvidence = {
              ...photo,
              storagePath,
              syncStatus: 'synced',
            };
            await inspectionRepository.savePhoto(updatedPhoto, blob);
          }
        }
      }
    } catch (err) {
      console.warn(`Error syncing photos for ${inspectionId}:`, err);
    }
  }
}

export const syncEngine = new SyncEngine();
