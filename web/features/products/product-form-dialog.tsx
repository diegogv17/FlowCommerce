'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from './types';

interface FormState {
  name: string;
  description: string;
  category: string;
  unit: string;
  price: string;
  maxDiscountPercent: string;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  category: '',
  unit: '',
  price: '',
  maxDiscountPercent: '0',
};

function fromProduct(product: Product): FormState {
  return {
    name: product.name,
    description: product.description ?? '',
    category: product.category ?? '',
    unit: product.unit ?? '',
    price: String(product.price),
    maxDiscountPercent: String(product.maxDiscountPercent),
  };
}

/** Texto vacío → null, para que el PATCH borre el campo. */
const orNull = (value: string) => (value.trim() ? value.trim() : null);

/** ¿Número con 2 decimales como máximo? (el backend valida maxDecimalPlaces: 2) */
const twoDecimals = (value: string) => /^\d+(\.\d{1,2})?$/.test(value.trim());

export function ProductFormDialog({
  open,
  onClose,
  product,
  categories = [],
}: {
  open: boolean;
  onClose: () => void;
  /** Sin producto = crear. */
  product?: Product | null;
  /** Categorías existentes para sugerir (datalist). */
  categories?: string[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : EMPTY);
      setErrors({});
    }
  }, [open, product]);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio';
    if (!twoDecimals(form.price)) next.price = 'Precio inválido (máx. 2 decimales)';
    const discount = Number(form.maxDiscountPercent);
    if (!twoDecimals(form.maxDiscountPercent || '0') || discount < 0 || discount > 100) {
      next.maxDiscountPercent = 'Entre 0 y 100';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    const input = {
      name: form.name.trim(),
      description: orNull(form.description),
      category: orNull(form.category),
      unit: orNull(form.unit),
      price: Number(form.price),
      maxDiscountPercent: Number(form.maxDiscountPercent || 0),
    };
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, input });
        toast.success('Producto actualizado');
      } else {
        await create.mutateAsync(input);
        toast.success('Producto creado');
      }
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      description="El precio es antes de IVA. Cambiarlo no altera las cotizaciones ya creadas."
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Nombre *" error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={set('name')} maxLength={255} autoFocus />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <Textarea value={form.description} onChange={set('description')} maxLength={2000} className="min-h-20" />
        </Field>
        <Field label="Categoría">
          <Input value={form.category} onChange={set('category')} maxLength={100} list="product-categories" />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="Unidad" hint="p. ej. usuario, sesión, hora">
          <Input value={form.unit} onChange={set('unit')} maxLength={50} />
        </Field>
        <Field label="Precio (Q) *" error={errors.price}>
          <Input type="number" inputMode="decimal" min={0} step="0.01" value={form.price} onChange={set('price')} />
        </Field>
        <Field label="Descuento máximo (%)" error={errors.maxDiscountPercent} hint="Tope por línea al cotizar">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            value={form.maxDiscountPercent}
            onChange={set('maxDiscountPercent')}
          />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
