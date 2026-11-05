<?php
declare(strict_types=1);
if (!isset($db,$user,$body,$module,$action)) { http_response_code(404); exit; }
require_once __DIR__.'/project_helpers.php';
if ($module==='assistant') { require __DIR__.'/assistant.php'; }
if ($module==='dashboard') {
    $projects=projectList($db,$user);
    $scope=$role==='coordinator'?'1=1':($role==='evaluator'?'EXISTS(SELECT 1 FROM evaluation_assignments e WHERE e.proposal_id=p.id AND e.evaluator_id=?)':'(p.author_id=? OR p.responsible_researcher_id=?)');
    $args=$role==='coordinator'?[]:($role==='evaluator'?[$actor]:[$actor,$actor]);
    $count=(int)query($db,'SELECT COUNT(*) FROM proposals p WHERE '.$scope,$args)->fetchColumn();
    authJsonResponse(200,['counts'=>[$count,count(array_filter($projects,fn($p)=>$p['status']==='active')),array_sum(array_map(fn($p)=>(int)$p['total_activities']-(int)$p['completed_activities'],$projects)),count($projects)],'projects'=>$projects]);
}
if ($module==='catalogs') {
    if ($action==='participants') {
        $p=projectAccess($db,$user,idField($body,'project_id'));
        if (($body['all']??'')==='1') {
            projectLead($p,$user);
            $items=query($db,'SELECT id,name,role FROM users WHERE role IN ("student","researcher") AND status="active" ORDER BY name')->fetchAll();
        } else $items=query($db,'SELECT u.id,u.name,u.role FROM participants t JOIN users u ON u.id=t.user_id WHERE t.project_id=? AND t.is_active=1 AND u.status="active" ORDER BY u.name',[$p['id']])->fetchAll();
        authJsonResponse(200,['items'=>$items]);
    }
    fail(404,'Catálogo no disponible.');
}
if ($module==='reports') {
    if (!in_array($role,['researcher','coordinator'],true)) fail(403,'No puedes generar reportes.');
    $ids=$action==='general'?($body['project_ids']??[]):[idField($body,'project_id')];
    if ($action==='general' && $role!=='coordinator') fail(403,'Solo coordinación genera reportes generales.');
    if (!is_array($ids) || !$ids || count($ids)>100) fail(422,'Selecciona entre 1 y 100 proyectos.');
    $reports=[]; foreach ($ids as $pid) $reports[]=projectReport($db,$user,idField(['id'=>$pid],'id'));
    if ($db->inTransaction()) $db->commit();
    authJsonResponse(200,['generated_at'=>date(DATE_ATOM),'projects'=>$reports]);
}
if ($module==='projects' || $module==='monitoring') {
    if ($action==='list') authJsonResponse(200,['items'=>projectList($db,$user)]);
    $p=projectAccess($db,$user,idField($body,'project_id'),$method==='POST'); $pid=(int)$p['id'];
    if ($action==='detail') {
        $p['total_activities']=(int)query($db,'SELECT COUNT(*) FROM activities WHERE project_id=?',[$pid])->fetchColumn();
        $p['completed_activities']=(int)query($db,'SELECT COUNT(*) FROM activities WHERE project_id=? AND status="completed"',[$pid])->fetchColumn();
        authJsonResponse(200,['item'=>$p]);
    }
    if ($action==='history') authJsonResponse(200,['items'=>query($db,'SELECT h.*,u.name AS actor_name FROM project_history h JOIN users u ON u.id=h.actor_id WHERE project_id=? ORDER BY h.id DESC',[$pid])->fetchAll()]);
    if ($action==='change-researcher') {
        if ($role!=='coordinator') fail(403,'Solo coordinación puede cambiar al responsable.');
        projectActive($p); $uid=idField($body,'researcher_id'); activeRole($db,$uid,'researcher');
        query($db,'UPDATE projects SET responsible_researcher_id=? WHERE id=?',[$uid,$pid]);
        query($db,'INSERT INTO participants(project_id,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE is_active=1,removed_at=NULL',[$pid,$uid]);
        eventProject($db,$pid,$actor,'project',$pid,$action,['before'=>$p['responsible_researcher_id'],'after'=>$uid]);
        $db->commit(); authJsonResponse(200,['project_id'=>$pid]);
    }
    fail(404,'Operación no disponible.');
}
if (in_array($module,['documents','institutional-documents','evidence'],true)) {
    $institutional=$module==='institutional-documents';
    if ($action==='list') {
        if ($institutional) $items=query($db,'SELECT d.*, (SELECT MAX(version) FROM document_versions v WHERE v.document_id=d.id) AS version FROM documents d WHERE kind="institutional" AND deleted_at IS NULL ORDER BY id DESC')->fetchAll();
        else {
            $pid=idField($body,'project_id'); projectAccess($db,$user,$pid);
            $sql='SELECT d.*,(SELECT MAX(version) FROM document_versions v WHERE v.document_id=d.id) AS version FROM documents d WHERE project_id=? AND deleted_at IS NULL'.($role==='researcher'?'':' AND restricted=0');
            $args=[$pid];
            if ($module==='evidence') { $sql.=' AND activity_id=?'; $args[]=idField($body,'activity_id'); } else $sql.=' AND kind="project"';
            $items=query($db,$sql.' ORDER BY d.id DESC',$args)->fetchAll();
        }
        authJsonResponse(200,['items'=>$items]);
    }
    $d=null;
    if (!in_array($action,['upload'],true) || isset($body['document_id'])) $d=documentAccess($db,$user,idField($body,'document_id'),$method==='POST');
    if ($d && (($institutional && $d['kind']!=='institutional') || (!$institutional && $d['kind']==='institutional'))) fail(404,'Documento no disponible.');
    if ($action==='detail') authJsonResponse(200,['item'=>$d]);
    if ($action==='versions') authJsonResponse(200,['items'=>query($db,'SELECT id,version,filename,mime,uploaded_by,created_at,(CHAR_LENGTH(text_content)>0) AS indexed FROM document_versions WHERE document_id=? ORDER BY version DESC',[$d['id']])->fetchAll()]);
    if ($action==='download') {
        $args=[$d['id']]; $filter='';
        if (isset($body['version'])) { $filter=' AND version=?'; $args[]=idField($body,'version'); }
        $v=query($db,'SELECT * FROM document_versions WHERE document_id=?'.$filter.' ORDER BY version DESC LIMIT 1',$args)->fetch();
        if (!$v) fail(404,'Versión no disponible.');
        header('Content-Type: application/octet-stream'); header('X-Content-Type-Options: nosniff');
        header("Content-Disposition: attachment; filename*=UTF-8''".rawurlencode($v['filename'])); echo $v['content']; exit;
    }
    if ($institutional) { if ($role!=='coordinator') fail(403,'Solo coordinación administra fuentes institucionales.'); $pid=null; }
    else {
        $pid=$d?(int)$d['project_id']:idField($body,'project_id'); $p=projectAccess($db,$user,$pid,true); projectActive($p);
        if (!in_array($role,['student','researcher'],true)) fail(403,'Solo participantes pueden administrar archivos.');
    }
    if ($action==='upload' || $action==='update' || $action==='upload-version') {
        if (!$d) {
            $aid=null;
            if ($module==='evidence') {
                $aid=idField($body,'activity_id');
                $a=query($db,'SELECT * FROM activities WHERE id=? AND project_id=? FOR UPDATE',[$aid,$pid])->fetch();
                if (!$a || (int)$a['participant_id']!==$actor || !in_array($a['status'],['pending','in_progress'],true)) fail(403,'Solo el responsable puede adjuntar evidencia antes de la revisión.');
            }
            $title=$module==='evidence'?($body['filename']??'Evidencia'):requiredText($body,'title',250);
            query($db,'INSERT INTO documents(project_id,activity_id,title,kind) VALUES (?,?,?,?)',[$pid,$aid,$title,$institutional?'institutional':($module==='evidence'?'evidence':'project')]);
            $did=(int)$db->lastInsertId();
        } else {
            $did=(int)$d['id'];
            if ($d['kind']==='evidence') fail(409,'Adjunta una evidencia nueva para preservar la entrega.');
            if (isset($body['title'])) query($db,'UPDATE documents SET title=? WHERE id=?',[requiredText($body,'title',250),$did]);
        }
        saveVersion($db,$did,$actor,$body);
    } elseif ($action==='delete') {
        $did=(int)$d['id'];
        if (!$institutional && $d['blocked'] && $role==='student') fail(403,'El documento está bloqueado.');
        if ($d['kind']==='evidence') fail(409,'Las evidencias se conservan como historial.');
        query($db,'UPDATE documents SET deleted_at=NOW() WHERE id=?',[$did]);
    } elseif (in_array($action,['set-block','set-restriction'],true) && !$institutional) {
        projectLead($p,$user); $did=(int)$d['id']; $field=$action==='set-block'?'blocked':'restricted';
        if (!is_bool($body[$field]??null)) fail(422,'Selecciona Sí o No.');
        query($db,"UPDATE documents SET $field=? WHERE id=?",[(int)$body[$field],$did]);
    } else fail(404,'Operación no disponible.');
    if ($pid) eventProject($db,$pid,$actor,'document',$did,$action);
    $db->commit(); authJsonResponse(200,['document_id'=>$did]);
}
// Las entidades de trabajo siempre se resuelven contra su proyecto real.
$entityTables=['participants'=>'participants','activities'=>'activities','milestones'=>'milestones','closures'=>'closures'];
if (!isset($entityTables[$module])) fail(404,'Módulo no disponible.');
$table=$entityTables[$module]; $item=null;
$idKey=['participants'=>'participant_record_id','activities'=>'activity_id','milestones'=>'milestone_id','closures'=>'closure_id'][$module];
if (isset($body[$idKey])) {
    $item=query($db,"SELECT * FROM $table WHERE id=?".($method==='POST'?' FOR UPDATE':''),[idField($body,$idKey)])->fetch();
    if (!$item) fail(404,'Registro no disponible.');
    $pid=(int)$item['project_id'];
} else $pid=idField($body,'project_id');
$p=projectAccess($db,$user,$pid,$method==='POST');
if ($action==='list') {
    $select=[
        'participants'=>'SELECT t.*,u.name,u.role FROM participants t JOIN users u ON u.id=t.user_id WHERE t.project_id=?',
        'activities'=>'SELECT a.*,u.name AS participant_name, CASE WHEN a.status="completed" THEN "Completada" WHEN a.deadline<CURDATE() THEN "Retrasada" WHEN a.deadline<=DATE_ADD(CURDATE(),INTERVAL 3 DAY) THEN "Próxima a vencer" ELSE "Normal" END AS deadline_status FROM activities a JOIN users u ON u.id=a.participant_id WHERE a.project_id=?',
        'milestones'=>'SELECT m.*,(SELECT COUNT(*) FROM milestone_activities ma WHERE ma.milestone_id=m.id) AS activity_count FROM milestones m WHERE project_id=?',
        'closures'=>'SELECT c.*,u.name AS requester_name,p.title FROM closures c JOIN users u ON u.id=c.requested_by JOIN projects p ON p.id=c.project_id WHERE c.project_id=?',
    ]; authJsonResponse(200,['items'=>query($db,$select[$module].' ORDER BY id DESC',[$pid])->fetchAll()]);
}
if ($action==='detail') {
    if (!$item) fail(404,'Registro no disponible.');
    if ($module==='activities') {
        $days=(int)(new DateTimeImmutable('today'))->diff(new DateTimeImmutable($item['deadline']))->format('%r%a');
        $item['deadline_status']=$item['status']==='completed'?'Completada':($days<0?'Retrasada':($days<=3?'Próxima a vencer':'Normal'));
    }
    if ($module==='milestones') $item['activity_ids']=array_column(query($db,'SELECT activity_id FROM milestone_activities WHERE milestone_id=?',[$item['id']])->fetchAll(),'activity_id');
    authJsonResponse(200,['item'=>$item]);
}
if ($action==='history') authJsonResponse(200,['items'=>query($db,'SELECT h.*,u.name AS actor_name FROM project_history h JOIN users u ON u.id=h.actor_id WHERE project_id=? AND entity=? AND entity_id=? ORDER BY h.id DESC',[$pid,($module==='activities'?'activity':rtrim($module,'s')),$item['id']??0])->fetchAll()]);
if ($module!=='closures') projectActive($p);
if ($module==='participants') {
    projectLead($p,$user); $uid=idField($body,'user_id');
    if ($action==='add') {
        if (!query($db,'SELECT id FROM users WHERE id=? AND role IN ("student","researcher") AND status="active" FOR UPDATE',[$uid])->fetch()) fail(422,'Cuenta no válida para participar.');
        query($db,'INSERT INTO participants(project_id,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE is_active=1,removed_at=NULL',[$pid,$uid]);
    } elseif ($action==='remove') {
        if ($uid===(int)$p['responsible_researcher_id']) fail(409,'No puedes retirar al responsable del proyecto.');
        participantValid($db,$pid,$uid);
        $pending=query($db,'SELECT id FROM activities WHERE project_id=? AND participant_id=? AND status<>"completed" FOR UPDATE',[$pid,$uid])->fetchAll();
        $map=$body['reassignments']??[];
        if (is_string($map)) $map=json_decode($map,true);
        if (!is_array($map)) fail(422,'Reasignaciones debe ser un objeto JSON: {"actividad_id": usuario_id}.');
        foreach ($pending as $a) {
            $target=idField(['target'=>$map[$a['id']]??null],'target');
            if ($target===$uid) fail(422,'Reasigna a otro participante.'); participantValid($db,$pid,$target);
            query($db,'UPDATE activities SET participant_id=? WHERE id=?',[$target,$a['id']]);
            eventProject($db,$pid,$actor,'activity',(int)$a['id'],'reassign',['before'=>$uid,'after'=>$target]);
        }
        query($db,'UPDATE participants SET is_active=0,removed_at=NOW() WHERE project_id=? AND user_id=?',[$pid,$uid]);
    } else fail(404,'Operación no disponible.');
    $eid=$uid;
} elseif ($module==='activities') {
    $eid=(int)($item['id']??0);
    if (in_array($action,['create','update','reassign'],true)) {
        projectLead($p,$user); $uid=idField($body,'participant_id'); participantValid($db,$pid,$uid);
        if ($action==='create') {
            query($db,'INSERT INTO activities(project_id,description,participant_id,deadline) VALUES (?,?,?,?)',[$pid,requiredText($body,'description',65535),$uid,dateField($body,'deadline')]); $eid=(int)$db->lastInsertId();
        } else {
            if (!$item) fail(404,'Actividad no disponible.');
            if ($action==='reassign') query($db,'UPDATE activities SET participant_id=? WHERE id=?',[$uid,$eid]);
            else query($db,'UPDATE activities SET description=?,participant_id=?,deadline=? WHERE id=?',[requiredText($body,'description',65535),$uid,dateField($body,'deadline'),$eid]);
        }
    } elseif (in_array($action,['start','submit','review'],true)) {
        if (!$item) fail(404,'Actividad no disponible.');
        if ($action==='review') {
            projectLead($p,$user); if ($item['status']!=='in_review') fail(409,'La actividad no está en revisión.');
            $decision=requiredText($body,'decision',30);
            if (!in_array($decision,['approved','changes_requested'],true)) fail(422,'Decisión inválida.');
            $next=$decision==='approved'?'completed':'in_progress';
            $obs=$decision==='changes_requested'?requiredText($body,'observations',65535):(string)($body['observations']??'');
        } else {
            if ((int)$item['participant_id']!==$actor || !in_array($role,['student','researcher'],true)) fail(403,'Solo el participante asignado puede entregar la actividad.');
            $expected=$action==='start'?'pending':'in_progress'; if ($item['status']!==$expected) fail(409,'Estado de actividad incompatible.');
            $next=$action==='start'?'in_progress':'in_review'; $obs=(string)($body['comment']??'');
        }
        query($db,'UPDATE activities SET status=?,observations=? WHERE id=?',[$next,$obs,$eid]);
    } else fail(404,'Operación no disponible.');
} elseif ($module==='milestones') {
    projectLead($p,$user); $eid=(int)($item['id']??0);
    if (in_array($action,['create','update'],true)) {
        $ids=$body['activity_ids']??null;
        if (!is_array($ids) || !$ids) fail(422,'Asocia al menos una actividad.');
        $ids=array_unique($ids);
        foreach ($ids as $aid) if (!query($db,'SELECT id FROM activities WHERE id=? AND project_id=?',[idField(['id'=>$aid],'id'),$pid])->fetch()) fail(422,'Una actividad no pertenece al proyecto.');
        $desc=requiredText($body,'description',65535); $date=dateField($body,'target_date');
        if ($action==='create') { query($db,'INSERT INTO milestones(project_id,description,target_date) VALUES (?,?,?)',[$pid,$desc,$date]); $eid=(int)$db->lastInsertId(); }
        else { if (!$item) fail(404,'Hito no disponible.'); query($db,'UPDATE milestones SET description=?,target_date=?,status="pending" WHERE id=?',[$desc,$date,$eid]); query($db,'DELETE FROM milestone_activities WHERE milestone_id=?',[$eid]); }
        foreach ($ids as $aid) query($db,'INSERT INTO milestone_activities VALUES (?,?)',[$eid,$aid]);
    } elseif ($action==='achieve') {
        if (!$item) fail(404,'Hito no disponible.');
        $stats=query($db,'SELECT COUNT(*) AS total,SUM(a.status<>"completed") AS pending FROM milestone_activities ma JOIN activities a ON a.id=ma.activity_id WHERE milestone_id=?',[$eid])->fetch();
        if (!(int)$stats['total'] || (int)$stats['pending']) fail(409,'Todas las actividades del hito deben estar completadas.');
        query($db,'UPDATE milestones SET status="achieved" WHERE id=?',[$eid]);
    } else fail(404,'Operación no disponible.');
} elseif ($module==='closures') {
    if ($action==='request') {
        projectLead($p,$user); projectActive($p);
        query($db,'INSERT INTO closures(project_id,requested_by,observations) VALUES (?,?,?)',[$pid,$actor,(string)($body['observations']??'')]); $eid=(int)$db->lastInsertId();
        query($db,'UPDATE projects SET status="closing" WHERE id=?',[$pid]);
    } elseif ($action==='review') {
        if ($role!=='coordinator') fail(403,'Solo coordinación revisa el cierre.');
        if (!$item || $item['status']!=='pending' || $p['status']!=='closing') fail(409,'No hay solicitud pendiente.');
        $decision=requiredText($body,'decision',30); if (!in_array($decision,['approved','changes_requested'],true)) fail(422,'Decisión inválida.');
        $obs=$decision==='changes_requested'?requiredText($body,'observations',65535):(string)($body['observations']??''); $eid=(int)$item['id'];
        query($db,'UPDATE closures SET status=?,review_observations=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',[$decision,$obs,$actor,$eid]);
        query($db,'UPDATE projects SET status=? WHERE id=?',[$decision==='approved'?'finalized':'active',$pid]);
    } else fail(404,'Operación no disponible.');
}
eventProject($db,$pid,$actor,($module==='activities'?'activity':rtrim($module,'s')),$eid,$action,['before'=>$item,'input'=>array_diff_key($body,['file_base64'=>true])]);
$db->commit(); authJsonResponse(200,['id'=>$eid,'project_id'=>$pid]);
