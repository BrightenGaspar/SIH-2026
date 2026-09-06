import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Phone number or email is required"),
  password: z.string().min(4, "Password or OTP must be at least 4 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  email: z.string().email("Valid email address is required").or(z.literal("")),
  farmName: z.string().min(2, "Farm or FPO name is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  village: z.string().min(2, "Village or locality is required"),
  farmSize: z.string().min(1, "Farm size is required"),
  primaryCrops: z.string().min(2, "Please specify primary crops"),
  farmerType: z.enum(["Individual Farmer", "FPO", "Farmer Group"]),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const produceSchema = z.object({
  crop: z.string().min(2, "Produce/crop name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  grade: z.enum(["A", "A-", "B", "B-", "C", "C-", "D"]),
  harvestDate: z.string().min(4, "Harvest date is required"),
  expectedPrice: z.number().positive("Expected price must be greater than 0"),
  location: z.string().min(2, "Pickup location is required"),
  notes: z.string().optional(),
});

export type ProduceFormData = z.infer<typeof produceSchema>;
