<?php
declare(strict_types=1);
require_once __DIR__.'/auth/_session.php';

function fail(int $code, string $message): void {
    authJsonResponse($code, ['message'=>$message]);
}
function query(PDO $db, string $sql, array $args = []): PDOStatement {
    $stmt = $db->prepare($sql);
    $stmt->execute($args);
    return $stmt;
}
function requiredText(array $body, string $field, int $max): string {
    $value = $body[$field] ?? null;
    if (!is_string($value) || trim($value)==='' || strlen($value)>$max) {
        fail(422, "Revisa el campo $field.");
    }
    return trim($value);
}
function idField(array $body, string $field): int {
    $id = filter_var($body[$field] ?? null, FILTER_VALIDATE_INT, ['options'=>['min_range'=>1]]);
    if (!$id) fail(422, "Identificador inválido: $field.");
    return $id;
}
function history(PDO $db, int $id, int $actor, string $action, ?string $before, string $after, ?string $details=null): void {
    query($db,'INSERT INTO proposal_history (proposal_id,actor_id,action,previous_status,new_status,details) VALUES (?,?,?,?,?,?)',
        [$id,$actor,$action,$before,$after,$details]);
}
function activeRole(PDO $db, int $id, string $role): void {
    if (!query($db,'SELECT id FROM users WHERE id=? AND role=? AND status="active" FOR UPDATE',[$id,$role])->fetch()) {
        fail(422,'Selecciona una cuenta activa del rol requerido.');
    }
}

if (!isset($method, $module, $action)) fail(404, 'Operación no disponible.');
authHandleHttp($method);
try {
    $db = authDatabase();
    $user = authRequireUser($db);
    $actor = $user['id'];
    $role = $user['role'];
    $body = $method === 'GET' ? $_GET : json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) fail(400,'Envía un objeto JSON.');
    if ($method==='POST') $db->beginTransaction();

    if (in_array($action,['researchers','evaluators'],true)) {
        $allowed = $action==='researchers' ? ['student','coordinator'] : ['coordinator'];
        if (!in_array($role,$allowed,true)) fail(403,'Acceso denegado.');
        authJsonResponse(200,['items'=>query($db,'SELECT id,name FROM users WHERE status="active" AND role=? ORDER BY name',
            [$action==='researchers'?'researcher':'evaluator'])->fetchAll()]);
    }

    if ($module==='users') {
        require __DIR__.'/users/_actions.php';
    }

    $scope = [
        'student'=>['p.author_id=?',[$actor]],
        'researcher'=>['(p.author_id=? OR p.responsible_researcher_id=?)',[$actor,$actor]],
        'evaluator'=>['EXISTS (SELECT 1 FROM evaluation_assignments a WHERE a.proposal_id=p.id AND a.evaluator_id=? AND a.is_active=1)',[$actor]],
        'coordinator'=>['1=1',[]],
    ];
    [$where,$args]=$scope[$role];
    if ($action==='assignments' && !isset($body['proposal_id'])) {
        $filter = $role==='evaluator' ? "$where AND a.evaluator_id=? AND a.is_active=1" : $where;
        if ($role==='evaluator') $args[]=$actor;
        $items=query($db,"SELECT a.id,a.proposal_id,a.assigned_at,p.title,p.status,p.is_archived,u.name AS evaluator_name
            FROM evaluation_assignments a JOIN proposals p ON p.id=a.proposal_id
            JOIN users u ON u.id=a.evaluator_id WHERE $filter ORDER BY a.id DESC",$args)->fetchAll();
        authJsonResponse(200,['items'=>$items]);
    }
    if ($action==='list') {
        foreach (['status'=>'p.status','archived'=>'p.is_archived'] as $field=>$column) {
            if (isset($body[$field]) && $body[$field]!=='') {
                if (!is_string($body[$field])) fail(422, "Filtro inválido: $field.");
                if ($field==='archived' && !in_array($body[$field],['0','1'],true)) fail(422, 'archived debe ser 0 o 1.');
                $where.=" AND $column=?";
                $args[]=$body[$field];
            }
        }
        if (!empty($body['search'])) {
            if (!is_string($body['search'])) fail(422, 'Búsqueda inválida.');
            $where.=' AND p.title LIKE ?';
            $args[]='%'.$body['search'].'%';
        }
        $limit=max(1,min(100,(int)($body['limit']??20)));
        $page=max(1,min(100000,(int)($body['page']??1)));
        $offset=($page-1)*$limit;
        $total=query($db,"SELECT COUNT(*) FROM proposals p WHERE $where",$args)->fetchColumn();
        $items=query($db,"SELECT p.*, r.name AS researcher_name FROM proposals p JOIN users r ON r.id=p.responsible_researcher_id WHERE $where ORDER BY p.id DESC LIMIT $limit OFFSET $offset",$args)->fetchAll();
        authJsonResponse(200,['items'=>$items,'page'=>$page,'limit'=>$limit,'total'=>(int)$total]);
    }

    if ($action==='create') {
        if (!in_array($role,['student','researcher'],true)) fail(403,'Acceso denegado.');
        $researcher=$role==='student'?idField($body,'responsible_researcher_id'):$actor;
        activeRole($db,$researcher,'researcher');
        $status=$role==='student'?'pending_researcher_review':'pending_coordinator';
        query($db,'INSERT INTO proposals (title,description,objectives,author_id,responsible_researcher_id,status) VALUES (?,?,?,?,?,?)',
            [requiredText($body,'title',250),requiredText($body,'description',65535),requiredText($body,'objectives',65535),$actor,$researcher,$status]);
        $id=(int)$db->lastInsertId();
        history($db,$id,$actor,'created',null,$status);
        $db->commit();
        authJsonResponse(201,['proposal_id'=>$id,'status'=>$status]);
    }

    $id=idField($body,'proposal_id');
    $args[]=$id;
    $lock=$method==='POST'?' FOR UPDATE':'';
    $proposal=query($db,"SELECT p.*, r.name AS researcher_name FROM proposals p JOIN users r ON r.id=p.responsible_researcher_id WHERE $where AND p.id=?$lock",$args)->fetch();
    if (!$proposal) fail(404,'Propuesta no disponible.');
    $before=$proposal['status'];
    $after=$before;
    $observations=null;
    $archived=(bool)$proposal['is_archived'];
    if ($action==='detail') authJsonResponse(200,['proposal'=>$proposal]);
    if ($action==='history') {
        authJsonResponse(200,['items'=>query($db,'SELECT h.*,u.name AS actor_name FROM proposal_history h LEFT JOIN users u ON u.id=h.actor_id WHERE h.proposal_id=? ORDER BY h.id DESC',[$id])->fetchAll()]);
    }
    if ($archived && !in_array($action,['archive','assignments'],true)) fail(409,'La propuesta está archivada.');

    switch ($action) {
        case 'update':
        case 'resubmit':
            if ((int)$proposal['author_id']!==$actor) fail(403,'Solo el autor puede corregir.');
            if (!in_array($before,['changes_requested_researcher','changes_requested_evaluator'],true)) fail(409,'La propuesta no admite correcciones.');
            if ($action==='update') {
                $changes=[];
                $values=[];
                foreach (['title'=>250,'description'=>65535,'objectives'=>65535] as $field=>$max) {
                    if (!array_key_exists($field,$body)) continue;
                    $changes[]="$field=?";
                    $values[]=requiredText($body,$field,$max);
                }
                if (!$changes) fail(422,'Envía al menos un campo para corregir.');
                $values[]=$id;
                query($db,'UPDATE proposals SET '.implode(',',$changes).', correction_pending_resubmit=1 WHERE id=?',$values);
            } else {
                if (!$proposal['correction_pending_resubmit']) fail(409,'Guarda la corrección antes de reenviar.');
                $after=$before==='changes_requested_researcher'?'pending_researcher_review':'under_evaluation';
                query($db,'UPDATE proposals SET correction_pending_resubmit=0 WHERE id=?',[$id]);
            }
            break;
        case 'review':
            if ($role!=='researcher' || (int)$proposal['responsible_researcher_id']!==$actor || (int)$proposal['author_id']===$actor) fail(403,'Solo el investigador responsable puede revisar.');
            if ($before!=='pending_researcher_review') fail(409,'La revisión preliminar no está pendiente.');
            $decisions=['approved'=>'pending_coordinator','changes_requested'=>'changes_requested_researcher','rejected'=>'rejected'];
            $decision=requiredText($body,'decision',30);
            if (!isset($decisions[$decision])) fail(422,'Decisión inválida.');
            $observations=$decision==='changes_requested' || !empty($body['observations']) ? requiredText($body,'observations',65535) : null;
            $after=$decisions[$decision];
            query($db,'INSERT INTO proposal_reviews (proposal_id,researcher_id,decision,observations) VALUES (?,?,?,?)',[$id,$actor,$decision,$observations]);
            $action='review_'.$decision;
            break;
        case 'archive':
            if ($role!=='coordinator') fail(403,'Acceso denegado.');
            $archive=$body['archived']??null;
            if (!is_bool($archive)) fail(422,'archived debe ser booleano.');
            if ($archive!==$archived) {
                $after=$archive?$before:($proposal['status_before_archive']??$before);
                query($db,'UPDATE proposals SET is_archived=?,status_before_archive=? WHERE id=?',[(int)$archive,$archive?$before:null,$id]);
                $action=$archive?'archived':'unarchived';
            }
            break;
        case 'assign':
            if ($role!=='coordinator') fail(403,'Acceso denegado.');
            if ($before!=='pending_coordinator') fail(409,'La propuesta no está pendiente de coordinación.');
            $evaluator=idField($body,'evaluator_id');
            activeRole($db,$evaluator,'evaluator');
            query($db,'INSERT INTO evaluation_assignments (proposal_id,evaluator_id,assigned_by) VALUES (?,?,?)',[$id,$evaluator,$actor]);
            $after='under_evaluation';
            $observations="Evaluador #$evaluator";
            break;
        case 'assignments':
            authJsonResponse(200,['items'=>query($db,'SELECT a.*,u.name AS evaluator_name FROM evaluation_assignments a JOIN users u ON u.id=a.evaluator_id WHERE a.proposal_id=?'.($role==='evaluator'?' AND a.evaluator_id=? AND a.is_active=1':'').' ORDER BY a.id DESC',$role==='evaluator'?[$id,$actor]:[$id])->fetchAll()]);
        default:
            fail(404,'Operación no disponible.');
    }
    if ($before!==$after) query($db,'UPDATE proposals SET status=? WHERE id=?',[$after,$id]);
    if ($action!=='archive') history($db,$id,$actor,$action,$before,$after,$observations);
    $db->commit();
    authJsonResponse(200,['proposal_id'=>$id,'status'=>$after]);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    if ($error instanceof PDOException && $error->getCode()==='23000') fail(409,'El registro entra en conflicto con otro existente.');
    error_log($error->getMessage());
    fail(500,'No se pudo completar la operación.');
}
