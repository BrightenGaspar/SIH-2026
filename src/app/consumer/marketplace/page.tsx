'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MarketplaceProduceItem } from '@/services/consumerService';
import { useLiveProduce } from '@/hooks/useLiveProduce';
import ProduceCard from '@/components/consumer/ProduceCard';
import GradeFilterTabs from '@/components/consumer/GradeFilterTabs';
import { useI18n } from '@/context/I18nContext';
import {
  PRODUCE_CATEGORIES,
  ProduceCategory,
  matchesSubCategory,
  getAvailableSubCategories,
  normalizeCategory,
} from '@/lib/categoryHelpers';
import { 
  Search, 
  Filter, 
  Sparkles, 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  Snowflake, 
  Radio, 
  AlertCircle, 
  RefreshCw,
  Carrot,
  Apple,
  Wheat,
  Flame,
  Tag,
  X,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function ConsumerMarketplacePage() {
  const { t } = useI18n();
  // Authoritative Supabase Realtime hook (<1s synchronization from farmer inventory)
  const { 
    items: liveProduce, 
    status: realtimeStatus, 
    recentlyUpdatedIds, 
    error: realtimeError, 
    isLoading, 
    reconnect 
  } = useLiveProduce();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [coldChainOnly, setColdChainOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'freshness'>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Category counts based on authoritative live produce
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: liveProduce.length,
      Vegetables: 0,
      Fruits: 0,
      Grains: 0,
      Spices: 0,
    };
    liveProduce.forEach((item) => {
      const cat = item.category || normalizeCategory(undefined, item.crop_name, item.variety);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [liveProduce]);

  // Subcategories available for currently selected category with item counts
  const subCategories = useMemo(() => {
    return getAvailableSubCategories(selectedCategory, liveProduce);
  }, [selectedCategory, liveProduce]);

  // Quality grade counts
  const gradeCounts = useMemo(() => {
    const counts = {
      all: liveProduce.length,
      A: 0,
      B: 0,
      'Organic Certified': 0,
    };
    liveProduce.forEach((item) => {
      const g = (item.quality_grade || 'A').toUpperCase();
      if (g.includes('ORGANIC')) {
        counts['Organic Certified']++;
      } else if (g.startsWith('A')) {
        counts.A++;
      } else if (g.startsWith('B')) {
        counts.B++;
      }
    });
    return counts;
  }, [liveProduce]);

  // Handle category change: reset active subcategory to 'all'
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubCategory('all');
  };

  // Authoritative Filtered & Sorted Produce
  const filteredProduce = useMemo(() => {
    return liveProduce
      .filter((item) => {
        // 1. Search query across crop name, variety, location, farmer name, and category
        const query = searchQuery.toLowerCase().trim();
        if (query) {
          const matchesSearch =
            item.crop_name.toLowerCase().includes(query) ||
            (item.variety && item.variety.toLowerCase().includes(query)) ||
            (item.location && item.location.toLowerCase().includes(query)) ||
            (item.farmer_name && item.farmer_name.toLowerCase().includes(query)) ||
            (item.category && item.category.toLowerCase().includes(query));

          if (!matchesSearch) return false;
        }

        // 2. Category filter
        const itemCat = item.category || normalizeCategory(undefined, item.crop_name, item.variety);
        if (selectedCategory !== 'All' && itemCat !== selectedCategory) {
          return false;
        }

        // 3. Sub-Category filter
        if (selectedSubCategory !== 'all') {
          if (!matchesSubCategory(item, selectedCategory, selectedSubCategory)) {
            return false;
          }
        }

        // 4. Grade filter
        if (selectedGrade !== 'all') {
          const g = (item.quality_grade || 'A').toUpperCase();
          if (selectedGrade === 'A' && !g.startsWith('A')) return false;
          if (selectedGrade === 'B' && !g.startsWith('B')) return false;
          if (selectedGrade === 'Organic Certified' && !g.includes('ORGANIC')) return false;
        }

        // 5. Cold-Chain filter
        if (coldChainOnly) {
          const isEligible = Boolean(
            item.is_cold_chain ||
            ['Vegetables', 'Fruits'].includes(itemCat)
          );
          if (!isEligible) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price_per_kg - b.price_per_kg;
        if (sortBy === 'price-desc') return b.price_per_kg - a.price_per_kg;
        if (sortBy === 'freshness') {
          const dateA = a.harvest_date ? new Date(a.harvest_date).getTime() : 0;
          const dateB = b.harvest_date ? new Date(b.harvest_date).getTime() : 0;
          return dateB - dateA;
        }
        // Default: order by updated_at descending (freshest live updates first)
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [liveProduce, searchQuery, selectedCategory, selectedSubCategory, selectedGrade, coldChainOnly, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedSubCategory !== 'all' ||
    selectedGrade !== 'all' ||
    coldChainOnly;

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSubCategory('all');
    setSelectedGrade('all');
    setColdChainOnly(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Vegetables':
        return Carrot;
      case 'Fruits':
        return Apple;
      case 'Grains':
        return Wheat;
      case 'Spices':
        return Flame;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Direct Farm-Gate Sourcing
            </span>
            {/* Realtime Sub-Second Status Badge & Reconnect */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span>{realtimeStatus === 'SUBSCRIBED' ? 'Live (<1s Realtime Sync)' : `Realtime: ${realtimeStatus}`}</span>
              </div>
              {realtimeStatus !== 'SUBSCRIBED' && (
                <button
                  type="button"
                  onClick={reconnect}
                  className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition cursor-pointer"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
            Produce Marketplace
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse verified farm harvests with transparent road freight & direct farmer realizations
          </p>
        </div>

        {/* View Mode & Sorter */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Sorter */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="recommended">Freshest First (Live Updated)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="freshness">Harvest Date (Newest)</option>
            </select>
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search Bar + Categories + Cold Chain */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop name, variety, farmer, location..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {PRODUCE_CATEGORIES.map((cat) => {
              const Icon = getCategoryIcon(cat);
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cold-Chain Toggle */}
          <button
            type="button"
            onClick={() => setColdChainOnly(!coldChainOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
              coldChainOnly
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 ring-2 ring-cyan-400/20'
                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
            <span>Cold-Chain Only</span>
          </button>
        </div>

        {/* Row 2: Sub-categories Navigation Pills */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
              <Tag className="w-3 h-3 text-emerald-500" />
              <span>Sub-categories:</span>
            </div>

            {subCategories.map((sub) => {
              const isSelected = selectedSubCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80'
                  }`}
                >
                  <span>{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Quality Grade Tabs */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <GradeFilterTabs
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
            counts={gradeCounts}
          />
        </div>

        {/* Active Filters Summary Bar */}
        {hasActiveFilters && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 font-semibold">Active filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                  Category: {selectedCategory}
                  <button type="button" onClick={() => handleCategoryChange('All')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSubCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                  Subcategory: {subCategories.find((s) => s.id === selectedSubCategory)?.label || selectedSubCategory}
                  <button type="button" onClick={() => setSelectedSubCategory('all')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedGrade !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                  Grade: {selectedGrade}
                  <button type="button" onClick={() => setSelectedGrade('all')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {coldChainOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold">
                  Cold-Chain Only
                  <button type="button" onClick={() => setColdChainOnly(false)} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Realtime / Database Offline Banner */}
      {realtimeError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{realtimeError}</span>
          </div>
          <button
            type="button"
            onClick={reconnect}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Produce Grid / List with Live Realtime Updates */}
      {isLoading && liveProduce.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Loading live produce catalog directly from Supabase...
          </p>
        </div>
      ) : liveProduce.length === 0 && realtimeError ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-8 space-y-4">
          <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/60 w-14 h-14 mx-auto flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Connection or Database Offline
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {realtimeError}
          </p>
          <button
            type="button"
            onClick={reconnect}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconnect Now
          </button>
        </div>
      ) : liveProduce.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 w-14 h-14 mx-auto flex items-center justify-center text-zinc-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No Produce Currently Available
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Farmers list freshly harvested crops daily. Check back shortly or check the farmer portal to list produce.
          </p>
          <Link href="/farmer/produce" className="inline-block">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              List Produce as Farmer
            </button>
          </Link>
        </div>
      ) : filteredProduce.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 w-14 h-14 mx-auto flex items-center justify-center text-zinc-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No produce found matching your filters
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Try resetting your subcategory, category, or search query.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProduce.map((item) => (
            <ProduceCard
              key={item.id}
              produce={item}
              isRecentlyUpdated={recentlyUpdatedIds.has(item.id)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Produce</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">Origin / Hub</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Price / kg</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredProduce.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100'}
                          alt={item.crop_name}
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white block">
                            {item.crop_name}
                          </span>
                          {item.variety && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {item.variety}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                        {item.category || 'Produce'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                        Grade {item.quality_grade || 'A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{item.location || 'Nashik APMC Hub'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                      {item.quantity_kg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        ₹{item.price_per_kg}
                      </span>
                      <span className="text-[10px] text-zinc-400">/kg</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/consumer/checkout">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Order Now
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
