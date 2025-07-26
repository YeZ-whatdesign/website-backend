const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 获取所有内容
router.get('/content', (req, res) => {
  db.getDb().all(
    'SELECT * FROM content',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      const content = {};
      rows.forEach(row => {
        try {
          content[row.section] = JSON.parse(row.data);
        } catch (e) {
          console.error('解析内容数据失败:', e);
        }
      });

      res.json(content);
    }
  );
});

// 获取特定章节内容
router.get('/content/:section', (req, res) => {
  const { section } = req.params;

  db.getDb().get(
    'SELECT * FROM content WHERE section = ?',
    [section],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!row) {
        return res.status(404).json({ error: '内容不存在' });
      }

      try {
        const data = JSON.parse(row.data);
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: '数据解析失败' });
      }
    }
  );
});

// 更新内容（需要认证）
router.put('/content/:section', authenticateToken, (req, res) => {
  const { section } = req.params;
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: '数据不能为空' });
  }

  const dataString = JSON.stringify(data);

  db.getDb().run(
    `INSERT OR REPLACE INTO content (section, data, updated_at) 
     VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [section, dataString],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      res.json({ message: '内容更新成功', section, id: this.lastID });
    }
  );
});

// 上传图片
router.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      error: '没有上传文件' 
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true,
    message: '文件上传成功',
    url: fileUrl,
    filename: req.file.filename
  });
});

// 获取所有联系表单
router.get('/contacts', authenticateToken, (req, res) => {
  db.getDb().all(
    'SELECT * FROM contacts ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(rows);
    }
  );
});

// 获取所有培训报名
router.get('/training-applications', authenticateToken, (req, res) => {
  db.getDb().all(
    'SELECT * FROM training_applications ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(rows);
    }
  );
});

// 获取所有求职申请
router.get('/job-applications', authenticateToken, (req, res) => {
  db.getDb().all(
    'SELECT * FROM job_applications ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(rows);
    }
  );
});

// 删除联系表单
router.delete('/contacts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.getDb().run(
    'DELETE FROM contacts WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '记录不存在' });
      }

      res.json({ message: '删除成功' });
    }
  );
});

// 删除培训报名
router.delete('/training-applications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.getDb().run(
    'DELETE FROM training_applications WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '记录不存在' });
      }

      res.json({ message: '删除成功' });
    }
  );
});

// 删除求职申请
router.delete('/job-applications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.getDb().run(
    'DELETE FROM job_applications WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '记录不存在' });
      }

      res.json({ message: '删除成功' });
    }
  );
});

module.exports = router;