'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { consumerService } from '@/services/consumerService';
import { ConsumerOrder } from '@/types/consumer';
import { useI18n } from '@/context/I18nContext';
import MultiFarmerConsolidationCard from '@/components/consumer/MultiFarmerConsolidationCard';
import ImpactReceiptModal from '@/components/consumer/ImpactReceiptModal';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  MapPin, 
  TrendingUp, 
  Users, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ConsumerOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>('ORD-HYD-5000');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<ConsumerOrder | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await consumerService.getOrders();
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'active') return o.status !== 'Delivered' && o.status !== 'Cancelled';
    if (activeTab === 'completed') return o.status === 'Delivered';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Transit':
      case 'Preparing':
      case 'Pickup':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Procurement Pipeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
            Sourcing Orders & Shipments
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'In Transit / Active' },
            { id: 'completed', label: 'Delivered & Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Loading order records...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
          <Package className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No orders in this view</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            You do not have any orders matching the active filter.
          </p>
          <Link
            href="/consumer/marketplace"
            className="inline-flex px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Explore Farm Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all"
              >
                {/* Order Header Summary Card */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black font-mono text-zinc-900 dark:text-white">
                        {order.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      {order.status === 'In Transit' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live GPS Active
                        </span>
                      )}
                      {order.isBulkOrder && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Bulk Multi-Farmer ({order.totalQuantityKg.toLocaleString('en-IN')} kg)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Ordered on {order.orderDate} • Payment via {order.paymentMethod} Escrow
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                    <div className="text-left sm:text-right mr-1">
                      <span className="text-xs text-zinc-400 block">Total Settlement</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link
                      href={`/consumer/tracking/${order.logisticsId || 'TRK-CONS-ROAD-9021'}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      title="Open Live GPS Tracking Map"
                    >
                      <Truck className="w-3.5 h-3.5" /> Track GPS
                    </Link>

                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                    {/* Item Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Purchased Harvest Batches
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                              <div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                                  {item.product.name}
                                </span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  Grade {item.product.grade} • Direct from {item.product.farmerStory.farmerName}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                                {item.quantityKg} kg @ ₹{item.selectedTierPricePerKg}/kg
                              </span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                ₹{(item.selectedTierPricePerKg * item.quantityKg).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Farmer Consolidation Breakdown if applicable */}
                    {order.multiFarmerSources && order.multiFarmerSources.length > 0 && (
                      <MultiFarmerConsolidationCard
                        sources={order.multiFarmerSources}
                        totalQuantityKg={order.totalQuantityKg}
                        produceName={order.items[0]?.product.name || 'Produce'}
                        isSIHDemoHighlight={order.id === 'ORD-HYD-5000'}
                      />
                    )}

                    {/* Delivery & Escrow Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Delivery Sourcing Hub
                        </span>
                        <p className="text-zinc-600 dark:text-zinc-300">
                          {order.deliveryAddress.name} ({order.deliveryAddress.phone})
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {order.deliveryAddress.address}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                        </p>
                      </div>

                      <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-cyan-500" /> Road Freight & Estimated Time
                        </span>
                        <p className="text-zinc-600 dark:text-zinc-300">
                          Mode: Tata 407 Reefer Climate Truck
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Arrival Window: {order.estimatedDeliveryDate}
                        </p>
                      </div>
                    </div>

                    {/* Action Footers */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      {order.impactReceipt && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <FileText className="w-4 h-4 text-emerald-500" />
                          View Farmer Realization Receipt
                        </button>
                      )}

                      <Link
                        href={`/consumer/tracking/${order.logisticsId || 'TRK-RD-701'}`}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all ml-auto"
                      >
                        <Truck className="w-4 h-4" /> Live Road Tracking & Telemetry <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Impact Receipt Modal */}
      {selectedReceiptOrder && selectedReceiptOrder.impactReceipt && (
        <ImpactReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          receipt={selectedReceiptOrder.impactReceipt}
        />
      )}
    </div>
  );
}
