// Consulta usuarios y administra el estado de los empleados mediante la API.

import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config';

@Injectable({ providedIn: 'root' })
export class Users {

  // Dependencias
  constructor(private config: ApiConfigService) {}

  private get url(): string {
    return this.config.getApiUrl() + '/users';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };
  }

  // Consultar usuarios (solo administrador)
  async list() {
    return (
      await axios.get(this.url + '/index.php', {
        headers: this.headers,
      })
    ).data;
  }

  // Cambiar estado de empleado
  async employeeStatus(id: number, status: 'active' | 'inactive') {
    return (
      await axios.patch(
        this.url + '/employee-status.php',
        { id, status },
        { headers: this.headers }
      )
    ).data;
  }
}
