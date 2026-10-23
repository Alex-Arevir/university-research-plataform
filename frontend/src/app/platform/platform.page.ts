/* Muestra las vistas de la plataforma con navegación y datos de ejemplo, sin consumir la API. */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Action, DemoRow, Field, Role, VIEWS, View } from './view-config';
import { DemoStateService } from './demo-state.service';

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent],
  templateUrl: './platform.page.html',
  styleUrls: ['./platform.page.scss'],
})
export class PlatformPage implements OnInit {
  get role(): Role { return this.demo.role; }
  set role(value: Role) { this.demo.role = value; }
  roles: { value: Role; label: string }[] = [
    { value: 'student', label: 'Estudiante' },
    { value: 'researcher', label: 'Investigador' },
    { value: 'evaluator', label: 'Evaluador' },
    { value: 'coordinator', label: 'Coordinador' },
  ];
  views = VIEWS;
  section = 'dashboard';
  selected?: DemoRow;
  search = '';
  status = 'Todos';
  tab = 'Información';
  projectId = '1';
  menuOpen = false;
  action?: Action;
  values: Record<string, string> = {};
  formError = '';
  notice = '';
  question = '';
  assistantAction = 'ask';
  messages: { author: string; text: string }[] = [];
  username = '';
  password = '';

  constructor(private route: ActivatedRoute, private router: Router, private demo: DemoStateService) {}

  // Actualiza la vista al cambiar la ruta.
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.section = this.route.snapshot.routeConfig?.path === 'login' ? 'login' : (params.get('section') || 'dashboard');
      this.selected = this.view?.rows.find(row => row.id === Number(params.get('id')));
      if (this.section === 'documents' && this.role !== 'researcher' && this.selected?.cells[3] === 'Restringido') this.selected = undefined;
      this.search = '';
      this.status = 'Todos';
      this.tab = 'Información';
      this.action = undefined;
      this.menuOpen = false;
      this.notice = '';
    });
  }

  get roleLabel(): string { return this.roles.find(role => role.value === this.role)?.label || ''; }
  get view(): View | undefined { return this.views.find(view => view.key === this.section); }
  get allowed(): boolean { return !this.view || this.view.roles.includes(this.role); }
  get menu(): View[] { return this.views.filter(view => view.roles.includes(this.role)); }
  get scoped(): boolean { return ['participants', 'activities', 'milestones', 'documents', 'monitoring'].includes(this.section); }
  get visibleRows(): DemoRow[] {
    let rows = this.view?.rows || [];
    // Los datos restringidos no se presentan a estudiantes ni a Coordinación.
    if (this.section === 'documents' && this.role !== 'researcher') rows = rows.filter(row => row.cells[3] !== 'Restringido');
    if (this.scoped && this.projectId === '2') rows = [];
    return rows.filter(row => row.cells.join(' ').toLocaleLowerCase().includes(this.search.toLocaleLowerCase()) &&
      (this.status === 'Todos' || row.cells.includes(this.status)));
  }
  get statuses(): string[] {
    const index = this.section === 'documents' ? 3 : this.view?.columns.findIndex(column => ['Estado', 'Decisión', 'Participación'].includes(column)) ?? -1;
    return index < 0 ? [] : [...new Set((this.view?.rows || []).map(row => row.cells[index]))];
  }
  get createAction(): Action | undefined { return this.availableActions.find(action => /^(Crear|Agregar|Subir documento|Solicitar)/.test(action.label)); }
  get availableActions(): Action[] { return (this.view?.actions || []).filter(action => action.roles.includes(this.role)); }
  get detailActions(): Action[] {
    return this.availableActions.filter(action => {
      if (action === this.createAction) return false;
      const state = this.selected?.cells[2];
      if (this.section === 'closures' && action.endpoint === 'closures/review.php') return state === 'Pendiente';
      if (this.section === 'evaluations' && action.endpoint === 'evaluations/submit.php') return state === 'Pendiente';
      if (this.section === 'proposals') {
        if (/correcciones|Reenviar/.test(action.label)) return state === 'Cambios solicitados' && this.role === 'student';
        if (action.endpoint === 'proposals/review.php') return state === 'En revisión del investigador';
      }
      if (this.section === 'activities') {
        if (/Comenzar/.test(action.label)) return state === 'Pendiente';
        if (/Enviar a revisión|Adjuntar/.test(action.label)) return state === 'En progreso';
        if (action.endpoint === 'activities/review.php') return state === 'En revisión';
        if (/Reasignar/.test(action.label)) return state !== 'Completada';
      }
      if (this.section === 'documents' && this.role === 'student' && this.selected?.cells[3] === 'Bloqueado' && /Retirar/.test(action.label)) return false;
      return true;
    });
  }
  get tabs(): string[] {
    const extras: Record<string, string[]> = {
      proposals: ['Evaluaciones', 'Historial'], projects: ['Propuesta de origen', 'Equipo', 'Actividades', 'Hitos', 'Documentos', 'Historial'],
      activities: ['Evidencias', 'Historial'], documents: ['Versiones'], milestones: ['Actividades'],
    };
    return ['Información', ...(extras[this.section] || [])];
  }

  // El selector cambia únicamente la demostración visual, no autentica usuarios.
  enterDemo(): void { this.password = ''; this.router.navigate(['/app/dashboard']); }
  changeRole(): void { this.selected = undefined; this.router.navigate(['/app/dashboard']); }
  logout(): void { this.password = ''; this.username = ''; this.messages = []; this.router.navigate(['/login']); }
  openDetail(row: DemoRow): void { this.router.navigate(['/app', this.section, row.id]); }
  setTab(tab: string): void { this.tab = tab; }
  openForm(action: Action): void {
    this.action = action;
    this.values = {};
    this.formError = '';
    if (this.selected) {
      const cells = this.selected.cells;
      this.values['title'] = cells[0];
      this.values['name'] = cells[0];
      this.values['username'] = cells[1];
      this.values['description'] = this.section === 'activities' ? cells[0] : '';
    }
  }
  closeForm(): void { this.action = undefined; }
  options(field: Field): { value: string; label: string }[] {
    const options: Record<string, { value: string; label: string }[]> = {
      role: this.roles, account: [{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }],
      review: [{ value: 'approved', label: 'Aprobar' }, { value: 'changes_requested', label: 'Solicitar cambios' }, { value: 'rejected', label: 'Rechazar' }],
      activityReview: [{ value: 'approved', label: 'Aprobar' }, { value: 'changes_requested', label: 'Solicitar cambios' }],
      boolean: [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }],
      researcher: [{ value: '2', label: 'Dra. Laura Méndez' }, { value: '3', label: 'Dr. Carlos Ruiz' }],
      evaluator: [{ value: '4', label: 'Dra. Elena Vargas' }],
      participant: [{ value: '1', label: 'Jazmín Montes' }, { value: '5', label: 'Ana Torres' }],
      activities: [{ value: '1', label: 'Revisión de literatura' }, { value: '2', label: 'Borrador de metodología' }],
      projects: [{ value: '1', label: 'Materiales sustentables' }, { value: '2', label: 'Energía solar en comunidades rurales' }],
      format: [{ value: 'json', label: 'JSON' }, { value: 'pdf', label: 'PDF' }],
    };
    return options[field.type] || [];
  }
  isSelect(field: Field): boolean { return this.options(field).length > 0; }
  isRequired(field: Field): boolean {
    if (field.type === 'optional' || field.key === 'email' || field.key === 'reassignments') return false;
    if (field.key === 'responsible_researcher_id') return this.role === 'student';
    if (field.key === 'observations') return this.action?.endpoint === 'evaluations/submit.php' || this.values['decision'] === 'changes_requested';
    return true;
  }
  chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.values['file'] = file.name;
  }
  // Valida los campos sin enviar ni almacenar archivos o contraseñas.
  submitForm(form: NgForm): void {
    if (form.invalid || (this.action?.fields.some(field => field.type === 'file') && !this.values['file'])) {
      this.formError = 'Completa los campos obligatorios.';
      return;
    }
    const password = this.values['new_password'] || this.values['password'];
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      this.formError = 'La contraseña necesita mínimo 8 caracteres, mayúscula, minúscula y número.';
      return;
    }
    if (this.values['new_password'] !== this.values['confirm_password']) {
      this.formError = 'Las contraseñas no coinciden.';
      return;
    }
    this.notice = `«${this.action?.label}»: formulario validado en demostración. No se enviaron cambios al servidor.`;
    this.values = {};
    this.closeForm();
  }
  download(): void { this.notice = 'Demostración: la descarga estará disponible cuando se conecte el endpoint correspondiente.'; }
  ask(): void {
    if (!this.question.trim()) return;
    this.messages.push({ author: 'Tú', text: this.question.trim() });
    this.messages.push({ author: 'Asistente · demostración', text: 'Esta es una vista previa. Al conectar la API, consultaré únicamente fuentes autorizadas y mostraré sus referencias. Por ahora no se ha consultado ningún documento ni servicio de IA.' });
    this.question = '';
  }
}
