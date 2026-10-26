import { InspectionRecord, VehicleInfo, InspectionItem, PhotoEvidence } from '../../types/inspection';
import { createDefaultInspectionItems } from '../../features/checklist/checklistTemplates';
import { createDefaultHandoverItems } from '../../features/checklist/handoverTemplates';
import { indexedDbStorage, StorageQuotaInfo } from '../storage/indexedDb';

export interface InspectionRepository {
  getAll(): Promise<InspectionRecord[]>;
  getById(id: string): Promise<InspectionRecord | null>;
  save(record: InspectionRecord): Promise<InspectionRecord>;
  create(vehicle: VehicleInfo, notes?: string): Promise<InspectionRecord>;
  updateItem(inspectionId: string, itemId: string, updates: Partial<InspectionItem>): Promise<InspectionRecord | null>;
  delete(id: string): Promise<boolean>;
  savePhoto(photoMeta: PhotoEvidence, blob: Blob): Promise<PhotoEvidence>;
  getPhotosForInspection(inspectionId: string): Promise<PhotoEvidence[]>;
  getPhotosForItem(inspectionId: string, itemId: string): Promise<PhotoEvidence[]>;
  deletePhoto(photoId: string, inspectionId?: string, itemId?: string): Promise<void>;
  getStorageQuota(): Promise<StorageQuotaInfo>;
}

function createSeedRecords(): InspectionRecord[] {
  const defaultItems1 = createDefaultInspectionItems();
  const inProgressItems = defaultItems1.map(item => {
    if (item.id === 'bp_hood') {
      return { ...item, status: 'healthy' as const, note: 'ضخامت رنگ ۱۱۰ میکرون فابریک' };
    }
    if (item.id === 'bp_fenders') {
      return { ...item, status: 'needs_review' as const, note: 'لبه پایین گلگیر جلو چپ دارای لیسه‌کشی جزئی' };
    }
    if (item.id === 'bp_doors') {
      return { ...item, status: 'defective' as const, note: 'درب عقب سمت شاگرد استوک تعویض بدون موم فابریک' };
    }
    if (item.id === 'bp_roof') {
      return { ...item, status: 'healthy' as const, note: 'سالم بدون موج' };
    }
    if (item.id === 'em_startup_sound') {
      return { ...item, status: 'healthy' as const, note: 'استارت نرم و منظم' };
    }
    if (item.id === 'em_visible_leaks') {
      return { ...item, status: 'needs_review' as const, note: 'تعریق جزئی اطراف واشر قالپاق سوپاپ' };
    }
    if (item.id === 'em_engine_oil') {
      return { ...item, status: 'healthy' as const, note: 'روغن تازه تعویض شده' };
    }
    if (item.id === 'tr_tread_wear') {
      return { ...item, status: 'healthy' as const, note: 'عاج حدود ۷۵ درصد' };
    }
    return item;
  });

  const record1: InspectionRecord = {
    id: 'insp-tara-101',
    trackingCode: 'KR-90412',
    vehicle: {
      make: 'ایران خودرو',
      model: 'تارا اتوماتیک V4',
      year: 1403,
      color: 'سفید دوپوششه',
      plate: { prefix: '34', letter: 'س', suffix: '782', provinceCode: '21' },
      mileage: 12400,
      inspectionDate: '1403/08/02',
      vin: 'IRNC415X8K190284',
      fuelType: 'بنزین',
      clientName: 'رضا علیزاده',
      clientPhone: '09121234567',
    },
    status: 'in_progress',
    items: inProgressItems,
    handoverItems: createDefaultHandoverItems(),
    notes: 'درخواست کارشناسی ویژه رنگ و اصالت شاسی قبل از معامله',
    inspectorName: 'مهندس کمالی',
    revision: 1,
    photoCount: 0,
    syncStatus: 'pending_sync',
    createdAt: '2024-10-23T10:00:00.000Z',
    updatedAt: '2024-10-24T08:30:00.000Z',
  };

  const defaultItems2 = createDefaultInspectionItems();
  const completedItems = defaultItems2.map(item => {
    if (item.id === 'bp_bumpers') {
      return { ...item, status: 'needs_review' as const, note: 'خط و خش جزئی روی پوسته سپر عقب' };
    }
    return { ...item, status: 'healthy' as const };
  });

  const record2: InspectionRecord = {
    id: 'insp-tiggo-102',
    trackingCode: 'KR-90411',
    vehicle: {
      make: 'مدیران خودرو',
      model: 'فونیکس تیگو 8 پرو مکس',
      year: 1402,
      color: 'مشکی متالیک',
      plate: { prefix: '18', letter: 'ط', suffix: '456', provinceCode: '10' },
      mileage: 38500,
      inspectionDate: '1403/08/02',
      vin: 'NAT48291X009182',
      fuelType: 'بنزین',
      clientName: 'امیرحسین مرادی',
      clientPhone: '09129876543',
    },
    status: 'completed',
    items: completedItems,
    handoverItems: createDefaultHandoverItems().map(item => {
      if (item.id === 'ho_fire_extinguisher') return { ...item, status: 'present_healthy' as const, note: 'شارژ تا پایان سال جاری' };
      if (item.id === 'ho_warning_triangle') return { ...item, status: 'present_healthy' as const };
      if (item.id === 'ho_spare_key') return { ...item, status: 'present_healthy' as const, note: 'هر دو ریموت هوشمند فابریک تحویل شد' };
      if (item.id === 'ho_hubcaps') return { ...item, status: 'present_defective' as const, note: 'خط و خش روی قالپاق چرخ راست' };
      if (item.id === 'ho_lighter') return { ...item, status: 'missing' as const, note: 'فندک در کنسول مفقود است' };
      return { ...item, status: 'present_healthy' as const };
    }),
    notes: 'خودرو در وضعیت سلامت کامل فنی و ادوات الکترونیکی تحویل شد',
    inspectorName: 'مهندس کمالی',
    revision: 1,
    photoCount: 0,
    syncStatus: 'pending_sync',
    createdAt: '2024-10-22T09:15:00.000Z',
    updatedAt: '2024-10-23T14:45:00.000Z',
  };

  return [record1, record2];
}

export class HybridIndexedDbInspectionRepository implements InspectionRepository {
  private isInitialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const existing = await indexedDbStorage.getAllInspections();
      if (!existing || existing.length === 0) {
        // Seed default records on first run
        const seeds = createSeedRecords();
        for (const s of seeds) {
          await indexedDbStorage.saveInspection(s);
        }
      }
      this.isInitialized = true;
    } catch {
      // In-memory or fallback mode
      this.isInitialized = true;
    }
  }

  async getAll(): Promise<InspectionRecord[]> {
    await this.ensureInitialized();
    return indexedDbStorage.getAllInspections();
  }

  async getById(id: string): Promise<InspectionRecord | null> {
    await this.ensureInitialized();
    return indexedDbStorage.getInspection(id);
  }

  async save(record: InspectionRecord): Promise<InspectionRecord> {
    await this.ensureInitialized();
    const updatedRecord: InspectionRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };
    await indexedDbStorage.saveInspection(updatedRecord);
    return updatedRecord;
  }

  async create(vehicle: VehicleInfo, notes = ''): Promise<InspectionRecord> {
    await this.ensureInitialized();
    const id = `insp-${Date.now()}`;
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const trackingCode = `KR-${randomCode}`;
    const now = new Date().toISOString();

    const items = createDefaultInspectionItems();

    const newRecord: InspectionRecord = {
      id,
      trackingCode,
      vehicle,
      status: 'in_progress',
      items,
      handoverItems: createDefaultHandoverItems(),
      notes,
      inspectorName: 'مهندس کمالی',
      revision: 1,
      photoCount: 0,
      syncStatus: 'pending_sync',
      createdAt: now,
      updatedAt: now,
    };

    await indexedDbStorage.saveInspection(newRecord);
    return newRecord;
  }

  async updateItem(
    inspectionId: string,
    itemId: string,
    updates: Partial<InspectionItem>
  ): Promise<InspectionRecord | null> {
    const record = await this.getById(inspectionId);
    if (!record) return null;

    const updatedItems = record.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedRecord: InspectionRecord = {
      ...record,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };

    await indexedDbStorage.saveInspection(updatedRecord);
    return updatedRecord;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await indexedDbStorage.deleteInspection(id);
      return true;
    } catch {
      return false;
    }
  }

  // ===================== PHOTOS =====================

  async savePhoto(photoMeta: PhotoEvidence, blob: Blob): Promise<PhotoEvidence> {
    await indexedDbStorage.savePhoto(photoMeta, blob);

    // Update photoCount and item.photoIds on the inspection record
    const inspection = await this.getById(photoMeta.inspectionId);
    if (inspection) {
      const allPhotos = await indexedDbStorage.getPhotosForInspection(photoMeta.inspectionId);
      const updatedItems = inspection.items.map(item => {
        if (item.id === photoMeta.itemId) {
          const itemPhotos = allPhotos.filter(p => p.itemId === item.id);
          return {
            ...item,
            photoIds: itemPhotos.map(p => p.id),
          };
        }
        return item;
      });

      await this.save({
        ...inspection,
        items: updatedItems,
        photoCount: allPhotos.length,
      });
    }

    return photoMeta;
  }

  async getPhotosForInspection(inspectionId: string): Promise<PhotoEvidence[]> {
    return indexedDbStorage.getPhotosForInspection(inspectionId);
  }

  async getPhotosForItem(inspectionId: string, itemId: string): Promise<PhotoEvidence[]> {
    return indexedDbStorage.getPhotosForItem(inspectionId, itemId);
  }

  async deletePhoto(photoId: string, inspectionId?: string, itemId?: string): Promise<void> {
    await indexedDbStorage.deletePhoto(photoId);

    if (inspectionId) {
      const inspection = await this.getById(inspectionId);
      if (inspection) {
        const remainingPhotos = await indexedDbStorage.getPhotosForInspection(inspectionId);
        const updatedItems = inspection.items.map(item => {
          if (itemId && item.id === itemId) {
            const currentIds = (item.photoIds || []).filter(id => id !== photoId);
            return { ...item, photoIds: currentIds };
          }
          return item;
        });

        await this.save({
          ...inspection,
          items: updatedItems,
          photoCount: remainingPhotos.length,
        });
      }
    }
  }

  async getStorageQuota(): Promise<StorageQuotaInfo> {
    return indexedDbStorage.getStorageQuota();
  }
}

export const inspectionRepository = new HybridIndexedDbInspectionRepository();
