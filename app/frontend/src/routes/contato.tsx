import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/users";

export const Route = createFileRoute("/contato")({
  head: () => ({ meta: [{ title: "Contate-nos — VPB" }] }),
  component: ContatoPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido"),
  message: z.string().trim().min(1, "Descreva seu problema").max(5000),
});

type ContactInput = z.infer<typeof schema>;

function ContatoPage() {
  const form = useForm<ContactInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  useEffect(() => {
    const s = getSession();
    if (s) {
      form.reset({
        name: s.name ?? "",
        email: s.email ?? "",
        message: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mut = useMutation({
    mutationFn: (data: ContactInput) =>
      apiFetch("/contact", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Mensagem enviada!");
      form.setValue("message", "");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl sm:text-6xl">Contate-nos</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="mt-8 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display text-xl">Seu nome:</FormLabel>
                <FormControl>
                  <Input {...field} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display text-xl">Seu email:</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="h-14 rounded-2xl bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display text-xl">Descreva seu problema</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={6}
                    className="rounded-2xl bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={mut.isPending}
            className="w-full h-14 rounded-lg bg-primary font-display text-2xl uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            {mut.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </Form>

      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 border-t border-dashed border-primary/60" />
        <span className="font-display text-lg text-foreground">Ou</span>
        <div className="flex-1 border-t border-dashed border-primary/60" />
      </div>

      <div className="text-center">
        <p className="font-display text-2xl">Envie um e-mail para:</p>
        <div className="mt-2 space-y-1 font-display text-lg">
          <a href="mailto:biancaaparecidapaz26@gmail.com" className="block hover:underline">
            biancaaparecidapaz26@gmail.com
          </a>
          <a href="mailto:victor.lermen@unoesc.edu.br" className="block hover:underline">
            victor.lermen@unoesc.edu.br
          </a>
        </div>
      </div>
    </div>
  );
}
