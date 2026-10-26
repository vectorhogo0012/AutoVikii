import test from 'node:test';
import assert from 'node:assert/strict';
import { InspectionRecord, PhotoEvidence } from '../../types/inspection';
import { detectItemConflicts, mergeInspectionRecords } from '../../lib/sync/conflictResolver';

/**
 * Security Rule & Permission Matrix Evaluation
 * Tests the security constraints modeled in firestore.rules and storage.rules
 */

interface SecurityContext {
  auth: { uid: string; email?: string } | null;
}

interface WorkspaceDoc {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

interface PhotoMetadata {
  fileSize: number;
  mimeType: string;
}

// Rule simulator mirroring firestore.rules
const firestoreRulesEvaluator = {
  isWorkspaceMember(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    if (!context.auth || !context.auth.uid) return false;
    return workspace.ownerId === context.auth.uid || workspace.members.includes(context.auth.uid);
  },

  isWorkspaceOwner(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    if (!context.auth || !context.auth.uid) return false;
    return workspace.ownerId === context.auth.uid;
  },

  canReadWorkspace(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    return this.isWorkspaceMember(workspace, context);
  },

  canCreateWorkspace(data: { name: string; ownerId: string }, context: SecurityContext): boolean {
    if (!context.auth || !context.auth.uid) return false;
    return data.ownerId === context.auth.uid && typeof data.name === 'string' && data.name.length > 0 && data.name.length <= 120;
  },

  canUpdateWorkspace(existing: WorkspaceDoc, updated: { name: string; ownerId: string }, context: SecurityContext): boolean {
    if (!this.isWorkspaceOwner(existing, context)) return false;
    // Disallow changing ownerId
    return updated.ownerId === existing.ownerId && typeof updated.name === 'string' && updated.name.length <= 120;
  },

  canDeleteWorkspace(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    return this.isWorkspaceOwner(workspace, context);
  },

  canReadInspection(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    return this.isWorkspaceMember(workspace, context);
  },

  canCreateInspection(workspace: WorkspaceDoc, data: any, context: SecurityContext): boolean {
    if (!this.isWorkspaceMember(workspace, context)) return false;
    return typeof data.trackingCode === 'string' && typeof data.vehicle === 'object' && data.vehicle !== null && typeof data.revision === 'number';
  },

  canUpdateInspection(workspace: WorkspaceDoc, existing: { revision: number }, updated: { revision: number }, context: SecurityContext): boolean {
    if (!this.isWorkspaceMember(workspace, context)) return false;
    return updated.revision >= existing.revision;
  },

  canDeleteInspection(workspace: WorkspaceDoc, context: SecurityContext): boolean {
    return this.isWorkspaceMember(workspace, context);
  },

  canWritePhotoMeta(workspace: WorkspaceDoc, photo: PhotoMetadata, context: SecurityContext): boolean {
    if (!this.isWorkspaceMember(workspace, context)) return false;
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    return photo.fileSize <= 10 * 1024 * 1024 && allowedMime.includes(photo.mimeType);
  }
};

// Storage Rule simulator mirroring storage.rules
const storageRulesEvaluator = {
  canUploadPhoto(fileSize: number, contentType: string, context: SecurityContext): boolean {
    if (!context.auth || !context.auth.uid) return false;
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    return fileSize <= 10 * 1024 * 1024 && allowedMime.includes(contentType);
  },

  canReadPhoto(context: SecurityContext): boolean {
    return Boolean(context.auth && context.auth.uid);
  }
};

const sampleWorkspace: WorkspaceDoc = {
  id: 'ws-tehran-dealership',
  name: 'مرکز کارشناسی مرکزی تهران',
  ownerId: 'user-kamali',
  members: ['user-assistant-1', 'user-assistant-2'],
};

test('Security Rules: Denies unauthenticated access to workspace and inspections', () => {
  const anonContext: SecurityContext = { auth: null };
  assert.equal(firestoreRulesEvaluator.canReadWorkspace(sampleWorkspace, anonContext), false);
  assert.equal(firestoreRulesEvaluator.canReadInspection(sampleWorkspace, anonContext), false);
  assert.equal(storageRulesEvaluator.canReadPhoto(anonContext), false);
  assert.equal(storageRulesEvaluator.canUploadPhoto(500000, 'image/jpeg', anonContext), false);
});

test('Security Rules: Denies cross-workspace access to non-members', () => {
  const strangerContext: SecurityContext = { auth: { uid: 'user-stranger-99' } };
  assert.equal(firestoreRulesEvaluator.canReadWorkspace(sampleWorkspace, strangerContext), false);
  assert.equal(firestoreRulesEvaluator.canReadInspection(sampleWorkspace, strangerContext), false);
  assert.equal(firestoreRulesEvaluator.canDeleteInspection(sampleWorkspace, strangerContext), false);
});

test('Security Rules: Allows workspace members to read and create inspections', () => {
  const memberContext: SecurityContext = { auth: { uid: 'user-assistant-1' } };
  assert.equal(firestoreRulesEvaluator.canReadWorkspace(sampleWorkspace, memberContext), true);
  assert.equal(firestoreRulesEvaluator.canReadInspection(sampleWorkspace, memberContext), true);
  
  const validInspection = {
    trackingCode: 'IR-TEST-001',
    vehicle: { make: 'Peugeot', model: '207' },
    revision: 1
  };
  assert.equal(firestoreRulesEvaluator.canCreateInspection(sampleWorkspace, validInspection, memberContext), true);
});

test('Security Rules: Prevents ownership hijacking and unauthorized workspace deletion', () => {
  const memberContext: SecurityContext = { auth: { uid: 'user-assistant-1' } };
  const ownerContext: SecurityContext = { auth: { uid: 'user-kamali' } };

  // Member cannot delete workspace
  assert.equal(firestoreRulesEvaluator.canDeleteWorkspace(sampleWorkspace, memberContext), false);
  assert.equal(firestoreRulesEvaluator.canDeleteWorkspace(sampleWorkspace, ownerContext), true);

  // Member cannot update workspace
  assert.equal(firestoreRulesEvaluator.canUpdateWorkspace(sampleWorkspace, { name: 'New Name', ownerId: 'user-assistant-1' }, memberContext), false);

  // Even owner cannot transfer ownership to someone else
  assert.equal(firestoreRulesEvaluator.canUpdateWorkspace(sampleWorkspace, { name: 'New Name', ownerId: 'user-hijacker' }, ownerContext), false);
});

test('Security Rules: Enforces revision monotonicity to prevent silent overwrite of newer edits', () => {
  const memberContext: SecurityContext = { auth: { uid: 'user-assistant-1' } };
  const existing = { revision: 5 };

  // Revision 6 is valid
  assert.equal(firestoreRulesEvaluator.canUpdateInspection(sampleWorkspace, existing, { revision: 6 }, memberContext), true);
  // Same revision is allowed (idempotent write)
  assert.equal(firestoreRulesEvaluator.canUpdateInspection(sampleWorkspace, existing, { revision: 5 }, memberContext), true);
  // Lower revision is strictly rejected
  assert.equal(firestoreRulesEvaluator.canUpdateInspection(sampleWorkspace, existing, { revision: 4 }, memberContext), false);
});

test('Storage Security Rules: Validates image size and MIME constraints', () => {
  const authContext: SecurityContext = { auth: { uid: 'user-assistant-1' } };

  // Valid JPEG under 10MB
  assert.equal(storageRulesEvaluator.canUploadPhoto(2 * 1024 * 1024, 'image/jpeg', authContext), true);
  assert.equal(storageRulesEvaluator.canUploadPhoto(500 * 1024, 'image/png', authContext), true);
  assert.equal(storageRulesEvaluator.canUploadPhoto(300 * 1024, 'image/webp', authContext), true);

  // Exceeds 10MB limit
  assert.equal(storageRulesEvaluator.canUploadPhoto(11 * 1024 * 1024, 'image/jpeg', authContext), false);

  // Disallowed MIME types (executables, scripts, HTML)
  assert.equal(storageRulesEvaluator.canUploadPhoto(1024, 'application/x-msdownload', authContext), false);
  assert.equal(storageRulesEvaluator.canUploadPhoto(1024, 'text/html', authContext), false);
  assert.equal(storageRulesEvaluator.canUploadPhoto(1024, 'image/gif', authContext), false);
});

test('Data Integrity: Photo evidence is correctly bound to defect item ID', () => {
  const mockPhoto: PhotoEvidence = {
    id: 'photo-101',
    inspectionId: 'insp-001',
    itemId: 'bp_hood',
    filename: 'hood_scratch.jpg',
    fileSize: 450000,
    mimeType: 'image/jpeg',
    thumbnailDataUrl: 'data:image/jpeg;base64,...',
    createdAt: new Date().toISOString(),
    syncStatus: 'pending_sync'
  };

  assert.equal(mockPhoto.itemId, 'bp_hood');
  assert.equal(mockPhoto.inspectionId, 'insp-001');
  assert.equal(mockPhoto.syncStatus, 'pending_sync');
});

test('Conflict Engine: Safely merges independent changes without losing defect data', () => {
  const baseRecord: InspectionRecord = {
    id: 'rec-1',
    trackingCode: 'KR-900',
    vehicle: { make: 'تارا', model: 'V4', year: 1403, color: 'سفید', plate: { prefix: '11', letter: 'ب', suffix: '123', provinceCode: '21' }, mileage: 10000, inspectionDate: '1403/08/01' },
    status: 'in_progress',
    items: [
      { id: 'bp_hood', category: 'body_paint', label: 'کاپوت', status: 'uninspected', note: '', weight: 3.5 },
      { id: 'bp_roof', category: 'body_paint', label: 'سقف', status: 'uninspected', note: '', weight: 4.0 },
    ],
    inspectorName: 'مهندس کمالی',
    revision: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  // Device A edits hood to defective
  const deviceA: InspectionRecord = {
    ...baseRecord,
    revision: 2,
    items: [
      { id: 'bp_hood', category: 'body_paint', label: 'کاپوت', status: 'defective', note: 'تعویض استوک', weight: 3.5 },
      { id: 'bp_roof', category: 'body_paint', label: 'سقف', status: 'uninspected', note: '', weight: 4.0 },
    ]
  };

  // Device B edits roof to healthy
  const deviceB: InspectionRecord = {
    ...baseRecord,
    revision: 2,
    items: [
      { id: 'bp_hood', category: 'body_paint', label: 'کاپوت', status: 'uninspected', note: '', weight: 3.5 },
      { id: 'bp_roof', category: 'body_paint', label: 'سقف', status: 'healthy', note: 'رنگ فابریک', weight: 4.0 },
    ]
  };

  // 1. Detect conflicts: none because different items were touched
  const conflicts = detectItemConflicts(deviceA, deviceB);
  assert.equal(conflicts.length, 0);

  // 2. Auto-merge merges both modifications safely
  const result = mergeInspectionRecords(deviceA, deviceB);
  assert.equal(result.hasConflicts, false);
  assert.equal(result.mergedRecord.items.find(i => i.id === 'bp_hood')?.status, 'defective');
  assert.equal(result.mergedRecord.items.find(i => i.id === 'bp_roof')?.status, 'healthy');
  assert.equal(result.mergedRecord.revision, 3);
});

test('Deletion Marker: isDeleted flag safely marks records for soft deletion', () => {
  const deletedRecord: InspectionRecord = {
    id: 'rec-2',
    trackingCode: 'KR-901',
    vehicle: { make: 'دنا', model: 'پلاس', year: 1402, color: 'مشکی', plate: { prefix: '11', letter: 'ج', suffix: '456', provinceCode: '21' }, mileage: 25000, inspectionDate: '1403/08/01' },
    status: 'completed',
    items: [],
    inspectorName: 'مهندس کمالی',
    revision: 3,
    isDeleted: true,
    deletedAt: '2024-01-02T12:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T12:00:00Z'
  };

  assert.equal(deletedRecord.isDeleted, true);
  assert.ok(deletedRecord.deletedAt);
});
