import { randomInt } from 'crypto';

export const generateOTP = (): string => {
  return randomInt(0, 999999).toString().padStart(6, '0');
};
