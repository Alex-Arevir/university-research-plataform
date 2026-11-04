<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$password = $argv[1] ?? '';
if (strlen($password) < 12 || strlen($password) > 72) {
    fwrite(STDERR, "Indica una contraseña de prueba de 12 a 72 bytes. Usa una base local.\n");
    exit(1);
}
$db = require __DIR__.'/../backend/config/database.php';
$db->beginTransaction();
try {
    $users = [
        'demo.estudiante'=>['Ana Torres','student'],
        'demo.investigador'=>['Laura Méndez','researcher'],
        'demo.evaluador'=>['Elena Vargas','evaluator'],
        'demo.coordinador'=>['Carlos Ruiz','coordinator'],
    ];
    $ids=[];
    $find=$db->prepare('SELECT id,role FROM users WHERE username=?');
    $create=$db->prepare('INSERT INTO users (username,name,role,password_hash) VALUES (?,?,?,?)');
    $hash=password_hash($password,PASSWORD_DEFAULT);
    foreach ($users as $username=>[$name,$role]) {
        $find->execute([$username]);
        $existing=$find->fetch();
        if ($existing && $existing['role']!==$role) throw new RuntimeException("Rol inesperado para $username.");
        if (!$existing) $create->execute([$username,$name,$role,$hash]);
        $ids[$role]=$existing?(int)$existing['id']:(int)$db->lastInsertId();
    }
    $findProposal=$db->prepare('SELECT id FROM proposals WHERE author_id=? AND title=?');
    $createProposal=$db->prepare('INSERT INTO proposals (title,description,objectives,author_id,responsible_researcher_id,status) VALUES (?,?,?,?,?,?)');
    $history=$db->prepare('INSERT INTO proposal_history (proposal_id,actor_id,action,new_status) VALUES (?,?,?,?)');
    $samples=[
        ['student','[Demo] Huerto escolar','pending_researcher_review'],
        ['researcher','[Demo] Calidad del agua','pending_coordinator'],
    ];
    foreach ($samples as [$role,$title,$status]) {
        $findProposal->execute([$ids[$role],$title]);
        if ($findProposal->fetch()) continue;
        $createProposal->execute([$title,'Propuesta para ensayar el flujo de trabajo.','Medir y documentar los resultados.',$ids[$role],$ids['researcher'],$status]);
        $history->execute([(int)$db->lastInsertId(),$ids[$role],'created',$status]);
    }
    $db->commit();
    echo "Datos de prueba disponibles. Las cuentas existentes conservan su contraseña.\n";
} catch (Throwable $error) {
    $db->rollBack();
    fwrite(STDERR,$error->getMessage().PHP_EOL);
    exit(1);
}
