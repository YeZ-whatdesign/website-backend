const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      } else {
        console.log('数据库连接成功');
      }
    });
  }

  init() {
    // 创建用户表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建用户表失败:', err);
      } else {
        // 插入默认管理员用户
        const bcrypt = require('bcryptjs');
        const defaultPassword = bcrypt.hashSync('admin123', 10);
        
        this.db.run(`
          INSERT OR IGNORE INTO users (username, password, role) 
          VALUES ('admin', ?, 'admin')
        `, [defaultPassword], (err) => {
          if (err) {
            console.error('插入默认用户失败:', err);
          } else {
            console.log('默认管理员用户创建成功');
          }
        });
      }
    });

    // 创建内容表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建内容表失败:', err);
      } else {
        // 插入默认内容数据
        this.insertDefaultContent();
      }
    });

    // 创建联系表单表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建培训报名表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS training_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        degree TEXT,
        phone TEXT,
        email TEXT NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建博客表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        image TEXT,
        author TEXT NOT NULL,
        published BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建博客表失败:', err);
      } else {
        // 插入默认博客文章
        this.insertDefaultBlogPosts();
      }
    });
  }

  insertDefaultBlogPosts() {
    const defaultBlogPosts = [
      {
        title: '汽车设计的未来趋势',
        excerpt: '探讨电动汽车时代的设计理念和技术创新，以及智能化、可持续发展对汽车外观设计的影响。',
        content: `# 汽车设计的未来趋势

随着电动汽车技术的快速发展，汽车设计正在经历一场前所未有的变革。传统的设计理念正在被重新定义，新的设计语言正在形成。

## 电动化带来的设计自由

电动汽车的动力系统结构相比传统燃油车更加简洁，这为设计师提供了更大的创作空间：

- **前脸设计的革新**：不再需要大面积的进气格栅，设计师可以创造更加简洁、未来感的前脸造型
- **车身比例的优化**：电池包的布局让车身重心更低，可以实现更加动感的车身比例
- **内饰空间的重新规划**：没有传动轴和排气系统，内饰布局更加灵活

## 智能化元素的融入

智能驾驶技术的发展也在影响着汽车的外观设计：

- **传感器的美学整合**：激光雷达、摄像头等传感器需要巧妙地融入车身设计
- **交互界面的外延**：车身表面可能成为新的交互界面，显示信息或与环境互动
- **照明系统的进化**：LED和OLED技术让车灯不仅仅是照明工具，更是设计表达的重要元素

## 可持续设计理念

环保意识的提升推动着汽车设计向可持续方向发展：

- **材料的创新**：使用可回收、生物基材料
- **生产工艺的优化**：减少生产过程中的能耗和废料
- **全生命周期设计**：考虑产品从生产到回收的整个生命周期

## 结语

汽车设计的未来充满无限可能。设计师们正在用创新的思维和先进的技术，创造出既美观又实用的未来交通工具。这不仅仅是外观的改变，更是整个出行体验的重新定义。`,
        image: '/images/modeler.jpg',
        author: '设计团队',
        published: 1
      },
      {
        title: 'Class-A曲面建模技巧分享',
        excerpt: '深入解析Class-A曲面建模的核心技术，分享专业的曲面建模方法和实战经验。',
        content: `# Class-A曲面建模技巧分享

Class-A曲面是汽车外观设计中的最高标准，它要求曲面具有完美的连续性和高质量的反射效果。本文将分享一些实用的Class-A曲面建模技巧。

## 什么是Class-A曲面

Class-A曲面是指满足以下条件的曲面：

- **G2连续性**：曲面在连接处不仅位置连续、切线连续，曲率也连续
- **高质量反射**：曲面能够产生清晰、连续的反射线
- **制造可行性**：曲面可以通过实际的制造工艺实现

## 核心建模技巧

### 1. 控制点的合理布局

控制点的数量和位置直接影响曲面的质量：

- 尽量使用最少的控制点达到设计要求
- 控制点应该均匀分布，避免局部密集
- 重要的特征线附近可以适当增加控制点密度

### 2. 曲面片的合理分割

复杂的曲面应该分解为多个简单的曲面片：

- 按照自然的特征线进行分割
- 每个曲面片应该具有单一的曲率变化趋势
- 避免在一个曲面片中包含过多的特征

### 3. 边界条件的精确控制

曲面边界的质量决定了整体效果：

- 确保边界曲线的G2连续性
- 控制边界处的曲率变化
- 注意相邻曲面的匹配关系

## 质量检查方法

### 反射线分析

使用反射线来检查曲面质量：

- 反射线应该平滑连续
- 避免出现扭结或突变
- 特别注意曲面连接处的反射线连续性

### 曲率分析

通过曲率分析来验证曲面质量：

- 检查曲率的连续性
- 识别异常的曲率变化
- 确保曲率分布符合设计意图

## 常见问题及解决方案

### 问题1：曲面连接处出现折痕

**解决方案**：
- 检查控制点的对齐
- 调整边界条件
- 重新构建连接区域

### 问题2：反射线不连续

**解决方案**：
- 增加曲面的连续性等级
- 调整控制点位置
- 重新规划曲面分割

## 实战建议

1. **从整体到局部**：先建立整体的曲面框架，再细化局部特征
2. **迭代优化**：不断检查和调整，逐步提升曲面质量
3. **工具熟练**：熟练掌握专业软件的各种功能和技巧
4. **经验积累**：多观察优秀的设计案例，积累经验

## 结语

Class-A曲面建模是一门需要理论知识和实践经验相结合的技术。通过不断的练习和总结，设计师可以创造出既美观又实用的高质量曲面。`,
        image: '/images/developer.jpg',
        author: '技术团队',
        published: 1
      },
      {
        title: '实时渲染技术在汽车展示中的应用',
        excerpt: '介绍最新的实时渲染技术在汽车营销和展示中的创新应用，以及未来发展趋势。',
        content: `# 实时渲染技术在汽车展示中的应用

随着GPU技术的快速发展，实时渲染技术已经达到了接近电影级别的视觉效果。在汽车行业，这项技术正在革命性地改变着产品展示和营销的方式。

## 实时渲染的技术优势

### 即时反馈

传统的离线渲染需要数小时甚至数天才能完成一张高质量图片，而实时渲染可以：

- **即时预览**：设计师可以实时看到修改效果
- **快速迭代**：大大缩短设计周期
- **交互体验**：用户可以实时操控视角和参数

### 成本效益

实时渲染技术带来显著的成本优势：

- **减少物理样车**：虚拟展示替代部分实体展示
- **降低拍摄成本**：减少传统摄影和后期制作的需求
- **提高效率**：快速生成大量营销素材

## 在汽车展示中的具体应用

### 1. 虚拟展厅

创建沉浸式的虚拟展示环境：

- **360度展示**：用户可以从任意角度观察车辆
- **环境切换**：在不同场景中展示车辆效果
- **细节放大**：支持无损放大查看细节

### 2. 配置器应用

实时配置和预览：

- **颜色选择**：实时切换车身颜色和材质
- **配件搭配**：动态添加或移除配件
- **内饰定制**：实时预览内饰搭配效果

### 3. AR/VR体验

增强现实和虚拟现实应用：

- **AR展示**：在现实环境中叠加虚拟车辆
- **VR试驾**：沉浸式的虚拟试驾体验
- **混合现实**：结合真实和虚拟元素的展示

## 技术实现要点

### 光照系统

高质量的光照是实时渲染的关键：

- **基于物理的渲染(PBR)**：确保材质表现的真实性
- **全局光照**：实现真实的光线反弹效果
- **动态光照**：支持实时光照变化

### 材质系统

汽车材质的精确表现：

- **车漆材质**：多层车漆的复杂反射效果
- **金属材质**：各种金属部件的质感表现
- **玻璃材质**：透明和半透明材质的处理

### 优化策略

保证实时性能的优化方法：

- **LOD系统**：根据距离调整模型精度
- **遮挡剔除**：只渲染可见的部分
- **纹理压缩**：优化内存使用

## 成功案例分析

### 案例1：某豪华品牌线上展厅

该品牌通过实时渲染技术创建了一个完全虚拟的展厅：

- **效果**：用户停留时间增加300%
- **转化**：线上到店转化率提升50%
- **成本**：展示成本降低70%

### 案例2：新车发布会

使用实时渲染技术进行新车发布：

- **灵活性**：可以实时调整展示效果
- **互动性**：观众可以参与配置展示
- **传播性**：生成大量社交媒体内容

## 未来发展趋势

### 云渲染

将渲染计算迁移到云端：

- **设备无关**：任何设备都能享受高质量渲染
- **算力共享**：充分利用云端GPU资源
- **实时协作**：多人同时参与设计和展示

### AI辅助渲染

人工智能技术的融入：

- **智能优化**：AI自动优化渲染参数
- **内容生成**：AI辅助生成展示内容
- **用户分析**：基于用户行为优化展示效果

### 更真实的物理模拟

更加精确的物理效果：

- **流体模拟**：雨水、泥浆等环境效果
- **变形模拟**：碰撞和变形的真实表现
- **声音同步**：视听一体的沉浸体验

## 结语

实时渲染技术正在重新定义汽车展示的标准。随着技术的不断进步，我们可以期待更加逼真、更加互动的汽车展示体验。对于汽车制造商来说，掌握这项技术将成为未来竞争的重要优势。`,
        image: '/images/visualization.jpg',
        author: '可视化团队',
        published: 1
      }
    ]

    defaultBlogPosts.forEach(post => {
      this.db.run(`
        INSERT OR IGNORE INTO blog_posts (title, excerpt, content, image, author, published) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [post.title, post.excerpt, post.content, post.image, post.author, post.published], (err) => {
        if (err) {
          console.error('插入默认博客文章失败:', err);
        }
      });
    });
  }

  insertDefaultContent() {
    const defaultContent = {
      hero: {
        title: '几何原本 - 专业汽车设计服务',
        subtitle: '计算机辅助样式设计 | Class-A曲面开发 | 实时产品可视化 | 软件技术开发',
        image: '/hero-car.jpg'
      },
      about: {
        title: '关于我们 About US',
        logo: '/images/logo_horizontal.png',
        description: '几何原本（What Tech）前身是2017年成立的设计机构乜也设计（What Design），后因公司技术及业务发展需要更名为几何原本。创始人（黑暗森霖）与国际软件巨头其下高端工业设计品牌有长年的深入合作，主要从事计算机辅助样式设计、Class-A曲面开发、实时产品可视化及相关软件技术开发及培训。',
        companyName: '上海几何原本科技有限公司 Shanghai What Technology Co.,Ltd'
      }
    };

    Object.keys(defaultContent).forEach(section => {
      this.db.run(`
        INSERT OR IGNORE INTO content (section, data) 
        VALUES (?, ?)
      `, [section, JSON.stringify(defaultContent[section])]);
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  }
}

module.exports = new Database();