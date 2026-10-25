import { InspectionRecord, InspectionItem, ConflictItemDiff, ConflictRecordInfo } from '../../types/inspection';

/**
 * Compares local and cloud inspection items to detect collisions where both devices
 * made conflicting edits to the same item.
 */
export function detectItemConflicts(
  localRecord: InspectionRecord,
  cloudRecord: InspectionRecord
): ConflictItemDiff[] {
  const conflicts: ConflictItemDiff[] = [];

  const cloudItemsMap = new Map<string, InspectionItem>();
  for (const item of cloudRecord.items) {
    cloudItemsMap.set(item.id, item);
  }

  for (const localItem of localRecord.items) {
    const cloudItem = cloudItemsMap.get(localItem.id);
    if (!cloudItem) continue;

    // Check if both status or note differ
    const statusDiffers = localItem.status !== cloudItem.status;
    const noteDiffers = (localItem.note || '').trim() !== (cloudItem.note || '').trim();

    if (statusDiffers || noteDiffers) {
      // If timestamps are provided and different, or statuses collide
      const isConflicted =
        (localItem.status !== 'uninspected' && cloudItem.status !== 'uninspected' && statusDiffers) ||
        (Boolean(localItem.note) && Boolean(cloudItem.note) && noteDiffers);

      if (isConflicted) {
        conflicts.push({
          itemId: localItem.id,
          itemLabel: localItem.label,
          category: localItem.category,
          localStatus: localItem.status,
          cloudStatus: cloudItem.status,
          localNote: localItem.note || '',
          cloudNote: cloudItem.note || '',
          localUpdatedAt: localItem.updatedAt,
          cloudUpdatedAt: cloudItem.updatedAt,
        });
      }
    }
  }

  return conflicts;
}

export interface MergeResult {
  mergedRecord: InspectionRecord;
  hasConflicts: boolean;
  conflicts: ConflictItemDiff[];
}

/**
 * Intelligent 3-way/2-way merge:
 * - Automatically merges non-conflicting item edits from both devices.
 * - Flags conflicting item edits without silently overwriting either side.
 */
export function mergeInspectionRecords(
  local: InspectionRecord,
  cloud: InspectionRecord
): MergeResult {
  const conflicts = detectItemConflicts(local, cloud);

  // If no conflicts found, we can cleanly combine both records
  const cloudItemsMap = new Map<string, InspectionItem>();
  for (const item of cloud.items) {
    cloudItemsMap.set(item.id, item);
  }

  const mergedItems: InspectionItem[] = local.items.map(localItem => {
    const cloudItem = cloudItemsMap.get(localItem.id);
    if (!cloudItem) return localItem;

    // If local was touched and cloud was untouched (uninspected and empty note), keep local
    if (localItem.status !== 'uninspected' && cloudItem.status === 'uninspected') {
      return localItem;
    }

    // If cloud was touched and local was untouched, take cloud
    if (cloudItem.status !== 'uninspected' && localItem.status === 'uninspected') {
      return cloudItem;
    }

    // If both modified without conflict (e.g. same status or one only added note)
    if (localItem.status === cloudItem.status) {
      return {
        ...localItem,
        note: localItem.note || cloudItem.note || '',
        updatedAt: new Date().toISOString(),
      };
    }

    // If conflicting, keep local as baseline until resolved via modal
    return localItem;
  });

  const nextRevision = Math.max(local.revision || 1, cloud.revision || 1) + 1;

  const mergedRecord: InspectionRecord = {
    ...local,
    workspaceId: cloud.workspaceId || local.workspaceId,
    revision: nextRevision,
    items: mergedItems,
    notes: local.notes || cloud.notes || '',
    updatedAt: new Date().toISOString(),
    syncStatus: conflicts.length > 0 ? 'sync_error' : 'synced',
  };

  return {
    mergedRecord,
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Applies user's explicit resolution choice to resolve a conflict.
 */
export function resolveInspectionConflict(
  conflict: ConflictRecordInfo,
  choice: 'keep_local' | 'accept_cloud' | 'custom_items',
  itemResolutions?: Record<string, 'local' | 'cloud'>
): InspectionRecord {
  const nextRevision = Math.max(conflict.localRecord.revision || 1, conflict.cloudRecord.revision || 1) + 1;

  if (choice === 'keep_local') {
    return {
      ...conflict.localRecord,
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };
  }

  if (choice === 'accept_cloud') {
    return {
      ...conflict.cloudRecord,
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };
  }

  // Custom item-by-item resolution
  const cloudItemsMap = new Map<string, InspectionItem>();
  for (const item of conflict.cloudRecord.items) {
    cloudItemsMap.set(item.id, item);
  }

  const resolvedItems = conflict.localRecord.items.map(localItem => {
    const cloudItem = cloudItemsMap.get(localItem.id);
    const itemChoice = itemResolutions ? itemResolutions[localItem.id] : 'local';

    if (itemChoice === 'cloud' && cloudItem) {
      return cloudItem;
    }
    return localItem;
  });

  return {
    ...conflict.localRecord,
    revision: nextRevision,
    items: resolvedItems,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending_sync',
  };
}
