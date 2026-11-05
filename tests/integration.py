"""Pruebas en una BD desechable. Requiere un coordinador inicial.
RESEARCH_TEST_URL=http://127.0.0.1:8085/backend RESEARCH_TEST_USER=coordinacion
RESEARCH_TEST_PASSWORD=... python tests/integration.py
Crea registros de prueba, no borra información. Nunca ejecutar contra producción.
"""
import base64, http.cookiejar, json, os, time, urllib.request, urllib.error
base=os.environ.get('RESEARCH_TEST_URL','http://127.0.0.1:8085/backend')
checks=0
class Client:
 def __init__(self): self.http=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,path,body=None,expect=200,params=None,raw=False):
  global checks
  url=base+'/'+path
  if params:
   from urllib.parse import urlencode
   url+='?'+urlencode(params)
  req=urllib.request.Request(url,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'} if body is not None else {})
  try:
   with self.http.open(req,timeout=20) as r: code=r.status; text=r.read()
  except urllib.error.HTTPError as e: code=e.code;text=e.read()
  assert code==expect,(path,code,text.decode(errors='replace'))
  checks+=1
  if raw:return text
  
  try:return json.loads(text)
  except Exception:raise AssertionError((path,code,text))
 def login(self,u,p):return self.call('auth/login.php',{'username':u,'password':p})
admin=Client();admin.login(os.environ.get('RESEARCH_TEST_USER','coordinacion'),os.environ['RESEARCH_TEST_PASSWORD'])
prefix='test'+str(time.time_ns())[-10:];password='Research2026'
accounts={}; clients={}
for name,role in [('student','student'),('researcher','researcher'),('evaluator','evaluator'),('outsider','student'),('other','student'),('researcher2','researcher')]:
 data=admin.call('users/create.php',{'name':name,'username':prefix+name,'password':password,'role':role},201);accounts[name]=int(data['user']['id']);c=Client();c.login(prefix+name,password);clients[name]=c
s,r,e,o,other,r2=[clients[n] for n in ['student','researcher','evaluator','outsider','other','researcher2']]
admin.call('users/create.php',{'name':'weak','username':prefix+'weak','password':'weakpass','role':'student'},422)
Client().call('projects/list.php',expect=401)
s.call('users/list.php',expect=403)
b={'title':'Investigación de prueba','description':'Descripción completa','objectives':'Objetivos de prueba','responsible_researcher_id':accounts['researcher']}
pid=s.call('proposals/create.php',b,201)['proposal_id']
o.call('proposals/detail.php',params={'proposal_id':pid},expect=404)
admin.call('evaluations/assign.php',{'proposal_id':pid,'evaluator_id':accounts['evaluator']},409)
r.call('proposals/review.php',{'proposal_id':pid,'decision':'changes_requested','observations':'Amplía objetivos'})
s.call('proposals/resubmit.php',{'proposal_id':pid},409)
s.call('proposals/update.php',{'proposal_id':pid,'objectives':'Objetivos ampliados'})
s.call('proposals/resubmit.php',{'proposal_id':pid})
r.call('proposals/review.php',{'proposal_id':pid,'decision':'approved','observations':'Revisión aprobada'})
admin.call('proposals/archive.php',{'proposal_id':pid,'archived':True})
admin.call('evaluations/assign.php',{'proposal_id':pid,'evaluator_id':accounts['evaluator']},409)
admin.call('proposals/archive.php',{'proposal_id':pid,'archived':False})
admin.call('evaluations/assign.php',{'proposal_id':pid,'evaluator_id':accounts['evaluator']})
e.call('evaluations/submit.php',{'proposal_id':pid,'decision':'changes_requested','observations':'Corrige metodología'})
s.call('proposals/update.php',{'proposal_id':pid,'description':'Metodología corregida'})
s.call('proposals/resubmit.php',{'proposal_id':pid})
e.call('evaluations/submit.php',{'proposal_id':pid,'decision':'approved','observations':'Cumple requisitos'})
e.call('evaluations/submit.php',{'proposal_id':pid,'decision':'approved','observations':'Duplicada'},409)
p=next(x for x in r.call('projects/list.php')['items'] if int(x['proposal_id'])==int(pid));pr=int(p['id'])
o.call('projects/detail.php',params={'project_id':pr},expect=404)
e.call('projects/detail.php',params={'project_id':pr},expect=404)
admin.call('users/change-role.php',{'user_id':accounts['researcher'],'role':'evaluator'},409)
s.call('participants/add.php',{'project_id':pr,'user_id':accounts['other']},403)
r.call('participants/add.php',{'project_id':pr,'user_id':accounts['evaluator']},422)
r.call('participants/add.php',{'project_id':pr,'user_id':accounts['other']})
a=r.call('activities/create.php',{'project_id':pr,'description':'Tarea inicial','participant_id':accounts['student'],'deadline':'2027-02-01'})['id']
r.call('activities/create.php',{'project_id':pr,'description':'Fecha inválida','participant_id':accounts['student'],'deadline':'2027-02-30'},422)
admin.call('activities/update.php',{'activity_id':a,'description':'No','participant_id':accounts['student'],'deadline':'2027-02-01'},403)
s.call('activities/create.php',{'project_id':pr,'description':'No','participant_id':accounts['student'],'deadline':'2027-02-01'},403)
s.call('activities/start.php',{'activity_id':a})
s.call('activities/review.php',{'activity_id':a,'decision':'approved'},403)
s.call('activities/submit.php',{'activity_id':a}) # Sin evidencia
r.call('activities/review.php',{'activity_id':a,'decision':'changes_requested','observations':'Corrige resultados'})
f={'project_id':pr,'activity_id':a,'filename':'evidencia.txt','file_base64':base64.b64encode(b'Resultados verificados').decode()}
s.call('evidence/upload.php',f)
s.call('activities/submit.php',{'activity_id':a})
m=r.call('milestones/create.php',{'project_id':pr,'description':'Meta de prueba','target_date':'2027-02-02','activity_ids':[a]})['id']
r.call('milestones/achieve.php',{'milestone_id':m},409)
r.call('activities/review.php',{'activity_id':a,'decision':'approved'})
r.call('milestones/achieve.php',{'milestone_id':m})
p=r.call('projects/detail.php',params={'project_id':pr})['item'];assert p['completed_activities']==1 and p['total_activities']==1
# Documentos y versiones, bloqueos y permisos para descarga/IA
f={'project_id':pr,'title':'Documento autorizado','filename':'reglas.txt','file_base64':base64.b64encode(b'El presupuesto visible es publico.').decode()}
d=s.call('documents/upload.php',f)['document_id']
s.call('documents/upload-version.php',dict(f,document_id=d,file_base64=base64.b64encode(b'El presupuesto visible actualizado es publico.').decode()))
versions=s.call('documents/versions.php',params={'document_id':d})['items'];assert len(versions)==2
assert b'actualizado' not in s.call('documents/download.php',params={'document_id':d,'version':1},raw=True)
o.call('documents/download.php',params={'document_id':d},expect=404)
r.call('documents/set-block.php',{'document_id':d,'blocked':True})
s.call('documents/delete.php',{'document_id':d},403)
r.call('documents/set-restriction.php',{'document_id':d,'restricted':True})
s.call('documents/detail.php',params={'document_id':d},expect=404)
admin.call('documents/download.php',params={'document_id':d},expect=404)
r.call('documents/download.php',params={'document_id':d},raw=True)
answer=s.call('assistant/query.php',{'question':'presupuesto visible actualizado'});assert answer['sources']==[]
assert e.call('assistant/query.php',{'question':'presupuesto visible actualizado'})['sources']==[]
assert o.call('assistant/query.php',{'question':'presupuesto visible actualizado'})['sources']==[]
r.call('assistant/query.php',{'question':'presupuesto visible actualizado'},expect=503) # No API key in this isolated test.
# Reasignación obligatoria al retirar participante, con historial conservado.
a2=r.call('activities/create.php',{'project_id':pr,'description':'Tarea reasignable','participant_id':accounts['other'],'deadline':'2027-02-01'})['id']
r.call('participants/remove.php',{'project_id':pr,'user_id':accounts['other']},422)
r.call('participants/remove.php',{'project_id':pr,'user_id':accounts['other'],'reassignments':{str(a2):accounts['student']}})
other.call('projects/detail.php',params={'project_id':pr},expect=404)
report=r.call('reports/project.php',{'project_id':pr});assert report['projects'][0]['progress']==50
s.call('reports/project.php',{'project_id':pr},403)
# Cambio de investigador mantiene datos y permite consultar propuesta de origen.
admin.call('projects/change-researcher.php',{'project_id':pr,'researcher_id':accounts['researcher2']})
r2.call('proposals/detail.php',params={'proposal_id':pid})
r.call('activities/create.php',{'project_id':pr,'description':'No','participant_id':accounts['student'],'deadline':'2027-02-01'},403)
c=r2.call('closures/request.php',{'project_id':pr,'observations':'Listo'})['id']
r2.call('activities/start.php',{'activity_id':a2},409)
admin.call('closures/review.php',{'closure_id':c,'decision':'changes_requested','observations':'Atiende pendiente'})
s.call('activities/start.php',{'activity_id':a2})
s.call('activities/submit.php',{'activity_id':a2})
r2.call('activities/review.php',{'activity_id':a2,'decision':'approved'})
c=r2.call('closures/request.php',{'project_id':pr})['id']
admin.call('closures/review.php',{'closure_id':c,'decision':'approved'})
r2.call('documents/delete.php',{'document_id':d},409)
r2.call('participants/add.php',{'project_id':pr,'user_id':accounts['other']},409)
admin.call('projects/change-researcher.php',{'project_id':pr,'researcher_id':accounts['researcher']},409)
s.call('activities/start.php',{'activity_id':a2},409)
r2.call('milestones/update.php',{'milestone_id':m,'description':'No','target_date':'2027-02-02','activity_ids':[a]},409)
assert r2.call('reports/project.php',{'project_id':pr})['projects'][0]['progress']==100
# Fuentes institucionales administradas solo por coordinación y accesibles para todos.
f={'title':'Lineamientos de prueba','filename':'lineamientos.txt','file_base64':base64.b64encode(b'Las propuestas deben registrar objetivos.').decode()}
doc=admin.call('institutional-documents/upload.php',f)['document_id']
s.call('institutional-documents/upload.php',f,403)
e.call('institutional-documents/download.php',params={'document_id':doc},raw=True)
admin.call('institutional-documents/update.php',dict(f,document_id=doc))
assert len(admin.call('institutional-documents/versions.php',params={'document_id':doc})['items'])==2
admin.call('institutional-documents/delete.php',{'document_id':doc})
e.call('institutional-documents/download.php',params={'document_id':doc},expect=404)
admin.call('users/change-status.php',{'user_id':accounts['outsider'],'status':'inactive'})
o.call('projects/list.php',expect=401)
print(f'PASS: {checks} comprobaciones HTTP y aserciones de flujo/permisos.')
