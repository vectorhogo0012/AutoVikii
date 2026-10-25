import React, { useState } from 'react';
import { AlertTriangle, Laptop, Cloud, Check, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { ConflictRecordInfo } from '../../types/inspection';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getItemStatusDetails } from '../../lib/utils';
import { resolveInspectionConflict } from '../../lib/sync/conflictResolver';
import { useInspection } from '../inspection/InspectionContext';

export interface ConflictResolutionModalProps {
  conflict: ConflictRecordInfo | null;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
}) => {
  const { resolveConflict } = useInspection();
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, 'local' | 'cloud'>>({});
  const [isResolving, setIsResolving] = useState<boolean>(false);

  if (!conflict) return null;

  const handleResolve = async (choice: 'keep_local' | 'accept_cloud' | 'custom_items') => {
    setIsResolving(true);
    try {
      const resolved = resolveInspectionConflict(conflict, choice, selectedResolutions);
      await resolveConflict(resolved);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  const setItemChoice = (itemId: string, choice: 'local' | 'cloud') => {
    setSelectedResolutions(prev => ({
      ...prev,
      [itemId]: choice,
    }));
  };

  return (
    <Dialog
      isOpen={Boolean(conflict)}
      onClose={onClose}
      title="تداخل در همگام‌سازی ابری پرونده"
      description="این پرونده به صورت همزمان در دستگاه دیگری ویرایش شده است. برای حفظ یکپارچگی اطلاعات، نحوه حل تعارض را انتخاب نمایید."
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isResolving}
            onClick={() => handleResolve('custom_items')}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            تأیید ترکیب اقلام انتخابی
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isResolving}
              onClick={() => handleResolve('accept_cloud')}
              leftIcon={<Cloud className="w-4 h-4" />}
            >
              پذیرش نسخه ابری
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isResolving}
              onClick={() => handleResolve('keep_local')}
              leftIcon={<Laptop className="w-4 h-4" />}
            >
              حفظ تغییرات این دستگاه
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-right">
        {/* Banner Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            تعداد <span className="font-bold font-latin-num">{conflict.conflictedItems.length}</span> قطعه دارای تفاوت وضعیت یا یادداشت بین دستگاه فعلی و نسخه سرور ابری هستند. می‌توانید به صورت یکجا نسخه این دستگاه را ارسال نموده یا نسخه سرور را تأیید فرمایید.
          </p>
        </div>

        {/* Diff Table of Items */}
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {conflict.conflictedItems.map(itemDiff => {
            const localDetails = getItemStatusDetails(itemDiff.localStatus);
            const cloudDetails = getItemStatusDetails(itemDiff.cloudStatus);
            const currentChoice = selectedResolutions[itemDiff.itemId] || 'local';

            return (
              <div
                key={itemDiff.itemId}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 bg-slate-50/50 dark:bg-[#0c1611]/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {itemDiff.itemLabel}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-latin-num">
                    شناسه: {itemDiff.itemId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Local version card */}
                  <div
                    onClick={() => setItemChoice(itemDiff.itemId, 'local')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      currentChoice === 'local'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#111e17] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                        <Laptop className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        نسخه این دستگاه
                      </span>
                      <Badge variant={localDetails.variant} size="sm">
                        {localDetails.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {itemDiff.localNote || 'بدون یادداشت'}
                    </p>
                  </div>

                  {/* Cloud version card */}
                  <div
                    onClick={() => setItemChoice(itemDiff.itemId, 'cloud')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      currentChoice === 'cloud'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#111e17] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                        <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        نسخه ابری سرور
                      </span>
                      <Badge variant={cloudDetails.variant} size="sm">
                        {cloudDetails.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {itemDiff.cloudNote || 'بدون یادداشت'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
};
