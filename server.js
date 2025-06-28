const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const db = new sqlite3.Database("./db.sqlite");

app.use(cors());
app.use(bodyParser.json());

const ADMIN_PASS = "metrobet123";

// Creazione tabelle se non esistono
db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS login_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    screenshot TEXT,
    word TEXT,
    status TEXT DEFAULT 'pending'
  )\`);
  db.run(\`CREATE TABLE IF NOT EXISTS deposit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    amount INTEGER,
    screenshot TEXT,
    status TEXT DEFAULT 'pending'
  )\`);
});

const randomWords = ["banana", "carrozza", "esplosione", "volpe", "drago", "cubo", "portale", "pixel", "miniera", "fantasma"];

app.get("/api/random-word", (req, res) => {
  const word = randomWords[Math.floor(Math.random() * randomWords.length)];
  res.json({ word });
});

app.post("/api/login", (req, res) => {
  const { username, screenshot, word } = req.body;
  db.run("INSERT INTO login_requests (username, screenshot, word) VALUES (?, ?, ?)", [username, screenshot, word], err => {
    if (err) return res.status(500).send("Errore server");
    res.send("Richiesta di accesso inviata");
  });
});

app.post("/api/deposit", (req, res) => {
  const { username, amount, screenshot } = req.body;
  db.run("INSERT INTO deposit_requests (username, amount, screenshot) VALUES (?, ?, ?)", [username, amount, screenshot], err => {
    if (err) return res.status(500).send("Errore server");
    res.send("Richiesta di deposito inviata");
  });
});

app.get("/api/admin/all", (req, res) => {
  const pass = req.query.pass;
  if (pass !== ADMIN_PASS) return res.status(403).send("Non autorizzato");
  db.serialize(() => {
    db.all("SELECT * FROM login_requests WHERE status = 'pending'", (err, logins) => {
      db.all("SELECT * FROM deposit_requests WHERE status = 'pending'", (err2, deposits) => {
        res.json({ logins, deposits });
      });
    });
  });
});

app.post("/api/admin/moderate", (req, res) => {
  const { pass, type, id, approve } = req.body;
  if (pass !== ADMIN_PASS) return res.status(403).send("Non autorizzato");
  const status = approve ? "approved" : "rejected";
  const table = type === "login" ? "login_requests" : "deposit_requests";
  db.run(\`UPDATE \${table} SET status = ? WHERE id = ?\`, [status, id], err => {
    if (err) return res.status(500).send("Errore");
    res.send("Aggiornato");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Metrobet API attiva sulla porta " + PORT));
