'use client';

import React, { useState, useEffect } from 'react';
import { ProofOfDelivery } from '@/types/delivery';
import { useBandwidth } from '@/context/BandwidthContext';
import { useI18n } from '@/context/I18nContext';
import { consumerService } from '@/services/consumerService';
import { logisticsService } from '@/services/logisticsService';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  X,
  Maximize2,
  AlertCircle,
} from 'lucide-react';

export interface ProofOfDeliveryCardProps {
  pod?: ProofOfDelivery;
  proofPhotoPath?: string;
  orderId: string;
  isDelivered: boolean;
  onReceiptConfirmed?: () => void;
}

export default function ProofOfDeliveryCard({
  pod,
  proofPhotoPath,
  orderId,
  isDelivered,
  onReceiptConfirmed,
}: ProofOfDeliveryCardProps) {
  const { isLowBandwidth } = useBandwidth();
  const { t } = useI18n();

  const [photoRevealed, setPhotoRevealed] = useState(!isLowBandwidth);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isReceiptConfirmed, setIsReceiptConfirmed] = useState(pod?.isVerified || false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const rawPath = proofPhotoPath || pod?.proofPhotoPath || pod?.photoUrl;

  // Resolve signed URL for storage paths
  useEffect(() => {
    let isMounted = true;

    async function resolvePhoto() {
      if (!rawPath) {
        setSignedPhotoUrl(null);
        return;
      }

      // If rawPath is already a fully qualified URL or data URL
      if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('data:')) {
        setSignedPhotoUrl(rawPath);
        return;
      }

      // Otherwise resolve from private delivery-proofs bucket via logisticsService
      setPhotoLoading(true);
      try {
        const url = await logisticsService.getDeliveryProofSignedUrl(rawPath);
        if (isMounted) {
          setSignedPhotoUrl(url);
        }
      } catch (err) {
        console.warn('Failed to load signed delivery proof URL:', err);
      } finally {
        if (isMounted) setPhotoLoading(false);
      }
    }

    resolvePhoto();

    return () => {
      isMounted = false;
    };
  }, [rawPath]);

  // Keep low-bandwidth default synced unless manually toggled
  useEffect(() => {
    if (isLowBandwidth) {
      setPhotoRevealed(false);
    } else {
      setPhotoRevealed(true);
    }
  }, [isLowBandwidth]);

  const handleConfirmReceipt = async () => {
    if (isConfirming || isReceiptConfirmed) return;
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await consumerService.confirmReceipt(orderId);
      if (res.success) {
        setIsReceiptConfirmed(true);
        if (onReceiptConfirmed) onReceiptConfirmed();
      } else {
        setConfirmError(res.error || 'Failed to confirm receipt. Please retry.');
      }
    } catch (err: any) {
      setConfirmError(err?.message || 'Network error confirming receipt.');
    } finally {
      setIsConfirming(false);
    }
  };

  const isVerified = isReceiptConfirmed || pod?.isVerified;

  if (!isDelivered && !isVerified) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t('deliveryProof') || 'Digital Proof of Delivery (POD)'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Pending Destination Scan
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Smart Escrow release will automatically execute when the destination recipient verifies delivery and confirms arrival receipt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/50 text-white shadow-xl space-y-5">
      {/* Header Status */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('deliveryProof') || 'Proof of Delivery'}
        </span>
        {isVerified ? (
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('receiptConfirmed') || 'ESCROW RELEASED'}
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            Awaiting Buyer Confirmation
          </span>
        )}
      </div>

      {/* Recipient & Token Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-slate-400 block text-[11px]">Received & Confirmed By</span>
          <strong className="text-white text-sm block">{pod?.receivedBy || 'Destination Recipient'}</strong>
          <span className="text-emerald-400 font-mono text-[11px] block">
            {pod?.timestamp || new Date().toLocaleString()}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 block text-[11px]">Digital Verification Token</span>
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-300 border border-emerald-500/30 inline-block">
            {pod?.verificationCode || `POD-${orderId.slice(-8).toUpperCase()}`}
          </span>
        </div>
      </div>

      {/* Proof Photo Display (with Low-Bandwidth Mode support) */}
      {(signedPhotoUrl || rawPath) && (
        <div className="space-y-2 pt-2 border-t border-emerald-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" /> Verified Delivery Photo Proof
            </span>
            {isLowBandwidth && (
              <button
                type="button"
                onClick={() => setPhotoRevealed((prev) => !prev)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
              >
                {photoRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide (Save Data)
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> {t('tapToViewPhoto') || 'Tap to view'}
                  </>
                )}
              </button>
            )}
          </div>

          {photoRevealed ? (
            <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950/80 aspect-video max-h-64 flex items-center justify-center">
              {photoLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Loading photo proof...
                </div>
              ) : signedPhotoUrl ? (
                <>
                  <img
                    src={signedPhotoUrl}
                    alt="Delivery proof confirmation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition opacity-0 group-hover:opacity-100"
                    title="Enlarge proof photo"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-400">Photo proof registered on blockchain</p>
              )}
            </div>
          ) : (
            <div
              onClick={() => setPhotoRevealed(true)}
              className="p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-slate-900/60 text-center cursor-pointer hover:bg-slate-900/90 transition group space-y-1"
            >
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
                <Eye className="w-4 h-4" /> {t('tapToViewPhoto') || 'Tap to load delivery proof photo'}
              </div>
              <p className="text-[11px] text-slate-400">
                Low-Bandwidth Mode active: Photo hidden to conserve mobile data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes if available */}
      {pod?.notes && (
        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Notes: {pod.notes}</span>
        </p>
      )}

      {/* Confirm Receipt Action for Buyer */}
      {isDelivered && !isVerified && (
        <div className="pt-3 border-t border-emerald-500/20 space-y-2">
          {confirmError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{confirmError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmReceipt}
            disabled={isConfirming}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide uppercase shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Confirming Receipt & Releasing Escrow...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> {t('confirmReceipt') || 'Confirm Receipt & Release Escrow'}
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            Confirming releases locked escrow funds immediately to the seller farmer and logistics carrier.
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && signedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={signedPhotoUrl}
              alt="Full size delivery proof"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
            <div className="text-center text-xs text-white/70 mt-2 font-mono">
              Delivery Proof Token: {pod?.verificationCode || `POD-${orderId.slice(-8).toUpperCase()}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
