<?php
if (!isset($db, $role, $action)) {
    http_response_code(404);
    exit;
}
if ($role!=='coordinator') fail(403,'Solo coordinación administra usuarios.');
$columns='id,name,username,email,role,status,created_at,updated_at';
if ($action==='list') {
    authJsonResponse(200,['items'=>query($db,"SELECT $columns FROM users ORDER BY name,id")->fetchAll()]);
}
if ($action==='create') {
    $newRole=requiredText($body,'role',30);
    if (!in_array($newRole,authRoles(),true)) fail(422,'Rol inválido.');
    $password=requiredText($body,'password',72);
    if (strlen($password)<8) fail(422,'Usa al menos ocho caracteres.');
    $email=trim((string)($body['email']??''));
    if ($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Correo inválido.');
    query($db,'INSERT INTO users (name,username,email,password_hash,role) VALUES (?,?,?,?,?)',
        [requiredText($body,'name',150),requiredText($body,'username',80),$email?:null,password_hash($password,PASSWORD_DEFAULT),$newRole]);
    $id=(int)$db->lastInsertId();
} else {
    $id=idField($body,'user_id');
    $lock=$method==='POST'?' FOR UPDATE':'';
    $target=query($db,"SELECT $columns FROM users WHERE id=?$lock",[$id])->fetch();
    if (!$target) fail(404,'Usuario no encontrado.');
    if ($action==='detail') authJsonResponse(200,['user'=>$target]);
    switch ($action) {
        case 'update':
            $email=trim((string)($body['email']??$target['email']));
            if ($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Correo inválido.');
            query($db,'UPDATE users SET name=?,username=?,email=? WHERE id=?',
                [requiredText($body,'name',150),requiredText($body,'username',80),$email?:null,$id]);
            break;
        case 'change-status':
            $status=requiredText($body,'status',10);
            if (!in_array($status,['active','inactive'],true)) fail(422,'Estado inválido.');
            if ($id===$actor && $status==='inactive') fail(409,'No puedes desactivar tu propia cuenta.');
            query($db,'UPDATE users SET status=? WHERE id=?',[$status,$id]);
            break;
        case 'change-role':
            $newRole=requiredText($body,'role',30);
            if (!in_array($newRole,authRoles(),true)) fail(422,'Rol inválido.');
            if ($id===$actor && $newRole!==$role) fail(409,'No puedes cambiar tu propio rol.');
            query($db,'UPDATE users SET role=? WHERE id=?',[$newRole,$id]);
            break;
        case 'reset-password':
            $password=requiredText($body,'password',72);
            if (strlen($password)<8) fail(422,'Usa al menos ocho caracteres.');
            query($db,'UPDATE users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$id]);
            break;
        default:
            fail(404,'Operación no disponible.');
    }
    if (in_array($action,['change-status','change-role','reset-password'],true)) {
        query($db,'UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL',[$id]);
    }
}
$result=query($db,"SELECT $columns FROM users WHERE id=?",[$id])->fetch();
$db->commit();
authJsonResponse($action==='create'?201:200,['user'=>$result]);
