import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Company } from "./types";

const STATUS_OPTIONS = [
  "Contacted",
  "Discarded",
  "Shortlist",
  "Meeting Scheduled",
  "NDA Sent",
  "Pending",
];

const editFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  city: z.string().min(1, "La ciudad es requerida"),
  employees: z.string(),
  description: z.string(),
  revenue: z.string(),
  ebitda: z.string(),
  score: z.number().min(0).max(10),
  status: z.string(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface EditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSave: (updatedCompany: Company) => void;
}

export function EditPanel({ open, onOpenChange, company, onSave }: EditPanelProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      city: "",
      employees: "",
      description: "",
      revenue: "",
      ebitda: "",
      score: 0,
      status: "Pending",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        city: company.city,
        employees: company.employees,
        description: company.description,
        revenue: company.revenue,
        ebitda: company.ebitda,
        score: company.score,
        status: company.status,
      });
    }
  }, [company, form]);

  const handleSubmit = (values: EditFormValues) => {
    if (!company) return;

    const updatedCompany: Company = {
      ...company,
      ...values,
    };

    onSave(updatedCompany);
    onOpenChange(false);
    toast({
      title: "Cambios guardados",
      description: `Los datos de ${values.name} han sido actualizados correctamente.`,
    });
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {company?.name || "Editar empresa"}
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Edita la información detallada de la organización
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form id="edit-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Company
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-200 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-200 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Employees
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-200 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        className="border-gray-200 focus:border-primary focus:ring-primary resize-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Revenue
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-200 focus:border-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ebitda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        EBITDA
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-200 focus:border-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      [AI] Relevo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="border-gray-200 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-form"
              className="flex-1"
            >
              Guardar Cambios
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
