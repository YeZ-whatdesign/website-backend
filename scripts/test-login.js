const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

// 从命令行获取要测试的密码
const testPassword = process.argv[2];

if (!testPassword) {
  console.log('使用方法: node test-login.js <要测试的密码>');
  console.log('例如: node test-login.js myNewPassword123');
  process.exit(1);
}

console.log('正在测试登录...');
console.log('测试密码:', testPassword);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 获取admin用户信息
db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
  if (err) {
    console.error('查询用户失败:', err.message);
    process.exit(1);
  }
  
  if (!user) {
    console.log('❌ 未找到admin用户');
    process.exit(1);
  }
  
  console.log('\n=== 用户信息 ===');
  console.log('ID:', user.id);
  console.log('用户名:', user.username);
  console.log('角色:', user.role);
  console.log('密码哈希:', user.password);
  
  // 验证密码
  const isValid = bcrypt.compareSync(testPassword, user.password);
  
  console.log('\n=== 密码验证结果 ===');
  console.log('密码匹配:', isValid ? '✅ 成功' : '❌ 失败');
  
  if (!isValid) {
    console.log('\n可能的问题:');
    console.log('1. 密码输入错误');
    console.log('2. 数据库中的哈希值不正确');
    console.log('3. 哈希算法版本不匹配');
    
    // 生成正确的哈希值作为参考
    const correctHash = bcrypt.hashSync(testPassword, 10);
    console.log('\n正确的哈希值应该是:', correctHash);
    console.log('当前数据库中的哈希值:', user.password);
    console.log('两者是否相同:', correctHash === user.password ? '是' : '否');
  }
  
  db.close();
});