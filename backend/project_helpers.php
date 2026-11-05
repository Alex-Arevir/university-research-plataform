<?php
declare(strict_types=1);
function projectAccess(PDO $db, array $user, int $id, bool $lock=false): array {
    $p=query($db,'SELECT p.*,u.name AS researcher_name FROM projects p JOIN users u ON u.id=p.responsible_researcher_id WHERE p.id=?'.($lock?' FOR UPDATE':''),[$id])->fetch();
    if (!$p) fail(404,'Proyecto no disponible.');
    $member=query($db,'SELECT id FROM participants WHERE project_id=? AND user_id=? AND is_active=1',[$id,$user['id']])->fetch();
    if ($user['role']!=='coordinator' && ($user['role']==='evaluator' || (!$member && (int)$p['responsible_researcher_id']!==$user['id']))) fail(404,'Proyecto no disponible.');
    return $p;
}
function projectLead(array $p,array $u): void {
    if ($u['role']!=='researcher' || (int)$p['responsible_researcher_id']!==$u['id']) fail(403,'Solo el investigador responsable administra este proyecto.');
}
function projectActive(array $p): void {
    if ($p['status']!=='active') fail(409,'El proyecto debe estar activo para modificarlo.');
}
function participantValid(PDO $db,int $pid,int $uid): void {
    if (!query($db,'SELECT t.id FROM participants t JOIN users u ON u.id=t.user_id WHERE t.project_id=? AND t.user_id=? AND t.is_active=1 AND u.status="active" AND u.role IN ("student","researcher")',[$pid,$uid])->fetch()) fail(422,'Selecciona un participante activo del proyecto.');
}
function eventProject(PDO $db,int $pid,int $actor,string $entity,int $id,string $action,array $data=[]): void {
    query($db,'INSERT INTO project_history(project_id,actor_id,entity,entity_id,action,details) VALUES (?,?,?,?,?,?)',[$pid,$actor,$entity,$id,$action,json_encode($data,JSON_UNESCAPED_UNICODE)]);
}
function dateField(array $b,string $key): string {
    $v=requiredText($b,$key,10); $d=DateTimeImmutable::createFromFormat('!Y-m-d',$v);
    if (!$d || $d->format('Y-m-d')!==$v) fail(422,'Fecha inválida.');
    return $v;
}
function projectList(PDO $db,array $u): array {
    $where=$u['role']==='coordinator'?'1=1':'(p.responsible_researcher_id=? OR EXISTS(SELECT 1 FROM participants t WHERE t.project_id=p.id AND t.user_id=? AND t.is_active=1))';
    if ($u['role']==='evaluator') return [];
    return query($db,'SELECT p.*,u.name AS researcher_name, (SELECT COUNT(*) FROM activities a WHERE a.project_id=p.id) AS total_activities, (SELECT COUNT(*) FROM activities a WHERE a.project_id=p.id AND a.status="completed") AS completed_activities FROM projects p JOIN users u ON u.id=p.responsible_researcher_id WHERE '.$where.' ORDER BY p.id DESC',$u['role']==='coordinator'?[]:[$u['id'],$u['id']])->fetchAll();
}
function documentAccess(PDO $db,array $u,int $id,bool $lock=false): array {
    $d=query($db,'SELECT * FROM documents WHERE id=? AND deleted_at IS NULL'.($lock?' FOR UPDATE':''),[$id])->fetch();
    if (!$d) fail(404,'Documento no disponible.');
    if ($d['kind']!=='institutional') {
        projectAccess($db,$u,(int)$d['project_id'],$lock);
        if ($d['restricted'] && $u['role']!=='researcher') fail(404,'Documento no disponible.');
    }
    return $d;
}
function filePayload(array $b): array {
    $name=basename(requiredText($b,'filename',255));
    $raw=$b['file_base64']??null;
    if (!is_string($raw) || strlen($raw)>14*1024*1024) fail(422,'Archivo demasiado grande (máximo 10 MB).');
    $bytes=base64_decode($raw,true);
    if ($bytes===false || strlen($bytes)===0 || strlen($bytes)>10*1024*1024) fail(422,'Archivo vacío o inválido.');
    $ext=strtolower(pathinfo($name,PATHINFO_EXTENSION));
    if (!in_array($ext,['pdf','txt','md','csv','docx','xlsx','png','jpg','jpeg'],true)) fail(422,'Formato permitido: PDF, TXT, MD, CSV, DOCX, XLSX, PNG o JPG.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->buffer($bytes) ?: 'application/octet-stream';
    $text='';
    if (in_array($ext,['txt','md','csv'],true)) $text=mb_convert_encoding($bytes,'UTF-8','UTF-8,Windows-1252');
    if (in_array($ext,['docx','xlsx'],true) && class_exists('ZipArchive')) {
        $tmp=tempnam(sys_get_temp_dir(),'research'); file_put_contents($tmp,$bytes); $z=new ZipArchive();
        if ($z->open($tmp)===true) {
            $entries=$ext==='docx'?['word/document.xml']:['xl/sharedStrings.xml'];
            foreach ($entries as $entry) { $stat=$z->statName($entry); $xml=($stat && $stat['size']<5*1024*1024)?$z->getFromName($entry):false; if ($xml!==false) $text.=' '.strip_tags(str_replace(['</w:p>','</si>'],"\n",$xml)); }
            $z->close();
        } unlink($tmp);
    }
    // Si pdftotext está instalado, indexa PDF con texto. Los escaneos necesitan OCR externo.
    if ($ext==='pdf' && function_exists('shell_exec') && is_string(getenv('PDFTOTEXT_BIN')) && getenv('PDFTOTEXT_BIN')!=='') {
        $tmp=tempnam(sys_get_temp_dir(),'research'); file_put_contents($tmp,$bytes);
        $text=(string)shell_exec(escapeshellarg(getenv('PDFTOTEXT_BIN')).' -enc UTF-8 '.escapeshellarg($tmp).' - 2>/dev/null'); unlink($tmp);
    }
    return [$name,$mime,$bytes,mb_substr($text,0,500000)];
}
function saveVersion(PDO $db,int $id,int $actor,array $b): void {
    [$name,$mime,$bytes,$text]=filePayload($b);
    $v=(int)query($db,'SELECT COALESCE(MAX(version),0)+1 FROM document_versions WHERE document_id=?',[$id])->fetchColumn();
    query($db,'INSERT INTO document_versions(document_id,version,filename,mime,content,text_content,uploaded_by) VALUES (?,?,?,?,?,?,?)',[$id,$v,$name,$mime,$bytes,$text,$actor]);
}
function projectReport(PDO $db,array $u,int $id): array {
    $p=projectAccess($db,$u,$id);
    if ($u['role']!=='coordinator') projectLead($p,$u);
    $p['participants']=query($db,'SELECT t.id,t.user_id,t.is_active,t.joined_at,t.removed_at,u.name,u.role FROM participants t JOIN users u ON u.id=t.user_id WHERE t.project_id=?',[$id])->fetchAll();
    $p['activities']=query($db,'SELECT a.*,u.name AS participant_name FROM activities a JOIN users u ON u.id=a.participant_id WHERE project_id=?',[$id])->fetchAll();
    $p['milestones']=query($db,'SELECT * FROM milestones WHERE project_id=?',[$id])->fetchAll();
    $n=count($p['activities']); $done=count(array_filter($p['activities'],fn($a)=>$a['status']==='completed'));
    $p['progress']=$n?round($done*100/$n,2):0;
    return $p;
}
