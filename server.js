"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
// 🔥 DEBUG
console.log("SERVER KEY:", process.env.MIDTRANS_SERVER_KEY);
var express_1 = require("express");
var vite_1 = require("vite");
var mongoose_1 = require("mongoose");
var cors_1 = require("cors");
var midtrans_client_1 = require("midtrans-client");
var rcon_client_1 = require("rcon-client");
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var url_1 = require("url");
var bcryptjs_1 = require("bcryptjs");
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = Number(process.env.PORT) || 3000;
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
// Firebase (used only to persist admin panel changes)
var firebaseConfig = {
    apiKey: "AIzaSyBElN5bsJV5-gwF2VR6HRUFFqt2yIFlOm0",
    authDomain: "evopixel-store.firebaseapp.com",
    projectId: "evopixel-store",
    storageBucket: "evopixel-store.firebasestorage.app",
    messagingSenderId: "845342254202",
    appId: "1:845342254202:web:f5819fb5dd6a9b5c0bc7c3",
    measurementId: "G-4C7CJY2240",
};
var firebaseApp = (0, app_1.initializeApp)(firebaseConfig);
var firestore = (0, firestore_1.getFirestore)(firebaseApp);
var adminDocRef = (0, firestore_1.doc)(firestore, "admin", "store");
function loadAdminStoreFromFirebase() {
    return __awaiter(this, void 0, void 0, function () {
        var snap_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, firestore_1.getDoc)(adminDocRef)];
                case 1:
                    snap_1 = _a.sent();
                    if (!snap_1.exists())
                        return [2 /*return*/, null];
                    return [2 /*return*/, snap_1.data()];
                case 2:
                    err_1 = _a.sent();
                    console.warn("Could not load admin store from Firebase:", err_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function persistAdminStoreToFirebase(data) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, firestore_1.setDoc)(adminDocRef, data, { merge: true })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.warn("Could not persist admin store to Firebase:", err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateAdminStoreField(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        var err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 6]);
                    return [4 /*yield*/, (0, firestore_1.updateDoc)(adminDocRef, (_a = {}, _a[key] = value, _a))];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 2:
                    err_3 = _c.sent();
                    if (!((err_3 === null || err_3 === void 0 ? void 0 : err_3.code) === "not-found")) return [3 /*break*/, 4];
                    return [4 /*yield*/, persistAdminStoreToFirebase((_b = {}, _b[key] = value, _b))];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    console.warn("Could not update admin store field in Firebase:", err_3);
                    _c.label = 5;
                case 5: return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function applyAdminStoreToDatabase(adminData) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, cat, _b, _c, p, _d, _e, c, _f, _g, _h, key, value, findStmt, insertStmt, updateStmt, _j, _k, cat, existing, stmt, _l, _m, p, stmt, _o, _p, c, stmt, _q, _r, _s, key, value;
        var _t;
        return __generator(this, function (_u) {
            switch (_u.label) {
                case 0:
                    if (!adminData)
                        return [2 /*return*/];
                    if (!useMongoDB) return [3 /*break*/, 17];
                    if (!adminData.categories) return [3 /*break*/, 4];
                    _i = 0, _a = adminData.categories;
                    _u.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    cat = _a[_i];
                    return [4 /*yield*/, Category.updateOne({ id: cat.id }, { $set: { name: cat.name } }, { upsert: true })];
                case 2:
                    _u.sent();
                    _u.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (!adminData.products) return [3 /*break*/, 8];
                    _b = 0, _c = adminData.products;
                    _u.label = 5;
                case 5:
                    if (!(_b < _c.length)) return [3 /*break*/, 8];
                    p = _c[_b];
                    return [4 /*yield*/, Product.updateOne({ id: p.id }, { $set: p }, { upsert: true })];
                case 6:
                    _u.sent();
                    _u.label = 7;
                case 7:
                    _b++;
                    return [3 /*break*/, 5];
                case 8:
                    if (!adminData.coupons) return [3 /*break*/, 12];
                    _d = 0, _e = adminData.coupons;
                    _u.label = 9;
                case 9:
                    if (!(_d < _e.length)) return [3 /*break*/, 12];
                    c = _e[_d];
                    return [4 /*yield*/, Coupon.updateOne({ code: c.code }, { $set: c }, { upsert: true })];
                case 10:
                    _u.sent();
                    _u.label = 11;
                case 11:
                    _d++;
                    return [3 /*break*/, 9];
                case 12:
                    if (!adminData.settings) return [3 /*break*/, 16];
                    _f = 0, _g = Object.entries(adminData.settings);
                    _u.label = 13;
                case 13:
                    if (!(_f < _g.length)) return [3 /*break*/, 16];
                    _h = _g[_f], key = _h[0], value = _h[1];
                    return [4 /*yield*/, Setting.updateOne({ key: key }, { $set: { value: value } }, { upsert: true })];
                case 14:
                    _u.sent();
                    _u.label = 15;
                case 15:
                    _f++;
                    return [3 /*break*/, 13];
                case 16: return [3 /*break*/, 18];
                case 17:
                    if (adminData.categories) {
                        findStmt = sqlite.prepare("SELECT * FROM categories WHERE id = ?");
                        insertStmt = sqlite.prepare("INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)");
                        updateStmt = sqlite.prepare("UPDATE categories SET name = ? WHERE id = ?");
                        for (_j = 0, _k = adminData.categories; _j < _k.length; _j++) {
                            cat = _k[_j];
                            existing = findStmt.get(cat.id);
                            if (existing) {
                                updateStmt.run(cat.name, cat.id);
                            }
                            else {
                                insertStmt.run(cat.id, cat.name, cat.icon || "Package");
                            }
                        }
                    }
                    if (adminData.products) {
                        stmt = sqlite.prepare("INSERT OR REPLACE INTO products (id, name, price, category, command, perks, commands, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        for (_l = 0, _m = adminData.products; _l < _m.length; _l++) {
                            p = _m[_l];
                            stmt.run(p.id, p.name, p.price, p.category, p.command, JSON.stringify(p.perks || []), JSON.stringify(p.commands || []), p.image || "", (_t = p.sort_order) !== null && _t !== void 0 ? _t : 0);
                        }
                    }
                    if (adminData.coupons) {
                        stmt = sqlite.prepare("INSERT OR REPLACE INTO coupons (code, discount, active) VALUES (?, ?, ?)");
                        for (_o = 0, _p = adminData.coupons; _o < _p.length; _o++) {
                            c = _p[_o];
                            stmt.run(c.code, c.discount, c.active ? 1 : 0);
                        }
                    }
                    if (adminData.settings) {
                        stmt = sqlite.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
                        for (_q = 0, _r = Object.entries(adminData.settings); _q < _r.length; _q++) {
                            _s = _r[_q], key = _s[0], value = _s[1];
                            stmt.run(key, value);
                        }
                    }
                    _u.label = 18;
                case 18: return [2 /*return*/];
            }
        });
    });
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
// Database Setup
var useMongoDB = false;
var MONGODB_URI = process.env.MONGODB_URI;
// SQLite Fallback Setup
var sqlite = new better_sqlite3_1.default("database.sqlite");
sqlite.exec("\n  CREATE TABLE IF NOT EXISTS transactions (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    orderId TEXT UNIQUE,\n    username TEXT,\n    productId TEXT,\n    productName TEXT,\n    price REAL,\n    status TEXT DEFAULT 'pending',\n    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP\n  );\n  \n  CREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    username TEXT UNIQUE,\n    password TEXT,\n    role TEXT DEFAULT 'user',\n    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP\n  );\n\n  CREATE TABLE IF NOT EXISTS categories (\n    id TEXT PRIMARY KEY,\n    name TEXT,\n    icon TEXT DEFAULT 'Package'\n  );\n\n  CREATE TABLE IF NOT EXISTS products (\n    id TEXT PRIMARY KEY,\n    name TEXT,\n    price REAL,\n    category TEXT,\n    command TEXT,\n    description TEXT,\n    perks TEXT, -- JSON string\n    commands TEXT, -- JSON string\n    image TEXT,\n    sort_order INTEGER DEFAULT 0\n  );\n\n  CREATE TABLE IF NOT EXISTS coupons (\n    code TEXT PRIMARY KEY,\n    discount REAL,\n    active INTEGER DEFAULT 1\n  );\n\n  CREATE TABLE IF NOT EXISTS settings (\n    key TEXT PRIMARY KEY,\n    value TEXT\n  );\n");
// Migration: Add icon to categories if it doesn't exist
try {
    sqlite.exec("ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'Package'");
}
catch (e) {
    // Column already exists
}
// Migration: Add sort_order to products if it doesn't exist
try {
    sqlite.exec("ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0");
}
catch (e) {
    // Column already exists or table doesn't exist yet
}
// Migration: Add description to products if it doesn't exist
try {
    sqlite.exec("ALTER TABLE products ADD COLUMN description TEXT");
}
catch (e) {
    // Column already exists or table doesn't exist yet
}
// MongoDB initialization (async) — used to decide whether to seed & read from Mongo
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var isValidMongoUri, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isValidMongoUri = MONGODB_URI &&
                        MONGODB_URI.startsWith("mongodb") &&
                        !MONGODB_URI.includes("YOUR_MONGODB_URI") &&
                        MONGODB_URI.length > 20;
                    if (!isValidMongoUri) {
                        console.log("ℹ️ MONGODB_URI not detected or invalid. Using local SQLite database.");
                        console.log("💡 To use MongoDB, add a valid MONGODB_URI in the Settings > Secrets menu.");
                        useMongoDB = false;
                        return [2 /*return*/];
                    }
                    console.log("🔄 Attempting to connect to MongoDB...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })];
                case 2:
                    _a.sent();
                    console.log("✅ Connected to MongoDB successfully.");
                    useMongoDB = true;
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    console.error("❌ MongoDB Connection Error:", err_4.message);
                    console.warn("⚠️ Falling back to local SQLite database.");
                    console.log("ℹ️ Ensure your MongoDB IP Whitelist allows connections from all IPs (0.0.0.0/0) for Cloud Run.");
                    useMongoDB = false;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Transaction Schema (Mongoose)
var transactionSchema = new mongoose_1.default.Schema({
    orderId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
});
var Transaction = mongoose_1.default.model("Transaction", transactionSchema);
// User Schema (Mongoose)
var userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
var User = mongoose_1.default.model("User", userSchema);
// Category Schema
var categorySchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: "Package" },
});
var Category = mongoose_1.default.model("Category", categorySchema);
// Coupon Schema
var couponSchema = new mongoose_1.default.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    active: { type: Boolean, default: true },
});
var Coupon = mongoose_1.default.model("Coupon", couponSchema);
// Setting Schema
var settingSchema = new mongoose_1.default.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});
var Setting = mongoose_1.default.model("Setting", settingSchema);
// Product Schema
var productSchema = new mongoose_1.default.Schema({
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
var Product = mongoose_1.default.model("Product", productSchema);
// Helper to save transaction
function saveTransaction(data) {
    return __awaiter(this, void 0, void 0, function () {
        var newTransaction, err_5, stmt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!useMongoDB) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    newTransaction = new Transaction(data);
                    return [4 /*yield*/, newTransaction.save()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    err_5 = _a.sent();
                    console.error("MongoDB Save Error, trying SQLite:", err_5);
                    return [3 /*break*/, 4];
                case 4:
                    stmt = sqlite.prepare("\n    INSERT INTO transactions (orderId, username, productId, productName, price, status)\n    VALUES (?, ?, ?, ?, ?, ?)\n  ");
                    stmt.run(data.orderId, data.username, data.productId, data.productName, data.price, data.status);
                    return [2 /*return*/];
            }
        });
    });
}
// Helper to update transaction
function updateTransactionStatus(orderId, status) {
    return __awaiter(this, void 0, void 0, function () {
        var err_6, stmt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!useMongoDB) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Transaction.findOneAndUpdate({ orderId: orderId }, { status: status })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    err_6 = _a.sent();
                    console.error("MongoDB Update Error, trying SQLite:", err_6);
                    return [3 /*break*/, 4];
                case 4:
                    stmt = sqlite.prepare("UPDATE transactions SET status = ? WHERE orderId = ?");
                    stmt.run(status, orderId);
                    return [2 /*return*/];
            }
        });
    });
}
// Midtrans Setup
var MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
var MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
if (!MIDTRANS_SERVER_KEY ||
    MIDTRANS_SERVER_KEY === "your_midtrans_server_key" ||
    MIDTRANS_SERVER_KEY.includes("YOUR_KEY")) {
    console.warn("⚠️ MIDTRANS_SERVER_KEY is not configured correctly.");
    console.warn("Please set MIDTRANS_SERVER_KEY in the Settings > Secrets menu.");
}
if (!MIDTRANS_CLIENT_KEY ||
    MIDTRANS_CLIENT_KEY === "your_midtrans_client_key" ||
    MIDTRANS_CLIENT_KEY.includes("YOUR_KEY")) {
    console.warn("⚠️ MIDTRANS_CLIENT_KEY is not configured correctly.");
    console.warn("Please set MIDTRANS_CLIENT_KEY in the Settings > Secrets menu.");
}
var snap = new midtrans_client_1.default.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});
// Products (Hardcoded for example)
var PRODUCTS = [
    {
        id: "sb_gold",
        name: "GOLD",
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
function sendRconCommand(command) {
    return __awaiter(this, void 0, void 0, function () {
        var rcon, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, rcon_client_1.Rcon.connect({
                            host: process.env.RCON_HOST || "localhost",
                            port: parseInt(process.env.RCON_PORT || "25575"),
                            password: process.env.RCON_PASSWORD || "password",
                        })];
                case 1:
                    rcon = _a.sent();
                    return [4 /*yield*/, rcon.send(command)];
                case 2:
                    response = _a.sent();
                    console.log("RCON Response:", response);
                    return [4 /*yield*/, rcon.end()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, response];
                case 4:
                    error_1 = _a.sent();
                    console.error("RCON Error:", error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// API Endpoints
app.get("/api/categories", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var categories_1, categories;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Category.find()];
            case 1:
                categories_1 = _a.sent();
                return [2 /*return*/, res.json(categories_1)];
            case 2:
                categories = sqlite.prepare("SELECT * FROM categories").all();
                res.json(categories);
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/categories", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, name, icon, oldCategory, oldCategory, categories, _b, err_7;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, id = _a.id, name = _a.name, icon = _a.icon;
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Category.findOne({ id: id })];
            case 1:
                oldCategory = _c.sent();
                if (!(oldCategory && oldCategory.name !== name)) return [3 /*break*/, 3];
                return [4 /*yield*/, Product.updateMany({ category: oldCategory.name }, { category: name })];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3: return [4 /*yield*/, Category.findOneAndUpdate({ id: id }, { name: name, icon: icon }, { upsert: true })];
            case 4:
                _c.sent();
                return [3 /*break*/, 6];
            case 5:
                oldCategory = sqlite
                    .prepare("SELECT name FROM categories WHERE id = ?")
                    .get(id);
                if (oldCategory && oldCategory.name !== name) {
                    sqlite
                        .prepare("UPDATE products SET category = ? WHERE category = ?")
                        .run(name, oldCategory.name);
                }
                sqlite
                    .prepare("INSERT OR REPLACE INTO categories (id, name, icon) VALUES (?, ?, ?)")
                    .run(id, name, icon || "Package");
                _c.label = 6;
            case 6:
                _c.trys.push([6, 11, , 12]);
                if (!useMongoDB) return [3 /*break*/, 8];
                return [4 /*yield*/, Category.find()];
            case 7:
                _b = _c.sent();
                return [3 /*break*/, 9];
            case 8:
                _b = sqlite.prepare("SELECT * FROM categories").all();
                _c.label = 9;
            case 9:
                categories = _b;
                return [4 /*yield*/, updateAdminStoreField("categories", categories)];
            case 10:
                _c.sent();
                return [3 /*break*/, 12];
            case 11:
                err_7 = _c.sent();
                console.warn("Failed to persist categories to Firebase:", err_7);
                return [3 /*break*/, 12];
            case 12:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.delete("/api/categories/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, categories, _a, err_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                id = req.params.id;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Category.deleteOne({ id: id })];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                sqlite.prepare("DELETE FROM categories WHERE id = ?").run(id);
                _b.label = 3;
            case 3:
                _b.trys.push([3, 8, , 9]);
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Category.find()];
            case 4:
                _a = _b.sent();
                return [3 /*break*/, 6];
            case 5:
                _a = sqlite.prepare("SELECT * FROM categories").all();
                _b.label = 6;
            case 6:
                categories = _a;
                return [4 /*yield*/, updateAdminStoreField("categories", categories)];
            case 7:
                _b.sent();
                return [3 /*break*/, 9];
            case 8:
                err_8 = _b.sent();
                console.warn("Failed to persist categories to Firebase:", err_8);
                return [3 /*break*/, 9];
            case 9:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/coupons", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var coupons_1, coupons;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Coupon.find()];
            case 1:
                coupons_1 = _a.sent();
                return [2 /*return*/, res.json(coupons_1)];
            case 2:
                coupons = sqlite.prepare("SELECT * FROM coupons").all();
                res.json(coupons);
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/coupons", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, code, discount, active, coupons, _b, err_9;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, code = _a.code, discount = _a.discount, active = _a.active;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Coupon.findOneAndUpdate({ code: code }, { discount: discount, active: active }, { upsert: true })];
            case 1:
                _c.sent();
                return [3 /*break*/, 3];
            case 2:
                sqlite
                    .prepare("INSERT OR REPLACE INTO coupons (code, discount, active) VALUES (?, ?, ?)")
                    .run(code, discount, active ? 1 : 0);
                _c.label = 3;
            case 3:
                _c.trys.push([3, 8, , 9]);
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Coupon.find()];
            case 4:
                _b = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                _b = sqlite.prepare("SELECT * FROM coupons").all();
                _c.label = 6;
            case 6:
                coupons = _b;
                return [4 /*yield*/, updateAdminStoreField("coupons", coupons)];
            case 7:
                _c.sent();
                return [3 /*break*/, 9];
            case 8:
                err_9 = _c.sent();
                console.warn("Failed to persist coupons to Firebase:", err_9);
                return [3 /*break*/, 9];
            case 9:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.delete("/api/coupons/:code", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var code, coupons, _a, err_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                code = req.params.code;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Coupon.deleteOne({ code: code })];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                sqlite.prepare("DELETE FROM coupons WHERE code = ?").run(code);
                _b.label = 3;
            case 3:
                _b.trys.push([3, 8, , 9]);
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Coupon.find()];
            case 4:
                _a = _b.sent();
                return [3 /*break*/, 6];
            case 5:
                _a = sqlite.prepare("SELECT * FROM coupons").all();
                _b.label = 6;
            case 6:
                coupons = _a;
                return [4 /*yield*/, updateAdminStoreField("coupons", coupons)];
            case 7:
                _b.sent();
                return [3 /*break*/, 9];
            case 8:
                err_10 = _b.sent();
                console.warn("Failed to persist coupons to Firebase:", err_10);
                return [3 /*break*/, 9];
            case 9:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/settings", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var settings_1, result_1, settings, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Setting.find()];
            case 1:
                settings_1 = _a.sent();
                result_1 = {};
                settings_1.forEach(function (s) { return (result_1[s.key] = s.value); });
                return [2 /*return*/, res.json(result_1)];
            case 2:
                settings = sqlite.prepare("SELECT * FROM settings").all();
                result = {};
                settings.forEach(function (s) { return (result[s.key] = s.value); });
                res.json(result);
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/settings", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, key, value, settings, _b, settingsObj_1, err_11;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, key = _a.key, value = _a.value;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Setting.findOneAndUpdate({ key: key }, { value: value }, { upsert: true })];
            case 1:
                _c.sent();
                return [3 /*break*/, 3];
            case 2:
                sqlite
                    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
                    .run(key, value);
                _c.label = 3;
            case 3:
                _c.trys.push([3, 8, , 9]);
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Setting.find()];
            case 4:
                _b = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                _b = sqlite.prepare("SELECT * FROM settings").all();
                _c.label = 6;
            case 6:
                settings = _b;
                settingsObj_1 = {};
                settings.forEach(function (s) {
                    settingsObj_1[s.key] = s.value;
                });
                return [4 /*yield*/, updateAdminStoreField("settings", settingsObj_1)];
            case 7:
                _c.sent();
                return [3 /*break*/, 9];
            case 8:
                err_11 = _c.sent();
                console.warn("Failed to persist settings to Firebase:", err_11);
                return [3 /*break*/, 9];
            case 9:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var products_1, products, formatted;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Product.find().sort({ sort_order: 1, id: 1 })];
            case 1:
                products_1 = _a.sent();
                return [2 /*return*/, res.json(products_1)];
            case 2:
                products = sqlite
                    .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
                    .all();
                formatted = products.map(function (p) { return (__assign(__assign({}, p), { description: p.description || "", perks: p.perks ? JSON.parse(p.perks) : [], commands: p.commands ? JSON.parse(p.commands) : [] })); });
                res.json(formatted);
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var product, existing, existing, products, _a, formatted, err_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                product = req.body;
                if (!(product.description === undefined)) return [3 /*break*/, 3];
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Product.findOne({ id: product.id })];
            case 1:
                existing = _b.sent();
                if (existing)
                    product.description = existing.description;
                return [3 /*break*/, 3];
            case 2:
                existing = sqlite
                    .prepare("SELECT description FROM products WHERE id = ?")
                    .get(product.id);
                if (existing)
                    product.description = existing.description;
                _b.label = 3;
            case 3:
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Product.findOneAndUpdate({ id: product.id }, product, {
                        upsert: true,
                    })];
            case 4:
                _b.sent();
                return [3 /*break*/, 6];
            case 5:
                sqlite
                    .prepare("\n      INSERT OR REPLACE INTO products (id, name, price, category, command, description, perks, commands, image, sort_order)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ")
                    .run(product.id, product.name, product.price, product.category, product.command, product.description || null, JSON.stringify(product.perks || []), JSON.stringify(product.commands || []), product.image || null, product.sort_order || 0);
                _b.label = 6;
            case 6:
                _b.trys.push([6, 11, , 12]);
                if (!useMongoDB) return [3 /*break*/, 8];
                return [4 /*yield*/, Product.find().sort({ sort_order: 1, id: 1 })];
            case 7:
                _a = _b.sent();
                return [3 /*break*/, 9];
            case 8:
                _a = sqlite
                    .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
                    .all();
                _b.label = 9;
            case 9:
                products = _a;
                formatted = products.map(function (p) { return (__assign(__assign({}, p), { description: p.description || "", perks: p.perks ? JSON.parse(p.perks) : [], commands: p.commands ? JSON.parse(p.commands) : [] })); });
                return [4 /*yield*/, updateAdminStoreField("products", formatted)];
            case 10:
                _b.sent();
                return [3 /*break*/, 12];
            case 11:
                err_12 = _b.sent();
                console.warn("Failed to persist products to Firebase:", err_12);
                return [3 /*break*/, 12];
            case 12:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.delete("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, products, _a, formatted, err_13;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                id = req.params.id;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Product.deleteOne({ id: id })];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                sqlite.prepare("DELETE FROM products WHERE id = ?").run(id);
                _b.label = 3;
            case 3:
                _b.trys.push([3, 8, , 9]);
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Product.find().sort({ sort_order: 1, id: 1 })];
            case 4:
                _a = _b.sent();
                return [3 /*break*/, 6];
            case 5:
                _a = sqlite
                    .prepare("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
                    .all();
                _b.label = 6;
            case 6:
                products = _a;
                formatted = products.map(function (p) { return (__assign(__assign({}, p), { description: p.description || "", perks: p.perks ? JSON.parse(p.perks) : [], commands: p.commands ? JSON.parse(p.commands) : [] })); });
                return [4 /*yield*/, updateAdminStoreField("products", formatted)];
            case 7:
                _b.sent();
                return [3 /*break*/, 9];
            case 8:
                err_13 = _b.sent();
                console.warn("Failed to persist products to Firebase:", err_13);
                return [3 /*break*/, 9];
            case 9:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/checkout", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, productId, couponCode, product, p, finalPrice, coupon, orderId, parameter, midtransTransaction, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 10, , 11]);
                _a = req.body, username = _a.username, productId = _a.productId, couponCode = _a.couponCode;
                product = null;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, Product.findOne({ id: productId })];
            case 1:
                product = _c.sent();
                return [3 /*break*/, 3];
            case 2:
                p = sqlite
                    .prepare("SELECT * FROM products WHERE id = ?")
                    .get(productId);
                if (p) {
                    product = __assign(__assign({}, p), { perks: p.perks ? JSON.parse(p.perks) : [], commands: p.commands ? JSON.parse(p.commands) : [] });
                }
                _c.label = 3;
            case 3:
                if (!product) {
                    return [2 /*return*/, res.status(404).json({ message: "Product not found" })];
                }
                finalPrice = product.price;
                if (!couponCode) return [3 /*break*/, 7];
                coupon = null;
                if (!useMongoDB) return [3 /*break*/, 5];
                return [4 /*yield*/, Coupon.findOne({
                        code: couponCode.trim().toUpperCase(),
                        active: true,
                    })];
            case 4:
                coupon = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                coupon = sqlite
                    .prepare("SELECT * FROM coupons WHERE code = ? AND active = 1")
                    .get(couponCode.trim().toUpperCase());
                _c.label = 6;
            case 6:
                if (coupon) {
                    finalPrice = Math.max(0, product.price - coupon.discount);
                }
                _c.label = 7;
            case 7:
                orderId = "ORDER-".concat(Date.now(), "-").concat(Math.floor(Math.random() * 1000));
                parameter = {
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
                            name: product.name +
                                (finalPrice < product.price ? " (Discount Applied)" : ""),
                        },
                    ],
                };
                return [4 /*yield*/, snap.createTransaction(parameter)];
            case 8:
                midtransTransaction = _c.sent();
                // Save to DB (using helper)
                return [4 /*yield*/, saveTransaction({
                        orderId: orderId,
                        username: username,
                        productId: product.id,
                        productName: product.name,
                        price: finalPrice,
                        status: "pending",
                    })];
            case 9:
                // Save to DB (using helper)
                _c.sent();
                res.json({
                    token: midtransTransaction.token,
                    redirect_url: midtransTransaction.redirect_url,
                });
                return [3 /*break*/, 11];
            case 10:
                error_2 = _c.sent();
                console.error("Checkout Error:", error_2);
                // Handle Midtrans specific errors
                if (error_2.httpStatusCode === 401 ||
                    (error_2.ApiResponse && error_2.ApiResponse.error_messages)) {
                    return [2 /*return*/, res.status(401).json({
                            message: "Midtrans authentication failed. Please check your Server Key in the settings.",
                            details: ((_b = error_2.ApiResponse) === null || _b === void 0 ? void 0 : _b.error_messages) || [error_2.message],
                        })];
                }
                res.status(500).json({
                    message: error_2.message || "Internal server error",
                    details: error_2.stack,
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.post("/api/webhook", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var notification, statusResponse, orderId, transactionStatus, fraudStatus, finalStatus, transactionData, product, p, command, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                notification = req.body;
                return [4 /*yield*/, snap.transaction.notification(notification)];
            case 1:
                statusResponse = _a.sent();
                orderId = statusResponse.order_id;
                transactionStatus = statusResponse.transaction_status;
                fraudStatus = statusResponse.fraud_status;
                console.log("Transaction notification received. Order ID: ".concat(orderId, ". Status: ").concat(transactionStatus, ". Fraud: ").concat(fraudStatus));
                finalStatus = "pending";
                if (transactionStatus === "capture") {
                    if (fraudStatus === "challenge") {
                        finalStatus = "challenge";
                    }
                    else if (fraudStatus === "accept") {
                        finalStatus = "settlement";
                    }
                }
                else if (transactionStatus === "settlement") {
                    finalStatus = "settlement";
                }
                else if (transactionStatus === "cancel" ||
                    transactionStatus === "deny" ||
                    transactionStatus === "expire") {
                    finalStatus = "failed";
                }
                else if (transactionStatus === "pending") {
                    finalStatus = "pending";
                }
                return [4 /*yield*/, updateTransactionStatus(orderId, finalStatus)];
            case 2:
                _a.sent();
                if (!(finalStatus === "settlement")) return [3 /*break*/, 10];
                transactionData = null;
                if (!useMongoDB) return [3 /*break*/, 4];
                return [4 /*yield*/, Transaction.findOne({ orderId: orderId })];
            case 3:
                transactionData = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                transactionData = sqlite
                    .prepare("SELECT * FROM transactions WHERE orderId = ?")
                    .get(orderId);
                _a.label = 5;
            case 5:
                if (!transactionData) return [3 /*break*/, 10];
                product = null;
                if (!useMongoDB) return [3 /*break*/, 7];
                return [4 /*yield*/, Product.findOne({ id: transactionData.productId })];
            case 6:
                product = _a.sent();
                return [3 /*break*/, 8];
            case 7:
                p = sqlite
                    .prepare("SELECT * FROM products WHERE id = ?")
                    .get(transactionData.productId);
                if (p) {
                    product = __assign(__assign({}, p), { perks: p.perks ? JSON.parse(p.perks) : [], commands: p.commands ? JSON.parse(p.commands) : [] });
                }
                _a.label = 8;
            case 8:
                if (!product) return [3 /*break*/, 10];
                command = product.command.replace("{username}", transactionData.username);
                return [4 /*yield*/, sendRconCommand(command)];
            case 9:
                _a.sent();
                console.log("Command sent for ".concat(transactionData.username, ": ").concat(command));
                _a.label = 10;
            case 10:
                res.status(200).send("OK");
                return [3 /*break*/, 12];
            case 11:
                error_3 = _a.sent();
                console.error("Webhook Error:", error_3);
                res
                    .status(500)
                    .json({ message: "Webhook processing failed", error: error_3.message });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
app.post("/api/register", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, hashedPassword, existingUser, newUser, existingUser, stmt, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, username = _a.username, password = _a.password;
                if (!username || !password) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Username and password are required" })];
                }
                if (username.toLowerCase() === "azmi") {
                    return [2 /*return*/, res.status(400).json({ message: "Username 'azmi' is reserved" })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 1:
                hashedPassword = _b.sent();
                if (!useMongoDB) return [3 /*break*/, 4];
                return [4 /*yield*/, User.findOne({ username: username })];
            case 2:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({ message: "Username already exists" })];
                }
                newUser = new User({ username: username, password: hashedPassword });
                return [4 /*yield*/, newUser.save()];
            case 3:
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                existingUser = sqlite
                    .prepare("SELECT * FROM users WHERE username = ?")
                    .get(username);
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({ message: "Username already exists" })];
                }
                stmt = sqlite.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
                stmt.run(username, hashedPassword);
                _b.label = 5;
            case 5:
                res.status(201).json({ message: "User registered successfully" });
                return [3 /*break*/, 7];
            case 6:
                error_4 = _b.sent();
                console.error("Registration Error:", error_4);
                res
                    .status(500)
                    .json({ message: "Registration failed", error: error_4.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.post("/api/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, isPasswordValid, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, username = _a.username, password = _a.password;
                if (!username || !password) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Username and password are required" })];
                }
                if (username === "azmi") {
                    if (password === "adminn") {
                        return [2 /*return*/, res.json({
                                message: "Login successful",
                                username: "azmi",
                                role: "admin",
                            })];
                    }
                    else {
                        return [2 /*return*/, res.status(401).json({ message: "Invalid password for admin" })];
                    }
                }
                user = null;
                if (!useMongoDB) return [3 /*break*/, 2];
                return [4 /*yield*/, User.findOne({ username: username })];
            case 1:
                user = _b.sent();
                return [3 /*break*/, 3];
            case 2:
                user = sqlite
                    .prepare("SELECT * FROM users WHERE username = ?")
                    .get(username);
                _b.label = 3;
            case 3:
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ message: "Invalid username" })];
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
            case 4:
                isPasswordValid = _b.sent();
                if (!isPasswordValid) {
                    return [2 /*return*/, res.status(401).json({ message: "Invalid password" })];
                }
                res.json({
                    message: "Login successful",
                    username: user.username,
                    role: "user",
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _b.sent();
                console.error("Login Error:", error_5);
                res.status(500).json({ message: "Login failed", error: error_5.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.post("/api/reset-password", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, newPassword, hashedPassword, user, user, stmt, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, username = _a.username, newPassword = _a.newPassword;
                if (!username || !newPassword) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Username and new password are required" })];
                }
                if (username.toLowerCase() === "azmi") {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ message: "Admin password cannot be reset via this API" })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
            case 1:
                hashedPassword = _b.sent();
                if (!useMongoDB) return [3 /*break*/, 4];
                return [4 /*yield*/, User.findOne({ username: username })];
            case 2:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                user.password = hashedPassword;
                return [4 /*yield*/, user.save()];
            case 3:
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                user = sqlite
                    .prepare("SELECT * FROM users WHERE username = ?")
                    .get(username);
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                stmt = sqlite.prepare("UPDATE users SET password = ? WHERE username = ?");
                stmt.run(hashedPassword, username);
                _b.label = 5;
            case 5:
                res.json({ message: "Password reset successfully" });
                return [3 /*break*/, 7];
            case 6:
                error_6 = _b.sent();
                console.error("Reset Password Error:", error_6);
                res
                    .status(500)
                    .json({ message: "Reset password failed", error: error_6.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.get("/api/midtrans-config", function (req, res) {
    var clientKey = process.env.MIDTRANS_CLIENT_KEY;
    var isConfigured = !!(clientKey &&
        clientKey !== "your_midtrans_client_key" &&
        !clientKey.includes("YOUR_KEY"));
    res.json({
        clientKey: clientKey || "SB-Mid-client-YOUR_KEY",
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        isConfigured: isConfigured,
    });
});
// Seed initial data if empty
function seedData() {
    return __awaiter(this, void 0, void 0, function () {
        var EVOPIXEL_IMAGE, categories, products, coupons, settings, _i, categories_2, cat, existingProducts, _a, products_2, p, index, catCount, stmt_1, stmt_2, prodCount, stmt_3, stmt_4, orderStmt_1, coupCount, stmt_5, settCount, stmt_6, adminStore;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    EVOPIXEL_IMAGE = "/images/EvoPixel.png";
                    categories = [
                        { id: "skyblock_ranks", name: "Skyblock Ranks", icon: "Trophy" },
                        { id: "survival_ranks", name: "Survival Ranks", icon: "Crown" },
                        { id: "coins", name: "🧩 Coins", icon: "Coins" },
                    ];
                    products = [
                        {
                            id: "sb_gold",
                            name: "GOLD",
                            price: 15000,
                            category: "Skyblock Ranks",
                            command: "lp user {username} parent add gold",
                            perks: ["Special GOLD Kits", "Auction Limit: 8", "[GOLD] Rank Prefix"],
                            commands: ["/heal", "/feed", "/ec (Enderchest)", "/wb (Workbench)"],
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=GOLD&font=montserrat",
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
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=DIAMOND&font=montserrat",
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
                            image: "https://placehold.co/400x400/1a1a1a/10b981?text=EMERALD&font=montserrat",
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
                            image: "https://placehold.co/400x400/1a1a1a/4b5563?text=NETHERITE&font=montserrat",
                        },
                        {
                            id: "rank_knight",
                            name: "💂Knight",
                            price: 25000,
                            category: "Survival Ranks",
                            command: "lp user {username} parent add knight",
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=KNIGHT&font=montserrat",
                        },
                        {
                            id: "rank_elite",
                            name: "🕵️Elite",
                            price: 50000,
                            category: "Survival Ranks",
                            command: "lp user {username} parent add elite",
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=ELITE&font=montserrat",
                        },
                        {
                            id: "rank_sage",
                            name: "🧙Sage",
                            price: 100000,
                            category: "Survival Ranks",
                            command: "lp user {username} parent add sage",
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=SAGE&font=montserrat",
                        },
                        {
                            id: "rank_royal",
                            name: "🥷Royal",
                            price: 150000,
                            category: "Survival Ranks",
                            command: "lp user {username} parent add royal",
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=ROYAL&font=montserrat",
                        },
                        {
                            id: "rank_divine",
                            name: "🧑‍⚖️Divine",
                            price: 200000,
                            category: "Survival Ranks",
                            command: "lp user {username} parent add divine",
                            image: "https://placehold.co/400x400/1a1a1a/60a5fa?text=DIVINE&font=montserrat",
                        },
                        {
                            id: "coins_50",
                            name: "50 Coins",
                            price: 5000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 50",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=50+COINS&font=montserrat",
                        },
                        {
                            id: "coins_120",
                            name: "120 Coins",
                            price: 10000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 120",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=120+COINS&font=montserrat",
                        },
                        {
                            id: "coins_260",
                            name: "260 Coins",
                            price: 20000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 260",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=260+COINS&font=montserrat",
                        },
                        {
                            id: "coins_550",
                            name: "550 Coins",
                            price: 40000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 550",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=550+COINS&font=montserrat",
                        },
                        {
                            id: "coins_1200",
                            name: "1.200 Coins",
                            price: 80000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 1200",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=1200+COINS&font=montserrat",
                        },
                        {
                            id: "coins_2500",
                            name: "2.500 Coins",
                            price: 150000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 2500",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=2500+COINS&font=montserrat",
                        },
                        {
                            id: "coins_5500",
                            name: "5.500 Coins",
                            price: 300000,
                            category: "🧩 Coins",
                            description: "This is the in-game currency you can spend in the shop.",
                            command: "eco give {username} 5500",
                            image: "https://placehold.co/400x400/1a1a1a/fbbf24?text=5500+COINS&font=montserrat",
                        },
                    ];
                    // Force EvoPixel logo for all products (no external image URLs used)
                    products.forEach(function (p) {
                        p.image = EVOPIXEL_IMAGE;
                    });
                    coupons = [{ code: "RAMADAN", discount: 2000, active: true }];
                    settings = [
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
                    if (!useMongoDB) return [3 /*break*/, 22];
                    return [4 /*yield*/, Category.countDocuments()];
                case 1:
                    if (!((_b.sent()) === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, Category.insertMany(categories)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 3:
                    _i = 0, categories_2 = categories;
                    _b.label = 4;
                case 4:
                    if (!(_i < categories_2.length)) return [3 /*break*/, 7];
                    cat = categories_2[_i];
                    return [4 /*yield*/, Category.updateOne({ id: cat.id }, { $set: { icon: cat.icon } })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, Product.countDocuments()];
                case 8:
                    if (!((_b.sent()) === 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, Product.insertMany(products.map(function (p, index) { return (__assign(__assign({}, p), { sort_order: index })); }))];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 15];
                case 10: return [4 /*yield*/, Product.find()];
                case 11:
                    existingProducts = _b.sent();
                    _a = 0, products_2 = products;
                    _b.label = 12;
                case 12:
                    if (!(_a < products_2.length)) return [3 /*break*/, 15];
                    p = products_2[_a];
                    index = products.indexOf(p);
                    return [4 /*yield*/, Product.updateOne({ id: p.id }, { $set: { sort_order: index } })];
                case 13:
                    _b.sent();
                    _b.label = 14;
                case 14:
                    _a++;
                    return [3 /*break*/, 12];
                case 15: return [4 /*yield*/, Coupon.countDocuments()];
                case 16:
                    if (!((_b.sent()) === 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, Coupon.insertMany(coupons)];
                case 17:
                    _b.sent();
                    _b.label = 18;
                case 18: return [4 /*yield*/, Setting.countDocuments()];
                case 19:
                    if (!((_b.sent()) === 0)) return [3 /*break*/, 21];
                    return [4 /*yield*/, Setting.insertMany(settings)];
                case 20:
                    _b.sent();
                    _b.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    catCount = sqlite
                        .prepare("SELECT count(*) as count FROM categories")
                        .get().count;
                    if (catCount === 0) {
                        stmt_1 = sqlite.prepare("INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)");
                        categories.forEach(function (c) { return stmt_1.run(c.id, c.name, c.icon); });
                    }
                    else {
                        stmt_2 = sqlite.prepare("UPDATE categories SET icon = ? WHERE id = ?");
                        categories.forEach(function (c) { return stmt_2.run(c.icon, c.id); });
                    }
                    prodCount = sqlite
                        .prepare("SELECT count(*) as count FROM products")
                        .get().count;
                    if (prodCount === 0) {
                        stmt_3 = sqlite.prepare("INSERT INTO products (id, name, price, category, command, description, perks, commands, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        products.forEach(function (p, index) {
                            return stmt_3.run(p.id, p.name, p.price, p.category, p.command, p.description || null, JSON.stringify(p.perks || []), JSON.stringify(p.commands || []), p.image, index);
                        });
                    }
                    else {
                        stmt_4 = sqlite.prepare("UPDATE products SET image = ? WHERE id = ? AND (image IS NULL OR image = '')");
                        products.forEach(function (p) { return stmt_4.run(p.image, p.id); });
                        orderStmt_1 = sqlite.prepare("UPDATE products SET sort_order = ? WHERE id = ?");
                        products.forEach(function (p, index) { return orderStmt_1.run(index, p.id); });
                    }
                    coupCount = sqlite
                        .prepare("SELECT count(*) as count FROM coupons")
                        .get().count;
                    if (coupCount === 0) {
                        stmt_5 = sqlite.prepare("INSERT INTO coupons (code, discount, active) VALUES (?, ?, ?)");
                        coupons.forEach(function (c) { return stmt_5.run(c.code, c.discount, c.active ? 1 : 0); });
                    }
                    settCount = sqlite
                        .prepare("SELECT count(*) as count FROM settings")
                        .get().count;
                    if (settCount === 0) {
                        stmt_6 = sqlite.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
                        settings.forEach(function (s) { return stmt_6.run(s.key, s.value); });
                    }
                    _b.label = 23;
                case 23: return [4 /*yield*/, loadAdminStoreFromFirebase()];
                case 24:
                    adminStore = _b.sent();
                    if (!adminStore) return [3 /*break*/, 26];
                    return [4 /*yield*/, applyAdminStoreToDatabase(adminStore)];
                case 25:
                    _b.sent();
                    _b.label = 26;
                case 26: return [2 /*return*/];
            }
        });
    });
}
// Vite middleware for development
function setupVite() {
    return __awaiter(this, void 0, void 0, function () {
        var vite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initializeDatabase()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, seedData()];
                case 2:
                    _a.sent();
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "spa",
                        })];
                case 3:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 5];
                case 4:
                    // ✅ serve React build
                    app.use(express_1.default.static(path_1.default.join(__dirname, "dist")));
                    // ✅ SPA fallback
                    app.get("*", function (req, res) {
                        res.sendFile(path_1.default.join(__dirname, "dist", "index.html"));
                    });
                    _a.label = 5;
                case 5:
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("Server running on http://localhost:".concat(PORT));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
setupVite();
