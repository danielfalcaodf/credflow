import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StepProfessionalProps {
  setValue: (name: "tipoRenda", value: string) => void;
  watch: (name: "tipoRenda") => string;
}

export default function StepProfessional({
}: StepProfessionalProps) {

  return (
    <div className="grid grid-cols-1 gap-3">
       <RadioGroup className="w-fit">
      <div className="flex items-center gap-3">
        <RadioGroupItem value="clt" id="r1" />
        <Label htmlFor="r1">CLT</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="autonomo" id="r2" />
        <Label htmlFor="r2">Autônomo</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="pj" id="r3" />
        <Label htmlFor="r3">PJ</Label>
      </div>
    </RadioGroup>
    </div>
   
  );
}