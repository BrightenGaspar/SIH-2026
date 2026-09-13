'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

export function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenModal = () => {
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDeleting) return; // Prevent closing while in-flight
    setModalOpen(false);
    setErrorMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteAccount();
      // On success, deleteAccount triggers router.push('/') and state eviction
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Account deletion failed:', error);
      setErrorMsg(error.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Account Deletion Card in Profile / Settings Area */}
      <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-4 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Delete Account & Data</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Permanently delete your AgriFlow account and associated personal data. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="shrink-0 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:border-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete Account & Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-2">
              <h2 id="delete-modal-title" className="text-lg font-black text-slate-900">
                Delete Account & Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete your AgriFlow account and associated personal data?
              </p>
              <p className="text-xs font-semibold text-rose-600">
                This action cannot be undone.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting account...</span>
                  </>
                ) : (
                  <span>Delete My Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
