import { z } from "zod";

// Skema validasi reusable untuk form Login, Register, dan Forgot Password.
// Dipakai bersama React Hook Form (zodResolver) di masing-masing form.

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    noHp: z.string().min(9, "Nomor HP tidak valid").max(15, "Nomor HP tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
