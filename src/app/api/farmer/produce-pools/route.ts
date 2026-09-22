import { NextResponse } from 'next/server';
import { ProducePool } from '@/types/farmer';

export async function GET() {
  const pools: ProducePool[] = [
    {
      id: 'pool-tomato-shadnagar',
      targetCommodity: 'Tomato (Hybrid Desi)',
      destination: 'BigBasket Wholesale Hub, Shamshabad',
      targetQuantityKg: 1000,
      currentQuantityKg: 1100,
      buyerName: 'BigBasket Wholesale Hub',
      offeredPricePerKg: 52.0,
      estimatedFreightSavingsPercent: 38,
      participants: [
        { id: 'f-1', farmerName: 'Farmer Ramesh (Shadnagar West)', quantityKg: 250, isCurrentUser: true },
        { id: 'f-2', farmerName: 'Farmer Venkatesh (Farooqnagar Road)', quantityKg: 300 },
        { id: 'f-3', farmerName: 'Farmer Anjaneyulu (Shadnagar Rural)', quantityKg: 200 },
        { id: 'f-4', farmerName: 'Farmer Balaji (Kothur Border)', quantityKg: 350 },
      ],
      deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'Consolidating',
    },
    {
      id: 'pool-onion-nashik',
      targetCommodity: 'Nashik Red Onion',
      destination: 'Reliance Retail Sourcing, Pune',
      targetQuantityKg: 3000,
      currentQuantityKg: 2400,
      buyerName: 'Reliance Retail Sourcing',
      offeredPricePerKg: 38.5,
      estimatedFreightSavingsPercent: 42,
      participants: [
        { id: 'f-5', farmerName: 'Kisan Ramesh Patil', quantityKg: 800 },
        { id: 'f-6', farmerName: 'Sanjay Deshmukh', quantityKg: 500 },
        { id: 'f-7', farmerName: 'Vithal Shinde', quantityKg: 600 },
        { id: 'f-8', farmerName: 'Anand More', quantityKg: 500 },
      ],
      deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: 'Open',
    },
  ];

  return NextResponse.json(pools);
}
