const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

// 从命令行参数获取新密码
const newPassword = process.argv[2];

if (!newPassword) {
  console.log('使用方法: node reset-admin-password.js <新密码>');
  console.log('例如: node reset-admin-password.js myNewPassword123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.log('错误: 密码长度至少需要6位');
  process.exit(1);
}

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 加密新密码
const hashedPassword = bcrypt.hashSync(newPassword, 10);

// 更新admin用户密码
db.run(
  'UPDATE users SET password = ? WHERE username = ?',
  [hashedPassword, 'admin'],
  function(err) {
    if (err) {
      console.error('密码更新失败:', err.message);
      process.exit(1);
    }
    
    if (this.changes === 0) {
      console.log('未找到admin用户，正在创建...');
      
      // 如果admin用户不存在，创建一个
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('创建admin用户失败:', err.message);
            process.exit(1);
          }
          console.log('✅ Admin用户创建成功，密码已设置为:', newPassword);
          db.close();
        }
      );
    } else {
      console.log('✅ Admin密码修改成功！新密码为:', newPassword);
      db.close();
    }
  }
);