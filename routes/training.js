const express = require('express');
const db = require('../config/database');

const router = express.Router();

// 提交培训报名
router.post('/', (req, res) => {
  const { name, degree, phone, email, message } = req.body;

  // 验证必填字段
  if (!name || !email) {
    return res.status(400).json({ error: '姓名和邮箱不能为空' });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  // 验证手机号格式（如果提供）
  if (phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
  }

  db.getDb().run(
    `INSERT INTO training_applications (name, degree, phone, email, message) 
     VALUES (?, ?, ?, ?, ?)`,
    [name, degree || '', phone || '', email, message || ''],
    function(err) {
      if (err) {
        console.error('保存培训报名失败:', err);
        return res.status(500).json({ error: '提交失败，请稍后重试' });
      }

      res.json({ 
        message: '报名提交成功！我们会尽快与您联系。',
        id: this.lastID 
      });
    }
  );
});

module.exports = router;