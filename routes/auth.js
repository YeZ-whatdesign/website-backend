const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.getDb().get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

// 验证token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 验证用户信息
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 修改密码
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '当前密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少需要6位' });
  }

  // 首先验证当前密码
  db.getDb().get(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(401).json({ error: '当前密码错误' });
      }

      // 加密新密码
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // 更新密码
      db.getDb().run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '密码更新失败' });
          }

          res.json({ message: '密码修改成功' });
        }
      );
    }
  );
});

// 重置admin密码（仅限admin用户）
router.post('/reset-admin-password', authenticateToken, (req, res) => {
  const { newPassword } = req.body;

  // 检查是否为admin用户
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足，仅管理员可以重置admin密码' });
  }

  if (!newPassword) {
    return res.status(400).json({ error: '新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少需要6位' });
  }

  // 加密新密码
  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

  // 更新admin密码
  db.getDb().run(
    'UPDATE users SET password = ? WHERE username = ?',
    [hashedNewPassword, 'admin'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '密码更新失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '未找到admin用户' });
      }

      res.json({ message: 'Admin密码重置成功' });
    }
  );
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;