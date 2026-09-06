import { Produce, ProduceGrade, QualityGradeResult } from "@/types/farmer";
import { initialProduceList } from "./mockData/mockProduce";

const STORAGE_KEY = "agriflow_farmer_produce";

export const farmerService = {
  getProduceList(): Produce[] {
    if (typeof window === "undefined") return initialProduceList;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProduceList));
      return initialProduceList;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialProduceList;
    }
  },

  addProduce(item: Omit<Produce, "id" | "createdAt" | "status">): Produce {
    const current = this.getProduceList();
    const newProduce: Produce = {
      ...item,
      id: "prod-" + Math.random().toString(36).substring(2, 9),
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    const updated = [newProduce, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return newProduce;
  },

  updateProduceStatus(id: string, status: Produce["status"]): void {
    const current = this.getProduceList();
    const updated = current.map(p => p.id === id ? { ...p, status } : p);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  simulateAIGrading(cropName: string, fileName?: string): Promise<QualityGradeResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          grade: "A",
          defectLevel: "Low",
          visualQualityScore: 94,
          colorScore: 96,
          sizeConsistencyScore: 91,
          surfaceDefectsScore: 95,
          damageScore: 98,
          freshnessScore: 93,
          estimatedFairRealizationMin: 41.00,
          estimatedFairRealizationMax: 44.00,
          explanation: "Analyzed fruit pigmentation, symmetry, skin integrity, and ripeness index. High grade suitability for institutional direct procurement.",
          disclaimer: "AI-assisted estimate. Final grade may require physical verification at collection hub.",
        });
      }, 1200);
    });
  }
};
