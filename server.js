const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// === Database ===
const db = new sqlite3.Database("metrobet.db");

// === Crea le tabelle se non esistono ===
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS login_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      screenshot_url TEXT NOT NULL,
      random_word TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS deposit_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      amount INTEGER NOT NULL,
      screenshot_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )
  `);
});

// === Funzione per parola casuale ===
function generateRandomWord() {
  const words = ["sword", "diamond", "nether", "block", "creeper", "piston", "spawner", "portal"];
  return words[Math.floor(Math.random() * words.length)];
}

// === Endpoint: Richiesta login ===
app.post("/login-request", (req, res) => {
  const { username, screenshot_url } = req.body;
  if (!username || !screenshot_url) return res.status(400).json({ error: "Missing data" });

  const randomWord = generateRandomWord();

  db.run(
    `INSERT INTO login_requests (username, screenshot_url, random_word) VALUES (?, ?, ?)`,
    [username, screenshot_url, randomWord],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, randomWord, requestId: this.lastID });
    }
  );
});

// === Endpoint: Richiesta deposito ===
app.post("/deposit-request", (req, res) => {
  const { username, amount, screenshot_url } = req.body;
  if (!username || !amount || !screenshot_url) return res.status(400).json({ error: "Missing data" });

  db.run(
    `INSERT INTO deposit_requests (username, amount, screenshot_url) VALUES (?, ?, ?)`,
    [username, amount, screenshot_url],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, requestId: this.lastID });
    }
  );
});

// === Endpoint: Lista richieste login (admin) ===
app.get("/admin/login-requests", (req, res) => {
  db.all(`SELECT * FROM login_requests ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// === Endpoint: Lista richieste deposito (admin) ===
app.get("/admin/deposit-requests", (req, res) => {
  db.all(`SELECT * FROM deposit_requests ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// === Endpoint: Approva o rifiuta login ===
app.post("/admin/login-requests/:id/:action", (req, res) => {
  const { id, action } = req.params;
  if (!["approved", "rejected"].includes(action)) return res.status(400).json({ error: "Invalid action" });

  db.run(`UPDATE login_requests SET status = ? WHERE id = ?`, [action, id], function (err) {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true });
  });
});

// === Endpoint: Approva o rifiuta deposito ===
app.post("/admin/deposit-requests/:id/:action", (req, res) => {
  const { id, action } = req.params;
  if (!["approved", "rejected"].includes(action)) return res.status(400).json({ error: "Invalid action" });

  db.run(`UPDATE deposit_requests SET status = ? WHERE id = ?`, [action, id], function (err) {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true });
  });
});

// === Avvio server ===
app.listen(port, () => {
  console.log(`✅ Metrobet backend attivo su http://localhost:${port}`);
});
📦 Altri file necessari
package.json:

json
Copia
Modifica
{
  "name": "metrobet-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "sqlite3": "^5.1.6"
  }
}

