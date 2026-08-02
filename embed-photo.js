const fs = require('fs');
const path = require('path');

const imagePath = process.argv[2] || 'photo.jpg';
if (!fs.existsSync(imagePath)) {
  console.error('错误: 找不到照片文件: ' + imagePath);
  console.log('用法: node embed-photo.js <照片路径>');
  console.log('例如: node embed-photo.js photo.jpg');
  process.exit(1);
}

const ext = path.extname(imagePath).toLowerCase();
const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
const base64 = fs.readFileSync(imagePath).toString('base64');
const dataUrl = 'data:' + mime + ';base64,' + base64;

let html = fs.readFileSync('g.html', 'utf8');

// 替换 admPhoto 变量
const oldVar = /var admPhoto = '.*?';/;
const newVar = "var admPhoto = '" + dataUrl + "';";
if (oldVar.test(html)) {
  html = html.replace(oldVar, newVar);
} else {
  // 如果没找到，在 script 标签内追加
  html = html.replace('</script>', newVar + '\n</script>');
}

fs.writeFileSync('g.html', html);
console.log('照片已嵌入 g.html');
console.log('照片大小: ' + (dataUrl.length / 1024).toFixed(1) + ' KB');
console.log('请执行: git add g.html && git commit -m "添加录取照片" && git push');
