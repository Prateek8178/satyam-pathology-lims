# LIMS - Laboratory Management System
## Quick Start Guide

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`

---

## 🚀 Starting the Application

### Option 1: Run in separate terminals (Recommended)

**Terminal 1 — Backend:**
```powershell
cd "d:\lab management system\server"
npm run dev
```

**Terminal 2 — Frontend:**
```powershell
cd "d:\lab management system\client"
npm run dev
```

### Option 2: Use startup scripts
```powershell
# Backend
powershell -File "d:\lab management system\start-backend.ps1"
# Frontend (in new terminal)
powershell -File "d:\lab management system\start-frontend.ps1"
```

---

## 🌐 URLs
| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |
| Public Report Verify | http://localhost:5173/verify-report/:reportId |
| Patient Portal | http://localhost:5173/patient-portal |

---

## 🔑 Login Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | admin@lims.dev | Admin@123 |
| LAB_ADMIN | labadmin@lims.dev | Admin@123 |
| LAB_TECHNICIAN | tech@lims.dev | Tech@123 |
| RECEPTIONIST | reception@lims.dev | Reception@123 |
| PATHOLOGIST | path@lims.dev | Path@123 |
| ACCOUNTANT | accounts@lims.dev | Accounts@123 |

> ⚠️ Change all passwords before deploying to production!

---

## 🔄 Database Seeding

To reset and re-seed the database:
```powershell
cd "d:\lab management system\server"
npm run seed
```

This creates:
- 6 users (one per role)
- 3 sample doctors
- 3 sample patients
- 6 diagnostic tests (CBC, LFT, KFT, TSH, Lipid, Urine)
- Full test parameters with reference ranges
- 1 test package (Full Body Checkup @ ₹1499)
- Lab settings (PathLab Diagnostics)

---

## 📋 Full Laboratory Workflow

```
1. RECEPTIONIST: Register Patient → Create Order → Auto Invoice
2. TECHNICIAN: View Pending Samples → Collect Sample (scan barcode)
3. ANALYZER: POST /api/lis/results → MockAdapter receives & matches
   OR TECHNICIAN: Manual result entry
4. TECHNICIAN: Review Results → Send for Verification
5. PATHOLOGIST: Verify/Reject Results with remarks
6. TECHNICIAN: Generate Report (WITH_HEADER or WITHOUT_HEADER PDF)
7. ACCOUNTANT/RECEPTIONIST: Record Payment against Invoice
8. PATIENT: Download report via QR scan → /verify-report/:reportId
```

---

## 🔬 LIS Integration

Current adapter: **MockLISAdapter** (development mode)

To inject a test result via mock:
```bash
POST http://localhost:5000/api/lis/mock/inject
{
  "sampleId": "S-2026-000001",
  "results": [
    { "paramCode": "HGB", "paramName": "Hemoglobin", "value": "14.2", "unit": "g/dL" },
    { "paramCode": "WBC", "paramName": "WBC Count", "value": "6.8", "unit": "thousand/µL" }
  ]
}
```

To connect a real analyzer, update `LIS_ADAPTER_TYPE` in `server/.env`:
- `mock` — MockAdapter (default)
- `astm` — ASTM E1381 (requires configuration in ASTMAdapter.js)
- `hl7` — HL7 v2.x MLLP (requires configuration in HL7Adapter.js)

---

## 🏗️ Project Structure

```
d:\lab management system\
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # DB connection, constants
│   │   ├── controllers/       # 19 controllers (all routes logic)
│   │   ├── middleware/        # auth, error handler, audit logger
│   │   ├── models/            # 22 Mongoose schemas
│   │   ├── routes/            # 20 Express routers
│   │   ├── integrations/lis/  # LIS adapter (Mock/ASTM/HL7)
│   │   ├── pdf/               # PDFKit report generator
│   │   ├── services/          # ID generator, notifications
│   │   └── utils/             # Seed, flag calculator
│   └── uploads/               # Generated PDFs
│
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI + charts
│   │   ├── context/           # AuthContext (JWT)
│   │   ├── hooks/             # useAuth, useDebounce, usePagination
│   │   ├── layouts/           # AppLayout, Sidebar, Topbar
│   │   ├── pages/             # 22+ pages (all features)
│   │   ├── routes/            # ProtectedRoute, RoleRoute
│   │   └── services/          # 19 API service files
│   └── tailwind.config.js
│
├── start-backend.ps1
└── start-frontend.ps1
```

---

## 🔒 API Security

- **JWT Authentication**: 8-hour tokens, role claims embedded
- **Role-based authorization**: 6 roles, each with specific endpoint access
- **Rate limiting**: Auth endpoints (20 req/15min), API (200 req/min)
- **Helmet**: HTTP security headers
- **Audit logs**: Immutable AuditLog entries for all critical actions
- **Input validation**: Express-validator (extends as needed)

---

## 📄 PDF Reports

Two report types generated via PDFKit:
- **WITH_HEADER**: Full lab letterhead + logo + QR code
- **WITHOUT_HEADER**: Minimal, for hospital-letterhead printing

PDFs stored at: `server/uploads/reports/`

QR code links to: `http://localhost:5173/verify-report/:reportId`
