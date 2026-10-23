// Guarda productos locales y sincroniza ediciones pendientes con la API.

import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config';

export interface PendingProductChange {
  id: number;
  changes: Record<string, any>;
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProductSync {

  private syncing = false;
  private readonly prefix = 'la_obra_sync_v1';

  constructor(private apiConfig: ApiConfigService) {}

  // Separar los datos por usuario y servidor
  private key(section: string): string {
    let userId = 'unknown';
    try { userId = String(JSON.parse(localStorage.getItem('user') || '{}').id || 'unknown'); } catch {}
    return `${this.prefix}:${this.apiConfig.getApiUrl()}:${userId}:${section}`;
  }

  private read<T>(section: string, fallback: T): T {
    try {
      const value = localStorage.getItem(this.key(section));
      return value ? JSON.parse(value) as T : fallback;
    } catch { return fallback; }
  }

  private write(section: string, value: unknown): void {
    localStorage.setItem(this.key(section), JSON.stringify(value));
  }

  // Guardar la última consulta remota exitosa
  saveProducts(products: any[]): void { this.write('products', products); }
  getProducts(): any[] { return this.read<any[]>('products', []); }
  hasProducts(): boolean { return this.read<any[] | null>('products', null) !== null; }
  saveCategories(categories: any[]): void { this.write('categories', categories); }
  getCategories(): any[] { return this.read<any[]>('categories', []); }

  // Consultar ediciones pendientes
  getPending(): PendingProductChange[] { return this.read<PendingProductChange[]>('pending', []); }
  get pendingCount(): number { return this.getPending().length; }

  // Guardar una edición para enviarla después
  queueUpdate(id: number, changes: Record<string, any>): void {
    const pending = this.getPending();
    const existing = pending.find(item => item.id === id);
    if (existing) {
      existing.changes = { ...existing.changes, ...changes };
      existing.savedAt = new Date().toISOString();
    } else {
      pending.push({ id, changes: { ...changes }, savedAt: new Date().toISOString() });
    }
    this.write('pending', pending);
    this.applyPending();
  }

  // Mostrar los cambios pendientes sobre la copia local
  applyPending(): any[] {
    const products = this.getProducts();
    const pending = this.getPending();
    return products.map(product => {
      const item = pending.find(change => change.id === Number(product.id));
      return item ? { ...product, ...item.changes, pending_sync: true } : product;
    });
  }

  // Detectar fallas de conectividad (no confundir con errores 401 o 422)
  isNetworkError(error: any): boolean {
    return !error?.response && (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error' || !navigator.onLine);
  }

  // Enviar cambios en orden; conservar pendientes cuando falla la API
  async synchronize(): Promise<{ sent: number; pending: number }> {
    if (this.syncing || !navigator.onLine) return { sent: 0, pending: this.pendingCount };
    this.syncing = true;
    let sent = 0;
    try {
      for (const item of [...this.getPending()]) {
        const token = localStorage.getItem('token');
        if (!token) break;
        try {
          await axios.patch(`${this.apiConfig.getApiUrl()}/products/update.php`,
            { id: item.id, ...item.changes },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
          // Quitar solamente la versión enviada; no borrar ediciones más recientes.
          const remaining = this.getPending().filter(current =>
            !(current.id === item.id && current.savedAt === item.savedAt));
          this.write('pending', remaining);
          sent++;
        } catch {
          break; // Evita reintentos continuos ante permisos, validaciones o falta de red.
        }
      }
    } finally { this.syncing = false; }
    return { sent, pending: this.pendingCount };
  }
}
