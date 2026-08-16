# Ustanavbat — Fullstack Sartaroshxona Navbat Tizimi

Backend REST API, `db.json` ma'lumotlar bazasi va `fetch` orqali to'liq integratsiya qilingan tizim.

---

## 🏗️ Arxitektura va Tuzilishi

- **`db.json`** — Loyihaning asosiy ma'lumotlar bazasi (`services`, `staff`, `inventory`, `orders`).
- **`server.js`** — Express REST API backend server (port `5000`), real-vaqtda `db.json` faylini o'qiydi va yozadi.
- **`src/api.js`** — Frontend `fetch` mijozi (GET, POST, PATCH, DELETE operatsiyalari).
- **`src/App.jsx`** — Asosiy dastur, avtomatik backend fetch va oflayn kesh mexanizmi.
- **`src/context.jsx`** — AppContext (global state va funksiyalar).
- **`src/data.js`** — Yordamchi hisob-kitob funksiyalari va zaxira ma'lumotlar.
- **`src/components/UI.jsx`** — UI komponentlar (Ticket, StatCard, Badge, TrendChart va boshqalar).
- **`src/pages/`**
  - **`ega.jsx`** — Ega bo'limi: Bugun, Ombor, Kadrlar, Analitika, Tarix.
  - **`agent.jsx`** — Agent bo'limi: Mening navbatim, Statistikam.
  - **`mijoz.jsx`** — Mijoz bo'limi: Yangi navbat, Mening navbatim, Narxlar.

---

## 🚀 Ishga Tushirish

### 1. Backend va Frontendni birgalikda ishga tushirish (Tavsiya etiladi):
```bash
npm run dev:all
# yoki
dev.bat
```

### 2. Alohida terminallarda ishga tushirish:

**Backend (REST API + db.json):**
```bash
npm run server
# Server: http://localhost:5000
```

**Frontend (React + Vite):**
```bash
npm run dev
# Frontend: http://localhost:5173
```

---

## 📡 REST API Endpointlar

| Metod | Manzil | Tavsif |
|---|---|---|
| `GET` | `/api/all` | Barcha ma'lumotlarni (`services`, `staff`, `orders`, `inventory`) bitta so'rovda olish |
| `GET` | `/api/orders` | Buyurtmalar ro'yxatini olish (`?date=`, `?staffId=`, `?status=`) |
| `POST` | `/api/orders` | Yangi navbat/buyurtma qo'shish va `db.json`ga saqlash |
| `PATCH` | `/api/orders/:id` | Buyurtma holatini yangilash (jarayonda, tugadi, kelmadi, bekor) |
| `DELETE` | `/api/orders/:id` | Buyurtmani o'chirish |
| `GET` | `/api/inventory` | Ombor mahsulotlarini olish |
| `PATCH` | `/api/inventory/:id` | Mahsulot sonini kamaytirish/ko'paytirish |
| `GET` | `/api/staff` | Xodimlar ro'yxatini olish |
| `POST` | `/api/staff` | Yangi xodim qo'shish |
| `DELETE` | `/api/staff/:id` | Xodimni o'chirish |
| `GET` | `/api/services` | Xizmatlar ro'yxatini olish |
