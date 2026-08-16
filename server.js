import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Helper: read db.json safely
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = { services: [], staff: [], inventory: [], orders: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db.json:", err.message);
    return { services: [], staff: [], inventory: [], orders: [] };
  }
}

// Helper: write db.json safely
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing to db.json:", err.message);
    return false;
  }
}

// Helper: register routes with and without /api prefix
function addRoute(method, pathStr, handler) {
  const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  app[method](cleanPath, handler);
  app[method](`/api${cleanPath}`, handler);
}

// Health check
addRoute("get", "/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET all data in one call
addRoute("get", "/all", (req, res) => {
  const db = readDB();
  res.json(db);
});

// --- SERVICES ---
addRoute("get", "/services", (req, res) => {
  const db = readDB();
  res.json(db.services || []);
});

addRoute("post", "/services", (req, res) => {
  const db = readDB();
  const newService = {
    id: req.body.id || `s${Date.now()}`,
    name: req.body.name || "Noma'lum xizmat",
    price: Number(req.body.price) || 0,
    duration: Number(req.body.duration) || 30
  };
  db.services = db.services || [];
  db.services.push(newService);
  writeDB(db);
  res.status(201).json(newService);
});

// --- STAFF ---
addRoute("get", "/staff", (req, res) => {
  const db = readDB();
  res.json(db.staff || []);
});

addRoute("post", "/staff", (req, res) => {
  const db = readDB();
  const name = (req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ error: "Xodim ismi ko'rsatilishi shart" });
  }
  const newStaff = {
    id: req.body.id || `u${Date.now()}`,
    name
  };
  db.staff = db.staff || [];
  db.staff.push(newStaff);
  writeDB(db);
  res.status(201).json(newStaff);
});

addRoute("delete", "/staff/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLength = (db.staff || []).length;
  db.staff = (db.staff || []).filter((s) => s.id !== id);
  if (db.staff.length === initialLength) {
    return res.status(404).json({ error: "Xodim topilmadi" });
  }
  writeDB(db);
  res.json({ success: true, message: "Xodim o'chirildi", id });
});

// --- INVENTORY ---
addRoute("get", "/inventory", (req, res) => {
  const db = readDB();
  res.json(db.inventory || []);
});

addRoute("post", "/inventory", (req, res) => {
  const db = readDB();
  const newItem = {
    id: req.body.id || `inv-${Date.now()}`,
    name: req.body.name || "Mahsulot",
    qty: Number(req.body.qty) || 0,
    low: Number(req.body.low) || 3
  };
  db.inventory = db.inventory || [];
  db.inventory.push(newItem);
  writeDB(db);
  res.status(201).json(newItem);
});

addRoute("patch", "/inventory/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  let item = (db.inventory || []).find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Mahsulot topilmadi" });
  }
  Object.assign(item, req.body);
  if (typeof req.body.delta === "number") {
    item.qty = Math.max(0, (item.qty || 0) + req.body.delta);
  }
  writeDB(db);
  res.json(item);
});

addRoute("put", "/inventory/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const idx = (db.inventory || []).findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Mahsulot topilmadi" });
  }
  db.inventory[idx] = { ...req.body, id };
  writeDB(db);
  res.json(db.inventory[idx]);
});

// --- ORDERS ---
addRoute("get", "/orders", (req, res) => {
  const db = readDB();
  let orders = db.orders || [];
  const { date, staffId, status, phone } = req.query;
  if (date) orders = orders.filter((o) => o.date === date);
  if (staffId) orders = orders.filter((o) => o.staffId === staffId);
  if (status) orders = orders.filter((o) => o.status === status);
  if (phone) orders = orders.filter((o) => o.phone.includes(phone));
  res.json(orders);
});

addRoute("get", "/orders/:id", (req, res) => {
  const db = readDB();
  const order = (db.orders || []).find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
  res.json(order);
});

addRoute("post", "/orders", (req, res) => {
  const db = readDB();
  const orderData = req.body;
  if (!orderData.customerName || !orderData.phone || !orderData.serviceId || !orderData.date || !orderData.time) {
    return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
  }
  
  const newOrder = {
    id: orderData.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ticketNo: Number(orderData.ticketNo) || ((db.orders || []).filter(o => o.date === orderData.date).length + 1),
    customerName: orderData.customerName.trim(),
    phone: orderData.phone.trim(),
    serviceId: orderData.serviceId,
    staffId: orderData.staffId,
    date: orderData.date,
    time: orderData.time,
    status: orderData.status || "navbatda",
    paid: Boolean(orderData.paid),
    method: orderData.method || null
  };

  db.orders = db.orders || [];
  db.orders.push(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

addRoute("patch", "/orders/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const order = (db.orders || []).find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Buyurtma topilmadi" });
  }
  Object.assign(order, req.body);
  writeDB(db);
  res.json(order);
});

addRoute("put", "/orders/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const idx = (db.orders || []).findIndex((o) => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Buyurtma topilmadi" });
  }
  db.orders[idx] = { ...req.body, id };
  writeDB(db);
  res.json(db.orders[idx]);
});

addRoute("delete", "/orders/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLength = (db.orders || []).length;
  db.orders = (db.orders || []).filter((o) => o.id !== id);
  if (db.orders.length === initialLength) {
    return res.status(404).json({ error: "Buyurtma topilmadi" });
  }
  writeDB(db);
  res.json({ success: true, message: "Buyurtma o'chirildi", id });
});

// Full sync endpoint (saves all state)
addRoute("post", "/sync", (req, res) => {
  const { orders, inventory, staff, services } = req.body;
  const db = readDB();
  if (orders) db.orders = orders;
  if (inventory) db.inventory = inventory;
  if (staff) db.staff = staff;
  if (services) db.services = services;
  writeDB(db);
  res.json({ success: true, message: "Barcha ma'lumotlar saqlandi", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Ustanavbat Backend Server ishga tushdi!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Database: db.json`);
  console.log(`=========================================`);
});
