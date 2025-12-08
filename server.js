import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0"
});

console.log("✔ WebSocket Multiplayer Server aktif di port:", PORT);

// Semua pemain online
let players = {};

function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(json);
  });
}

wss.on("connection", ws => {
  const id = randomUUID();

  players[id] = {
    id,
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500)
  };

  console.log("Pemain masuk:", id);

  ws.send(JSON.stringify({
    type: "init",
    id,
    players
  }));

  broadcast({
    type: "player_join",
    player: players[id]
  });

  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "move") {
        if (players[id]) {
          players[id].x = data.x;
          players[id].y = data.y;
        }

        broadcast({
          type: "update",
          players
        });
      }
    } catch (e) {
      console.log("Error:", e);
    }
  });

  ws.on("close", () => {
    console.log("Pemain keluar:", id);
    delete players[id];

    broadcast({
      type: "player_leave",
      id
    });
  });
});