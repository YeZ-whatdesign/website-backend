const express = require('express');
const db = require('../config/database');

const router = express.Router();

// 提交联系表单
router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;

  // 验证必填字段
  if (!name || !email || !message) {
    return res.status(400).json({ error: '姓名、邮箱和留言不能为空' });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  db.getDb().run(
    `INSERT INTO contacts (name, email, subject, message) 
     VALUES (?, ?, ?, ?)`,
    [name, email, subject || '', message],
    function(err) {
      if (err) {
        console.error('保存联系表单失败:', err);
        return res.status(500).json({ error: '提交失败，请稍后重试' });
      }

      res.json({ 
        message: '消息发送成功！我们会尽快回复您。',
        id: this.lastID 
      });
    }
  );
});

module.exports = router;