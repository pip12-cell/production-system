import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory and initial empty database
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      departments: [],
      workers: [],
      records: [],
      settings: {
        factoryName: 'نظام إدارة الإنتاج والعمال',
        currency: 'جنيه',
        allowMultipleRecordsPerDay: false
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

function readDb(): any {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.departments)) parsed.departments = [];
    if (!Array.isArray(parsed.workers)) parsed.workers = [];
    if (!Array.isArray(parsed.records)) parsed.records = [];

    // Ensure departments have unitTiers
    let modified = false;
    parsed.departments = parsed.departments.map((dept: any) => {
      if (!Array.isArray(dept.unitTiers) || dept.unitTiers.length === 0) {
        const batch = Number(dept.unitBatch) || 25;
        const exp = Number(dept.expenseAmount) || 107;
        const tiers = [];
        for (let i = 1; i <= 10; i++) {
          tiers.push({
            id: `tier_${dept.id}_${i}`,
            departmentId: dept.id,
            units: batch * i,
            expenseAmount: Math.round(exp * i * 100) / 100
          });
        }
        dept.unitTiers = tiers;
        modified = true;
      }
      return dept;
    });

    if (modified) {
      writeDb(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Error reading database file, returning default empty db:', error);
    return {
      departments: [],
      workers: [],
      records: [],
      settings: {
        factoryName: 'نظام إدارة الإنتاج والعمال',
        currency: 'جنيه',
        allowMultipleRecordsPerDay: false
      }
    };
  }
}

function writeDb(data: any): void {
  ensureDatabase();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get full database
  app.get('/api/data', (req, res) => {
    try {
      const db = readDb();
      res.json(db);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في قراءة قاعدة البيانات' });
    }
  });

  // Settings
  app.post('/api/settings', (req, res) => {
    try {
      const db = readDb();
      db.settings = { ...db.settings, ...req.body };
      writeDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في حفظ الإعدادات' });
    }
  });

  // Departments CRUD
  app.post('/api/departments', (req, res) => {
    try {
      const { name, unitBatch, expenseAmount, unitTiers, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'اسم القسم مطلوب' });
      }
      const batchNum = Number(unitBatch) || 1;
      const expenseNum = Number(expenseAmount) || 0;
      if (batchNum <= 0) {
        return res.status(400).json({ error: 'عدد الوحدات الأساسي يجب أن يكون أكبر من صفر' });
      }
      if (expenseNum < 0) {
        return res.status(400).json({ error: 'قيمة المصاريف لا يمكن أن تكون سالبة' });
      }

      const deptId = 'dept_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const now = new Date().toISOString();

      // Process tiers if provided, or generate 10 default levels based on batch & expense
      let processedTiers: any[] = [];
      if (Array.isArray(unitTiers) && unitTiers.length > 0) {
        processedTiers = unitTiers
          .filter((t: any) => t && Number(t.units) > 0 && Number(t.expenseAmount) >= 0)
          .map((t: any, idx: number) => ({
            id: t.id || `tier_${deptId}_${idx + 1}_${Date.now()}`,
            departmentId: deptId,
            units: Math.round(Number(t.units)),
            expenseAmount: Math.round(Number(t.expenseAmount) * 100) / 100,
            createdAt: t.createdAt || now,
            updatedAt: now
          }));
      } else {
        // Generate standard 10 multiplier levels (e.g. 25->107, 50->214, 75->321...)
        for (let i = 1; i <= 10; i++) {
          const u = batchNum * i;
          const e = Math.round(expenseNum * i * 100) / 100;
          processedTiers.push({
            id: `tier_${deptId}_${i}_${Date.now()}`,
            departmentId: deptId,
            units: u,
            expenseAmount: e,
            createdAt: now,
            updatedAt: now
          });
        }
      }

      // Sort tiers by units ascending
      processedTiers.sort((a, b) => a.units - b.units);

      const db = readDb();
      const newDept = {
        id: deptId,
        name: name.trim(),
        unitBatch: processedTiers[0]?.units || batchNum,
        expenseAmount: processedTiers[0]?.expenseAmount ?? expenseNum,
        unitPrice: expenseNum / batchNum,
        unitTiers: processedTiers,
        notes: notes ? notes.trim() : '',
        createdAt: now,
        updatedAt: now
      };
      db.departments.push(newDept);
      writeDb(db);
      res.status(201).json(newDept);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في إضافة القسم' });
    }
  });

  app.put('/api/departments/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, unitBatch, expenseAmount, unitTiers, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'اسم القسم مطلوب' });
      }
      const batchNum = Number(unitBatch) || 1;
      const expenseNum = Number(expenseAmount) || 0;

      const db = readDb();
      const index = db.departments.findIndex((d: any) => d.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'القسم غير موجود' });
      }

      const now = new Date().toISOString();
      let processedTiers: any[] = [];
      if (Array.isArray(unitTiers) && unitTiers.length > 0) {
        processedTiers = unitTiers
          .filter((t: any) => t && Number(t.units) > 0 && Number(t.expenseAmount) >= 0)
          .map((t: any, idx: number) => ({
            id: t.id || `tier_${id}_${idx + 1}_${Date.now()}`,
            departmentId: id,
            units: Math.round(Number(t.units)),
            expenseAmount: Math.round(Number(t.expenseAmount) * 100) / 100,
            createdAt: t.createdAt || now,
            updatedAt: now
          }));
      } else if (db.departments[index].unitTiers && db.departments[index].unitTiers.length > 0) {
        processedTiers = db.departments[index].unitTiers;
      } else {
        for (let i = 1; i <= 10; i++) {
          const u = batchNum * i;
          const e = Math.round(expenseNum * i * 100) / 100;
          processedTiers.push({
            id: `tier_${id}_${i}_${Date.now()}`,
            departmentId: id,
            units: u,
            expenseAmount: e,
            createdAt: now,
            updatedAt: now
          });
        }
      }

      // Sort tiers by units ascending
      processedTiers.sort((a, b) => a.units - b.units);

      db.departments[index] = {
        ...db.departments[index],
        name: name.trim(),
        unitBatch: processedTiers[0]?.units || batchNum,
        expenseAmount: processedTiers[0]?.expenseAmount ?? expenseNum,
        unitPrice: expenseNum / batchNum,
        unitTiers: processedTiers,
        notes: notes ? notes.trim() : '',
        updatedAt: now
      };
      writeDb(db);
      res.json(db.departments[index]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في تعديل القسم' });
    }
  });

  app.delete('/api/departments/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      // Check if there are workers linked to this department
      const linkedWorkers = db.workers.filter((w: any) => w.departmentId === id);
      if (linkedWorkers.length > 0) {
        return res.status(400).json({
          error: `لا يمكن حذف القسم لوجود ${linkedWorkers.length} عامل مرتبط به. يرجى نقل العمال لقسم آخر أولاً.`
        });
      }
      db.departments = db.departments.filter((d: any) => d.id !== id);
      writeDb(db);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في حذف القسم' });
    }
  });

  // Workers CRUD
  app.post('/api/workers', (req, res) => {
    try {
      const { code, name, departmentId, status, phone, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'اسم العامل مطلوب' });
      }
      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'كود العامل مطلوب' });
      }
      if (!departmentId) {
        return res.status(400).json({ error: 'يرجى تحديد قسم للعامل' });
      }

      const db = readDb();
      // Check uniqueness of code
      const existingCode = db.workers.find((w: any) => w.code.trim() === code.trim());
      if (existingCode) {
        return res.status(400).json({ error: 'كود العامل مسجل مسبقاً، يرجى استخدام كود فريد' });
      }

      const newWorker = {
        id: 'wrk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        code: code.trim(),
        name: name.trim(),
        departmentId,
        status: status === 'inactive' ? 'inactive' : 'active',
        phone: phone ? phone.trim() : '',
        notes: notes ? notes.trim() : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.workers.push(newWorker);
      writeDb(db);
      res.status(201).json(newWorker);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في إضافة العامل' });
    }
  });

  app.put('/api/workers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { code, name, departmentId, status, phone, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'اسم العامل مطلوب' });
      }
      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'كود العامل مطلوب' });
      }
      if (!departmentId) {
        return res.status(400).json({ error: 'يرجى تحديد قسم للعامل' });
      }

      const db = readDb();
      const index = db.workers.findIndex((w: any) => w.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'العامل غير موجود' });
      }

      // Check uniqueness of code against others
      const duplicateCode = db.workers.find((w: any) => w.id !== id && w.code.trim() === code.trim());
      if (duplicateCode) {
        return res.status(400).json({ error: 'كود العامل مسجل مسبقاً لعامل آخر' });
      }

      db.workers[index] = {
        ...db.workers[index],
        code: code.trim(),
        name: name.trim(),
        departmentId,
        status: status === 'inactive' ? 'inactive' : 'active',
        phone: phone ? phone.trim() : '',
        notes: notes ? notes.trim() : '',
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      res.json(db.workers[index]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في تعديل بيانات العامل' });
    }
  });

  app.delete('/api/workers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      db.workers = db.workers.filter((w: any) => w.id !== id);
      writeDb(db);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في حذف العامل' });
    }
  });

  // Daily Records CRUD
  app.post('/api/records', (req, res) => {
    try {
      const {
        id,
        date,
        workerId,
        quantity,
        attendanceStatus,
        deduction,
        overtime,
        productionDue: customProductionDue,
        selectedTierId,
        notes
      } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
      }
      if (!workerId) {
        return res.status(400).json({ error: 'يرجى اختيار العامل' });
      }

      const db = readDb();
      const worker = db.workers.find((w: any) => w.id === workerId);
      if (!worker) {
        return res.status(404).json({ error: 'العامل المحدد غير موجود' });
      }

      const department = db.departments.find((d: any) => d.id === worker.departmentId);
      const unitBatch = department ? (Number(department.unitBatch) || 1) : 1;
      const expenseAmount = department ? (Number(department.expenseAmount) || 0) : 0;
      const unitPrice = expenseAmount / unitBatch;

      const qty = Math.max(0, Number(quantity) || 0);
      const ded = Math.max(0, Number(deduction) || 0);
      const ovt = Math.max(0, Number(overtime) || 0);

      let productionDue: number;
      if (customProductionDue !== undefined && customProductionDue !== null) {
        productionDue = Math.max(0, Math.round(Number(customProductionDue) * 100) / 100);
      } else {
        const matchedTier = department?.unitTiers?.find((t: any) => Number(t.units) === qty);
        if (matchedTier) {
          productionDue = Number(matchedTier.expenseAmount);
        } else {
          productionDue = Math.round((qty / unitBatch) * expenseAmount * 100) / 100;
        }
      }

      const netDue = Math.round((productionDue + ovt - ded) * 100) / 100;

      let recordIndex = -1;
      if (id) {
        recordIndex = db.records.findIndex((r: any) => r.id === id);
      } else if (!db.settings?.allowMultipleRecordsPerDay) {
        recordIndex = db.records.findIndex((r: any) => r.workerId === workerId && r.date === date);
      }

      if (recordIndex !== -1) {
        db.records[recordIndex] = {
          ...db.records[recordIndex],
          date,
          workerId: worker.id,
          workerName: worker.name,
          workerCode: worker.code,
          departmentId: worker.departmentId,
          departmentName: department ? department.name : 'غير محدد',
          unitBatch,
          expenseAmount,
          unitPrice,
          quantity: qty,
          productionDue,
          selectedTierId: selectedTierId || db.records[recordIndex].selectedTierId,
          attendanceStatus: attendanceStatus || 'present',
          deduction: ded,
          overtime: ovt,
          netDue,
          notes: notes ? notes.trim() : '',
          updatedAt: new Date().toISOString()
        };
        writeDb(db);
        return res.json({ updated: true, record: db.records[recordIndex] });
      }

      const newRecord = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date,
        workerId: worker.id,
        workerName: worker.name,
        workerCode: worker.code,
        departmentId: worker.departmentId,
        departmentName: department ? department.name : 'غير محدد',
        unitBatch,
        expenseAmount,
        unitPrice,
        quantity: qty,
        productionDue,
        selectedTierId: selectedTierId || undefined,
        attendanceStatus: attendanceStatus || 'present',
        deduction: ded,
        overtime: ovt,
        netDue,
        notes: notes ? notes.trim() : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.records.push(newRecord);
      writeDb(db);
      res.status(201).json({ created: true, record: newRecord });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في حفظ السجل اليومي' });
    }
  });

  app.put('/api/records/:id', (req, res) => {
    try {
      const { id } = req.params;
      const {
        date,
        workerId,
        quantity,
        attendanceStatus,
        deduction,
        overtime,
        productionDue: customProductionDue,
        selectedTierId,
        notes
      } = req.body;

      const db = readDb();
      const index = db.records.findIndex((r: any) => r.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'السجل غير موجود' });
      }

      const currentRecord = db.records[index];
      const worker = db.workers.find((w: any) => w.id === (workerId || currentRecord.workerId)) || {
        id: currentRecord.workerId,
        name: currentRecord.workerName,
        code: currentRecord.workerCode,
        departmentId: currentRecord.departmentId
      };

      const department = db.departments.find((d: any) => d.id === worker.departmentId);
      const unitBatch = currentRecord.unitBatch || (department ? department.unitBatch : 1);
      const expenseAmount = currentRecord.expenseAmount !== undefined ? currentRecord.expenseAmount : (department ? department.expenseAmount : 0);
      const unitPrice = expenseAmount / unitBatch;

      const qty = Math.max(0, Number(quantity) || 0);
      const ded = Math.max(0, Number(deduction) || 0);
      const ovt = Math.max(0, Number(overtime) || 0);

      let productionDue: number;
      if (customProductionDue !== undefined && customProductionDue !== null) {
        productionDue = Math.max(0, Math.round(Number(customProductionDue) * 100) / 100);
      } else {
        const matchedTier = department?.unitTiers?.find((t: any) => Number(t.units) === qty);
        if (matchedTier) {
          productionDue = Number(matchedTier.expenseAmount);
        } else {
          productionDue = Math.round((qty / unitBatch) * expenseAmount * 100) / 100;
        }
      }

      const netDue = Math.round((productionDue + ovt - ded) * 100) / 100;

      db.records[index] = {
        ...currentRecord,
        date: date || currentRecord.date,
        workerId: worker.id,
        workerName: worker.name,
        workerCode: worker.code,
        departmentId: worker.departmentId,
        departmentName: department ? department.name : currentRecord.departmentName,
        unitBatch,
        expenseAmount,
        unitPrice,
        quantity: qty,
        productionDue,
        selectedTierId: selectedTierId !== undefined ? selectedTierId : currentRecord.selectedTierId,
        attendanceStatus: attendanceStatus || currentRecord.attendanceStatus,
        deduction: ded,
        overtime: ovt,
        netDue,
        notes: notes !== undefined ? notes.trim() : currentRecord.notes,
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      res.json(db.records[index]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في تعديل السجل' });
    }
  });

  app.delete('/api/records/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      db.records = db.records.filter((r: any) => r.id !== id);
      writeDb(db);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في حذف السجل' });
    }
  });

  // Backup restore endpoint
  app.post('/api/backup/restore', (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
      }
      const validatedDb = {
        departments: Array.isArray(backupData.departments) ? backupData.departments : [],
        workers: Array.isArray(backupData.workers) ? backupData.workers : [],
        records: Array.isArray(backupData.records) ? backupData.records : [],
        settings: backupData.settings && typeof backupData.settings === 'object' ? backupData.settings : {
          factoryName: 'نظام إدارة الإنتاج والعمال',
          currency: 'جنيه',
          allowMultipleRecordsPerDay: false
        }
      };
      writeDb(validatedDb);
      res.json({ success: true, data: validatedDb });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في استعادة النسخة الاحتياطية' });
    }
  });

  // Reset database endpoint
  app.post('/api/reset', (req, res) => {
    try {
      const emptyDb = {
        departments: [],
        workers: [],
        records: [],
        settings: {
          factoryName: 'نظام إدارة الإنتاج والعمال',
          currency: 'جنيه',
          allowMultipleRecordsPerDay: false
        }
      };
      writeDb(emptyDb);
      res.json({ success: true, data: emptyDb });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في إعادة ضبط قاعدة البيانات' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // التعديل الرئيسي هنا: استخدام 127.0.0.1 بدلاً من 0.0.0.0
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

export default app;