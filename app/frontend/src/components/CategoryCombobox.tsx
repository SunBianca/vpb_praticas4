import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createCategory, type Category } from "@/lib/categories";

export function CategoryCombobox({
  categories,
  value,
  onChange,
  currentUserId,
  disabled,
}: {
  categories: Category[];
  value: number;
  onChange: (id: number) => void;
  currentUserId: number | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const selected = categories.find((c) => c.id === value);
  const term = search.trim();
  const exists = term && categories.some((c) => c.name.toLowerCase() === term.toLowerCase());

  const createM = useMutation({
    mutationFn: async (name: string) => {
      if (!currentUserId) throw new Error("Faça login para criar categoria");
      return createCategory({ user_id: currentUserId, name });
    },
    onSuccess: (cat) => {
      toast.success(`Categoria "${cat.name}" criada`);
      qc.invalidateQueries({ queryKey: ["categories"] });
      onChange(cat.id);
      setOpen(false);
      setSearch("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.name : "Selecionar categoria..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar categoria..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {term ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded"
                  disabled={createM.isPending || !currentUserId}
                  onClick={() => createM.mutate(term)}
                >
                  {createM.isPending ? "Criando..." : `+ Criar "${term}"`}
                </button>
              ) : (
                <span className="block px-2 py-1.5 text-sm text-muted-foreground">
                  Nenhuma categoria encontrada.
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {categories.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                  />
                  {c.name}
                </CommandItem>
              ))}
              {term && !exists && (
                <CommandItem
                  value={`__create_${term}`}
                  onSelect={() => createM.mutate(term)}
                  disabled={createM.isPending || !currentUserId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createM.isPending ? "Criando..." : `Criar "${term}"`}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function accountLabel(a: { bank: string; branch: string; account_number: string }) {
  return `${a.bank} — ${a.branch}/${a.account_number}`;
}
