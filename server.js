import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ port: PORT });

console.log("✔ WebSocket Multiplayer Server aktif di port:", PORT);

// data pemain
let players = {};

// broadcast
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(json);
  });
}

// koneksi masuk
wss.on("connection", ws => {
  const id = randomUUID();

  players[id] = {
    id,
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500),
    dir: "bawah",
    ts: Date.now()
  };

  console.log("▶ Pemain masuk:", id);

  ws.send(JSON.stringify({
    type: "init",
    id: id,
    players: players
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
          players[id].z = data.z;
          players[id].dir = data.dir;
          players[id].ts = data.ts;
        }

        broadcast({
          type: "update",
          players: players
        });
      }

    } catch (err) {
      console.log("❌ Error parsing:", err);
    }
  });

  ws.on("close", () => {
    console.log("⛔ Pemain keluar:", id);
    delete players[id];

    broadcast({
      type: "player_leave",
      id: id
    });
  });
});