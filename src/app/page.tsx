'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  Store, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Globe, 
  Leaf 
} from 'lucide-react';
import { useBandwidth } from '@/context/BandwidthContext';

export default function PublicGateway() {
  const router = useRouter();
  const { isLowBandwidth } = useBandwidth();

  // Preserve OAuth callback token forwarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasHash = window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('error')
      );
      const hasCode = window.location.search && (
        window.location.search.includes('code=') ||
        window.location.search.includes('error=')
      );
      if (hasHash || hasCode) {
        router.replace(`/auth/callback${window.location.search}${window.location.hash}`);
      }
    }
  }, [router]);

  const scrollToRoles = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('roles-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF3] text-slate-800 font-sans selection:bg-[#185E32] selection:text-white relative overflow-x-hidden">
      
      {/* 1. ORGANIC CURVED BACKGROUND SHAPES & FLOATING LEAVES */}
      {!isLowBandwidth && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Top-Left Organic Sage Curve */}
          <svg className="absolute -top-16 -left-20 w-[420px] h-[340px] text-[#E5EED8] opacity-70" viewBox="0 0 420 340" fill="currentColor">
            <path d="M0,0 C180,-20 340,90 280,220 C220,330 80,300 0,260 Z" />
          </svg>

          {/* Right Hero Organic Contour */}
          <svg className="absolute top-12 -right-24 w-[600px] h-[520px] text-[#E4EED7] opacity-60" viewBox="0 0 600 520" fill="currentColor">
            <path d="M120,0 C380,40 580,180 540,360 C500,500 280,480 180,420 C60,340 40,160 120,0 Z" />
          </svg>

          {/* Floating Subtle Leaf 1 - Top Left */}
          <div className="absolute top-36 left-[38%] text-[#84A143] opacity-80 rotate-12 animate-pulse" style={{ animationDuration: '4s' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>

          {/* Floating Subtle Leaf 2 - Center Hero */}
          <div className="absolute top-[28%] left-[48%] text-[#7D9B3E] opacity-75 -rotate-45">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>

          {/* Floating Subtle Leaf 3 - Hero Top Right */}
          <div className="absolute top-24 right-[19%] text-[#8BA847] opacity-80 rotate-45">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>

          {/* Floating Subtle Leaf 4 - Far Right */}
          <div className="absolute top-44 right-6 text-[#7B993C] opacity-75 rotate-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>

          {/* Floating Subtle Leaf 5 - Lower Left */}
          <div className="absolute top-[62%] left-4 text-[#8BA847] opacity-70 -rotate-12">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>

          {/* Bottom Organic Wave Curve */}
          <svg className="absolute -bottom-24 -left-20 w-[640px] h-[360px] text-[#E6EED9] opacity-70" viewBox="0 0 640 360" fill="currentColor">
            <path d="M0,180 C240,120 440,320 640,240 L640,360 L0,360 Z" />
          </svg>

          {/* Bottom Right Wave */}
          <svg className="absolute -bottom-20 -right-20 w-[560px] h-[340px] text-[#E5EDD8] opacity-70" viewBox="0 0 560 340" fill="currentColor">
            <path d="M0,280 C180,180 380,340 560,200 L560,340 L0,340 Z" />
          </svg>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subtitle, Buttons, Benefits */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF2E5] border border-[#D5E3CC] text-[#245831] text-xs font-semibold shadow-2xs">
              <div className="w-4 h-4 rounded-full bg-[#185E32] text-white flex items-center justify-center">
                <Sprout className="w-2.5 h-2.5" />
              </div>
              <span className="font-bold">AgriFlow</span>
              <span className="text-[#6D8A74]">&bull;</span>
              <span className="font-medium text-[#466B50]">Connecting Farmers, Consumers &amp; Logistics</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="tracking-tight">
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-slate-900 leading-[1.12]">
                From Farm to Your Table
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-[#228344] leading-[1.12] mt-1 sm:mt-2">
                Smarter, Faster, Together
              </span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              AgriFlow is a unified platform that connects farmers, consumers and logistics operators for a transparent, efficient and sustainable food supply chain.
            </p>

            {/* CTA Button Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToRoles}
                className="px-7 py-3 rounded-full bg-[#185E32] hover:bg-[#134D28] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Benefits Row (Compact 4-Pillar Strip) */}
            <div className="pt-6 sm:pt-8">
              <div className="bg-white/95 backdrop-blur-xs border border-[#E3ECE0] rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* 1. Fresh Produce */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F1E6] text-[#185E32] flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Fresh Produce</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Direct from farmers</p>
                  </div>
                </div>

                {/* 2. Trusted Quality */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F1E6] text-[#185E32] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Trusted Quality</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Safe &amp; verified</p>
                  </div>
                </div>

                {/* 3. Efficient Delivery */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F1E6] text-[#185E32] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Efficient Delivery</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">On time, every time</p>
                  </div>
                </div>

                {/* 4. Sustainable Future */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F1E6] text-[#185E32] flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Sustainable Future</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">For generations</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column: Organic Curved Visual with Indian Farmer & Fresh Harvest */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            
            {/* Organic Curved Container Framing the Farmer Photo */}
            <div className="relative rounded-[36px] sm:rounded-[48px] overflow-hidden shadow-xl border-4 border-white/90 bg-[#EBF2E5]">
              {!isLowBandwidth ? (
                <div className="relative w-full aspect-[460/272] sm:aspect-[460/272]">
                  <Image
                    src="/assets/hero-farmer-card-2x.jpg"
                    alt="Indian farmer proudly holding fresh harvest crate in lush agricultural field"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    priority
                    className="object-cover object-center"
                  />
                </div>
              ) : (
                /* Low Bandwidth Fallback: Text-first clean badge representation */
                <div className="p-8 text-center bg-[#E5EED8] space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#185E32] text-white flex items-center justify-center mx-auto shadow-sm">
                    <Sprout className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-[#153820]">Fresh From Indian Farmgates</h3>
                  <p className="text-xs text-slate-600">Smart consolidation &bull; Solar cold storage &bull; Fair market realization</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 4. "CHOOSE YOUR ROLE" SECTION */}
      <section id="roles-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12 space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-black text-[#153820] tracking-tight">
            Choose Your Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Select your role to get started with AgriFlow
          </p>
        </div>

        {/* 3 Large Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 max-w-6xl mx-auto">
          
          {/* 1. FARMER CARD (GREEN) */}
          <div className="bg-[#F4F9F4] border border-[#D5EAD7] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs hover:shadow-md hover:border-[#B5DDB9] transition-all flex flex-col justify-between group">
            <div className="space-y-3 relative z-10">
              
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#185E32] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#185E32] leading-tight">Farmer</h3>
                  <p className="text-xs font-bold text-[#2C7D47] mt-0.5">Grow Better &bull; Earn More</p>
                </div>
              </div>

              {/* Body Text */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-[210px] pt-1">
                Access market prices, manage your produce, track orders and grow your farm business with ease.
              </p>

              {/* Action Button */}
              <div className="pt-4">
                <Link
                  href="/farmer/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#185E32] hover:bg-[#134D28] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all group-hover:gap-3"
                >
                  <span>Continue as Farmer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Illustration on Right Side */}
            {!isLowBandwidth && (
              <div className="absolute right-0 bottom-0 w-28 sm:w-32 h-36 sm:h-40 pointer-events-none opacity-95">
                <Image
                  src="/assets/role-farmer-card-2x.jpg"
                  alt="Farmer digital portal graphic"
                  fill
                  sizes="140px"
                  className="object-contain object-bottom-right"
                />
              </div>
            )}
          </div>

          {/* 2. CONSUMER CARD (BLUE) */}
          <div className="bg-[#F2F7FD] border border-[#CCE0F9] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs hover:shadow-md hover:border-[#ADCFF5] transition-all flex flex-col justify-between group">
            <div className="space-y-3 relative z-10">
              
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1D63D8] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1D63D8] leading-tight">Consumer</h3>
                  <p className="text-xs font-bold text-[#2A71E6] mt-0.5">Fresh Food &bull; Better Living</p>
                </div>
              </div>

              {/* Body Text */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-[210px] pt-1">
                Buy fresh, quality produce directly from farmers. Support local and enjoy healthy food.
              </p>

              {/* Action Button */}
              <div className="pt-4">
                <Link
                  href="/consumer/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1D63D8] hover:bg-[#1752B5] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all group-hover:gap-3"
                >
                  <span>Continue as Consumer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Illustration on Right Side */}
            {!isLowBandwidth && (
              <div className="absolute right-0 bottom-0 w-28 sm:w-32 h-36 sm:h-40 pointer-events-none opacity-95">
                <Image
                  src="/assets/role-consumer-card-2x.jpg"
                  alt="Consumer fresh produce buyer graphic"
                  fill
                  sizes="140px"
                  className="object-contain object-bottom-right"
                />
              </div>
            )}
          </div>

          {/* 3. LOGISTICS CARD (AMBER/YELLOW) */}
          <div className="bg-[#FCF9F0] border border-[#F5E8C4] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs hover:shadow-md hover:border-[#EDD79C] transition-all flex flex-col justify-between group">
            <div className="space-y-3 relative z-10">
              
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#B8710B] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#B8710B] leading-tight">Logistics</h3>
                  <p className="text-xs font-bold text-[#9C6008] mt-0.5">Transport &bull; Deliver &bull; Supply Chain</p>
                </div>
              </div>

              {/* Body Text */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-[210px] pt-1">
                Manage deliveries, track vehicles, monitor temperature and humidity, keep the supply chain fresh.
              </p>

              {/* Action Button */}
              <div className="pt-4">
                <Link
                  href="/logistics/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B8710B] hover:bg-[#9E5F07] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all group-hover:gap-3"
                >
                  <span>Continue as Logistics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Illustration on Right Side */}
            {!isLowBandwidth && (
              <div className="absolute right-0 bottom-0 w-32 sm:w-36 h-32 sm:h-36 pointer-events-none opacity-95">
                <Image
                  src="/assets/role-logistics-card-2x.jpg"
                  alt="Cold chain reefer vehicle delivery graphic"
                  fill
                  sizes="160px"
                  className="object-contain object-bottom-right"
                />
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. BOTTOM IMPACT STRIP */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 my-6 sm:my-10">
        <div className="bg-white/95 backdrop-blur-xs rounded-full border border-[#DCE6D7] shadow-xs py-4 px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Pillar 1: Stronger Farmers */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#185E32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Stronger Farmers</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Better income &amp; opportunities</p>
              </div>
            </div>

            {/* Pillar 2: Healthier Consumers */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#185E32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Healthier Consumers</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Fresh, safe &amp; nutritious food</p>
              </div>
            </div>

            {/* Pillar 3: Efficient Logistics */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#185E32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Efficient Logistics</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Reliable &amp; sustainable delivery</p>
              </div>
            </div>

            {/* Pillar 4: A Greener Planet */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#185E32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">A Greener Planet</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Less waste, more sustainability</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#E5EED9] py-6 text-center text-xs text-slate-500 bg-[#F4F8EE]/60">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} AgriFlow AI &bull; Ministry of Agriculture &amp; Farmers Welfare Hackathon Edition
        </p>
      </footer>
    </div>
  );
}