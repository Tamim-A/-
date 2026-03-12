import { z } from "zod";

export const beneficiarySchema = z.object({
  national_id: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "رقم الهوية مطلوب")
        .regex(/^\d{10}$/, "رقم الهوية يجب أن يكون 10 أرقام")
    ),
  full_name: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "الاسم الكامل مطلوب")
        .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل")
    ),
  phone: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "رقم الجوال مطلوب")
        .regex(/^05\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام")
    ),
  city: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "المدينة مطلوبة")),
  support_amount: z
    .number({ error: "مبلغ الدعم يجب أن يكون رقماً" })
    .positive("مبلغ الدعم يجب أن يكون أكبر من صفر"),
  notes: z
    .string()
    .transform((v) => v.trim())
    .optional()
    .nullable(),
});

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

export const beneficiaryUpdateSchema = beneficiarySchema;
export type BeneficiaryUpdateData = z.infer<typeof beneficiaryUpdateSchema>;
