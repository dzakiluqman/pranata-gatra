import { z } from 'zod';

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Masukkan email yang valid.'),
});

export const otpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Kode OTP harus terdiri dari 6 digit.'),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;