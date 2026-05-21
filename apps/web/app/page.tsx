import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <Container>
      <main className="flex flex-col justify-between w-full pb-8">
        
        <Image 
          src="/logo.png" 
          alt="Logo da credflow" 
          width={150} 
          height={50}
          priority 
          className="mb-8"
          loading="eager"
        />
        
        <Image 
          src="/ilustra.jpg" 
          alt="Ilustração de uma pessoa analisando gráficos financeiros" 
          width={800} 
          height={400}
          className="w-full h-auto rounded-lg"
          loading="eager"
        />

        <div className="flex flex-col mb-6">
          <h1 className="scroll-m-20 text-left text-4xl font-extrabold tracking-tight text-balance mb-2">
            Entenda seu potencial de crédito com clareza.
          </h1> 
          <p className="text-muted-foreground text-lg">
            Simule sua análise de crédito em minutos e descubra oportunidades para realizar seus planos.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center w-full gap-4">
          
          <Button variant="default" className="w-full" size="lg" asChild>
            <Link href="/simulacao">
              Começar minha análise
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button variant="outline" className="w-full" size="lg" asChild>
            <Link href="/historico">
              <FileText aria-hidden="true" className="mr-2 h-5 w-5" />
              Ver análises anteriores
            </Link>
          </Button>

          <div 
            className="flex w-full items-center justify-center gap-2 mt-2 text-sm text-muted-foreground"
            role="status"
          >
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-green-600" />
            <span>Não compartilhamos seus dados com terceiros.</span>
          </div>

        </div>
      </main>
    </Container>
  );
}