// 从 index.html 中提取 genPageHTML 的 PART1 和 PART3 模板，注入数据生成独立页面
const fs = require('fs');
const sharp = require('sharp');

(async () => {
  // 压缩 6.jpg 到 200x240，与表单上传时一致
  const buf = await sharp('6.jpg')
    .resize(200, 240, { fit: 'cover' })
    .jpeg({ quality: 0.75 })
    .toBuffer();
  const imageA = 'data:image/jpeg;base64,' + buf.toString('base64');
  console.log('image base64 length:', imageA.length);

  // 读取 index.html 源码
  const html = fs.readFileSync('index.html', 'utf8');

  // 提取 PART1 和 PART3 模板字符串
  // PART1 = `...` (从 "var PART1 = `" 到 PART1 结束的 `)
  // PART3 = `...` (从 "var PART3 = `" 到 PART3 结束的 `)
  // 它们在 genPageHTML 函数内
  const part1Start = html.indexOf('var PART1 = `');
  const part3Start = html.indexOf('var PART3 = `');
  if (part1Start < 0 || part3Start < 0) {
    throw new Error('PART1/PART3 模板未找到');
  }
  // 找到 PART1 的结束反引号 (PART1 在 PART3 之前)
  const part1End = html.lastIndexOf('`', part3Start - 1);
  const part3End = html.indexOf('`', part3Start + 'var PART3 = `'.length);
  // 从 PART3 起始开始找到下一个未转义的 ` (PART3 结束)
  let p3i = part3Start + 'var PART3 = `'.length;
  while (p3i < html.length) {
    if (html[p3i] === '`') break;
    if (html[p3i] === '\\') p3i += 2;
    else p3i++;
  }
  const part1 = html.substring(part1Start + 'var PART1 = `'.length, part1End);
  const part3 = html.substring(part3Start + 'var PART3 = `'.length, p3i);

  // 构造数据对象（与 collectFormData 字段对齐）
  const data = {
    name: '施家豪',
    gender: '男',
    nation: '汉族',
    id_number: '420625200310016812',
    nian: 2003,
    yue: 10,
    ri: 1,
    school: '福建师范大学',
    academic_qualification: '本科',
    educational_system: '4',
    major: '新能源科学与工程',
    xltype: '普通全日制',
    xllb: '普通高等教育',
    fenyuan: '材料工程学院',
    xisuo: '材料工程',
    banji: '材料253',
    xuehao: '2512321',
    ru_nian: 2023,
    ru_yue: 9,
    ru_ri: 1,
    li_nian: 2027,
    li_yue: 6,
    li_ri: 30,
    zhuangtai: '在籍(注册学籍)',
    image_a: imageA,
    image_b: '',
    has_grad: false,
    grad_level: '',
    grad_school: '',
    grad_major: '',
    grad_degree_type: '',
    grad_educational_system: '',
    grad_enroll_type: '',
    grad_train_mode: '',
    grad_research: '',
    grad_supervisor: '',
    grad_fenyuan: '',
    grad_xuehao: '',
    grad_ru_nian: '',
    grad_ru_yue: '',
    grad_ru_ri: '',
    grad_li_nian: '',
    grad_li_yue: '',
    grad_li_ri: '',
    grad_zhuangtai: '',
    grad_image_a: '',
    grad_image_b: ''
  };

  const defaultBlock = '\nvar DEFAULT_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  const out = part1 + defaultBlock + part3;

  // 生成随机 ID（6 字符）
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  console.log('Generated ID:', id);

  fs.writeFileSync(id + '.html', out);
  console.log('Written:', id + '.html', 'size:', out.length);
})();