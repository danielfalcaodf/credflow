import { Input } from "@/components/ui/input";
interface StepFinancialProps {
  register: (name: string, options?: { valueAsNumber?: boolean }) => Record<string, unknown>;
  watch: (name: string) => string;
}
export default function StepFinancial({ register }: StepFinancialProps) {
  return (
    <div className="space-y-4">
      <Input
        type="number"
        placeholder="Renda mensal"
        {...register("renda", {
          valueAsNumber: true,
        })}
      />

      <Input
        type="number"
        placeholder="Dívidas atuais"
        {...register("dividas", {
          valueAsNumber: true,
        })}
      />
    </div>
  );
}