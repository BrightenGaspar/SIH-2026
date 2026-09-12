import { Produce, ProduceGrade, ProduceStatus } from "@/types/farmer";
import { supabase } from "@/lib/supabase";
import { initialProduceList } from "./mockData/mockProduce";

export const farmerService = {
  /**
   * Fetch all active produce listings from Supabase public.produce table
   */
  async getProduceList(): Promise<Produce[]> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .select(`
          id,
          crop_name,
          variety,
          category,
          quantity,
          unit,
          asking_price,
          harvest_date,
          quality_grade,
          location,
          status,
          created_at,
          profiles:farmer_id (
            full_name,
            fpo_name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase query error in getProduceList:', error.message);
        return initialProduceList;
      }

      if (!data || data.length === 0) {
        return initialProduceList;
      }

      return data.map((row: any) => ({
        id: row.id,
        crop: row.crop_name || 'Produce',
        quantity: Number(row.quantity) || 0,
        unit: row.unit || 'kg',
        grade: (row.quality_grade as ProduceGrade) || 'A',
        harvestDate: row.harvest_date || new Date().toISOString().split('T')[0],
        expectedPrice: Number(row.asking_price) || 0,
        location: row.location || (row.profiles as any)?.location || 'Farm Location',
        status: (row.status as ProduceStatus) || 'Active',
        notes: row.variety ? `${row.variety} • ${row.category || ''}` : undefined,
        createdAt: row.created_at || new Date().toISOString(),
      }));
    } catch (err: any) {
      console.warn('Error fetching produce from Supabase, returning fallback:', err?.message);
      return initialProduceList;
    }
  },

  /**
   * Insert a new produce lot directly into Supabase public.produce
   */
  async addProduce(item: Omit<Produce, "id" | "createdAt" | "status">): Promise<Produce> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .insert({
          crop_name: item.crop,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          quality_grade: item.grade || 'A',
          harvest_date: item.harvestDate,
          asking_price: item.expectedPrice,
          location: item.location,
          status: 'Active',
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert error in addProduce:', error.message);
        return {
          id: `prod-${Math.floor(100 + Math.random() * 900)}`,
          createdAt: new Date().toISOString(),
          status: 'Active',
          ...item,
        };
      }

      return {
        id: data.id,
        crop: data.crop_name,
        quantity: Number(data.quantity),
        unit: data.unit || 'kg',
        grade: (data.quality_grade as ProduceGrade) || item.grade,
        harvestDate: data.harvest_date,
        expectedPrice: Number(data.asking_price),
        location: data.location,
        status: (data.status as ProduceStatus) || 'Active',
        createdAt: data.created_at || new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('Fallback adding produce:', err?.message);
      return {
        id: `prod-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        status: 'Active',
        ...item,
      };
    }
  },

  /**
   * Update the status of an existing produce lot in Supabase
   */
  async updateProduceStatus(id: string, status: Produce["status"]): Promise<Produce> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase update error:', error.message);
        const found = initialProduceList.find(p => p.id === id);
        if (found) {
          found.status = status;
          return found;
        }
        return {
          id,
          crop: "Tomato (Hybrid)",
          quantity: 1000,
          unit: "kg",
          grade: "A",
          harvestDate: new Date().toISOString().split('T')[0],
          expectedPrice: 40,
          location: "Telangana Cluster",
          status,
          createdAt: new Date().toISOString(),
        };
      }

      return {
        id: data.id,
        crop: data.crop_name,
        quantity: Number(data.quantity),
        unit: data.unit,
        grade: data.quality_grade as ProduceGrade,
        harvestDate: data.harvest_date,
        expectedPrice: Number(data.asking_price),
        location: data.location,
        status: data.status as ProduceStatus,
        createdAt: data.created_at,
      };
    } catch {
      const found = initialProduceList.find(p => p.id === id);
      if (found) {
        found.status = status;
        return found;
      }
      return {
        id,
        crop: "Tomato (Hybrid)",
        quantity: 1000,
        unit: "kg",
        grade: "A",
        harvestDate: new Date().toISOString().split('T')[0],
        expectedPrice: 40,
        location: "Telangana Cluster",
        status,
        createdAt: new Date().toISOString(),
      };
    }
  }
};