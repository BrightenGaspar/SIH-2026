'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { farmerService } from '@/services/farmerService';
import { Order } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { supabase } from '@/lib/supabase';
import { Truck, ArrowRight, CheckCircle2, Clock, Sparkles, Flag, PackageCheck, Send, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import RateAndReviewModal from '@/components/reviews/RateAndReviewModal';
import ReportModal from '@/components/reports/ReportModal';
import { UserRole, ReportType } from '@/types/review';

export default function FarmerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Rating and Report State
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<{
    transactionId: string;
    targetUserId: string;
    targetRole: UserRole;
    targetName: string;
    productName?: string;
  } | null>(null);

  const [selectedReportData, setSelectedReportData] = useState<{
    reportType: ReportType;
    reportedUserId?: string;
    reportedRole?: UserRole;
    reportedName: string;
    transactionId?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await farmerService.getFarmerOrders();
        if (isMounted) setOrders(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();

    // Supabase Realtime subscription: Receive live order creations and status updates instantly
    const channel = supabase
      .channel('realtime-farmer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async () => {
          const fresh = await farmerService.getFarmerOrders();
          if (isMounted) setOrders(fresh);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await farmerService.updateOrderStatus(orderId, newStatus);
      const fresh = await farmerService.getFarmerOrders();
      setOrders(fresh);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Orders & Delivery</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor confirmed buyer purchase contracts, road freight dispatches, and delivery payment releases.
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-sm">Connecting to Supabase Realtime & loading orders...</p>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
            <PackageCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Orders Received Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              When buyers purchase your listed produce from the marketplace, their live order and escrow status will appear here in real-time.
            </p>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-emerald-500/50 transition">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-slate-400">{order.id}</span>
                <StatusBadge status={order.status} />
                <span className="text-xs text-slate-400">&bull; Ordered: {order.orderDate}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{order.buyerName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.buyerType} &bull; Destination: <strong className="text-slate-700 dark:text-slate-200">{order.destinationCity}</strong></p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Produce</span>
                  <span className="font-bold text-slate-900 dark:text-white">{order.produceName} (Grade {order.grade})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Quantity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{order.quantityKg.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rate</span>
                  <span className="font-bold text-emerald-500">{formatINR(order.pricePerKg)}/kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Realization Value</span>
                  <span className="font-black text-emerald-500 text-sm">{formatINR(order.totalOrderValue)}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto flex flex-col gap-2 shrink-0 min-w-[200px]">
              {/* Lifecycle Stage Action: Accept Order */}
              {((order.rawStatus?.toLowerCase() === 'pending') || order.status === 'New') && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, 'accepted')}
                  disabled={updatingOrderId === order.id}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  {updatingOrderId === order.id ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  )}
                  <span>Accept Order</span>
                </Button>
              )}

              {/* Lifecycle Stage Action: Mark Preparing */}
              {((order.rawStatus?.toLowerCase() === 'accepted') || order.status === 'Confirmed' || order.status === 'Escrow Locked') && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                  disabled={updatingOrderId === order.id}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
                >
                  {updatingOrderId === order.id ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <PackageCheck className="w-4 h-4 mr-1.5" />
                  )}
                  <span>Prepare Harvest</span>
                </Button>
              )}

              {/* Lifecycle Stage Action: Ready to Deliver */}
              {((order.rawStatus?.toLowerCase() === 'preparing') || order.status === 'PREPARING' || order.status === 'Preparing') && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, 'READY_TO_DELIVER')}
                  disabled={updatingOrderId === order.id}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  {updatingOrderId === order.id ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1.5" />
                  )}
                  <span>Ready to Deliver</span>
                </Button>
              )}

              {/* Status Notice when waiting for logistics */}
              {((order.rawStatus?.toLowerCase() === 'ready_for_pickup') || order.status === 'READY_TO_DELIVER' || order.status === 'Ready to Deliver' || order.status === 'DISPATCH_OFFERED') && (
                <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 dark:text-cyan-400 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Awaiting Carrier Acceptance</span>
                </div>
              )}

              <Link href={`/farmer/tracking/${order.logisticsId}`}>
                <Button className="w-full" size="sm" variant="outline">
                  <Truck className="w-4 h-4" />
                  <span>Road Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              {/* Verified Reciprocal Rating - Only after Delivered/Completed */}
              {order.status === 'Delivered' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRatingOrder({
                        transactionId: order.id,
                        targetUserId: order.buyerId || 'buyer_direct',
                        targetRole: 'BUYER',
                        targetName: order.buyerName,
                        productName: order.produceName,
                      });
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Rate Buyer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRatingOrder({
                        transactionId: order.id,
                        targetUserId: 'logistics_operator',
                        targetRole: 'LOGISTICS',
                        targetName: 'Cold-Chain Reefer Express',
                      });
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    Rate Carrier
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportData({
                        reportType: 'USER',
                        reportedUserId: order.buyerId,
                        reportedRole: 'BUYER',
                        reportedName: order.buyerName,
                        transactionId: order.id,
                      });
                    }}
                    title="Report Buyer"
                    className="p-1.5 rounded-xl border border-slate-700 hover:bg-rose-950/30 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </Card>
        )))}
      </div>

      {/* Reciprocal Rate and Review Modal */}
      {selectedRatingOrder && (
        <RateAndReviewModal
          isOpen={true}
          onClose={() => setSelectedRatingOrder(null)}
          transactionId={selectedRatingOrder.transactionId}
          targetUserId={selectedRatingOrder.targetUserId}
          targetRole={selectedRatingOrder.targetRole}
          targetName={selectedRatingOrder.targetName}
          productName={selectedRatingOrder.productName}
          raterUserId={user?.id || 'farmer_user'}
          raterRole="FARMER"
          raterDisplayName={user?.name || 'Verified Farmer'}
        />
      )}

      {/* User Report Modal */}
      {selectedReportData && (
        <ReportModal
          isOpen={true}
          onClose={() => setSelectedReportData(null)}
          reportType={selectedReportData.reportType}
          reportedUserId={selectedReportData.reportedUserId}
          reportedRole={selectedReportData.reportedRole}
          reportedName={selectedReportData.reportedName}
          transactionId={selectedReportData.transactionId}
          reporterUserId={user?.id || 'farmer_user'}
          reporterRole="FARMER"
          reporterDisplayName={user?.name || 'Verified Farmer'}
        />
      )}

    </div>
  );
}
