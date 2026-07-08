import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

const dayEnum = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const timeRegex = /^\d{2}:\d{2}$/;

export const personalSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const businessSchema = z.object({
  businessName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  pricingFrom: z.coerce.number().nonnegative().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  location: z.string().trim().max(120).optional(),
  categories: z.array(z.string().trim().min(1)).max(10).optional(),
  skills: z.array(z.string().trim().min(1)).max(20).optional(),
  profileImageUrl: z.string().url().optional(),
});

export const skillsSchema = z.object({
  skills: z.array(z.string().trim().min(1)).min(1).max(20),
});

export const servicesSchema = z.object({
  services: z
    .array(
      z.object({
        title: z.string().trim().min(3).max(100),
        description: z.string().trim().min(10).max(1000),
        price: z.coerce.number().positive(),
        durationMinutes: z.coerce.number().int().positive().max(24 * 60),
        category: z.string().trim().min(1),
      })
    )
    .min(1),
});

export const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        day: dayEnum,
        startTime: z.string().regex(timeRegex, 'Expected HH:mm format'),
        endTime: z.string().regex(timeRegex, 'Expected HH:mm format'),
      })
    )
    .min(1),
});

export const studentVerificationSchema = z.object({
  institution: z.string().trim().min(2).max(160),
  studentIdNumber: z.string().trim().min(2).max(60),
});

export const submitSchema = z.object({});

export const portfolioMetadataSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid('Invalid portfolio item id'),
        title: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().max(500).optional(),
      })
    )
    .min(1),
});

export type PersonalInput = z.infer<typeof personalSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type SkillsInput = z.infer<typeof skillsSchema>;
export type ServicesInput = z.infer<typeof servicesSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type StudentVerificationInput = z.infer<typeof studentVerificationSchema>;
export type PortfolioMetadataInput = z.infer<typeof portfolioMetadataSchema>;
