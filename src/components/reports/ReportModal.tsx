'use client';

import React, { useState } from 'react';
import { reportService } from '@/services/reportService';
import { 
  ReportType, 
  ReportReason, 
  UserRole 
} from '@/types/review';
import { Button } from '@/components/common/Button';
import { 
  X, 
  Flag, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  reporterUserId: string;
  reporterRole: UserRole;
  reporterDisplayName?: string;
  reportedUserId?: string;
  reportedRole?: UserRole;
  reportedName?: string;
  transactionId?: string;
  productId?: string;
  orderItemId?: string;
  reviewId?: string;
}

const REPORT_REASONS: { code: ReportReason; label: string; desc: string }[] = [
  { code: 'FRAUD_SUSPICIOUS', label: 'Fraud or Suspicious Activity', desc: 'Attempted offline payment scams or identity misrepresentation' },
  { code: 'POOR_UNSAFE_PRODUCT', label: 'Severe Quality / Unsafe Produce', desc: 'Produce rotten, spoiled, or inconsistent with grade' },
  { code: 'MISLEADING_INFO', label: 'Misleading Harvest / Origin Info', desc: 'False claims about farm origin, weight, or harvest date' },
  { code: 'HARASSMENT_ABUSE', label: 'Abusive Behavior / Harassment', desc: 'Unprofessional communication or threats' },
  { code: 'PAYMENT_ISSUE', label: 'Payment or Escrow Dispute', desc: 'Payment release irregularity or refusal of terms' },
  { code: 'DELIVERY_ISSUE', label: 'Delivery / Cold-Chain Breach', desc: 'Reefer turned off, temperature abuse, or cargo damage' },
  { code: 'FAKE_REVIEW', label: 'Fake or Extortionate Review', desc: 'Review contains false statements or extortion attempt' },
  { code: 'SPAM_IRRELEVANT', label: 'Spam or Irrelevant Content', desc: 'Promotional links or unrelated text' },
  { code: 'OTHER', label: 'Other Concern', desc: 'Other trust & safety violation' },
];

export default function ReportModal({
  isOpen,
  onClose,
  reportType,
  reporterUserId,
  reporterRole,
  reporterDisplayName,
  reportedUserId,
  reportedRole,
  reportedName,
  transactionId,
  productId,
  orderItemId,
  reviewId,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('FRAUD_SUSPICIOUS');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await reportService.submitReport({
      reporterUserId,
      reporterRole,
      reporterDisplayName,
      reportedUserId,
      reportedRole,
      reportType,
      reason: selectedReason,
      description,
      transactionId,
      productId,
      orderItemId,
      reviewId,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Your report has been submitted and will be reviewed.');
      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setErrorMsg(res.error || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Report {reportType === 'USER' ? (reportedName || 'User') : reportType === 'REVIEW' ? 'Inappropriate Review' : reportType === 'PRODUCT' ? 'Produce Listing' : 'Order Issue'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AgriFlow Trust, Safety & Quality Compliance Incident Log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {successMsg ? (
          <div className="py-10 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Submitted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {successMsg}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Details Badge */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Target:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {reportedName || transactionId || productId || reviewId || 'Platform Entity'}
              </strong>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Why are you filing this report? *
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const isSelected = selectedReason === r.code;
                  return (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setSelectedReason(r.code)}
                      className={`w-full p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 text-xs ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/40 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="block">{r.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{r.desc}</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                        isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-400'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide context or specific details to help the compliance team investigate..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 outline-none transition resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Submitting Report...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}