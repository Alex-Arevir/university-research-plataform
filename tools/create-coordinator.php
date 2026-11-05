<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
// Uso: php tools/create-coordinator.php coordinacion "Nombre completo"
$user=$argv[1]??''; $name=$argv[2]??'';
if (!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/',$user) || trim($name)==='') { fwrite(STDERR,"Uso: php tools/create-coordinator.php usuario \"Nombre completo\"\n"); exit(1); }
fwrite(STDOUT,"Contraseña (8 a 72 caracteres, mayúscula, minúscula y número): ");
$password=trim((string)fgets(STDIN));
if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}$/s',$password)) { fwrite(STDERR,"Contraseña inválida.\n"); exit(1); }
try {
 $db=require __DIR__.'/../backend/config/database.php';
 $s=$db->prepare('INSERT INTO users(name,username,password_hash,role) VALUES (?,?,?,"coordinator")');
 $s->execute([$name,$user,password_hash($password,PASSWORD_DEFAULT)]);
 echo "Coordinador creado. Inicia sesión y crea las demás cuentas desde Usuarios.\n";
} catch (Throwable $e) { fwrite(STDERR,"No se creó la cuenta. Comprueba la conexión, las tablas y que el usuario no exista.\n"); exit(1); }
