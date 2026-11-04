/* Conecta el acceso con PHP y muestra las vistas disponibles para el rol autenticado. */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Action, DemoRow, Field, Role, VIEWS, View } from './view-config';
import { AuthService } from '../auth/auth.service';

import { Account, UsersService } from '../services/users.service';
import { HistoryEntry, Proposal, ProposalsService } from '../services/proposals.service';
import { CatalogsService } from '../services/catalogs.service';
import { Assignment, AssignmentSummary, EvaluationsService } from '../services/evaluations.service';

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonicModule],
  templateUrl: './platform.page.html',
  styleUrls: ['./platform.page.scss'],
})
export class PlatformPage implements OnInit {
  get role(): Role | null { return this.auth.user()?.role ?? null; }
  get userName(): string { return this.auth.user()?.name || ''; }
  get firstName(): string { return this.userName.trim().split(/\s+/)[0] || ''; }
  get initials(): string { return this.userName.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
  get today(): string { return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); }
  loginBusy = false;
  logoutBusy = false;
  loginError = '';
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

  liveRows: DemoRow[] = [];
  proposal?: Proposal;
  account?: Account;
  history: HistoryEntry[] = [];
  assignments: Assignment[] = [];
  assignmentList: AssignmentSummary[] = [];
  researchers: {value: string; label: string}[] = [];
  evaluators: {value: string; label: string}[] = [];
  loading = false;
  saving = false;
  loadError = '';
  page = 1;
  total = 0;
  archived = '0';
  private revision = 0;
  readonly historyLabels: Record<string, string> = {
    created: 'Propuesta registrada', update: 'Correcciones guardadas', resubmit: 'Propuesta reenviada',
    review_approved: 'Revisión preliminar aprobada', review_changes_requested: 'Cambios solicitados',
    review_rejected: 'Revisión preliminar rechazada', assign: 'Evaluador asignado',
    archived: 'Propuesta archivada', unarchived: 'Propuesta desarchivada',
  };
  get latestReview(): HistoryEntry | undefined {
    return this.history.find(event => event.action.startsWith('review_'));
  }
  readonly proposalStatuses: Record<string, string> = {
    pending_researcher_review: 'En revisión del investigador',
    pending_coordinator: 'Pendiente de coordinación',
    under_evaluation: 'En evaluación',
    changes_requested_researcher: 'Cambios solicitados por el investigador',
    changes_requested_evaluator: 'Cambios solicitados por el evaluador',
    rejected: 'Rechazada',
    approved: 'Aprobada',
  };

  get live(): boolean { return ['users', 'proposals', 'evaluations'].includes(this.section); }

  private proposalRow(p: Proposal): DemoRow {
    return { id: Number(p.id), cells: [p.title, p.researcher_name, this.proposalStatuses[p.status] || p.status, p.created_at] };
  }
  private accountRow(u: Account): DemoRow {
    return { id: Number(u.id), cells: [u.name, u.username, this.roles.find(r => r.value === u.role)?.label || u.role, u.status === 'active' ? 'Activo' : 'Inactivo'] };
  }

  async loadLive(page = 1): Promise<void> {
    const revision = ++this.revision;
    this.loading = true;
    this.loadError = '';
    this.page = page;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      if (this.section === 'evaluations') {
        const result = await this.evaluations.list();
        if (revision !== this.revision) return;
        this.assignmentList = result.items;
      } else if (this.section === 'users') {
        if (id) {
          const result = await this.users.detail(id);
          if (revision !== this.revision) return;
          this.account = result.user;
          this.selected = this.accountRow(result.user);
        } else {
          const result = await this.users.list();
          if (revision !== this.revision) return;
          this.liveRows = result.items.map(u => this.accountRow(u));
        }
      } else if (id) {
        const [detail, history, assignments] = await Promise.all([
          this.proposals.detail(id), this.proposals.history(id), this.evaluations.assignments(id),
        ]);
        if (revision !== this.revision) return;
        this.proposal = detail.proposal;
        this.selected = this.proposalRow(detail.proposal);
        this.history = history.items;
        this.assignments = assignments.items;
      } else {
        const result = await this.proposals.list({
          page, limit: 20, archived: this.archived, search: this.search.trim(),
          status: this.status === 'Todos' ? '' : this.status,
        });
        if (revision !== this.revision) return;
        this.liveRows = result.items.map(p => this.proposalRow(p));
        this.total = result.total;
      }
    } catch (error) {
      if (revision === this.revision) this.loadError = error instanceof Error ? error.message : 'Error de carga.';
    } finally {
      if (revision === this.revision) {
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    }
  }

  constructor(private route: ActivatedRoute, private router: Router, public auth: AuthService, private changeDetector: ChangeDetectorRef,
    private users: UsersService, private proposals: ProposalsService,
    private catalogs: CatalogsService, private evaluations: EvaluationsService) {}

  // Actualiza la vista al cambiar la ruta.
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.section = this.route.snapshot.routeConfig?.path === 'login' ? 'login' : (params.get('section') || 'dashboard');
      ++this.revision;
      this.loading = false;
      this.loadError = '';
      this.proposal = undefined;
      this.account = undefined;
      this.liveRows = [];
      this.archived = '0';
      this.selected = this.live ? undefined : this.view?.rows.find(row => row.id === Number(params.get('id')));
      if (this.section === 'documents' && this.role !== 'researcher' && this.selected?.cells[3] === 'Restringido') this.selected = undefined;
      this.search = '';
      this.status = 'Todos';
      this.tab = 'Información';
      this.action = undefined;
      this.menuOpen = false;
      this.notice = this.route.snapshot.queryParamMap.get('denied') === '1' ? 'Tu rol no tiene acceso a esa sección.' : '';
      if (this.live) void this.loadLive();
      if (this.section === 'login') this.password = '';
    });
  }

  get roleLabel(): string { return this.roles.find(role => role.value === this.role)?.label || ''; }
  get view(): View | undefined { return this.views.find(view => view.key === this.section); }
  get allowed(): boolean { return this.role !== null && (!this.view || this.view.roles.includes(this.role)); }
  get menu(): View[] { return this.views.filter(view => this.role !== null && view.roles.includes(this.role)); }
  get scoped(): boolean { return ['participants', 'activities', 'milestones', 'documents', 'monitoring'].includes(this.section); }
  get visibleRows(): DemoRow[] {
    if (this.section === 'proposals') return this.liveRows;
    let rows = this.live ? this.liveRows : this.view?.rows || [];
    // Los datos restringidos no se presentan a estudiantes ni a Coordinación.
    if (this.section === 'documents' && this.role !== 'researcher') rows = rows.filter(row => row.cells[3] !== 'Restringido');
    if (this.scoped && this.projectId === '2') rows = [];
    return rows.filter(row => row.cells.join(' ').toLocaleLowerCase().includes(this.search.toLocaleLowerCase()) &&
      (this.status === 'Todos' || row.cells.includes(this.status)));
  }
  get statuses(): string[] {
    const index = this.section === 'documents' ? 3 : this.view?.columns.findIndex(column => ['Estado', 'Decisión', 'Participación'].includes(column)) ?? -1;
    return index < 0 ? [] : [...new Set((this.live ? this.liveRows : this.view?.rows || []).map(row => row.cells[index]))];
  }
  get createAction(): Action | undefined { return this.availableActions.find(action => /^(Crear|Agregar|Subir documento|Solicitar)/.test(action.label)); }
  get availableActions(): Action[] { return (this.view?.actions || []).filter(action => this.role !== null && action.roles.includes(this.role)); }
  get detailActions(): Action[] {
    return this.availableActions.filter(action => {
      if (action === this.createAction) return false;
      const state = this.selected?.cells[2];
      if (this.section === 'closures' && action.endpoint === 'closures/review.php') return state === 'Pendiente';
      if (this.section === 'evaluations' && action.endpoint === 'evaluations/submit.php') return state === 'Pendiente';
      if (this.section === 'proposals') {
        const p = this.proposal;
        const user = this.auth.user();
        if (!p || !user) return false;
        if (action.endpoint === 'proposals/archive.php') return true;
        if (Number(p.is_archived)) return false;
        if (action.endpoint === 'evaluations/assign.php') return p.status === 'pending_coordinator';
        if (action.endpoint === 'proposals/review.php') {
          return p.status === 'pending_researcher_review' && Number(p.responsible_researcher_id) === user.id;
        }
        return Number(p.author_id) === user.id && p.status.startsWith('changes_requested_') &&
          (action.endpoint !== 'proposals/resubmit.php' || Boolean(Number(p.correction_pending_resubmit)));
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

  // Inicia sesión con la cuenta real y abre únicamente una ruta interna permitida.
  async login(form: NgForm): Promise<void> {
    if (this.loginBusy) return;
    this.loginError = '';
    this.auth.sessionMessage = '';
    if (form.invalid || !this.username.trim() || !this.password) {
      this.loginError = 'Escribe tu usuario y contraseña.';
      return;
    }
    this.loginBusy = true;
    try {
      await this.auth.login(this.username, this.password);
      this.password = '';
      const destination = this.route.snapshot.queryParamMap.get('returnUrl');
      const safeUrl = destination && /^\/app\/[a-z]+(?:\/\d+)?$/.test(destination) ? destination : '/app/dashboard';
      await this.router.navigateByUrl(safeUrl, { replaceUrl: true });
    } catch (error) {
      this.password = '';
      this.loginError = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    } finally {
      this.loginBusy = false;
      this.changeDetector.markForCheck();
    }
  }

  // El cierre se confirma con PHP antes de abandonar la sesión.
  async logout(): Promise<void> {
    if (this.logoutBusy) return;
    this.logoutBusy = true;
    this.notice = '';
    try {
      await this.auth.logout();
      this.password = '';
      this.username = '';
      this.messages = [];
      this.values = {};
      this.action = undefined;
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      this.notice = error instanceof Error ? error.message : 'No se pudo cerrar sesión. Inténtalo de nuevo.';
    } finally {
      this.logoutBusy = false;
      this.changeDetector.markForCheck();
    }
  }
  openDetail(row: DemoRow): void { this.router.navigate(['/app', this.section, row.id]); }
  setTab(tab: string): void { this.tab = tab; }
  async openForm(action: Action): Promise<void> {
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
    if (this.account) this.values['email'] = this.account.email || '';
    if (this.proposal) {
      this.values['description'] = this.proposal.description;
      this.values['objectives'] = this.proposal.objectives;
      this.values['archived'] = String(!Number(this.proposal.is_archived));
    }
    const kind = action.fields.some(f => f.type === 'evaluator') ? 'evaluators' :
      this.role === 'student' && action.fields.some(f => f.type === 'researcher') ? 'researchers' : null;
    const needsRoles = this.section === 'users' && action.fields.some(f => f.type === 'role');
    if (this.live && (kind || needsRoles)) {
      if (kind) this[kind] = [];
      this.saving = true;
      try {
        if (kind) {
          const result = await this.catalogs.list(kind);
          this[kind] = result.items.map(item => ({ value: String(item.id), label: item.name }));
        } else {
          this.roles = (await this.catalogs.roles()).items;
        }
      } catch (error) {
        this.formError = error instanceof Error ? error.message : 'No se pudo cargar el catálogo.';
      } finally {
        this.saving = false;
        this.changeDetector.markForCheck();
      }
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
    if (this.live && field.type === 'researcher') return this.researchers;
    if (this.live && field.type === 'evaluator') return this.evaluators;
    return options[field.type] || [];
  }
  isSelect(field: Field): boolean { return ['researcher', 'evaluator'].includes(field.type) || this.options(field).length > 0; }
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
  async submitForm(form: NgForm): Promise<void> {
    if (this.saving) return;
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
    if (this.live && this.action) {
      const action = this.action;
      const revision = this.revision;
      const body: Record<string, string | number | boolean> = {};
      for (const field of action.fields) {
        const value = this.values[field.key];
        if (value !== undefined && field.key !== 'confirm_password') body[field.key] = value;
      }
      if (this.account) body['user_id'] = this.account.id;
      if (this.proposal) body['proposal_id'] = this.proposal.id;
      if (action.endpoint.endsWith('/archive.php')) body['archived'] = body['archived'] === 'true';
      if (body['new_password']) {
        body['password'] = body['new_password'];
        delete body['new_password'];
      }
      this.saving = true;
      try {
        if (this.section === 'users') await this.users.save(action.endpoint, body);
        else if (action.endpoint === 'evaluations/assign.php') await this.evaluations.assign(body);
        else await this.proposals.save(action.endpoint, body);
        if (revision !== this.revision) return;
        this.notice = 'Cambios guardados.';
        this.values = {};
        this.closeForm();
        await this.loadLive();
      } catch (error) {
        if (revision === this.revision) this.formError = error instanceof Error ? error.message : 'No se pudo guardar.';
      } finally {
        this.saving = false;
        this.changeDetector.markForCheck();
      }
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
