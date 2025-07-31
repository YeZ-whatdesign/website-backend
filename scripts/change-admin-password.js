const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, '../data/database.sqlite');

// 创建readline接口用于用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('请输入新的admin密码: ', (password) => {
      if (password.length < 6) {
        console.log('密码长度至少需要6位，请重新输入。');
        resolve(askPassword());
      } else {
        rl.question('请再次确认密码: ', (confirmPassword) => {
          if (password !== confirmPassword) {
            console.log('两次输入的密码不一致，请重新输入。');
            resolve(askPassword());
          } else {
            resolve(password);
          }
        });
      }
    });
  });
}

async function changeAdminPassword() {
  try {
    console.log('=== 修改Admin密码工具 ===');
    
    // 获取新密码
    const newPassword = await askPassword();
    rl.close();
    
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
              console.log('✅ Admin用户创建成功，密码已设置！');
              db.close();
            }
          );
        } else {
          console.log('✅ Admin密码修改成功！');
          db.close();
        }
      }
    );
    
  } catch (error) {
    console.error('操作失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
changeAdminPassword();