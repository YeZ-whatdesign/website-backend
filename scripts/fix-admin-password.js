const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

// 从命令行获取新密码
const newPassword = process.argv[2];

if (!newPassword) {
  console.log('使用方法: node fix-admin-password.js <新密码>');
  console.log('例如: node fix-admin-password.js myNewPassword123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.log('❌ 密码长度至少需要6位');
  process.exit(1);
}

console.log('=== 修复Admin密码 ===');
console.log('新密码:', newPassword);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 生成新的哈希值
const hashedPassword = bcrypt.hashSync(newPassword, 10);
console.log('生成的哈希值:', hashedPassword);

// 首先检查admin用户是否存在
db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
  if (err) {
    console.error('查询用户失败:', err.message);
    process.exit(1);
  }
  
  if (!user) {
    console.log('admin用户不存在，正在创建...');
    
    // 创建admin用户
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'admin'],
      function(err) {
        if (err) {
          console.error('创建admin用户失败:', err.message);
          process.exit(1);
        }
        
        console.log('✅ Admin用户创建成功！');
        console.log('用户ID:', this.lastID);
        
        // 验证创建结果
        verifyPassword();
      }
    );
  } else {
    console.log('找到现有admin用户，正在更新密码...');
    
    // 更新密码
    db.run(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin'],
      function(err) {
        if (err) {
          console.error('更新密码失败:', err.message);
          process.exit(1);
        }
        
        console.log('✅ 密码更新成功！');
        console.log('影响的行数:', this.changes);
        
        // 验证更新结果
        verifyPassword();
      }
    );
  }
});

function verifyPassword() {
  // 验证密码是否正确设置
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
    if (err) {
      console.error('验证失败:', err.message);
      process.exit(1);
    }
    
    const isValid = bcrypt.compareSync(newPassword, user.password);
    
    console.log('\n=== 验证结果 ===');
    console.log('密码验证:', isValid ? '✅ 成功' : '❌ 失败');
    console.log('用户ID:', user.id);
    console.log('用户名:', user.username);
    console.log('角色:', user.role);
    
    if (isValid) {
      console.log('\n🎉 密码修复完成！现在可以使用以下凭据登录:');
      console.log('用户名: admin');
      console.log('密码:', newPassword);
    } else {
      console.log('\n❌ 密码验证失败，请检查问题');
    }
    
    db.close();
  });
}