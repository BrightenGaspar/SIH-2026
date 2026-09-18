export type ProduceCategory = 'Vegetables' | 'Fruits' | 'Grains' | 'Spices';

export const PRODUCE_CATEGORIES: ('All' | ProduceCategory)[] = [
  'All',
  'Vegetables',
  'Fruits',
  'Grains',
  'Spices',
];

export interface SubCategoryDef {
  id: string;
  label: string;
  keywords: string[];
}

export const CATEGORY_SUBCATEGORIES: Record<string, SubCategoryDef[]> = {
  All: [
    { id: 'all', label: 'All Items', keywords: [] },
    { id: 'tomatoes', label: 'Tomatoes', keywords: ['tomato', 'tamatar'] },
    { id: 'onions', label: 'Onions & Shallots', keywords: ['onion', 'pyaz', 'shallot'] },
    { id: 'potatoes', label: 'Potatoes & Tubers', keywords: ['potato', 'aloo', 'kufri', 'tuber', 'yam'] },
    { id: 'chillies', label: 'Chillies & Peppers', keywords: ['chilli', 'chili', 'mirchi', 'teja', 'capsicum', 'pepper', 'g4'] },
    { id: 'greens', label: 'Leafy Greens', keywords: ['spinach', 'palak', 'methi', 'coriander', 'dhania', 'greens', 'leafy', 'lettuce'] },
    { id: 'grains', label: 'Grains & Pulses', keywords: ['rice', 'wheat', 'millet', 'grain', 'paddy', 'dal', 'pulse', 'corn', 'maize', 'chana'] },
    { id: 'fruits', label: 'Fresh Fruits', keywords: ['mango', 'banana', 'apple', 'citrus', 'orange', 'papaya', 'guava', 'pomegranate', 'grape', 'fruit', 'lemon'] },
    { id: 'spices', label: 'Spices & Herbs', keywords: ['turmeric', 'haldi', 'ginger', 'adrak', 'garlic', 'lahsun', 'cumin', 'jeera', 'cardamom', 'elaichi'] },
  ],
  Vegetables: [
    { id: 'all', label: 'All Vegetables', keywords: [] },
    { id: 'tomatoes', label: 'Tomatoes', keywords: ['tomato', 'tamatar'] },
    { id: 'onions', label: 'Onions & Shallots', keywords: ['onion', 'pyaz', 'shallot'] },
    { id: 'potatoes', label: 'Potatoes & Tubers', keywords: ['potato', 'aloo', 'kufri', 'tuber', 'yam'] },
    { id: 'greens', label: 'Leafy Greens', keywords: ['spinach', 'palak', 'methi', 'coriander', 'dhania', 'greens', 'leafy', 'lettuce'] },
    { id: 'gourds', label: 'Gourds & Cucumbers', keywords: ['gourd', 'cucumber', 'kheera', 'karela', 'lauki', 'tori', 'squash', 'pumpkin', 'bottle gourd', 'bitter gourd', 'ridge gourd'] },
    { id: 'cruciferous', label: 'Cauliflower & Cabbage', keywords: ['cauliflower', 'cabbage', 'gobhi', 'gobi', 'patta gobhi', 'phool gobhi', 'broccoli'] },
    { id: 'roots', label: 'Carrots & Root Veggies', keywords: ['carrot', 'radish', 'gajar', 'mooli', 'beetroot', 'turnip'] },
    { id: 'beans', label: 'Beans & Peas', keywords: ['bean', 'beans', 'pea', 'peas', 'matar', 'cluster', 'french bean', 'broad bean'] },
    { id: 'brinjals', label: 'Brinjal & Eggplant', keywords: ['brinjal', 'eggplant', 'baingan', 'aubergine'] },
    { id: 'okra', label: 'Okra & Ladyfinger', keywords: ['okra', 'bhindi', 'ladyfinger'] },
  ],
  Fruits: [
    { id: 'all', label: 'All Fruits', keywords: [] },
    { id: 'mangoes', label: 'Mangoes', keywords: ['mango', 'aam', 'alphonso', 'kesar', 'dasheri', 'totapuri', 'badami', 'banganapalli', 'chaunsa', 'langra'] },
    { id: 'bananas', label: 'Bananas', keywords: ['banana', 'kela', 'yelakki', 'robusta', 'cavendish', 'g9'] },
    { id: 'citrus', label: 'Citrus & Lemons', keywords: ['citrus', 'lemon', 'lime', 'orange', 'mosambi', 'sweet lime', 'santre', 'nimbu', 'mandarin', 'kinnow'] },
    { id: 'apples', label: 'Apples & Pears', keywords: ['apple', 'seb', 'pear', 'nashpati', 'shimla apple', 'kashmiri apple'] },
    { id: 'papayas_melons', label: 'Papayas & Melons', keywords: ['papaya', 'papita', 'melon', 'watermelon', 'muskmelon', 'tarbooz', 'kharbooja'] },
    { id: 'pomegranates_guavas', label: 'Pomegranates & Guavas', keywords: ['pomegranate', 'anar', 'guava', 'amrud', 'bhagwa'] },
    { id: 'grapes', label: 'Grapes & Berries', keywords: ['grape', 'grapes', 'angoor', 'thompson', 'berry', 'strawberry'] },
  ],
  Grains: [
    { id: 'all', label: 'All Grains', keywords: [] },
    { id: 'rice', label: 'Rice & Paddy', keywords: ['rice', 'paddy', 'basmati', 'sona masoori', 'ponni', 'chawal', 'dhan', 'kolam'] },
    { id: 'wheat', label: 'Wheat & Flour', keywords: ['wheat', 'gehun', 'atta', 'sharbati', 'lokwan', 'suji', 'maida'] },
    { id: 'millets', label: 'Millets & Jowar', keywords: ['millet', 'jowar', 'bajra', 'ragi', 'sorghum', 'foxtail', 'pearl millet', 'finger millet'] },
    { id: 'pulses', label: 'Pulses & Lentils (Dal)', keywords: ['pulse', 'dal', 'daal', 'gram', 'chana', 'toor', 'tur', 'moong', 'urad', 'lentil', 'masoor', 'arhar', 'chickpea'] },
    { id: 'corn', label: 'Corn & Maize', keywords: ['corn', 'maize', 'makka', 'sweet corn'] },
    { id: 'oilseeds', label: 'Oilseeds & Groundnut', keywords: ['groundnut', 'peanut', 'mustard', 'sarson', 'soybean', 'sunflower', 'sesame', 'til'] },
  ],
  Spices: [
    { id: 'all', label: 'All Spices', keywords: [] },
    { id: 'chillies', label: 'Chillies (Fresh & Dried)', keywords: ['chilli', 'chili', 'mirchi', 'g4', 'teja', 'guntur', 'byadgi', 'lal mirch', 'green chilli', 'red chilli'] },
    { id: 'turmeric', label: 'Turmeric (Haldi)', keywords: ['turmeric', 'haldi', 'curcuma', 'selam haldi'] },
    { id: 'ginger_garlic', label: 'Ginger & Garlic', keywords: ['ginger', 'adrak', 'garlic', 'lahsun', 'garlic pod'] },
    { id: 'seed_spices', label: 'Coriander & Cumin Seeds', keywords: ['coriander seed', 'dhania seed', 'cumin', 'jeera', 'fennel', 'saunf', 'mustard seed', 'sarson', 'fenugreek seed', 'methi dana'] },
    { id: 'aromatic_spices', label: 'Cardamom & Black Pepper', keywords: ['cardamom', 'elaichi', 'pepper', 'kali mirch', 'clove', 'laung', 'cinnamon', 'dalchini', 'nutmeg'] },
  ],
};

/**
 * Infer the high-level ProduceCategory from crop name and optional variety.
 */
export function inferProduceCategory(
  cropName?: string | null,
  variety?: string | null
): ProduceCategory {
  const text = `${cropName || ''} ${variety || ''}`.toLowerCase().trim();

  if (!text) return 'Vegetables';

  // 1. Spices check
  const spiceWords = [
    'chilli', 'chili', 'mirchi', 'teja', 'guntur', 'pepper', 'turmeric', 'haldi',
    'ginger', 'adrak', 'garlic', 'lahsun', 'cumin', 'jeera', 'coriander seed',
    'cardamom', 'elaichi', 'clove', 'cinnamon', 'fennel', 'saunf', 'spice'
  ];
  if (spiceWords.some((w) => text.includes(w))) {
    return 'Spices';
  }

  // 2. Grains & Pulses check
  const grainWords = [
    'rice', 'paddy', 'basmati', 'sona masoori', 'wheat', 'gehun', 'atta',
    'millet', 'jowar', 'bajra', 'ragi', 'sorghum', 'dal', 'daal', 'pulse',
    'chana', 'toor', 'tur', 'moong', 'urad', 'masoor', 'arhar', 'lentil',
    'corn', 'maize', 'makka', 'barley', 'grain', 'groundnut', 'soybean'
  ];
  if (grainWords.some((w) => text.includes(w))) {
    return 'Grains';
  }

  // 3. Fruits check
  const fruitWords = [
    'mango', 'aam', 'alphonso', 'kesar', 'dasheri', 'banana', 'kela',
    'apple', 'seb', 'pear', 'orange', 'santre', 'citrus', 'lemon', 'lime', 'nimbu',
    'mosambi', 'papaya', 'papita', 'watermelon', 'tarbooz', 'melon', 'muskmelon',
    'pomegranate', 'anar', 'guava', 'amrud', 'grape', 'grapes', 'angoor', 'berry',
    'strawberry', 'fruit', 'chikoo', 'sapota', 'fig', 'anjeer', 'coconut'
  ];
  if (fruitWords.some((w) => text.includes(w))) {
    return 'Fruits';
  }

  // Default to Vegetables
  return 'Vegetables';
}

/**
 * Normalize raw category string, falling back to inference if missing or invalid.
 */
export function normalizeCategory(
  rawCategory?: string | null,
  cropName?: string | null,
  variety?: string | null
): ProduceCategory {
  if (rawCategory) {
    const lower = rawCategory.toLowerCase().trim();
    if (lower.includes('fruit')) return 'Fruits';
    if (lower.includes('grain') || lower.includes('pulse') || lower.includes('cereal')) return 'Grains';
    if (lower.includes('spice')) return 'Spices';
    if (lower.includes('vegetable') || lower.includes('veggie') || lower.includes('tuber')) return 'Vegetables';
  }
  return inferProduceCategory(cropName, variety);
}

/**
 * Check whether a produce item matches the selected subcategory.
 */
export function matchesSubCategory(
  produce: { crop_name?: string | null; variety?: string | null; category?: string | null },
  category: string,
  subCategoryId: string
): boolean {
  if (!subCategoryId || subCategoryId === 'all') return true;

  const subCats = CATEGORY_SUBCATEGORIES[category] || CATEGORY_SUBCATEGORIES.All;
  const def = subCats.find((s) => s.id === subCategoryId);
  if (!def) return true;

  if (def.keywords.length === 0) return true;

  const text = `${produce.crop_name || ''} ${produce.variety || ''} ${produce.category || ''}`.toLowerCase();
  return def.keywords.some((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Compute the list of subcategories for a given category with matching item counts.
 */
export function getAvailableSubCategories(
  category: string,
  items: { crop_name: string; variety?: string | null; category?: string | null }[]
): { id: string; label: string; count: number }[] {
  const subCats = CATEGORY_SUBCATEGORIES[category] || CATEGORY_SUBCATEGORIES.All;

  // Filter items to current category first if category !== 'All'
  const categoryScopedItems =
    category === 'All'
      ? items
      : items.filter((item) => {
          const itemCat = normalizeCategory(item.category, item.crop_name, item.variety);
          return itemCat === category;
        });

  return subCats.map((sub) => {
    if (sub.id === 'all') {
      return {
        id: sub.id,
        label: sub.label,
        count: categoryScopedItems.length,
      };
    }

    const count = categoryScopedItems.filter((item) =>
      matchesSubCategory(item, category, sub.id)
    ).length;

    return {
      id: sub.id,
      label: sub.label,
      count,
    };
  });
}
