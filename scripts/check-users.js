const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

console.log('正在检查数据库中的用户信息...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 查询所有用户信息
db.all('SELECT id, username, role, created_at FROM users', (err, users) => {
  if (err) {
    console.error('查询用户失败:', err.message);
    process.exit(1);
  }
  
  console.log('=== 用户列表 ===');
  users.forEach(user => {
    console.log(`ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 创建时间: ${user.created_at}`);
  });
  
  // 特别检查admin用户的密码哈希
  db.get('SELECT username, password FROM users WHERE username = ?', ['admin'], (err, admin) => {
    if (err) {
      console.error('查询admin用户失败:', err.message);
      process.exit(1);
    }
    
    if (admin) {
      console.log('\n=== Admin用户密码信息 ===');
      console.log('用户名:', admin.username);
      console.log('密码哈希:', admin.password);
      console.log('哈希长度:', admin.password.length);
      console.log('哈希格式正确:', admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'));
    } else {
      console.log('\n❌ 未找到admin用户！');
    }
    
    db.close();
  });
});