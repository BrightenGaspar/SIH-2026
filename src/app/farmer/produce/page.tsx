'use client';

import React, { useState, useEffect } from 'react';
import { farmerService } from '@/services/farmerService';
import { uploadCropImage } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Produce, ProduceGrade } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { produceSchema, ProduceFormData } from '@/lib/validators';
import { Sprout, Plus, Filter, CheckCircle2, ShieldCheck, Image as ImageIcon, UploadCloud, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function FarmerProducePage() {
  const { user, currentUser } = useAuth();
  const [produceList, setProduceList] = useState<Produce[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [produceToDelete, setProduceToDelete] = useState<Produce | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProduceFormData>({
    resolver: zodResolver(produceSchema),
    defaultValues: {
      crop: 'Tomato (Hybrid)',
      quantity: 1500,
      unit: 'kg',
      grade: 'A',
      harvestDate: new Date().toISOString().split('T')[0],
      expectedPrice: 42,
      location: 'Shadnagar FPO Hub, Telangana',
      notes: 'Clean produce stored in crates.',
    },
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await farmerService.getProduceList();
        if (isMounted) setProduceList(data || []);
      } catch {
        if (isMounted) setProduceList([]);
      }
    }
    load();

    const channel = supabase
      .channel('realtime-farmer-produce')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produce',
        },
        async () => {
          const refreshed = await farmerService.getProduceList();
          if (isMounted) setProduceList(refreshed || []);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produce_listings',
        },
        async () => {
          const refreshed = await farmerService.getProduceList();
          if (isMounted) setProduceList(refreshed || []);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const onAddProduceSubmit = async (data: ProduceFormData) => {
    try {
      setIsSaving(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      // Validate required fields
      if (!data.crop || !data.crop.trim()) {
        throw new Error('Please enter a valid produce / crop name.');
      }
      if (!data.quantity || Number(data.quantity) <= 0) {
        throw new Error('Quantity must be greater than zero.');
      }
      if (!data.expectedPrice || Number(data.expectedPrice) <= 0) {
        throw new Error('Expected price must be greater than zero.');
      }
      if (!data.location || !data.location.trim()) {
        throw new Error('Please enter a valid pickup location / hub.');
      }

      const farmerId = user?.id || currentUser?.id;
      if (!farmerId) {
        throw new Error('Authentication required: You must be signed in as a farmer to create a listing.');
      }
      let uploadedImageUrl: string | undefined = undefined;

      if (imageFile) {
        setIsUploading(true);
        try {
          uploadedImageUrl = await uploadCropImage(farmerId, imageFile);
        } catch (uploadErr: any) {
          console.warn('Image upload failed, continuing with listing:', uploadErr?.message);
        } finally {
          setIsUploading(false);
        }
      }

      const createdItem = await farmerService.addProduce({
        crop: data.crop.trim(),
        quantity: Number(data.quantity),
        unit: data.unit || 'kg',
        grade: (data.grade || 'A') as ProduceGrade,
        harvestDate: data.harvestDate,
        expectedPrice: Number(data.expectedPrice),
        location: data.location.trim(),
        notes: data.notes?.trim() || undefined,
        imageUrl: uploadedImageUrl,
        image_url: uploadedImageUrl,
      }, farmerId);

      setSubmitSuccess(`Listing "${createdItem.crop}" (${createdItem.quantity} ${createdItem.unit}) published successfully to Supabase!`);

      const refreshed = await farmerService.getProduceList();
      setProduceList(refreshed || []);

      setTimeout(() => {
        setIsAddModalOpen(false);
        setImageFile(null);
        setImagePreview(null);
        setSubmitSuccess(null);
        reset();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to add produce listing:', err);
      setSubmitError(err?.message || 'Database error: Could not publish listing to Supabase. Please verify connection.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!produceToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const result = await farmerService.deleteProduce(produceToDelete.id);
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to delete produce listing');
      }

      setDeleteSuccess(`Listing "${produceToDelete.crop}" deleted successfully.`);
      setProduceToDelete(null);

      const refreshed = await farmerService.getProduceList();
      setProduceList(refreshed || []);

      setTimeout(() => {
        setDeleteSuccess(null);
      }, 4000);
    } catch (err: any) {
      console.error('Delete produce error:', err);
      setDeleteError(err?.message || 'Could not delete produce listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = filterStatus === 'All'
    ? produceList
    : produceList.filter(p => p.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">My Produce Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage listed crops, declare harvest quantities, and connect with direct buyers.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>+ Add Produce</span>
        </Button>
      </div>

      {/* Delete Success Alert Banner */}
      {deleteSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold flex-1">{deleteSuccess}</span>
          <button
            type="button"
            onClick={() => setDeleteSuccess(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'Active', 'Reserved', 'Sold', 'Expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === status
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Produce Grid */}
      {deleteError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Sprout className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No produce listings found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Add your first agricultural harvest listing to discover buyers.</p>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            + Add Produce
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between hover:border-emerald-500/50 transition overflow-hidden">
              <div>
                {(item.imageUrl || item.image_url) && (
                  <div className="mb-3 -mx-6 -mt-6 h-40 w-[calc(100%+3rem)] overflow-hidden relative bg-slate-900 border-b border-slate-800">
                    <img
                      src={item.imageUrl || item.image_url}
                      alt={item.crop}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.crop}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">{item.location}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* 4-Metric Live Stock Breakdown */}
                <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Live Inventory Breakdown</span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {(item.totalQuantity ?? item.quantity).toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Reserved</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {(item.reservedQuantity ?? 0).toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block">Delivered</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {(item.deliveredQuantity ?? 0).toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Available</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {(item.availableQuantity ?? item.quantity).toLocaleString()} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Quality Grade</span>
                    <span className="text-xs font-black text-emerald-500">Grade {item.grade}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Expected Price</span>
                    <span className="text-xs font-bold text-emerald-500">{formatINR(item.expectedPrice)}/{item.unit}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Harvest Date</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.harvestDate}</span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
                {/* Real-time Inventory Quantity Updater (Realtime echo back) */}
                <div className="my-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Edit Live Stock ({item.unit})
                    </label>
                    <span className="text-[10px] text-slate-400">Updates marketplace in &lt;1s</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      defaultValue={item.availableQuantity ?? item.quantity}
                      key={`${item.id}-${item.availableQuantity ?? item.quantity}`}
                      onBlur={async (e) => {
                        const newQty = Math.max(0, parseInt(e.target.value) || 0);
                        if (newQty !== (item.availableQuantity ?? item.quantity)) {
                          await farmerService.updateQuantity(item.id, newQty);
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          const newQty = Math.max(0, parseInt(target.value) || 0);
                          target.blur();
                          await farmerService.updateQuantity(item.id, newQty);
                        }
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Lot Value:</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {formatINR(item.quantity * item.expectedPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProduceToDelete(item);
                    setDeleteError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title={`Delete ${item.crop}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Produce Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setSubmitError(null); setSubmitSuccess(null); }} title="Add Agricultural Produce" subtitle="Declare crop quantity, grade, and expected realization price.">
        <form onSubmit={handleSubmit(onAddProduceSubmit)} className="space-y-4">
          
          {/* Real Database Error Banner */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-200">Listing Error</span>
                <span className="leading-relaxed">{submitError}</span>
              </div>
            </div>
          )}

          {/* Real Database Success Banner */}
          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-emerald-200">Published to Live Database</span>
                <span className="leading-relaxed">{submitSuccess}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Produce / Crop Name *</label>
            <input
              type="text"
              {...register('crop')}
              disabled={isSaving}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-50"
            />
            {errors.crop && <p className="text-[11px] text-rose-400 mt-1">{errors.crop.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Quantity *</label>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Unit</label>
              <select
                {...register('unit')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="quintal">quintal</option>
                <option value="crates">crates</option>
              </select>
            </div>
          </div>

          {/* Grade selection */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300">Grade (A, A-, B, B-, C, C-, D) *</label>
            <div className="grid grid-cols-7 gap-1.5">
              {(['A', 'A-', 'B', 'B-', 'C', 'C-', 'D'] as ProduceGrade[]).map((g) => (
                <label key={g} className="cursor-pointer">
                  <input
                    type="radio"
                    value={g}
                    {...register('grade')}
                    className="hidden peer"
                  />
                  <div className="text-center py-2 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 peer-checked:bg-emerald-600 peer-checked:border-emerald-500 peer-checked:text-white transition">
                    {g}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Expected Price (₹/unit) *</label>
              <input
                type="number"
                step="0.5"
                {...register('expectedPrice', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Harvest Date *</label>
              <input
                type="date"
                {...register('harvestDate')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Pickup Location / Hub *</label>
            <input
              type="text"
              {...register('location')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          {/* Crop Image Upload to Supabase Storage */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Crop Image</label>
            <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Crop preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-slate-300 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer w-full"
                  />
                  <p className="text-[10px] text-slate-400">
                    Uploads directly to produce-images storage bucket
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Storage / Crate Notes</label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsAddModalOpen(false); setSubmitError(null); setSubmitSuccess(null); }}
              className="flex-1"
              disabled={isSaving || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving || isUploading}>
              {isUploading ? 'Uploading Image...' : isSaving ? 'Saving to Supabase...' : 'Publish Listing'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Produce Confirmation Modal */}
      {produceToDelete && (
        <Modal
          isOpen={Boolean(produceToDelete)}
          onClose={() => {
            if (!isDeleting) {
              setProduceToDelete(null);
              setDeleteError(null);
            }
          }}
          title="Delete Produce Listing"
          subtitle="Permanently remove this crop listing from your inventory and the marketplace."
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-rose-200">Deletion Failed</span>
                  <span className="leading-relaxed">{deleteError}</span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Crop Name</span>
                <span className="text-sm font-bold text-white">{produceToDelete.crop}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Available Stock</span>
                <span className="text-xs font-bold text-emerald-400">
                  {(produceToDelete.availableQuantity ?? produceToDelete.quantity).toLocaleString()} {produceToDelete.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Expected Price</span>
                <span className="text-xs font-semibold text-slate-200">
                  {formatINR(produceToDelete.expectedPrice)}/{produceToDelete.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Location</span>
                <span className="text-xs text-slate-300 truncate max-w-[220px]">{produceToDelete.location}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this listing? This action cannot be undone, and buyers will no longer be able to discover or purchase this crop.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setProduceToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

