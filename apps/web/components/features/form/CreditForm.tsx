"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";


import { calcularScore } from "@/services/creditScore";

import ProgressBar from "./ProgressBar";
import StepPersonal from "./StepPersonal";
import StepFinancial from "./StepFinancial";
import StepProfessional from "./StepProfessional";
import ResultCard from "./result/ResultCard";
import { CreditFormData, creditSchema } from "@/types/credit";
import Link from "next/link";

export default function CreditForm() {
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<{
    score: number;
    income: number;
    debts: number;
  } | null>(null);

  const form = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      name: "",
      age: 18,
      income: 0,
      debts: 0,
      incomeType: undefined,
    },
  });

  async function onSubmit(data: CreditFormData) {
    setLoading(true);

    setTimeout(() => {
      const { income, debts, incomeType } = data;
      const score = calcularScore({
        renda: income,
        dividas: debts,
        tipoRenda: incomeType,
      });

      setResults({
        score,
        income: data.income,
        debts: data.debts,
      });

      setLoading(false);
    }, 1800);
  }

  function nextStep() {
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }

  if (results) {
    return (
      <ResultCard
        score={results.score}
        income={results.income}
        debts={results.debts}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />

        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold">
            Analisando seu perfil
          </h2>

          <p className="text-sm text-muted-foreground">
            Estamos calculando seu potencial de crédito...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <ProgressBar step={step} total={3} />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {step === 1 && "Dados pessoais"}
          {step === 2 && "Situação financeira"}
          {step === 3 && "Perfil profissional"}
        </h2>

        <p className="text-sm text-muted-foreground">
          {step === 1 &&
            "Precisamos de algumas informações básicas."}

          {step === 2 &&
            "Agora vamos entender sua situação financeira."}

          {step === 3 &&
            "Por último, conte um pouco sobre sua renda."}
        </p>
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <StepPersonal register={form.register as any} watch={form.watch} />
        )}

        {step === 2 && (
          <StepFinancial register={form.register as any} watch={form.watch} />
        )}

        {step === 3 && (
          <StepProfessional
            setValue={(name, value) => {
              if (name === "tipoRenda") {
                form.setValue("incomeType", value as "CLT" | "AUTONOMO" | "PJ");
              }
            }}
            watch={form.watch}
          />
        )}
      </div>

      <div className="flex gap-3 pt-4">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={prevStep}
          >
            Voltar
          </Button>
        )}

        {step < 3 ? (
          <Button
            type="button"
            className="flex-1 h-12 rounded-xl"
            onClick={nextStep}
          >
            Continuar
          </Button>
        ) : (
          <Button type="submit"
            className="flex-1 h-12 rounded-xl"> 
          <Link href="/dashboard">
            Analisar crédito
            </Link>
          </Button>
        )}
      </div>
    </form>
  );
}