import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  categoriesQueryOptions,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/categories";
import { getSession } from "@/lib/users";

export const Route = createFileRoute("/categorias")({
  head: () => ({ meta: [{ title: "Categorias — VPB" }] }),
  component: CategoriesPage,
  errorComponent: ({ error }) => (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
});
type FormInput = z.infer<typeof formSchema>;

function CategoriesPage() {
  const { data: all, isLoading, error } = useQuery({ ...categoriesQueryOptions, retry: false });
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const session = mounted ? getSession() : null;

  const visible = (all ?? []).filter((c) =>
    session?.id
      ? c.user_id === session.id || (c.user_id == null && c.is_default)
      : c.user_id == null && c.is_default,
  );

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const createForm = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (editing) {
      editForm.reset({ name: editing.name, description: editing.description ?? "" });
    }
  }, [editing, editForm]);

  const createM = useMutation({
    mutationFn: (data: FormInput) => {
      if (!session?.id) throw new Error("Faça login");
      return createCategory({
        user_id: session.id,
        name: data.name,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      toast.success("Categoria criada");
      qc.invalidateQueries({ queryKey: ["categories"] });
      createForm.reset({ name: "", description: "" });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: (data: FormInput) => {
      if (!editing) throw new Error("Sem categoria");
      return updateCategory(editing.id, {
        name: data.name,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      toast.success("Categoria atualizada");
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Categoria excluída");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Gerenciar Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Categorias padrão não podem ser editadas ou excluídas.
          </p>
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit((d) => createM.mutate(d))}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createM.isPending} className="w-full">
                  {createM.isPending ? "Criando..." : "Criar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {isLoading && (
          <div className="rounded-xl border border-white/10 bg-card p-6 text-sm text-muted-foreground">
            Carregando...
          </div>
        )}
        {error && !isLoading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            Não foi possível carregar as categorias: {(error as Error).message}
          </div>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card p-6 text-sm text-muted-foreground">
            Nenhuma categoria.
          </div>
        )}
        {visible.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-card p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.name}</span>
                {c.is_default && (
                  <Badge variant="secondary" className="uppercase">
                    Padrão
                  </Badge>
                )}
              </div>
              {c.description && (
                <div className="mt-1 text-sm text-muted-foreground">{c.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={c.is_default}
                onClick={() => setEditing(c)}
                className="gap-1"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={c.is_default} className="gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => delM.mutate(c.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => updateM.mutate(d))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateM.isPending} className="w-full">
                {updateM.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
