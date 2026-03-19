import dotenv from "dotenv";
dotenv.config();

// 🔥 DEBUG
console.log("SERVER KEY:", process.env.MIDTRANS_SERVER_KEY);

import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import midtransClient from "midtrans-client";
import { Rcon } from "rcon-client";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase (used only to persist admin panel changes)
const firebaseConfig = {
  apiKey: "AIzaSyBElN5bsJV5-gwF2VR6HRUFFqt2yIFlOm0",
  authDomain: "evopixel-store.firebaseapp.com",
  projectId: "evopixel-store",
  storageBucket: "evopixel-store.firebasestorage.app",
  messagingSenderId: "845342254202",
  appId: "1:845342254202:web:f5819fb5dd6a9b5c0bc7c3",
  measurementId: "G-4C7CJY2240",
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const adminDocRef = doc(firestore, "admin", "store");

async function loadAdminStoreFromFirebase() {
  try {
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.warn("Could not load admin store from Firebase:", err);
    return null;
  }
}

async function persistAdminStoreToFirebase(data: any) {
  try {
    await setDoc(adminDocRef, data, { merge: true });
  } catch (err) {
    console.warn("Could not persist admin store to Firebase:", err);
  }
}

async function updateAdminStoreField(key: string, value: any) {
  try {
    await updateDoc(adminDocRef, { [key]: value });
  } catch (err) {
    if ((err as any)?.code === "not-found") {
      await persistAdminStoreToFirebase({ [key]: value });
    } else {
      console.warn("Could not update admin store field in Firebase:", err);
    }
  }
}

async function applyAdminStoreToDatabase(adminData: any) {
  if (!adminData) return;

  if (useMongoDB) {
    if (adminData.categories) {
      for (const cat of adminData.categories) {
        await Category.updateOne(
          { id: cat.id },
          { $set: { name: cat.name } },
          { upsert: true },
        );
      }
    }
    if (adminData.products) {
      for (const p of adminData.products) {
        await Product.updateOne({ id: p.id }, { $set: p }, { upsert: true });
      }
    }
    if (adminData.coupons) {
      for (const c of adminData.coupons) {
        await Coupon.updateOne({ code: c.code }, { $set: c }, { upsert: true });
      }
    }
    if (adminData.settings) {
      for (const [key, value] of Object.entries(adminData.settings)) {
        await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
      }
    }
  } else {
    if (adminData.categories) {
      const findStmt = sqlite.prepare("SELECT * FROM categories WHERE id = ?");
      const insertStmt = sqlite.prepare(
        "INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)",
      );
      const updateStmt = sqlite.prepare(
        "UPDATE categories SET name = ? WHERE id = ?",
      );
      for (const cat of adminData.categories) {
        const existing = findStmt.get(cat.id);
        if (existing) {
          updateStmt.run(cat.name, cat.id);
        } else {
          insertStmt.run(cat.id, cat.name, cat.icon || "Package");
        }
      }
    }
    if (adminData.products) {
      const stmt = sqlite.prepare(
        "INSERT OR REPLACE INTO products (id, name, price, category, command, perks, commands, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      for (const p of adminData.products) {
        stmt.run(
          p.id,
          p.name,
          p.price,
          p.category,
          p.command,
          JSON.stringify(p.perks || []),
          JSON.stringify(p.commands || []),
          p.image || "",
          p.sort_order ?? 0,
        );
      }
    }
    if (adminData.coupons) {
      const stmt = sqlite.prepare(
        "INSERT OR REPLACE INTO coupons (code, discount, active) VALUES (?, ?, ?)",
      );
      for (const c of adminData.coupons) {
        stmt.run(c.code, c.discount, c.active ? 1 : 0);
      }
    }
    if (adminData.settings) {
      const stmt = sqlite.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      );
      for (const [key, value] of Object.entries(adminData.settings)) {
        stmt.run(key, value);
      }
    }
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Database Setup
let useMongoDB = false;
const MONGODB_URI = process.env.MONGODB_URI;

// SQLite Fallback Setup
const sqlite = new Database("database.sqlite");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT UNIQUE,
    username TEXT,
    productId TEXT,
    productName TEXT,
    price REAL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT,
    icon TEXT DEFAULT 'Package'
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    category TEXT,
    command TEXT,
    description TEXT,
    perks TEXT, -- JSON string
    commands TEXT, -- JSON string
    image TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount REAL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Add icon to categories if it doesn't exist
try {
  sqlite.exec("ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'Package'");
} catch (e) {
  // Column already exists
}

// Migration: Add sort_order to products if it doesn't exist
try {
  sqlite.exec("ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists or table doesn't exist yet
}

// Migration: Add description to products if it doesn't exist
try {
  sqlite.exec("ALTER TABLE products ADD COLUMN description TEXT");
} catch (e) {
  // Column already exists or table doesn't exist yet
}

// MongoDB initialization (async) — used to decide whether to seed & read from Mongo
async function initializeDatabase() {
  const isValidMongoUri =
    MONGODB_URI &&
    MONGODB_URI.startsWith("mongodb") &&
    !MONGODB_URI.includes("YOUR_MONGODB_URI") &&
    MONGODB_URI.length > 20; // Basic check for a real-looking URI

  if (!isValidMongoUri) {
    console.log(
      "ℹ️ MONGODB_URI not detected or invalid. Using local SQLite database.",
    );
    console.log(
      "💡 To use MongoDB, add a valid MONGODB_URI in the Settings > Secrets menu.",
    );
    useMongoDB = false;
    return;
  }

  console.log("🔄 Attempting to connect to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Connected to MongoDB successfully.");
    useMongoDB = true;
  } catch (err: any) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.warn("⚠️ Falling back to local SQLite database.");
    console.log(
      "ℹ️ Ensure your MongoDB IP Whitelist allows connections from all IPs (0.0.0.0/0) for Cloud Run.",
    );
    useMongoDB = false;
  }
}

// Transaction Schema (Mongoose)
const transactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// User Schema (Mongoose)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, default: "Package" },
});
const Category = mongoose.model("Category", categorySchema);

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  active: { type: Boolean, default: true },
});
const Coupon = mongoose.model("Coupon", couponSchema);

// Setting Schema
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});
const Setting = mongoose.model("Setting", settingSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  command: { type: String, required: true },
  description: { type: String, default: "" },
  perks: [String],
  commands: [String],
  image: String,
  sort_order: { type: Number, default: 0 },
});
const Product = mongoose.model("Product", productSchema);

// Helper to save transaction
async function saveTransaction(data: any) {
  if (useMongoDB) {
    try {
      const newTransaction = new Transaction(data);
      await newTransaction.save();
      return;
    } catch (err) {
      console.error("MongoDB Save Error, trying SQLite:", err);
    }
  }

  // SQLite Fallback
  const stmt = sqlite.prepare(`
    INSERT INTO transactions (orderId, username, productId, productName, price, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.orderId,
    data.username,
    data.productId,
    data.productName,
    data.price,
    data.status,
  );
}

// Helper to update transaction
async function updateTransactionStatus(orderId: string, status: string) {
  if (useMongoDB) {
    try {
      await Transaction.findOneAndUpdate({ orderId }, { status });
      return;
    } catch (err) {
      console.error("MongoDB Update Error, trying SQLite:", err);
    }
  }

  // SQLite Fallback
  const stmt = sqlite.prepare(
    "UPDATE transactions SET status = ? WHERE orderId = ?",
  );
  stmt.run(status, orderId);
}

// Midtrans Setup
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;

if (
  !MIDTRANS_SERVER_KEY ||
  MIDTRANS_SERVER_KEY === "your_midtrans_server_key" ||
  MIDTRANS_SERVER_KEY.includes("YOUR_KEY")
) {
  console.warn("⚠️ MIDTRANS_SERVER_KEY is not configured correctly.");
  console.warn(
    "Please set MIDTRANS_SERVER_KEY in the Settings > Secrets menu.",
  );
}

if (
  !MIDTRANS_CLIENT_KEY ||
  MIDTRANS_CLIENT_KEY === "your_midtrans_client_key" ||
  MIDTRANS_CLIENT_KEY.includes("YOUR_KEY")
) {
  console.warn("⚠️ MIDTRANS_CLIENT_KEY is not configured correctly.");
  console.warn(
    "Please set MIDTRANS_CLIENT_KEY in the Settings > Secrets menu.",
  );
}

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// Products (Hardcoded for example)
const PRODUCTS = [
  {
    id: "sb_gold",
    name: "🟡 GOLD",
    price: 15000,
    category: "Skyblock Ranks",
    command: "lp user {username} parent add gold",
    perks: ["Special GOLD Kits", "Auction Limit: 8", "[GOLD] Rank Prefix"],
    commands: ["/heal", "/feed", "/ec (Enderchest)", "/wb (Workbench)"],
  },
  {
    id: "sb_diamond",
    name: "🔵 DIAMOND",
    price: 25000,
    category: "Skyblock Ranks",
    command: "lp user {username} parent add diamond",
    perks: [
      "Chat Emotes",
      "Special DIAMOND Kits",
      "Auction Limit: 11",
      "[DIAMOND] Rank Prefix",
    ],
    commands: ["/repair", "/feed", "/ec (Enderchest)", "/wb (Workbench)"],
  },
  {
    id: "sb_emerald",
    name: "🟢 EMERALD",
    price: 90000,
    category: "Skyblock Ranks",
    command: "lp user {username} parent add emerald",
    perks: [
      "Chat Emotes",
      "Special EMERALD Kits",
      "Island Fly",
      "Auction Limit: 13",
      "[EMERALD] Rank Prefix",
    ],
    commands: [
      "/repair",
      "/heal",
      "/feed",
      "/ec (Enderchest)",
      "/wb (Workbench)",
    ],
  },
  {
    id: "sb_netherite",
    name: "⚫ NETHERITE",
    price: 135000,
    category: "Skyblock Ranks",
    command: "lp user {username} parent add netherite",
    perks: [
      "Chat Emotes",
      "Special NETHERITE Kits",
      "Island Fly",
      "Auction Limit: 15",
      "[NETHERITE] Rank Prefix",
    ],
    commands: [
      "/gamma",
      "/repair",
      "/heal",
      "/feed",
      "/ec (Enderchest)",
      "/wb (Workbench)",
      "/smithtable",
      "/carttable",
    ],
  },
  {
    id: "rank_knight",
    name: "💂Knight",
    price: 25000,
    category: "Survival Ranks",
    command: "lp user {username} parent add knight",
    perks: ["/feed", "/pv 1", "/craft", "/ec", "/skin"],
  },
  {
    id: "rank_elite",
    name: "🕵️Elite",
    price: 50000,
    category: "Survival Ranks",
    command: "lp user {username} parent add elite",
    perks: ["/feed", "/pv 1,2", "/craft", "/anvil", "/ec", "/skin"],
  },
  {
    id: "rank_sage",
    name: "🧙Sage",
    price: 100000,
    category: "Survival Ranks",
    command: "lp user {username} parent add sage",
    perks: [
      "/feed",
      "/pv 1,2,3",
      "/craft",
      "/anvil",
      "/ec",
      "/skin",
      "/nickname",
      "/heal",
      "/fly",
    ],
  },
  {
    id: "rank_royal",
    name: "🥷Royal",
    price: 150000,
    category: "Survival Ranks",
    command: "lp user {username} parent add royal",
    perks: [
      "/feed",
      "/pv 1,2,3,4",
      "/craft",
      "/anvil",
      "/ec",
      "/skin",
      "/nickname",
      "/heal",
      "/repair",
      "/fly",
      "/vanish (1 Jam / day)",
    ],
  },
  {
    id: "rank_divine",
    name: "🧑‍⚖️Divine",
    price: 200000,
    category: "Survival Ranks",
    command: "lp user {username} parent add divine",
    perks: [
      "/feed",
      "/pv 1,2,3,4,5",
      "/craft",
      "/anvil",
      "/ec",
      "/skin",
      "/nickname",
      "/heal",
      "/repair",
      "/fly",
      "/vanish",
      "/tp",
      "/god",
    ],
  },
  {
    id: "coins_50",
    name: "50 Coins",
    price: 5000,
    category: "🧩 Coins",
    command: "eco give {username} 50",
  },
  {
    id: "coins_120",
    name: "120 Coins",
    price: 10000,
    category: "🧩 Coins",
    command: "eco give {username} 120",
  },
  {
    id: "coins_260",
    name: "260 Coins",
    price: 20000,
    category: "🧩 Coins",
    command: "eco give {username} 260",
  },
  {
    id: "coins_550",
    name: "550 Coins",
    price: 40000,
    category: "🧩 Coins",
    command: "eco give {username} 550",
  },
  {
    id: "coins_1200",
    name: "1.200 Coins",
    price: 80000,
    category: "🧩 Coins",
    command: "eco give {username} 1200",
  },
  {
    id: "coins_2500",
    name: "2.500 Coins",
    price: 150000,
    category: "🧩 Coins",
    command: "eco give {username} 2500",
  },
  {
    id: "coins_5500",
    name: "5.500 Coins",
    price: 300000,
    category: "🧩 Coins",
    command: "eco give {username} 5500",
  },
];

// RCON Helper
async function sendRconCommand(command: string) {
  try {
    const rcon = await Rcon.connect({
      host: process.env.RCON_HOST || "localhost",
      port: parseInt(process.env.RCON_PORT || "25575"),
      password: process.env.RCON_PASSWORD || "password",
    });
    const response = await rcon.send(command);
    console.log("RCON Response:", response);
    await rcon.end();
    return response;
  } catch (error) {
    console.error("RCON Error:", error);
    throw error;
  }
}

// API Endpoints
app.get("/api/categories", async (req, res) => {
  if (useMongoDB) {
    const categories = await Category.find();
    return res.json(categories);
  }
  const categories = sqlite.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

app.post("/api/categories", async (req, res) => {
  const { id, name, icon } = req.body;

  if (useMongoDB) {
    const oldCategory = await Category.findOne({ id });
    if (oldCategory && oldCategory.name !== name) {
      await Product.updateMany(
        { category: oldCategory.name },
        { category: name },
      );
    }
    await Category.findOneAndUpdate({ id }, { name, icon }, { upsert: true });
  } else {
    const oldCategory = sqlite
      .prepare("SELECT name FROM categories WHERE id = ?")
      .get(id) as { name: string } | undefined;
    if (oldCategory && oldCategory.name !== name) {
      sqlite
        .prepare("UPDATE products SET category = ? WHERE category = ?")
        .run(name, oldCategory.name);
    }
    sqlite
      .prepare(
        "INSERT OR REPLACE INTO categories (id, name, icon) VALUES (?, ?, ?)",
      )
      .run(id, name, icon || "Package");
  }

  // Persist admin panel category changes in Firebase so they survive restarts
  try {
    const categories = useMongoDB
      ? await Category.find()
      : sqlite.prepare("SELECT * FROM categories").all();
    await updateAdminStoreField("categories", categories);
  } catch (err) {
    console.warn("Failed to persist categories to Firebase:", err);
  }

  res.json({ success: true });
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongoDB) {
    await Category.deleteOne({ id });
  } else {
    sqlite.prepare("DELETE FROM categories WHERE id = ?").run(id);
  }

  // Persist admin panel category changes in Firebase
  try {
    const categories = useMongoDB
      ? await Category.find()
      : sqlite.prepare("SELECT * FROM categories").all();
    await updateAdminStoreField("categories", categories);
  } catch (err) {
    console.warn("Failed to persist categories to Firebase:", err);
  }

  res.json({ success: true });
});

app.get("/api/coupons", async (req, res) => {
  if (useMongoDB) {
    const coupons = await Coupon.find();
    return res.json(coupons);
  }
  const coupons = sqlite.prepare("SELECT * FROM coupons").all();
  res.json(coupons);
});

app.post("/api/coupons", async (req, res) => {
  const { code, discount, active } = req.body;
  if (useMongoDB) {
    await Coupon.findOneAndUpdate(
      { code },
      { discount, active },
      { upsert: true },
    );
  } else {
    sqlite
      .prepare(
        "INSERT OR REPLACE INTO coupons (code, discount, active) VALUES (?, ?, ?)",
      )
      .run(code, discount, active ? 1 : 0);
  }

  // Persist admin panel coupons changes in Firebase
  try {
    const coupons = useMongoDB
      ? await Coupon.find()
      : sqlite.prepare("SELECT * FROM coupons").all();
    await updateAdminStoreField("coupons", coupons);
  } catch (err) {
    console.warn("Failed to persist coupons to Firebase:", err);
  }

  res.json({ success: true });
});

app.delete("/api/coupons/:code", async (req, res) => {
  const { code } = req.params;
  if (useMongoDB) {
    await Coupon.deleteOne({ code });
  } else {
    sqlite.prepare("DELETE FROM coupons WHERE code = ?").run(code);
  }

  // Persist admin panel coupon changes in Firebase
  try {
    const coupons = useMongoDB
      ? await Coupon.find()
      : sqlite.prepare("SELECT * FROM coupons").all();
    await updateAdminStoreField("coupons", coupons);
  } catch (err) {
    console.warn("Failed to persist coupons to Firebase:", err);
  }

  res.json({ success: true });
});

app.get("/api/settings", async (req, res) => {
  if (useMongoDB) {
    const settings = await Setting.find();
    const result: any = {};
    settings.forEach((s) => (result[s.key] = s.value));
    return res.json(result);
  }
  const settings = sqlite.prepare("SELECT * FROM settings").all();
  const result: any = {};
  settings.forEach((s: any) => (result[s.key] = s.value));
  res.json(result);
});

app.post("/api/settings", async (req, res) => {
  const { key, value } = req.body;
  if (useMongoDB) {
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
  } else {
    sqlite
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, value);
  }

  // Persist admin panel settings changes in Firebase
  try {
    const settings = useMongoDB
      ? await Setting.find()
      : sqlite.prepare("SELECT * FROM settings").all();
    const settingsObj: any = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    await updateAdminStoreField("settings", settingsObj);
  } catch (err) {
    console.warn("Failed to persist settings to Firebase:", err);
  }

  res.json({ success: true });
});

app.get("/api/products", async (req, res) => {
  if (useMongoDB) {
    const products = await Product.find().sort({ sort_order: 1, id: 1 });
    return res.json(products);
  }
  const products = sqlite
    .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
    .all();
  const formatted = products.map((p: any) => ({
    ...p,
    description: p.description || "",
    perks: p.perks ? JSON.parse(p.perks) : [],
    commands: p.commands ? JSON.parse(p.commands) : [],
  }));
  res.json(formatted);
});

app.post("/api/products", async (req, res) => {
  const product = req.body;

  // Preserve existing description if the frontend did not send it
  if (product.description === undefined) {
    if (useMongoDB) {
      const existing = await Product.findOne({ id: product.id });
      if (existing) product.description = existing.description;
    } else {
      const existing: any = sqlite
        .prepare("SELECT description FROM products WHERE id = ?")
        .get(product.id);
      if (existing) product.description = existing.description;
    }
  }

  if (useMongoDB) {
    await Product.findOneAndUpdate({ id: product.id }, product, {
      upsert: true,
    });
  } else {
    sqlite
      .prepare(
        `
      INSERT OR REPLACE INTO products (id, name, price, category, command, description, perks, commands, image, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        product.id,
        product.name,
        product.price,
        product.category,
        product.command,
        product.description || null,
        JSON.stringify(product.perks || []),
        JSON.stringify(product.commands || []),
        product.image || null,
        product.sort_order || 0,
      );
  }

  // Persist admin panel products changes in Firebase
  try {
    const products = useMongoDB
      ? await Product.find().sort({ sort_order: 1, id: 1 })
      : sqlite
          .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
          .all();
    const formatted = products.map((p: any) => ({
      ...p,
      description: p.description || "",
      perks: p.perks ? JSON.parse(p.perks) : [],
      commands: p.commands ? JSON.parse(p.commands) : [],
    }));
    await updateAdminStoreField("products", formatted);
  } catch (err) {
    console.warn("Failed to persist products to Firebase:", err);
  }

  res.json({ success: true });
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongoDB) {
    await Product.deleteOne({ id });
  } else {
    sqlite.prepare("DELETE FROM products WHERE id = ?").run(id);
  }

  // Persist admin panel products changes in Firebase
  try {
    const products = useMongoDB
      ? await Product.find().sort({ sort_order: 1, id: 1 })
      : sqlite
          .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
          .all();
    const formatted = products.map((p: any) => ({
      ...p,
      description: p.description || "",
      perks: p.perks ? JSON.parse(p.perks) : [],
      commands: p.commands ? JSON.parse(p.commands) : [],
    }));
    await updateAdminStoreField("products", formatted);
  } catch (err) {
    console.warn("Failed to persist products to Firebase:", err);
  }

  res.json({ success: true });
});

app.post("/api/checkout", async (req, res) => {
  try {
    const { username, productId, couponCode } = req.body;

    let product: any = null;
    if (useMongoDB) {
      product = await Product.findOne({ id: productId });
    } else {
      const p: any = sqlite
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(productId);
      if (p) {
        product = {
          ...p,
          perks: p.perks ? JSON.parse(p.perks) : [],
          commands: p.commands ? JSON.parse(p.commands) : [],
        };
      }
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let finalPrice = product.price;
    if (couponCode) {
      let coupon: any = null;
      if (useMongoDB) {
        coupon = await Coupon.findOne({
          code: couponCode.trim().toUpperCase(),
          active: true,
        });
      } else {
        coupon = sqlite
          .prepare("SELECT * FROM coupons WHERE code = ? AND active = 1")
          .get(couponCode.trim().toUpperCase());
      }

      if (coupon) {
        finalPrice = Math.max(0, product.price - coupon.discount);
      }
    }

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice,
      },
      customer_details: {
        first_name: username,
      },
      item_details: [
        {
          id: product.id,
          price: finalPrice,
          quantity: 1,
          name:
            product.name +
            (finalPrice < product.price ? " (Discount Applied)" : ""),
        },
      ],
    };

    const midtransTransaction = await snap.createTransaction(parameter);

    // Save to DB (using helper)
    await saveTransaction({
      orderId,
      username,
      productId: product.id,
      productName: product.name,
      price: finalPrice,
      status: "pending",
    });

    res.json({
      token: midtransTransaction.token,
      redirect_url: midtransTransaction.redirect_url,
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);

    // Handle Midtrans specific errors
    if (
      error.httpStatusCode === 401 ||
      (error.ApiResponse && error.ApiResponse.error_messages)
    ) {
      return res.status(401).json({
        message:
          "Midtrans authentication failed. Please check your Server Key in the settings.",
        details: error.ApiResponse?.error_messages || [error.message],
      });
    }

    res.status(500).json({
      message: error.message || "Internal server error",
      details: error.stack,
    });
  }
});

app.post("/api/webhook", async (req, res) => {
  try {
    const notification = req.body;
    const statusResponse = await snap.transaction.notification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(
      `Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud: ${fraudStatus}`,
    );

    let finalStatus = "pending";

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        finalStatus = "challenge";
      } else if (fraudStatus === "accept") {
        finalStatus = "settlement";
      }
    } else if (transactionStatus === "settlement") {
      finalStatus = "settlement";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      finalStatus = "failed";
    } else if (transactionStatus === "pending") {
      finalStatus = "pending";
    }

    await updateTransactionStatus(orderId, finalStatus);

    // If payment successful, send RCON command
    if (finalStatus === "settlement") {
      // We need to find the transaction to get details for RCON
      let transactionData: any = null;

      if (useMongoDB) {
        transactionData = await Transaction.findOne({ orderId });
      } else {
        transactionData = sqlite
          .prepare("SELECT * FROM transactions WHERE orderId = ?")
          .get(orderId);
      }

      if (transactionData) {
        let product: any = null;
        if (useMongoDB) {
          product = await Product.findOne({ id: transactionData.productId });
        } else {
          const p: any = sqlite
            .prepare("SELECT * FROM products WHERE id = ?")
            .get(transactionData.productId);
          if (p) {
            product = {
              ...p,
              perks: p.perks ? JSON.parse(p.perks) : [],
              commands: p.commands ? JSON.parse(p.commands) : [],
            };
          }
        }

        if (product) {
          const command = product.command.replace(
            "{username}",
            transactionData.username,
          );
          await sendRconCommand(command);
          console.log(
            `Command sent for ${transactionData.username}: ${command}`,
          );
        }
      }
    }

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("Webhook Error:", error);
    res
      .status(500)
      .json({ message: "Webhook processing failed", error: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    if (username.toLowerCase() === "azmi") {
      return res.status(400).json({ message: "Username 'azmi' is reserved" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (useMongoDB) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
    } else {
      const existingUser = sqlite
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const stmt = sqlite.prepare(
        "INSERT INTO users (username, password) VALUES (?, ?)",
      );
      stmt.run(username, hashedPassword);
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    if (username === "azmi") {
      if (password === "adminn") {
        return res.json({
          message: "Login successful",
          username: "azmi",
          role: "admin",
        });
      } else {
        return res.status(401).json({ message: "Invalid password for admin" });
      }
    }

    let user: any = null;
    if (useMongoDB) {
      user = await User.findOne({ username });
    } else {
      user = sqlite
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      username: user.username,
      role: "user",
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res
        .status(400)
        .json({ message: "Username and new password are required" });
    }

    if (username.toLowerCase() === "azmi") {
      return res
        .status(403)
        .json({ message: "Admin password cannot be reset via this API" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (useMongoDB) {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.password = hashedPassword;
      await user.save();
    } else {
      const user = sqlite
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const stmt = sqlite.prepare(
        "UPDATE users SET password = ? WHERE username = ?",
      );
      stmt.run(hashedPassword, username);
    }

    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "Reset password failed", error: error.message });
  }
});

app.get("/api/midtrans-config", (req, res) => {
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isConfigured = !!(
    clientKey &&
    clientKey !== "your_midtrans_client_key" &&
    !clientKey.includes("YOUR_KEY")
  );

  res.json({
    clientKey: clientKey || "SB-Mid-client-YOUR_KEY",
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    isConfigured,
  });
});

// Seed initial data if empty
async function seedData() {
  const EVOPIXEL_IMAGE = "/images/EvoPixel.png";

  const categories = [
    { id: "skyblock_ranks", name: "Skyblock Ranks", icon: "Trophy" },
    { id: "survival_ranks", name: "Survival Ranks", icon: "Crown" },
    { id: "coins", name: "🧩 Coins", icon: "Coins" },
  ];

  const products = [
    {
      id: "sb_gold",
      name: "🟡 GOLD",
      price: 15000,
      category: "Skyblock Ranks",
      command: "lp user {username} parent add gold",
      perks: ["Special GOLD Kits", "Auction Limit: 8", "[GOLD] Rank Prefix"],
      commands: ["/heal", "/feed", "/ec (Enderchest)", "/wb (Workbench)"],
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=GOLD&font=montserrat",
    },
    {
      id: "sb_diamond",
      name: "🔵 DIAMOND",
      price: 25000,
      category: "Skyblock Ranks",
      command: "lp user {username} parent add diamond",
      perks: [
        "Chat Emotes",
        "Special DIAMOND Kits",
        "Auction Limit: 11",
        "[DIAMOND] Rank Prefix",
      ],
      commands: ["/repair", "/feed", "/ec (Enderchest)", "/wb (Workbench)"],
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=DIAMOND&font=montserrat",
    },
    {
      id: "sb_emerald",
      name: "🟢 EMERALD",
      price: 90000,
      category: "Skyblock Ranks",
      command: "lp user {username} parent add emerald",
      perks: [
        "Chat Emotes",
        "Special EMERALD Kits",
        "Island Fly",
        "Auction Limit: 13",
        "[EMERALD] Rank Prefix",
      ],
      commands: [
        "/repair",
        "/heal",
        "/feed",
        "/ec (Enderchest)",
        "/wb (Workbench)",
      ],
      image:
        "https://placehold.co/400x400/1a1a1a/10b981?text=EMERALD&font=montserrat",
    },
    {
      id: "sb_netherite",
      name: "⚫ NETHERITE",
      price: 135000,
      category: "Skyblock Ranks",
      command: "lp user {username} parent add netherite",
      perks: [
        "Chat Emotes",
        "Special NETHERITE Kits",
        "Island Fly",
        "Auction Limit: 15",
        "[NETHERITE] Rank Prefix",
      ],
      commands: [
        "/gamma",
        "/repair",
        "/heal",
        "/feed",
        "/ec (Enderchest)",
        "/wb (Workbench)",
        "/smithtable",
        "/carttable",
      ],
      image:
        "https://placehold.co/400x400/1a1a1a/4b5563?text=NETHERITE&font=montserrat",
    },
    {
      id: "rank_knight",
      name: "💂Knight",
      price: 25000,
      category: "Survival Ranks",
      command: "lp user {username} parent add knight",
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=KNIGHT&font=montserrat",
    },
    {
      id: "rank_elite",
      name: "🕵️Elite",
      price: 50000,
      category: "Survival Ranks",
      command: "lp user {username} parent add elite",
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=ELITE&font=montserrat",
    },
    {
      id: "rank_sage",
      name: "🧙Sage",
      price: 100000,
      category: "Survival Ranks",
      command: "lp user {username} parent add sage",
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=SAGE&font=montserrat",
    },
    {
      id: "rank_royal",
      name: "🥷Royal",
      price: 150000,
      category: "Survival Ranks",
      command: "lp user {username} parent add royal",
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=ROYAL&font=montserrat",
    },
    {
      id: "rank_divine",
      name: "🧑‍⚖️Divine",
      price: 200000,
      category: "Survival Ranks",
      command: "lp user {username} parent add divine",
      image:
        "https://placehold.co/400x400/1a1a1a/60a5fa?text=DIVINE&font=montserrat",
    },
    {
      id: "coins_50",
      name: "50 Coins",
      price: 5000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 50",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=50+COINS&font=montserrat",
    },
    {
      id: "coins_120",
      name: "120 Coins",
      price: 10000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 120",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=120+COINS&font=montserrat",
    },
    {
      id: "coins_260",
      name: "260 Coins",
      price: 20000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 260",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=260+COINS&font=montserrat",
    },
    {
      id: "coins_550",
      name: "550 Coins",
      price: 40000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 550",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=550+COINS&font=montserrat",
    },
    {
      id: "coins_1200",
      name: "1.200 Coins",
      price: 80000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 1200",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=1200+COINS&font=montserrat",
    },
    {
      id: "coins_2500",
      name: "2.500 Coins",
      price: 150000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 2500",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=2500+COINS&font=montserrat",
    },
    {
      id: "coins_5500",
      name: "5.500 Coins",
      price: 300000,
      category: "🧩 Coins",
      description: "This is the in-game currency you can spend in the shop.",
      command: "eco give {username} 5500",
      image:
        "https://placehold.co/400x400/1a1a1a/fbbf24?text=5500+COINS&font=montserrat",
    },
  ];

  // Force EvoPixel logo for all products (no external image URLs used)
  products.forEach((p) => {
    p.image = EVOPIXEL_IMAGE;
  });

  const coupons = [{ code: "RAMADAN", discount: 2000, active: true }];

  const settings = [
    {
      key: "coupon_banner_text",
      value: "Ramadan Sale 50% Discount! Use coupon code →",
    },
    { key: "show_coupon_banner", value: "true" },
    {
      key: "welcome_logo",
      value: EVOPIXEL_IMAGE,
    },
    {
      key: "hero_background",
      value: EVOPIXEL_IMAGE,
    },
    {
      key: "checkout_confirm_image",
      value: EVOPIXEL_IMAGE,
    },
  ];

  if (useMongoDB) {
    if ((await Category.countDocuments()) === 0) {
      await Category.insertMany(categories);
    } else {
      // Migration: Update icons for existing categories in MongoDB
      for (const cat of categories) {
        await Category.updateOne({ id: cat.id }, { $set: { icon: cat.icon } });
      }
    }
    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany(
        products.map((p, index) => ({ ...p, sort_order: index })),
      );
    } else {
      // Migration: Update sort_order for existing products in MongoDB
      const existingProducts = await Product.find();
      for (const p of products) {
        const index = products.indexOf(p);
        await Product.updateOne({ id: p.id }, { $set: { sort_order: index } });
      }
    }
    if ((await Coupon.countDocuments()) === 0) await Coupon.insertMany(coupons);
    if ((await Setting.countDocuments()) === 0)
      await Setting.insertMany(settings);
  } else {
    const catCount = sqlite
      .prepare("SELECT count(*) as count FROM categories")
      .get().count;
    if (catCount === 0) {
      const stmt = sqlite.prepare(
        "INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)",
      );
      categories.forEach((c) => stmt.run(c.id, c.name, c.icon));
    } else {
      // Migration: Update icons for existing categories in SQLite
      const stmt = sqlite.prepare(
        "UPDATE categories SET icon = ? WHERE id = ?",
      );
      categories.forEach((c) => stmt.run(c.icon, c.id));
    }
    const prodCount = sqlite
      .prepare("SELECT count(*) as count FROM products")
      .get().count;
    if (prodCount === 0) {
      const stmt = sqlite.prepare(
        "INSERT INTO products (id, name, price, category, command, description, perks, commands, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      products.forEach((p, index) =>
        stmt.run(
          p.id,
          p.name,
          p.price,
          p.category,
          p.command,
          p.description || null,
          JSON.stringify(p.perks || []),
          JSON.stringify(p.commands || []),
          p.image,
          index,
        ),
      );
    } else {
      // Migration: Update existing products with images if they don't have one
      const stmt = sqlite.prepare(
        "UPDATE products SET image = ? WHERE id = ? AND (image IS NULL OR image = '')",
      );
      products.forEach((p) => stmt.run(p.image, p.id));

      // Migration: Update sort_order for existing products based on their position in the hardcoded list
      const orderStmt = sqlite.prepare(
        "UPDATE products SET sort_order = ? WHERE id = ?",
      );
      products.forEach((p, index) => orderStmt.run(index, p.id));
    }
    const coupCount = sqlite
      .prepare("SELECT count(*) as count FROM coupons")
      .get().count;
    if (coupCount === 0) {
      const stmt = sqlite.prepare(
        "INSERT INTO coupons (code, discount, active) VALUES (?, ?, ?)",
      );
      coupons.forEach((c) => stmt.run(c.code, c.discount, c.active ? 1 : 0));
    }
    const settCount = sqlite
      .prepare("SELECT count(*) as count FROM settings")
      .get().count;
    if (settCount === 0) {
      const stmt = sqlite.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
      );
      settings.forEach((s) => stmt.run(s.key, s.value));
    }
  }

  // Apply any admin-configured overrides stored in Firebase (only relevant for admin panel changes)
  const adminStore = await loadAdminStoreFromFirebase();
  if (adminStore) {
    await applyAdminStoreToDatabase(adminStore);
  }
}

// Vite middleware for development
async function setupVite() {
  await initializeDatabase();
  await seedData();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // ✅ serve React build
    app.use(express.static(path.join(__dirname, "dist")));

    // ✅ SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();