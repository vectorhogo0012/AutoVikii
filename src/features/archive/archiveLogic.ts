import { InspectionRecord, ScoreResult } from '../../types/inspection';

export interface ProcessedArchiveRecord {
  record: InspectionRecord;
  score: ScoreResult;
}

export type ScoreFilterType = 'all' | 'high' | 'medium' | 'low';
export type FindingsFilterType = 'all' | 'has_defects' | 'clean' | 'needs_review';
export type SortByType = 'newest' | 'oldest' | 'updated' | 'highest_score' | 'lowest_score';

export interface ArchiveFilterOptions {
  searchQuery: string;
  statusFilter: string;
  scoreFilter: ScoreFilterType;
  findingsFilter: FindingsFilterType;
  sortBy: SortByType;
}

export function filterArchiveRecords(
  items: ProcessedArchiveRecord[],
  options: Omit<ArchiveFilterOptions, 'sortBy'>
): ProcessedArchiveRecord[] {
  const { searchQuery, statusFilter, scoreFilter, findingsFilter } = options;
  const q = searchQuery.toLowerCase().trim();

  return items.filter(({ record, score }) => {
    const v = record.vehicle;

    // Search query matches make, model, tracking code, client name, plate parts, or VIN
    const matchesSearch =
      !q ||
      v.model.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      record.trackingCode.toLowerCase().includes(q) ||
      Boolean(v.clientName && v.clientName.toLowerCase().includes(q)) ||
      Boolean(v.plate?.prefix && v.plate.prefix.includes(q)) ||
      Boolean(v.plate?.suffix && v.plate.suffix.includes(q)) ||
      Boolean(v.vin && v.vin.toLowerCase().includes(q));

    // Status filter
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    // Score filter
    let matchesScore = true;
    if (scoreFilter === 'high') {
      matchesScore = score.currentScore >= 80;
    } else if (scoreFilter === 'medium') {
      matchesScore = score.currentScore >= 50 && score.currentScore < 80;
    } else if (scoreFilter === 'low') {
      matchesScore = score.currentScore < 50;
    }

    // Findings filter
    let matchesFindings = true;
    if (findingsFilter === 'has_defects') {
      matchesFindings = score.defectiveItemsCount > 0;
    } else if (findingsFilter === 'clean') {
      matchesFindings = score.defectiveItemsCount === 0;
    } else if (findingsFilter === 'needs_review') {
      matchesFindings = score.needsReviewItemsCount > 0;
    }

    return matchesSearch && matchesStatus && matchesScore && matchesFindings;
  });
}

export function sortArchiveRecords(
  items: ProcessedArchiveRecord[],
  sortBy: SortByType
): ProcessedArchiveRecord[] {
  return [...items].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.record.createdAt).getTime() - new Date(a.record.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.record.createdAt).getTime() - new Date(b.record.createdAt).getTime();
    }
    if (sortBy === 'updated') {
      return new Date(b.record.updatedAt).getTime() - new Date(a.record.updatedAt).getTime();
    }
    if (sortBy === 'highest_score') {
      return b.score.currentScore - a.score.currentScore;
    }
    if (sortBy === 'lowest_score') {
      return a.score.currentScore - b.score.currentScore;
    }
    return 0;
  });
}

export function paginateRecords<T>(items: T[], page: number, pageSize: number): T[] {
  const startIndex = Math.max(0, (page - 1) * pageSize);
  return items.slice(startIndex, startIndex + pageSize);
}
