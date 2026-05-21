import { Input } from "@/components/ui/input";
interface StepPersonalProps {
  register: (name: string, options?: { valueAsNumber?: boolean }) => Record<string, unknown>;
  watch: (name: string) => string;
}

export default function StepPersonal({ register }: StepPersonalProps) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Seu nome"
        {...register("nome")}
      />

      <Input
        type="number"
        placeholder="Sua idade"
        {...register("idade", {
          valueAsNumber: true,
        })}
      />
    </div>
  );
}