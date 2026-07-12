import { z } from 'zod';

/** Exactly 10 digits, e.g. 0241234567. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits');

/**
 * Strong password policy: at least 8 characters and a mix of character types
 * (lowercase, uppercase, and a digit).
 */
export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/\d/, 'Password must include a number');

export interface PasswordChecks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  digit: boolean;
  symbol: boolean;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  score: number;
  strength: PasswordStrength;
  checks: PasswordChecks;
}

/**
 * Classifies a password for real-time (weak / medium / strong) feedback.
 * - weak:    fails the basic policy (length or missing core character types)
 * - medium:  meets the required policy (8+ chars, lower+upper+digit)
 * - strong:  meets the policy AND includes a symbol
 */
export const assessPasswordStrength = (password: string): PasswordStrengthResult => {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const coreMet = checks.length && checks.lowercase && checks.uppercase && checks.digit;
  const score = Object.values(checks).filter(Boolean).length;

  let strength: PasswordStrength;
  if (coreMet && checks.symbol) {
    strength = 'strong';
  } else if (coreMet) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return { score, strength, checks };
};
