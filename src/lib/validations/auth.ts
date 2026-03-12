import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  full_name: z
    .string()
    .min(1, "الاسم الكامل مطلوب"),
  role: z.enum(["admin", "staff", "viewer"], {
    error: "الدور غير صالح",
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
