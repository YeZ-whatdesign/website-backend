const bcrypt = require('bcryptjs');

// 从命令行参数获取密码
const password = process.argv[2];

if (!password) {
  console.log('使用方法: node generate-password-hash.js <密码>');
  console.log('例如: node generate-password-hash.js myNewPassword123');
  process.exit(1);
}

// 生成哈希值
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('原密码:', password);
console.log('哈希值:', hashedPassword);
console.log('\n可以在SQLite中使用以下命令更新密码:');
console.log(`UPDATE users SET password = '${hashedPassword}' WHERE username = 'admin';`);