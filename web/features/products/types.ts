// Tipos del catálogo, copiados de src/products/presentation/dto.

export interface Product {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  /** Precio unitario antes de IVA. */
  price: number;
  /** Descuento máximo permitido al cotizar (%). */
  maxDiscountPercent: number;
  /** false = no se puede agregar a cotizaciones nuevas. */
  active: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Body de POST /products (un producto nace activo). */
export interface CreateProductInput {
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  price: number;
  maxDiscountPercent?: number;
}

/** Body de PATCH /products/:id (parcial; active=false desactiva). */
export type UpdateProductInput = Partial<CreateProductInput> & { active?: boolean };

export interface ProductFilters {
  active?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}
