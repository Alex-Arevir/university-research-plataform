<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
$name=$argv[1]??'university_research_platform_complete';
if (!preg_match('/^[a-zA-Z0-9_]{3,64}$/',$name)) { fwrite(STDERR,"Nombre de base inválido.\n"); exit(1); }
$config=['host'=>'127.0.0.1','port'=>3306,'username'=>'root','password'=>''];
$path=__DIR__.'/../backend/config/database.local.php';
if (is_file($path)) $config=array_replace($config,require $path);
try {
 $db=new PDO('mysql:host='.$config['host'].';port='.$config['port'].';charset=utf8mb4',$config['username'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
 $db->exec('CREATE DATABASE IF NOT EXISTS `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
 $db->exec('USE `'.$name.'`');
 if ($db->query('SHOW TABLES')->fetch()) throw new RuntimeException('La base ya contiene tablas. Usa otro nombre; no se sobrescriben datos.');
 $db->exec(file_get_contents(__DIR__.'/../database/schema.sql'));
 $config['dbname']=$name;
 if (is_file($path) && !copy($path,__DIR__.'/../backend/config/database.local.backup-'.date('Ymd-His').'.php')) throw new RuntimeException('No se pudo respaldar la configuración anterior.');
 if (file_put_contents($path,"<?php\nreturn ".var_export($config,true).";\n")===false) throw new RuntimeException('No se pudo guardar la conexión.');
 echo "Base instalada y conexión configurada. Ahora crea el coordinador con tools/create-coordinator.php.\n";
} catch (Throwable $e) { fwrite(STDERR,"Instalación detenida: ".$e->getMessage()."\n"); exit(1); }
