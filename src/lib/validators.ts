import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Phone number or email is required"),
  password: z.string().min(4, "Password or OTP must be at least 4 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const supportedLanguagesEnum = z.enum(["en", "te", "ta", "ml", "hi", "bn", "mr"]);

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  email: z.string().email("Valid email address is required").or(z.literal("")),
  farmName: z.string().min(2, "Farm or FPO name is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  village: z.string().min(2, "Place / Village is required"),
  preferredLanguage: supportedLanguagesEnum,
  farmSize: z.string().min(1, "Farm size is required"),
  primaryCrops: z.string().min(2, "Please specify primary crops"),
  farmerType: z.enum(["Individual Farmer", "FPO", "Farmer Group"]),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const consumerRegisterSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  email: z.string().email("Valid email address is required").or(z.literal("")),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  place: z.string().min(2, "Place / Town is required"),
  preferredLanguage: supportedLanguagesEnum,
  buyerType: z.enum(["household", "retailer", "restaurant", "bulk-buyer", "institution"]),
  typicalOrderSizeKg: z.number().min(1, "Order capacity must be greater than 0"),
});

export type ConsumerRegisterFormData = z.infer<typeof consumerRegisterSchema>;

export const logisticsRegisterSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  email: z.string().email("Valid email address is required").or(z.literal("")),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  place: z.string().min(2, "Base Hub / Place is required"),
  preferredLanguage: supportedLanguagesEnum,
  vehicleType: z.enum(["Tata Ace", "Tata 407 Reefer", "Mahindra Bolero Maxi Truck"]),
  vehicleNumber: z.string().min(5, "Vehicle registration number is required"),
  vehicleCapacityKg: z.number().min(100, "Capacity must be at least 100 kg"),
  reeferEnabled: z.boolean(),
});

export type LogisticsRegisterFormData = z.infer<typeof logisticsRegisterSchema>;

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required").or(z.literal("")),
  email: z.string().email("Valid email address is required").or(z.literal("")),
  address: z.string().min(3, "Address is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  place: z.string().min(2, "Place / Village / Town is required"),
  preferredLanguage: supportedLanguagesEnum,
});

export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

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
