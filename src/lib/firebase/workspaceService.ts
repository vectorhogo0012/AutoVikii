import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getBlob,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { Workspace, WorkspaceMember } from '../../types/workspace';
import { InspectionRecord, PhotoEvidence } from '../../types/inspection';

export class WorkspaceService {
  /**
   * Retrieves all workspaces where user is owner or an authorized member
   */
  async getUserWorkspaces(uid: string): Promise<Workspace[]> {
    if (!db || !('app' in db)) return [];

    try {
      // 1. Workspaces owned by user
      const ownedQuery = query(collection(db, 'workspaces'), where('ownerId', '==', uid));
      const ownedSnap = await getDocs(ownedQuery);

      const workspaces: Workspace[] = [];
      const seenIds = new Set<string>();

      ownedSnap.forEach(d => {
        workspaces.push(d.data() as Workspace);
        seenIds.add(d.id);
      });

      // 2. Workspaces where user is a member
      const memberQuery = query(
        collection(db, 'workspaces'),
        where(`members.${uid}.uid`, '==', uid)
      );
      const memberSnap = await getDocs(memberQuery);
      memberSnap.forEach(d => {
        if (!seenIds.has(d.id)) {
          workspaces.push(d.data() as Workspace);
          seenIds.add(d.id);
        }
      });

      return workspaces;
    } catch (err) {
      console.warn('Error fetching user workspaces:', err);
      return [];
    }
  }

  /**
   * Creates a new dealership/center workspace
   */
  async createWorkspace(
    name: string,
    ownerId: string,
    ownerEmail: string,
    ownerDisplayName: string
  ): Promise<Workspace> {
    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const randomCode = `WS-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const ownerMember: WorkspaceMember = {
      uid: ownerId,
      email: ownerEmail,
      displayName: ownerDisplayName || 'مدیر مرکز',
      role: 'owner',
      joinedAt: now,
    };

    const workspace: Workspace = {
      id: workspaceId,
      name: name.trim() || 'مرکز تخصصی کارشناسی خودرو',
      code: randomCode,
      ownerId,
      ownerEmail,
      members: {
        [ownerId]: ownerMember,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (db && 'app' in db) {
      await setDoc(doc(db, 'workspaces', workspaceId), workspace);
    }

    return workspace;
  }

  /**
   * Saves or updates an inspection in the workspace's Firestore subcollection
   */
  async saveInspection(workspaceId: string, record: InspectionRecord): Promise<void> {
    if (!db || !('app' in db)) return;

    const inspectionRef = doc(db, 'workspaces', workspaceId, 'inspections', record.id);
    const dataToSave: Partial<InspectionRecord> = {
      ...record,
      workspaceId,
      syncStatus: 'synced',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(inspectionRef, dataToSave, { merge: true });
  }

  /**
   * Retrieves an inspection from the workspace
   */
  async getInspection(workspaceId: string, inspectionId: string): Promise<InspectionRecord | null> {
    if (!db || !('app' in db)) return null;

    const snap = await getDoc(doc(db, 'workspaces', workspaceId, 'inspections', inspectionId));
    if (!snap.exists()) return null;

    return snap.data() as InspectionRecord;
  }

  /**
   * Loads all non-deleted inspections for a workspace
   */
  async getWorkspaceInspections(workspaceId: string): Promise<InspectionRecord[]> {
    if (!db || !('app' in db)) return [];

    try {
      const collRef = collection(db, 'workspaces', workspaceId, 'inspections');
      const snap = await getDocs(collRef);
      const list: InspectionRecord[] = [];

      snap.forEach(d => {
        const item = d.data() as InspectionRecord;
        if (!item.isDeleted) {
          list.push(item);
        }
      });

      return list;
    } catch (err) {
      console.warn('Error fetching workspace inspections:', err);
      return [];
    }
  }

  /**
   * Soft deletes an inspection with tombstone marker so other devices do not resurrect it
   */
  async deleteInspection(workspaceId: string, inspectionId: string): Promise<void> {
    if (!db || !('app' in db)) return;

    const inspectionRef = doc(db, 'workspaces', workspaceId, 'inspections', inspectionId);
    await updateDoc(inspectionRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Uploads an image blob to Cloud Storage and persists metadata in Firestore
   */
  async uploadPhoto(
    workspaceId: string,
    inspectionId: string,
    photoMeta: PhotoEvidence,
    blob: Blob
  ): Promise<string> {
    if (!storage || !('app' in storage)) {
      throw new Error('Cloud Storage is not initialized');
    }

    const storagePath = `workspaces/${workspaceId}/inspections/${inspectionId}/${photoMeta.id}.jpg`;
    const storageRef = ref(storage, storagePath);

    // 1. Upload binary blob
    await uploadBytes(storageRef, blob, {
      contentType: photoMeta.mimeType || 'image/jpeg',
      customMetadata: {
        inspectionId,
        itemId: photoMeta.itemId,
        filename: photoMeta.filename,
      },
    });

    // 2. Persist metadata in Firestore subcollection
    if (db && 'app' in db) {
      const metaRef = doc(
        db,
        'workspaces',
        workspaceId,
        'inspections',
        inspectionId,
        'photos',
        photoMeta.id
      );
      await setDoc(metaRef, {
        ...photoMeta,
        storagePath,
        syncStatus: 'synced',
      });
    }

    return storagePath;
  }

  /**
   * Downloads photo binary blob from Cloud Storage via authenticated SDK
   */
  async downloadPhotoBlob(storagePath: string): Promise<Blob | null> {
    if (!storage || !('app' in storage)) return null;

    try {
      const storageRef = ref(storage, storagePath);
      return await getBlob(storageRef);
    } catch (err) {
      console.warn('Failed to download photo blob:', err);
      return null;
    }
  }
}

export const workspaceService = new WorkspaceService();
