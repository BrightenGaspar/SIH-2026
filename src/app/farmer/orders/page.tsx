'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackingService } from '@/services/trackingService';
import { Order } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Truck, ArrowRight, CheckCircle2, Clock, Sparkles, Flag } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import RateAndReviewModal from '@/components/reviews/RateAndReviewModal';
import ReportModal from '@/components/reports/ReportModal';
import { UserRole, ReportType } from '@/types/review';

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

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
    trackingService.getOrders().then(setOrders);
  }, []);

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
        {orders.map((order) => (
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

            <div className="w-full lg:w-auto flex flex-col gap-2 shrink-0">
              <Link href={`/farmer/tracking/${order.logisticsId}`}>
                <Button className="w-full" size="sm">
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
                        targetUserId: order.buyerName || 'buyer_01',
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
                        targetUserId: 'logistics_01',
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
                        reportedUserId: 'buyer_01',
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
        ))}
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
          raterUserId="farmer_01"
          raterRole="FARMER"
          raterDisplayName="Ramesh Reddy (Shadnagar FPO)"
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
          reporterUserId="farmer_01"
          reporterRole="FARMER"
          reporterDisplayName="Ramesh Reddy (Shadnagar FPO)"
        />
      )}

    </div>
  );
}
