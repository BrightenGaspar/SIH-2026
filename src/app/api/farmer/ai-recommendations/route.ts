import { NextResponse } from 'next/server';
import { AIRecommendation } from '@/types/farmer';

export async function GET() {
  const recommendations: AIRecommendation[] = [
    {
      id: 'rec-01',
      title: 'Sell Tomatoes Immediately in Mumbai Vashi APMC',
      actionText: 'Dispatch to Mumbai Vashi',
      score: 94,
      expectedImprovementPerKg: 30.92,
      confidence: 94,
      summary: '40% supply deficit in Mumbai Vashi market due to recent monsoon transit delays. Institutional buyers paying ₹52.92/kg premium for immediate delivery.',
      factors: {
        demandStrength: 95,
        distanceScore: 82,
        freshnessScore: 90,
        expectedPriceScore: 94,
        fairRealizationScore: 92,
      },
      reasoning: [
        'Mumbai Vashi APMC has a 34-tonne regional supply shortage.',
        'Institutional buyers are purchasing Grade A hybrid tomatoes at ₹52.92/kg.',
        'Ambient storage beyond 4 days accelerates spoilage; immediate refrigerated dispatch maximizes realization.',
      ],
      recommendedMarket: 'Mumbai Vashi APMC',
      bestTimeToSellDays: 1,
    },
    {
      id: 'rec-02',
      title: 'Hold Nashik Red Onions for Friday Demand Peak',
      actionText: 'Hold & Monitor Price',
      score: 88,
      expectedImprovementPerKg: 14.50,
      confidence: 88,
      summary: 'Local harvest peak ending in 48 hours. Regional demand in Hyderabad forecasted to rise by 25% by Friday.',
      factors: {
        demandStrength: 85,
        distanceScore: 88,
        freshnessScore: 95,
        expectedPriceScore: 86,
        fairRealizationScore: 88,
      },
      reasoning: [
        'Cured red onions have 21+ days shelf-life with minimal moisture loss.',
        'Arrivals from local belts are dropping 12% daily.',
        'Expected realization increases from ₹28/kg to ₹38.50/kg by weekend.',
      ],
      recommendedMarket: 'Hyderabad Shamshabad Terminal',
      bestTimeToSellDays: 3,
    },
  ];

  return NextResponse.json(recommendations);
}
