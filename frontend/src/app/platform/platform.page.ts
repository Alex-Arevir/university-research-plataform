/* Conecta el acceso con PHP y muestra las vistas disponibles para el rol autenticado. */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Action, DemoRow, Field, Role, VIEWS, View } from './view-config';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';
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

  get live(): boolean { return this.section !== 'login' && this.section !== 'assistant'; }

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
      if (!['users','proposals','evaluations'].includes(this.section)) {
        await this.loadResearch(id, revision);
      } else if (this.section === 'evaluations') {
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
    private catalogs: CatalogsService, private evaluations: EvaluationsService, private api: ApiService) {}

  // Actualiza la vista al cambiar la ruta.
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.projectId = this.route.snapshot.queryParamMap.get('project') || this.projectId;
      this.section = this.route.snapshot.routeConfig?.path === 'login' ? 'login' : (params.get('section') || 'dashboard');
      ++this.revision;
      this.loading = false;
      this.loadError = '';
      this.record = undefined; this.records = []; this.versions = []; this.projectHistory = [];
      this.proposal = undefined;
      this.account = undefined;
      this.liveRows = [];
      this.archived = '0';
      this.selected = undefined;
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
      if (this.record) return this.canResearchAction(action);
      const state = this.selected?.cells[2];
      if (this.section === 'closures' && action.endpoint === 'closures/review.php') return state === 'Pendiente';
      if (this.section === 'evaluations' && action.endpoint === 'evaluations/submit.php') return state === 'Pendiente';
      if (this.section === 'proposals') {
        const p = this.proposal;
        const user = this.auth.user();
        if (!p || !user) return false;
        if (action.endpoint === 'evaluations/submit.php') return this.role === 'evaluator' && p.status === 'under_evaluation';
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
  setTab(tab: string): void { this.tab = tab; if (this.record) void this.loadTab(); }
  async openForm(action: Action): Promise<void> {
    this.action = action;
    this.values = Object.fromEntries(action.fields.map(field => [field.key, (field.key === 'activity_ids' || field.key === 'project_ids' ? [] : '') as any]));
    if (action.endpoint === 'users/create.php') this.values['role'] = 'student';
    this.file = undefined;
    this.formError = '';
    if (this.record) {
      for (const [key,value] of Object.entries(this.record)) this.values[key] = (Array.isArray(value) ? value.map(String) : value == null ? '' : String(value)) as any;
      this.values['context'] = String(this.record['project_id'] || this.record['id']);
    } else if (this.projectId) this.values['context'] = this.projectId;
    if (this.selected) {
      const cells = this.selected.cells;
      this.values['title'] = cells[0];
      this.values['name'] = cells[0];
      this.values['username'] = cells[1];
      if (!this.record) this.values['description'] = this.section === 'activities' ? cells[0] : '';
    }
    if (this.account) this.values['email'] = this.account.email || '';
    if (this.proposal) {
      this.values['description'] = this.proposal.description;
      this.values['objectives'] = this.proposal.objectives;
      this.values['archived'] = String(!Number(this.proposal.is_archived));
    }
    if (!['users','proposals','evaluations'].includes(this.section)) {
      await this.loadFormOptions(action); return;
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
      researcher: this.researchers,
      evaluator: this.evaluators,
      participant: this.participantOptions,
      activities: this.activityOptions,
      projects: this.projectOptions,
      format: [{ value: 'json', label: 'JSON' }, { value: 'pdf', label: 'Vista imprimible / Guardar como PDF' }],
    };
    if (this.live && field.type === 'researcher') return this.researchers;
    if (this.live && field.type === 'evaluator') return this.evaluators;
    return options[field.type] || [];
  }
  isSelect(field: Field): boolean { return ['researcher', 'evaluator'].includes(field.type) || this.options(field).length > 0; }
  isRequired(field: Field): boolean {
    if (field.type === 'optional' || field.key === 'email' || field.key === 'reassignments') return false;
    if (field.key === 'responsible_researcher_id') return this.role === 'student';
    if (field.key === 'observations') return ['evaluations/submit.php','proposals/review.php'].includes(this.action?.endpoint || '') || this.values['decision'] === 'changes_requested';
    return true;
  }
  chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.file = file;
    if (file) this.values['file'] = file.name;
  }
  async submitForm(form: NgForm): Promise<void> {
    if (this.saving) return;
    this.formError = '';
    form.form.markAllAsTouched();
    const missing = (this.action?.fields || []).filter(field => {
      if (field.key === 'responsible_researcher_id' && this.role !== 'student') return false;
      if (!this.isRequired(field)) return false;
      if (field.type === 'file') return !this.file;
      const value = this.values[field.key];
      return value == null || (Array.isArray(value) ? value.length === 0 : String(value).trim() === '');
    });
    if (missing.length) {
      this.formError = 'Completa: ' + missing.map(field => field.label).join(', ') + '.';
      return;
    }
    if (form.invalid) {
      const invalid = Object.entries(form.controls).filter(([, control]) => control.invalid);
      this.formError = 'Revisa: ' + invalid.map(([key, control]) => {
        const field = this.action?.fields.find(item => item.key === key);
        return (field?.label || (key === 'context' ? 'Proyecto' : key)) + (control.hasError('email') ? ' (correo inválido)' : '');
      }).join(', ') + '.';
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
    if (this.action && !['users','proposals','evaluations'].includes(this.section)) { await this.saveResearch(); return; }
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
  }

  record?: Record<string, any>;
  records: Record<string, any>[] = [];
  projects: Record<string, any>[] = [];
  currentProject?: Record<string, any>;
  versions: Record<string, any>[] = [];
  relatedActivities: Record<string, any>[] = [];
  projectHistory: Record<string, any>[] = [];
  participantOptions: {value:string;label:string}[] = [];
  activityOptions: {value:string;label:string}[] = [];
  counts: number[] = [0,0,0,0];
  file?: File;
  asking = false;
  get projectOptions(): {value:string;label:string}[] { return this.projects.map(p=>({value:String(p['id']),label:p['title']})); }
  get moduleName(): string { return this.section === 'institutional' ? 'institutional-documents' : this.section; }
  get recordIdKey(): string { return ({projects:'project_id',monitoring:'project_id',reports:'project_id',participants:'participant_record_id',activities:'activity_id',milestones:'milestone_id',documents:'document_id',institutional:'document_id',closures:'closure_id'} as Record<string,string>)[this.section]; }
  get progress(): number { const p=this.record || this.currentProject; return p?.['total_activities'] ? Math.round(100*p['completed_activities']/p['total_activities']) : 0; }
  label(value: any): string { return ({active:'Activo',closing:'En cierre',finalized:'Finalizado',pending:'Pendiente',in_progress:'En progreso',in_review:'En revisión',completed:'Completada',achieved:'Alcanzado',approved:'Aprobado',changes_requested:'Cambios solicitados',student:'Estudiante',researcher:'Investigador'} as Record<string,string>)[String(value)] || String(value ?? ''); }
  researchRow(r: Record<string,any>): DemoRow {
    const s=this.section;
    let cells: any[]=[];
    if (['projects','reports','monitoring'].includes(s)) {
      const n=Number(r['total_activities']), done=Number(r['completed_activities']); const percent=n?Math.round(done*100/n):0;
      cells=s==='monitoring'?[r['title'],`${done} / ${n}`,`${percent} %`,this.label(r['status'])]:s==='reports'?[r['title'],r['researcher_name'],`${percent} %`,this.label(r['status'])]:[r['title'],r['researcher_name'],this.label(r['status']),`${percent} %`];
    } else if (s==='participants') cells=[r['name'],this.label(r['role']),Number(r['is_active'])?'Activa':'Retirada',r['joined_at']];
    else if (s==='activities') cells=[r['description'],r['participant_name'] || `Usuario #${r['participant_id']}`,this.label(r['status']),r['deadline']];
    else if (s==='milestones') cells=[r['description'],r['target_date'],`${r['activity_count'] || r['activity_ids']?.length || 0} actividades`,this.label(r['status'])];
    else if (s==='closures') cells=[r['title'] || this.currentProject?.['title'],r['requester_name'] || `Usuario #${r['requested_by']}`,this.label(r['status']),r['created_at']];
    else if (s==='institutional') cells=[r['title'],`v${r['version'] || ''}`,r['created_at'],'Disponible'];
    else cells=[r['title'],'Repositorio del proyecto',`v${r['version'] || ''}`,Number(r['restricted'])?'Restringido':Number(r['blocked'])?'Bloqueado':'Disponible'];
    return {id:Number(r['id']),cells:cells.map(v=>String(v??''))};
  }
  async loadResearch(id: number, revision: number): Promise<void> {
    if (this.section==='dashboard') { const r=await this.api.request<any>('dashboard/summary.php'); if(revision===this.revision) {this.counts=r.counts; this.projects=r.projects;} return; }
    if (this.section==='institutional') {
      const r=await this.api.request<any>('institutional-documents/list.php'); if(revision!==this.revision)return;
      this.records=r.items;
    } else {
      const result=await this.api.request<any>('projects/list.php'); if(revision!==this.revision)return;
      this.projects=result.items;
      if (!this.projects.some(p=>String(p['id'])===this.projectId)) this.projectId=String(this.projects[0]?.['id'] || '');
      if (['projects','reports','monitoring'].includes(this.section)) this.records=this.projects;
      else if (id) {
        const result=await this.api.request<any>(`${this.moduleName}/detail.php`,{[this.recordIdKey]:id}); if(revision!==this.revision)return;
        this.record=result.item; this.projectId=String(result.item.project_id); this.records=[result.item];
      } else if (this.projectId) {
        const r=await this.api.request<any>(`${this.moduleName}/list.php`,{project_id:this.projectId}); if(revision!==this.revision)return; this.records=r.items;
      } else this.records=[];
      this.currentProject=this.projects.find(p=>String(p['id'])===this.projectId);
    }
    if(revision!==this.revision)return;
    this.liveRows=this.records.map(r=>this.researchRow(r));
    if(id) {
      this.record=this.records.find(r=>Number(r['id'])===id);
      if(!this.record) throw new Error('Registro no disponible.');
      this.selected=this.researchRow(this.record);
      if(['projects','monitoring','reports'].includes(this.section)) {this.projectId=String(id); this.currentProject=this.record;}
    }
  }
  async changeProject(): Promise<void> { this.selected=undefined; this.record=undefined; await this.loadLive(); }
  canResearchAction(a: Action): boolean {
    const r=this.record; if(!r) return false;
    const p=this.currentProject; const lead=this.role==='researcher' && Number(p?.['responsible_researcher_id'])===this.auth.user()?.id;
    if(this.section==='institutional') return this.role==='coordinator';
    if(this.section==='projects') return a.endpoint==='projects/change-researcher.php' && r['status']==='active';
    if(this.section==='reports') return this.role==='coordinator' || lead;
    if(this.section==='closures') return this.role==='coordinator' && r['status']==='pending';
    if(p?.['status']!=='active')return false;
    if(this.section==='documents') return /set-block|set-restriction/.test(a.endpoint)?lead:!(this.role==='student' && Number(r['blocked']));
    if(this.section==='activities') {
      const state=r['status'];
      if(/start|submit|evidence/.test(a.endpoint)) return Number(r['participant_id'])===this.auth.user()?.id && (a.endpoint.includes('start')?state==='pending':['pending','in_progress'].includes(state) && (!a.endpoint.includes('submit') || state==='in_progress'));
      return lead && (!a.endpoint.includes('review') || state==='in_review');
    }
    if(this.section==='milestones') return lead && (!a.endpoint.includes('achieve') || r['status']!=='achieved');
    return lead;
  }
  get canCreate(): boolean {
    if(!this.createAction)return false;
    if(['users','proposals','institutional'].includes(this.section))return true;
    const p=this.currentProject;
    if(!p || p['status']!=='active')return false;
    return this.section==='documents' || (this.role==='researcher' && Number(p['responsible_researcher_id'])===this.auth.user()?.id);
  }
  async loadFormOptions(a: Action): Promise<void> {
    this.saving=true;
    try {
      if(a.fields.some(f=>f.type==='researcher')) this.researchers=(await this.catalogs.list('researchers')).items.map(x=>({value:String(x.id),label:x.name}));
      if(a.fields.some(f=>f.type==='participant') && this.projectId) {
        const r=await this.api.request<any>('catalogs/participants.php',{project_id:this.projectId,all:a.endpoint==='participants/add.php'?'1':'0'});
        this.participantOptions=r.items.map((x:any)=>({value:String(x.id),label:x.name}));
      }
      if(a.fields.some(f=>f.type==='activities') && this.projectId) {
        const r=await this.api.request<any>('activities/list.php',{project_id:this.projectId}); this.activityOptions=r.items.map((x:any)=>({value:String(x.id),label:x.description}));
      }
    } catch(e) {this.formError=e instanceof Error?e.message:'No se pudieron cargar las opciones.';}
    finally {this.saving=false; this.changeDetector.markForCheck();}
  }
  async saveResearch(): Promise<void> {
    if(!this.action)return;
    this.saving=true;
    try {
      const body:Record<string,any>={};
      for(const f of this.action.fields) if(f.key!=='file') body[f.key]=this.values[f.key];
      body['project_id']=Number(this.values['context'] || this.projectId);
      if(this.record) body[this.recordIdKey]=Number(this.record['id']);
      for(const key of ['blocked','restricted']) if(key in body) body[key]=body[key]==='true';
      for(const key of ['activity_ids','project_ids']) if(key in body && !Array.isArray(body[key])) body[key]=[body[key]].filter(Boolean);
      if(this.file) {
        if(this.file.size>10*1024*1024)throw new Error('El archivo supera 10 MB.');
        body['filename']=this.file.name;
        body['file_base64']=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('No se pudo leer el archivo.'));reader.readAsDataURL(this.file!);});
      }
      if(this.action.endpoint==='evidence/upload.php') body['activity_id']=this.record?.['id'];
      const result=await this.api.request<any>(this.action.endpoint,{},body);
      if(this.section==='reports') this.showReport(result,body['format']);
      this.notice='Operación completada.'; this.closeForm(); this.file=undefined; await this.loadLive();
    } catch(e) {this.formError=e instanceof Error?e.message:'No se pudo guardar.';}
    finally {this.saving=false;this.changeDetector.markForCheck();}
  }
  async loadTab(): Promise<void> {
    try {
      const id=Number(this.record?.['id']);
      if(this.tab==='Actividades' && this.section==='milestones') {
        const r=await this.api.request<any>('activities/list.php',{project_id:this.projectId});
        this.relatedActivities=r.items.filter((a:any)=>this.record?.['activity_ids']?.map(Number).includes(Number(a.id)));
      }
      if(this.tab==='Versiones') this.versions=(await this.api.request<any>(`${this.moduleName}/versions.php`,{document_id:id})).items;
      if(this.tab==='Evidencias') this.versions=(await this.api.request<any>('evidence/list.php',{project_id:this.projectId,activity_id:id})).items;
      if(this.tab==='Historial') this.projectHistory=(await this.api.request<any>(`${this.section}/history.php`,{[this.recordIdKey]:id})).items;
    } catch(e) {this.notice=e instanceof Error?e.message:'No se pudo cargar.';}
    this.changeDetector.markForCheck();
  }
  download(id?: number, version?: number): void {
    const documentId=id || Number(this.record?.['id']); if(!documentId)return;
    const module=this.section==='institutional'?'institutional-documents':'documents';
    const url=environment.apiBaseUrl+`/${module}/download.php?document_id=${documentId}`+(version?`&version=${version}`:'');
    window.open(url,'_blank','noopener');
  }
  showReport(data: any, format: string): void {
    const escape=(v:any)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
    const json=JSON.stringify(data,null,2);
    let text=json, mime='application/json', ext='json';
    if(format==='pdf') {
      mime='text/html'; ext='html';
      text='<!doctype html><html lang="es"><meta charset="utf-8"><title>Reporte de seguimiento</title><style>body{font:15px system-ui;margin:40px;color:#18253a}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:8px}h2{margin-top:32px}@media print{button{display:none}}</style><button onclick="window.print()">Imprimir / Guardar como PDF</button><h1>Reporte de seguimiento</h1><p>'+escape(data.generated_at)+'</p>';
      for(const p of data.projects) {
        text+='<h2>'+escape(p.title)+'</h2><p>Responsable: '+escape(p.researcher_name)+' · Estado: '+escape(this.label(p.status))+' · Avance: '+escape(p.progress)+' %</p>';
        for(const [key,title] of [['participants','Participantes'],['activities','Actividades'],['milestones','Hitos']]) {
          text+='<h3>'+title+'</h3><table>';
          for(const r of p[key]) text+='<tr><td>'+escape(r.name || r.description)+'</td><td>'+escape(r.participant_name || r.role || '')+'</td><td>'+escape(this.label(r.status || (Number(r.is_active)?'active':'Retirado')))+'</td><td>'+escape(r.deadline || r.target_date || r.joined_at)+'</td></tr>';
          text+='</table>';
        }
      } text+='</html>';
    }
    const url=URL.createObjectURL(new Blob([text],{type:mime}));
    if(format==='pdf')window.open(url,'_blank','noopener');
    else {const a=document.createElement('a');a.href=url;a.download='reporte-investigacion.'+ext;a.click();}
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async ask(): Promise<void> {
    if(!this.question.trim() || this.asking)return;
    const question=this.question.trim();this.question='';this.asking=true;
    this.messages.push({author:'Tú',text:question});
    const timer=setTimeout(()=>{this.notice='El asistente sigue procesando tu consulta…';this.changeDetector.markForCheck();},10000);
    try {
      const r=await this.api.request<any>('assistant/query.php',{}, {question,mode:this.assistantAction});
      this.messages.push({author:'Asistente',text:r.answer+(r.sources.length?'\n\nFuentes recuperadas:\n'+r.sources.map((s:any)=>`[${s.reference}] ${s.title} · v${s.version} · fragmento ${s.fragment}`).join('\n'):'')});
    } catch(e) {this.messages.push({author:'Asistente',text:e instanceof Error?e.message:'No se pudo consultar.'});}
    finally {clearTimeout(timer);this.notice='';this.asking=false;this.changeDetector.markForCheck();}
  }
}
