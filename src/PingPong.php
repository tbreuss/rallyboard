<?php
namespace App;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class PingPong implements MessageComponentInterface {
    protected $rooms = [];

    public function onOpen(ConnectionInterface $conn) {
        // Connection opened, waiting for the first message
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg);
        if (!$data || !isset($data->room)) return;

        $roomCode = $data->room;

        // If the connection is not yet assigned to a room
        if (!isset($from->roomCode)) {
            if (!isset($this->rooms[$roomCode])) {
                $this->rooms[$roomCode] = [];
            }

            // SAFETY: reject if the room already has 2 players
            if (count($this->rooms[$roomCode]) >= 2) {
                $from->send(json_encode([
                    "room" => $roomCode,
                    "error" => "game_in_progress"
                ]));
                $from->close();
                return;
            }

            $from->roomCode = $roomCode;
            $this->rooms[$roomCode][] = $from;
        }

        // Forward the message to the OTHER phone in the same room
        foreach ($this->rooms[$roomCode] as $client) {
            if ($client !== $from) {
                $client->send($msg);
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // Clean up when a player disconnects
        if (isset($conn->roomCode) && isset($this->rooms[$conn->roomCode])) {
            // Notify remaining players in the room
            foreach ($this->rooms[$conn->roomCode] as $client) {
                if ($client !== $conn) {
                    $client->send(json_encode([
                        "room" => $conn->roomCode,
                        "type" => "opponent_left"
                    ]));
                }
            }

            $key = array_search($conn, $this->rooms[$conn->roomCode]);
            if ($key !== false) {
                unset($this->rooms[$conn->roomCode][$key]);
            }
            if (count($this->rooms[$conn->roomCode]) === 0) {
                unset($this->rooms[$conn->roomCode]);
            }
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        $conn->close();
    }
}
