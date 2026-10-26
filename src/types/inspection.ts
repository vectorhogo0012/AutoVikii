export type ItemStatus = 'uninspected' | 'healthy' | 'needs_review' | 'defective';

export type ChecklistCategory = 
  | 'body_paint'
  | 'engine_mechanics'
  | 'interior'
  | 'tires';

export type InspectionRecordStatus = 'in_progress' | 'completed' | 'draft';

export type InspectionGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'N/A';

export type SyncStatus = 'pending_sync' | 'syncing' | 'synced' | 'sync_error';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle' | 'syncing' | 'synced';

export interface VehiclePlate {
  prefix: string;      // e.g. "34"
  letter: string;      // e.g. "س"
  suffix: string;      // e.g. "782"
  provinceCode: string;// e.g. "21"
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number | string;
  color: string;
  plate: VehiclePlate;
  mileage: number;
  inspectionDate: string;
  vin?: string;
  fuelType?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface InspectionItem {
  id: string;
  category: ChecklistCategory;
  label: string;
  description?: string;
  status: ItemStatus;
  note: string;
  weight: number;      // Weighted points within the 100-point system
  photoIds?: string[]; // IDs of attached photos for this item
  updatedAt?: string;
}

export interface PhotoEvidence {
  id: string;
  inspectionId: string;
  itemId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  thumbnailDataUrl: string;
  storagePath?: string;
  blob?: Blob;
  createdAt: string;
  syncStatus: SyncStatus;
}

export type HandoverItemStatus = 
  | 'present_healthy'     // موجود و سالم
  | 'missing'             // مفقود / موجود نیست
  | 'present_defective'   // موجود ولی معیوب
  | 'uninspected';        // بررسی‌نشده

export type HandoverCategory =
  | 'safety_emergency'    // ایمنی و اقلام ضروری
  | 'accessories_keys'    // لوازم و متعلقات
  | 'cabin_comfort'       // تجهیزات کابین و امکانات
  | 'exterior_equipment'  // تجهیزات بیرونی
  | 'tire_tools';         // ابزار و تجهیزات تعویض چرخ

export interface HandoverEquipmentItem {
  id: string;
  categoryId: HandoverCategory;
  label: string;
  description?: string;
  status: HandoverItemStatus;
  note?: string;
  updatedAt?: string;
}

export interface InspectionRecord {
  id: string;
  workspaceId?: string;
  trackingCode: string;
  vehicle: VehicleInfo;
  status: InspectionRecordStatus;
  items: InspectionItem[];
  handoverItems?: HandoverEquipmentItem[];
  notes?: string;
  inspectorName: string;
  revision: number;
  lastModifiedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  photoCount?: number;
  syncStatus?: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictItemDiff {
  itemId: string;
  itemLabel: string;
  category: ChecklistCategory;
  localStatus: ItemStatus;
  cloudStatus: ItemStatus;
  localNote: string;
  cloudNote: string;
  localUpdatedAt?: string;
  cloudUpdatedAt?: string;
}

export interface ConflictRecordInfo {
  inspectionId: string;
  localRecord: InspectionRecord;
  cloudRecord: InspectionRecord;
  conflictedItems: ConflictItemDiff[];
}

export interface CategoryScoreSummary {
  category: ChecklistCategory;
  title: string;
  maxWeight: number;
  earnedPoints: number;
  inspectedWeight: number;
  scorePercentage: number;
  inspectedCount: number;
  totalCount: number;
  coveragePercentage: number;
}

export interface ScoreResult {
  currentScore: number;            // 0 - 100
  isProvisional: boolean;          // true when coverage < 100%
  coveragePercent: number;         // 0 - 100
  totalItems: number;
  inspectedItemsCount: number;
  uninspectedItemsCount: number;
  healthyItemsCount: number;
  needsReviewItemsCount: number;
  defectiveItemsCount: number;
  totalWeight: number;             // always 100
  inspectedWeight: number;         // weight of items with status != uninspected
  earnedPoints: number;            // weighted points earned
  grade: InspectionGrade;
  defectiveItems: { item: InspectionItem; categoryTitle: string }[];
  needsReviewItems: { item: InspectionItem; categoryTitle: string }[];
  categoryBreakdown: Record<ChecklistCategory, CategoryScoreSummary>;
}
