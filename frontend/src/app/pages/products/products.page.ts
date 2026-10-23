// Controla la consulta y gestión de productos.

import { Component, ChangeDetectorRef } from '@angular/core';
import { Products } from '../../services/products';
import { Categories } from '../../services/categories';
import { ProductSync } from '../../services/product-sync';

@Component({
  selector: 'app-products',
  templateUrl: 'products.page.html',
  styleUrls: ['products.page.scss'],
  standalone: false,
})
export class ProductsPage {

  // Datos y estado
  products: any[] = [];
  categories: any[] = [];
  form: any = {
    name: '',
    description: '',
    category_id: null,
    type: 'prepared',
    price: null,
  };
  editingId: number | null = null;
  message = '';
  modalOpen = false;
  saving = false;
  loading = false;
  offline = !navigator.onLine;
  pendingCount = 0;
  syncMessage = '';

  private onOnline = () => { void this.syncNow(); };
  private onOffline = () => { this.offline = true; this.cdr.detectChanges(); };

  // Abrir formulario de registro
  openCreate() {
    this.cancel();
    this.message = '';
    this.modalOpen = true;
  }

  // Dependencias e inicio
  constructor(
    private cdr: ChangeDetectorRef,
    private productsService: Products,
    private categoriesService: Categories,
    private productSync: ProductSync
  ) {}

  // Escuchar la recuperación de conexión
  ngOnInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  // Enviar pendientes y volver a consultar MySQL
  async syncNow() {
    this.offline = !navigator.onLine;
    if (this.offline) return;
    const result = await this.productSync.synchronize();
    this.pendingCount = result.pending;
    this.syncMessage = result.pending
      ? `${result.pending} cambio(s) pendientes de sincronizar`
      : result.sent ? `${result.sent} cambio(s) sincronizados` : '';
    await this.load();
  }

  // Entrada a la pantalla
  async ionViewWillEnter() {
    await this.load();
  }

  // Consultar la API o mostrar la copia local
  async load() {
    this.loading = true;
    this.message = '';
    this.offline = !navigator.onLine;

    try {
      if (this.offline) {
        this.products = this.productSync.applyPending();
        this.categories = this.productSync.getCategories();
        this.message = this.productSync.hasProducts()
          ? 'Sin conexión: mostrando productos guardados localmente'
          : 'Sin conexión y sin productos guardados todavía';
        return;
      }

      // Primero enviar los cambios pendientes
      await this.productSync.synchronize();
      const results = await Promise.allSettled([
        this.productsService.getAll(),
        this.categoriesService.getAll(),
      ]);
      const [p, c] = results;

      if (p.status === 'fulfilled') {
        const list = p.value.products || p.value.data || [];
        this.productSync.saveProducts(list);
        this.products = this.productSync.applyPending();
      } else if (this.productSync.isNetworkError(p.reason)) {
        this.offline = true;
        this.products = this.productSync.applyPending();
        this.message = this.productSync.hasProducts()
          ? 'Servidor no disponible: mostrando copia local'
          : 'No se pudo conectar y no hay productos guardados';
      } else {
        throw p.reason;
      }

      if (c.status === 'fulfilled') {
        this.categories = c.value.categories || c.value.data || [];
        this.productSync.saveCategories(this.categories);
      } else {
        this.categories = this.productSync.getCategories();
        if (!this.message) this.message = 'No se pudieron actualizar las categorías';
      }
    } catch (e: any) {
      this.message = e.response?.data?.message || 'No se pudieron cargar los productos';
    } finally {
      this.pendingCount = this.productSync.pendingCount;
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Preparar edición
  edit(p: any) {
    this.modalOpen = true;
    this.editingId = Number(p.id);
    this.form = {
      name: p.name,
      description: p.description,
      category_id: Number(p.category_id ?? p.category?.id),
      type: p.type,
      price: Number(p.price),
      is_available: Boolean(Number(p.is_available ?? 1)),
    };
  }

  // Cancelar
  cancel() {
    this.modalOpen = false;
    this.editingId = null;
    this.form = {
      name: '',
      description: '',
      category_id: null,
      type: 'prepared',
      price: null,
    };
  }

  // Guardar datos
  async save() {
    if (this.saving) return;

    if (
      !this.form.name.trim() ||
      !this.form.category_id ||
      this.form.price === null ||
      this.form.price === '' ||
      !Number.isFinite(Number(this.form.price)) ||
      Number(this.form.price) < 0
    ) {
      this.message = 'Completa los datos requeridos con valores válidos';
      return;
    }

    this.saving = true;

    // Solo las ediciones existentes pueden guardarse sin conexión.
    if (this.offline || !navigator.onLine) {
      if (!this.editingId) {
        this.message = 'Para crear productos necesitas conexión al servidor';
      } else {
        this.productSync.queueUpdate(this.editingId, { ...this.form });
        this.products = this.productSync.applyPending();
        this.pendingCount = this.productSync.pendingCount;
        this.cancel();
        this.message = 'Edición guardada localmente; pendiente de sincronización';
      }
      this.saving = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      if (this.editingId) {
        await this.productsService.update(this.editingId, this.form);
      } else {
        await this.productsService.create(
          this.form.name,
          this.form.description,
          Number(this.form.category_id),
          this.form.type,
          Number(this.form.price)
        );
      }

      this.message = 'Producto guardado correctamente';
      this.cancel();
      await this.load();
    } catch (e: any) {
      if (this.editingId && this.productSync.isNetworkError(e)) {
        this.productSync.queueUpdate(this.editingId, { ...this.form });
        this.products = this.productSync.applyPending();
        this.pendingCount = this.productSync.pendingCount;
        this.offline = true;
        this.cancel();
        this.message = 'Sin conexión: edición pendiente de sincronizar';
      } else {
        this.message = e.response?.data?.message || 'No se pudo guardar el producto';
      }
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  // Desactivar registro
  async deactivate(id: number) {
    try {
      await this.productsService.deactivate(Number(id));
      await this.load();
    } catch (e: any) {
      this.message = e.response?.data?.message || 'No se pudo desactivar';
    }
  }

  // Activar registro
  async activate(id: number) {
    try {
      await this.productsService.activate(Number(id));
      await this.load();
    } catch (e: any) {
      this.message = e.response?.data?.message || 'No se pudo activar';
    }
  }
}
