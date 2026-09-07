'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackingService } from '@/services/trackingService';
import { Order } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Truck, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

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
                <span className="text-xs text-slate-400">• Ordered: {order.orderDate}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{order.buyerName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.buyerType} • Destination: <strong className="text-slate-700 dark:text-slate-200">{order.destinationCity}</strong></p>
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

            <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2">
              <Link href={`/farmer/tracking/${order.logisticsId}`}>
                <Button className="w-full" size="sm">
                  <Truck className="w-4 h-4" />
                  <span>View Road Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </Card>
        ))}
      </div>

    </div>
  );
}
