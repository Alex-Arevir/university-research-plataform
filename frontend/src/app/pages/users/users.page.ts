// Muestra administradores y empleados; permite cambiar únicamente el estado de empleados.

import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Users } from '../../services/users';

@Component({
  selector: 'app-users',
  templateUrl: 'users.page.html',
  styleUrls: ['users.page.scss'],
  standalone: false,
})
export class UsersPage {

  // Datos y estado
  records: any[] = [];
  loading = false;
  saving = false;
  message = '';
  confirmationOpen = false;
  selected: any = null;
  nextStatus: 'active' | 'inactive' = 'active';

  constructor(
    private api: Users,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get administrators(): any[] {
    return this.records.filter((u) => u.role === 'admin');
  }

  get employees(): any[] {
    return this.records.filter((u) => u.role === 'employee');
  }

  // Comprobar acceso y cargar usuarios
  async ionViewWillEnter() {
    if (this.auth.getStoredUser()?.role !== 'admin') {
      await this.router.navigate(['/home']);
      return;
    }

    await this.load();
  }

  async load() {
    this.loading = true;
    this.message = '';

    try {
      const response = await this.api.list();
      this.records = response.users || [];
    } catch (error: any) {
      this.message =
        error.response?.data?.message || 'No se pudieron consultar los usuarios.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Mostrar estado con palabras claras
  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      active: 'Activo',
      inactive: 'Inactivo',
      rejected: 'Rechazado',
    };

    return labels[status] || status;
  }

  // Confirmar cambios antes de enviarlos
  confirm(user: any, status: 'active' | 'inactive') {
    this.selected = user;
    this.nextStatus = status;
    this.message = '';
    this.confirmationOpen = true;
  }

  closeConfirmation() {
    if (!this.saving) this.confirmationOpen = false;
  }

  // Guardar el estado del empleado
  async saveStatus() {
    if (!this.selected || this.saving || this.selected.role !== 'employee') return;

    this.saving = true;
    this.message = '';

    try {
      await this.api.employeeStatus(Number(this.selected.id), this.nextStatus);
      this.confirmationOpen = false;
      await this.load();
    } catch (error: any) {
      this.message =
        error.response?.data?.message || 'No se pudo actualizar la cuenta.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
