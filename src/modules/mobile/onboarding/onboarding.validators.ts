import { z } from 'zod';
import { ApplicationStatus, DayOfWeek } from '@prisma/client';

export const personalSchema = z.object({
  phone: z.string().trim().min(7).max(20).optional(),
  avatarUrl: z.string().trim().url().optional().nullable(),
});

export const businessSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  bio: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  pricingFrom: z.coerce.number().nonnegative('Pricing must be a positive number').nullable(),
});

export const skillsSchema = z.object({
  names: z.array(z.string().trim().min(1)).min(1, 'At least one skill is required').max(20),
});

export const servicesSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().trim().min(3, 'Service title must be at least 3 characters').max(100),
      description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
      price: z.coerce.number().positive('Price must be positive'),
      durationMinutes: z.coerce.number().int().positive('Duration must be positive').max(24 * 60),
      categoryName: z.string().trim().min(1),
      isActive: z.boolean().default(true),
    })
  ).min(1, 'At least one service is required'),
});

export const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      day: z.nativeEnum(DayOfWeek),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
    })
  ).min(1, 'At least one availability slot is required'),
});

export const portfolioSchema = z.object({
  items: z.array(
    z.object({
      imageUrl: z.string().url('imageUrl must be a valid URL'),
      caption: z.string().trim().max(200).optional().nullable(),
    })
  ).min(1, 'At least one portfolio item is required'),
});

export const verificationSchema = z.object({
  institution: z.string().trim().min(2, 'Institution name is required').max(200),
  studentIdNumber: z.string().trim().min(1, 'Student ID is required'),
  verificationImageUrl: z.string().url('verificationImageUrl must be a valid URL'),
});

export const submitSchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type PersonalInfoInput = z.infer<typeof personalSchema>;
export type BusinessInfoInput = z.infer<typeof businessSchema>;
export type SkillsInput = z.infer<typeof skillsSchema>;
export type ServicesInput = z.infer<typeof servicesSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
export type SubmitInput = z.infer<typeof submitSchema>;
