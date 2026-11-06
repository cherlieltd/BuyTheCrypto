import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const checkoutSchema = z.object({
  fiatCurrency: z.string().trim().min(3).max(8).toUpperCase(),
  cryptoCurrency: z.string().trim().min(2).max(15).toUpperCase(),
  network: z.string().trim().min(2).max(40),
  fiatAmount: z.number().positive("Enter an amount greater than zero.").max(1_000_000),
  walletAddress: z.string().trim().min(8).max(256),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
});

export const supportSchema = z.object({
  email: z.string().trim().email(),
  subject: z.string().trim().min(4).max(140),
  message: z.string().trim().min(10).max(5000),
});

export const clientOrderUpdateSchema = z
  .object({
    orderId: z.string().uuid(),
    providerOrderId: z.string().min(8).max(80).optional(),
  })
  .strict();

export const roleSchema = z.object({
  role: z.enum(["customer", "admin"]),
  enabled: z.boolean(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(8).max(200),
  answer: z.string().trim().min(8).max(4000),
  published: z.boolean().default(true),
});
