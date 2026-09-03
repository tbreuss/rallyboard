<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use App\PingPong;

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/src/PingPong.php';

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new PingPong()
        )
    ),
    9999
);

echo "Your own PHP ping-pong server is running on port 8080...\n";
$server->run();
