// src/app/analise/page.tsx
import CreditForm from "@/components/features/form/CreditForm";
import Container from "@/components/layout/Container";

export default function AnalisePage() {
  return (
    <main className="min-h-screen bg-background">
      <Container>
        <h1 className="text-2xl font-semibold mt-6">
          Simular análise de crédito
        </h1>

        <CreditForm />
      </Container>
    </main>
  );
}