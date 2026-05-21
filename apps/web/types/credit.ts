import { z } from "zod";

export const creditSchema = z.object({
  name: z
    .string()
    .min(2, "Nome obrigatório"),

  age: z
    .number()
    .min(18, "Você precisa ser maior de idade"),

  income: z
    .number()
    .min(1, "Informe sua renda"),

  debts: z
    .number()
    .min(0),

  incomeType: z.enum([
    "CLT",
    "AUTONOMO",
    "PJ",
  ]),
});

export type CreditFormData = z.infer<
  typeof creditSchema
>;