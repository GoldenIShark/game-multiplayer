const { WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ port: PORT });

console.log("✔ WebSocket Multiplayer Server aktif di port:", PORT);

let players = {};

function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(json);
  });
}

wss.on("connection", ws => {
  const id = randomUUID();

  players[id] = {
    id,
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500)
  };

  console.log("Player join:", id);

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
    let data;
    try { data = JSON.parse(msg); }
    catch { return; }

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
  });

  ws.on("close", () => {
    delete players[id];
    broadcast({ type: "player_leave", id });
    console.log("Player leave:", id);
  });
});
