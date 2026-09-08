'use client';

import React, { useState, useEffect } from 'react';
import { farmerService } from '@/services/farmerService';
import { Produce, ProduceGrade } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { produceSchema, ProduceFormData } from '@/lib/validators';
import { Sprout, Plus, Filter, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function FarmerProducePage() {
  const [produceList, setProduceList] = useState<Produce[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  useEffect(() => { let isMounted = true; farmerService.getProduceList().then(data => { if (isMounted) setProduceList(data || []); }).catch(() => { if (isMounted) setProduceList([]); }); return () => { isMounted = false; }; }, []);

  const onAddProduceSubmit = (data: ProduceFormData) => {
    farmerService.addProduce({
      crop: data.crop,
      quantity: Number(data.quantity),
      unit: data.unit,
      grade: data.grade as ProduceGrade,
      harvestDate: data.harvestDate,
      expectedPrice: Number(data.expectedPrice),
      location: data.location,
      notes: data.notes,
    });
    farmerService.getProduceList().then(data => setProduceList(data || []));
    setIsAddModalOpen(false);
    reset();
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
            <Card key={item.id} className="flex flex-col justify-between hover:border-emerald-500/50 transition">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.crop}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">{item.location}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 my-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">Quantity</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.quantity.toLocaleString()} {item.unit}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">Quality Grade</span>
                    <span className="text-sm font-black text-emerald-500">Grade {item.grade}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">Expected Price</span>
                    <span className="text-sm font-bold text-emerald-500">{formatINR(item.expectedPrice)}/{item.unit}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">Harvest Date</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.harvestDate}</span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Lot Value:</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {formatINR(item.quantity * item.expectedPrice)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Produce Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Agricultural Produce" subtitle="Declare crop quantity, grade, and expected realization price.">
        <form onSubmit={handleSubmit(onAddProduceSubmit)} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Produce / Crop Name *</label>
            <input
              type="text"
              {...register('crop')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
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

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Storage / Crate Notes</label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Publish Listing
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

