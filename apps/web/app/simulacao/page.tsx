import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreditForm from "@/components/features/form/CreditForm";

export default function SimulacaoPage() {
  return (
    <Container>
      <main className="flex flex-col gap-8 pb-8">
        
        <Button variant="ghost" asChild className="w-fit -ml-4">
          <Link href="/">
            <ArrowLeft
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Voltar
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Iniciando sua análise
          </h1>

          <p className="text-muted-foreground text-lg">
            Preencha os dados abaixo para descobrirmos
            seu potencial de crédito.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <CreditForm />
        </div>

      </main>
    </Container>
  );
}