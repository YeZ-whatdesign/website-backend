const express = require('express');
const db = require('../config/database');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;

const router = express.Router();

// 获取所有已发布的博客文章
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.getDb().all(
    `SELECT id, title, excerpt, content, image, author, created_at 
     FROM blog_posts 
     WHERE published = 1 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: '数据库错误' 
        });
      }

      // 获取总数
      db.getDb().get(
        'SELECT COUNT(*) as total FROM blog_posts WHERE published = 1',
        [],
        (err, countRow) => {
          if (err) {
            return res.status(500).json({ 
              success: false,
              error: '数据库错误' 
            });
          }

          res.json({
            success: true,
            posts: rows,
            total: countRow.total,
            pagination: {
              page,
              limit,
              total: countRow.total,
              pages: Math.ceil(countRow.total / limit)
            }
          });
        }
      );
    }
  );
});

// 获取单篇博客文章
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.getDb().get(
    'SELECT * FROM blog_posts WHERE id = ? AND published = 1',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: '数据库错误' 
        });
      }

      if (!row) {
        return res.status(404).json({ 
          success: false,
          error: '文章不存在' 
        });
      }

      res.json({
        success: true,
        post: row
      });
    }
  );
});

// 获取所有博客文章（管理员）
router.get('/admin/all', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.getDb().all(
    `SELECT * FROM blog_posts 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      // 获取总数
      db.getDb().get(
        'SELECT COUNT(*) as total FROM blog_posts',
        [],
        (err, countRow) => {
          if (err) {
            return res.status(500).json({ error: '数据库错误' });
          }

          res.json({
            posts: rows,
            pagination: {
              page,
              limit,
              total: countRow.total,
              pages: Math.ceil(countRow.total / limit)
            }
          });
        }
      );
    }
  );
});

// 创建博客文章
router.post('/', authenticateToken, (req, res) => {
  const { title, excerpt, content, image, author, published } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: '标题、内容和作者不能为空' });
  }

  db.getDb().run(
    `INSERT INTO blog_posts (title, excerpt, content, image, author, published) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, excerpt || '', content, image || '', author, published ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      res.json({ 
        message: '博客文章创建成功',
        id: this.lastID 
      });
    }
  );
});

// 更新博客文章
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, excerpt, content, image, author, published } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: '标题、内容和作者不能为空' });
  }

  db.getDb().run(
    `UPDATE blog_posts 
     SET title = ?, excerpt = ?, content = ?, image = ?, author = ?, published = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, excerpt || '', content, image || '', author, published ? 1 : 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }

      res.json({ message: '博客文章更新成功' });
    }
  );
});

// 删除博客文章
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.getDb().run(
    'DELETE FROM blog_posts WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }

      res.json({ message: '博客文章删除成功' });
    }
  );
});

module.exports = router;