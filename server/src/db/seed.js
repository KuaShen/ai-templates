import db from './init.js';
import { initDatabase } from './init.js';
import bcrypt from 'bcryptjs';

initDatabase();

// 清空旧数据（保留表结构）
db.exec('DELETE FROM favorites');
db.exec('DELETE FROM credit_transactions');
db.exec('DELETE FROM downloads');
db.exec('DELETE FROM templates');
db.exec('DELETE FROM users');

// ====== 创建管理员用户 ======
const adminHash = bcrypt.hashSync('admin123', 10);
const userHash = bcrypt.hashSync('user123', 10);

const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, credits, role) VALUES (?, ?, ?, ?, ?)');
insertUser.run('admin', 'admin@prompt.ai', adminHash, 9999, 'admin');
insertUser.run('demo', 'demo@prompt.ai', userHash, 50, 'user');

// ====== 模板数据 ======
const templates = [
  // ======== 🛒 电商广告 (E-commerce) ========
  {
    id: 'eco-001', title: '高级护肤品产品摄影',
    description: '适用于高端护肤品的专业产品摄影提示词，光影细腻，质感突出，适合电商主图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A premium skincare product bottle on a minimalist marble surface, soft natural lighting from the left, luxurious golden reflections, commercial product photography, depth of field, hyper-realistic, 8K, clean white background with subtle shadow, elegant and sophisticated mood --ar 4:3 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"250","version":"6.1"}',
    usage_guide: '适用于护肤品、化妆品电商主图。如需改变产品类型，替换"A premium skincare product bottle"为你的产品描述。',
    is_free: 0, price: 5, downloads: 342, likes: 28,
  },
  {
    id: 'eco-002', title: '电子产品白底图',
    description: '干净的电子产品白底展示图，适合淘宝/京东商品主图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A modern wireless earphone charging case, white background, studio lighting, commercial product photography, sharp focus, clean composition, subtle reflection on surface, minimalist, high-end product shot, 8K quality --ar 4:3 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"100","version":"6.1"}',
    usage_guide: '白底图基础款。将产品描述替换为你需要的电子产品即可。降低stylize值保持产品真实性。',
    is_free: 0, price: 3, downloads: 567, likes: 45,
  },
  {
    id: 'eco-003', title: '美食产品场景图',
    description: '诱人的美食产品场景拍摄，适合食品类电商详情页',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Artisanal chocolate bars arranged on a rustic wooden table, warm golden hour lighting, melted chocolate drizzle, cocoa powder dusted, commercial food photography, mouthwatering detail, shallow depth of field, 8K, rich colors, culinary magazine style --ar 3:2 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"3:2","stylize":"300","version":"6.1"}',
    usage_guide: '食品类场景图。木质桌面和暖色灯光能增强食欲感，适合烘焙、巧克力、甜品类产品。',
    is_free: 0, price: 5, downloads: 289, likes: 32,
  },
  {
    id: 'eco-004', title: '服装穿搭街拍风',
    description: 'Urban street style fashion photography, 适合服装电商的街头穿搭展示',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Fashion model wearing a casual beige trench coat and white sneakers, walking on a rainy city street at golden hour, cinematic composition, natural pose, street style photography, shallow depth of field, warm tones, realistic skin texture, high fashion editorial look, 8K, shot on 35mm --ar 3:4 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"200","version":"6.1"}',
    usage_guide: '服装类电商场景图。3:4比例适合手机端展示。替换服装描述为你需要的款式。',
    is_free: 1, price: 0, downloads: 892, likes: 67,
  },
  {
    id: 'eco-005', title: '家居产品生活场景',
    description: '温馨的家居产品场景图，适合家具/家纺类电商',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Cozy modern living room interior, a minimalist Scandinavian sofa with soft cream fabric, warm ambient lighting, potted plants, textured throw pillows, sunlight streaming through sheer curtains, lifestyle photography, airy and bright, 8K, architectural digest style --ar 16:9 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"150","version":"6.1"}',
    usage_guide: '家居类场景图。宽幅比例适合横版详情页。沙发类型和颜色可按需替换。',
    is_free: 0, price: 5, downloads: 234, likes: 19,
  },
  {
    id: 'eco-006', title: '珠宝首饰特写',
    description: '高端珠宝首饰微距特写，闪耀质感，适合珠宝电商',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Macro close-up of a diamond ring with white gold band, sparkling gemstone, soft studio lighting with subtle lens flare, luxury jewelry photography, extreme detail, reflective surfaces, elegant composition, deep black background, high-end magazine quality, 8K --ar 1:1 --v 6.1 --s 350',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"350","version":"6.1"}',
    usage_guide: '珠宝首饰类目。深黑背景突出产品主体，高stylize值增加艺术感。正方形比例适合1:1主图。',
    is_free: 0, price: 8, downloads: 178, likes: 23,
  },
  {
    id: 'eco-007', title: '运动鞋产品图',
    description: 'Dynamic sports shoe product shot, 适合运动品牌电商',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A pair of sleek running shoes on a reflective surface, dynamic angle, vibrant color gradient lighting, motion blur in background, sporty and energetic vibe, commercial product photography, sharp focus on product, 8K quality, studio lighting with colored gels --ar 4:3 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"200","version":"6.1"}',
    usage_guide: '运动品类产品图。动态背景和彩色灯光营造运动感，替换跑鞋描述即可适配不同鞋款。',
    is_free: 1, price: 0, downloads: 654, likes: 51,
  },
  {
    id: 'eco-008', title: '手表产品展示',
    description: 'Luxury wristwatch product showcase, 高端手表电商主图',
    category: 'ecommerce', ai_platform: 'dalle3',
    prompt_text: 'A premium mechanical wristwatch with leather strap, elegant close-up showing detailed dial and hands, soft window lighting, warm brown tones, sophisticated atmosphere, commercial watch photography, sharp details on watch face, reflection on polished metal, luxurious mood',
    negative_prompt: '', parameters: '{"quality":"hd","style":"vivid"}',
    usage_guide: 'DALL·E 3版本的手表产品图。描述中强调细节和光线，适合高端腕表电商展示。',
    is_free: 0, price: 5, downloads: 345, likes: 31,
  },
  {
    id: 'eco-009', title: '茶饮产品场景',
    description: '新式茶饮/咖啡的场景营销图，适合饮品品牌',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A frothy matcha latte on a wooden cafe table, scattered tea leaves, soft morning light, steam rising, cozy atmosphere, food photography, warm earthy tones, shallow depth of field, artisanal cafe style, 8K --ar 4:3 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"250","version":"6.1"}',
    usage_guide: '饮品类场景图。蒸汽和木桌营造温暖氛围感，适合茶饮、咖啡等品牌营销素材。',
    is_free: 0, price: 3, downloads: 421, likes: 38,
  },
  {
    id: 'eco-010', title: '高端香水大片',
    description: '高端香水品牌大片风格，质感高级，适合奢侈品电商',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'An elegant perfume bottle with golden liquid, surrounded by floating flower petals, dramatic lighting with soft golden backlight, luxury perfume advertisement, ethereal atmosphere, bokeh background, high-end fashion magazine style, 8K, ultra-detailed --ar 3:4 --v 6.1 --s 400',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"400","version":"6.1"}',
    usage_guide: '高端香水/香薰类目。花瓣漂浮和金色逆光营造奢华感，3:4比例适合社交媒体投放。',
    is_free: 0, price: 8, downloads: 267, likes: 42,
  },

  // ======== 📱 社交媒体 (Social Media) ========
  {
    id: 'soc-001', title: '小红书封面 - 美妆教程',
    description: '小红书风格美妆教程封面，吸引点击的精致排版感',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Flat lay of makeup products arranged aesthetically, rose gold and pink tones, fresh flowers around, natural window lighting, top-down view, Instagram flat lay style, pastel color palette, clean and organized, bright and airy, 8K --ar 3:4 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"200","version":"6.1"}',
    usage_guide: '小红书美妆类封面图。俯拍+平铺布局在小红书平台转化率最高，粉色系增强女性用户点击。',
    is_free: 1, price: 0, downloads: 1234, likes: 89,
  },
  {
    id: 'soc-002', title: 'Instagram 品牌故事图',
    description: 'Instagram品牌故事/品牌叙事风格图，适合品牌社交账号',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'A person wearing a cream linen outfit, walking through a sunlit wheat field, golden hour, soft dreamy atmosphere, backlit silhouette, lifestyle photography, warm vintage tones, film grain texture, nostalgic feeling, 8K, shot on film camera --ar 4:5 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"4:5","stylize":"300","version":"6.1"}',
    usage_guide: 'Instagram品牌内容。暖色调和胶片质感适合讲述品牌故事，4:5比例在IG feed中视觉效果最佳。',
    is_free: 0, price: 5, downloads: 567, likes: 43,
  },
  {
    id: 'soc-003', title: '小红书探店打卡',
    description: '探店打卡风格图，适合本地生活/餐饮类小红书内容',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'A cozy minimalist cafe interior, a cup of latte with latte art on a small round table, soft warm lighting, plants and books in background, aesthetic vibe, lifestyle photography, relaxed weekend morning feeling, warm color palette, 8K --ar 3:4 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"200","version":"6.1"}',
    usage_guide: '探店打卡类模板。暖色调+绿植+书籍的三件套组合最容易出小红书爆款封面。',
    is_free: 0, price: 3, downloads: 789, likes: 56,
  },
  {
    id: 'soc-004', title: '微信朋友圈广告',
    description: '微信朋友圈信息流广告风格，简洁有力',
    category: 'social', ai_platform: 'dalle3',
    prompt_text: 'A minimalist product display with elegant typography overlay space, clean white background, one hero product centered, soft studio lighting, modern and clean design, WeChat ad style, professional and trustworthy, bright and simple composition',
    negative_prompt: '', parameters: '{"quality":"hd","style":"natural"}',
    usage_guide: '微信朋友圈广告素材。留白区域可在后期添加文案，自然风格避免过于艺术化。',
    is_free: 0, price: 5, downloads: 345, likes: 27,
  },
  {
    id: 'soc-005', title: 'Facebook 活动推广图',
    description: 'Facebook活动/促销推广图，适合付费投放',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Bold promotional composition with vibrant red and gold color scheme, festive atmosphere, empty space in center for text overlay, celebration elements like confetti and sparkles, commercial advertising style, energetic and exciting, 8K --ar 1.91:1 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"1.91:1","stylize":"150","version":"6.1"}',
    usage_guide: 'Facebook广告图。1.91:1是FB feed广告的标准比例。中间留空用于后期叠加促销文案。',
    is_free: 0, price: 5, downloads: 234, likes: 18,
  },
  {
    id: 'soc-006', title: '抖音直播封面',
    description: '抖音/直播封面图，吸引眼球的高点击率风格',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Close-up portrait of a confident woman smiling, vibrant and colorful background, bright studio lighting, high contrast, Douyin live streaming thumbnail style, energetic and engaging, bold colors, clear facial features, 8K --ar 9:16 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"9:16","stylize":"100","version":"6.1"}',
    usage_guide: '直播封面/短视频封面。低stylize保证人物真实感，9:16竖屏适配抖音。',
    is_free: 1, price: 0, downloads: 1567, likes: 102,
  },
  {
    id: 'soc-007', title: '小红书穿搭分享',
    description: 'OOTD穿搭分享风格图，适合时尚类小红书博主',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Full body outfit of a person in trendy streetwear, standing against an urban graffiti wall, natural portrait photography, casual confident pose, afternoon sunlight, fashion blogger style, clear outfit details, 8K --ar 3:4 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"150","version":"6.1"}',
    usage_guide: '穿搭分享模板。涂鸦墙背景适合街头潮流风格，可按需求替换背景和服装描述。',
    is_free: 0, price: 3, downloads: 678, likes: 45,
  },

  // ======== 🏷️ 品牌形象 (Brand Identity) ========
  {
    id: 'brd-001', title: '极简Logo设计 - 科技风',
    description: '现代科技公司Logo设计，极简几何风格',
    category: 'branding', ai_platform: 'midjourney',
    prompt_text: 'Minimalist tech company logo design, geometric abstract shape, blue and white color scheme, clean lines, modern corporate identity, professional branding, vector style, simple but memorable, business card mockup, 8K --ar 1:1 --v 6.1 --s 50',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"50","version":"6.1"}',
    usage_guide: '科技公司Logo设计参考。低stylize值保持简洁清晰，可参考几何形态进行二次设计。',
    is_free: 0, price: 5, downloads: 456, likes: 34,
  },
  {
    id: 'brd-002', title: '品牌视觉识别展示',
    description: '品牌VI视觉识别系统展示图，适合品牌手册',
    category: 'branding', ai_platform: 'midjourney',
    prompt_text: 'Brand identity mockup on a wooden desk, showing logo variations, color palette swatches, business cards, and stationery, soft natural lighting, professional branding photography, clean composition, minimalist aesthetic, 8K --ar 16:9 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"100","version":"6.1"}',
    usage_guide: '品牌VI展示。适合品牌手册、官网About页面的视觉展示素材。',
    is_free: 0, price: 8, downloads: 234, likes: 21,
  },
  {
    id: 'brd-003', title: '餐饮品牌Logo',
    description: '餐饮/咖啡馆品牌Logo设计',
    category: 'branding', ai_platform: 'midjourney',
    prompt_text: 'Vintage cafe logo design, hand-drawn coffee cup illustration, rustic typography style, warm brown and cream color palette, chalkboard background, artisanal feel, retro charm, restaurant branding, 8K --ar 1:1 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"150","version":"6.1"}',
    usage_guide: '餐饮品牌Logo。手绘+复古风格适合精品咖啡店、烘焙坊等品牌。',
    is_free: 0, price: 5, downloads: 345, likes: 29,
  },
  {
    id: 'brd-004', title: '护肤品牌视觉',
    description: '自然护肤品牌的视觉调性图',
    category: 'branding', ai_platform: 'midjourney',
    prompt_text: 'Natural skincare brand aesthetic, minimalist white bottles with green botanical accents, fresh green leaves, clean laboratory background, morning sunlight, clean beauty concept, organic and pure feel, spa atmosphere, 8K --ar 4:3 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"200","version":"6.1"}',
    usage_guide: '护肤品牌视觉。白+绿配色传递天然纯净感，适合Clean Beauty品牌调性。',
    is_free: 0, price: 5, downloads: 567, likes: 48,
  },

  // ======== 🎉 活动推广 (Campaign) ========
  {
    id: 'cmp-001', title: '双十一促销海报',
    description: '双十一/双十二等大促活动海报风格图',
    category: 'campaign', ai_platform: 'midjourney',
    prompt_text: 'Festive shopping festival composition, vibrant red and gold color scheme, floating discount tags and gift boxes, explosive energy, celebration atmosphere, commercial poster style, space for text overlay in center, 8K, dramatic lighting --ar 3:4 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"300","version":"6.1"}',
    usage_guide: '大促活动海报。红色+金色配色传递促销和节日氛围，中心留空叠加主文案。',
    is_free: 0, price: 8, downloads: 789, likes: 56,
  },
  {
    id: 'cmp-002', title: '新品发布 - 科技感',
    description: '科技产品新品发布会风格图，神秘感和期待感',
    category: 'campaign', ai_platform: 'midjourney',
    prompt_text: 'Silhouette of a mysterious new product under a dramatic spotlight, dark studio background, blue and purple neon accent lighting, smoke and atmosphere, tech product launch event style, teaser campaign mood, cinematic lighting, 8K --ar 16:9 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"250","version":"6.1"}',
    usage_guide: '新品预热/发布会预告。剪影+聚光灯营造神秘感和期待感。',
    is_free: 0, price: 5, downloads: 456, likes: 37,
  },
  {
    id: 'cmp-003', title: '圣诞节促销',
    description: '圣诞节主题活动促销视觉',
    category: 'campaign', ai_platform: 'midjourney',
    prompt_text: 'Cozy Christmas product display, evergreen wreath, warm fairy lights, red and gold ornaments, snowflakes on window, festive mood, warm fireplace background, gift boxes wrapped elegantly, holiday season commercial photography, 8K --ar 3:2 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"3:2","stylize":"300","version":"6.1"}',
    usage_guide: '圣诞节促销视觉。暖色灯光+圣诞元素营造节日氛围，适合12月营销素材。',
    is_free: 0, price: 5, downloads: 567, likes: 41,
  },
  {
    id: 'cmp-004', title: '周年庆活动',
    description: '品牌周年庆活动视觉',
    category: 'campaign', ai_platform: 'midjourney',
    prompt_text: 'Elegant anniversary celebration composition, golden balloons floating, champagne glasses, confetti, warm golden lighting, sophisticated party atmosphere, luxury brand celebration style, 8K, shallow depth of field --ar 3:4 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"250","version":"6.1"}',
    usage_guide: '周年庆视觉。金色+香槟色调传递高端庆祝氛围，适合品牌周年纪念活动。',
    is_free: 1, price: 0, downloads: 345, likes: 28,
  },

  // ======== 📊 营销素材 (Marketing) ========
  {
    id: 'mkt-001', title: '邮件营销Banner',
    description: 'EDM邮件营销Banner图，简洁专业',
    category: 'marketing', ai_platform: 'midjourney',
    prompt_text: 'Clean email newsletter banner, professional composition, left side product image space, right side text space, soft blue gradient background, subtle geometric pattern, modern business style, 8K --ar 3:1 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"3:1","stylize":"100","version":"6.1"}',
    usage_guide: 'EDM邮件Banner。左右分割布局，左侧产品展示区，右侧文案区，3:1标准EDM比例。',
    is_free: 1, price: 0, downloads: 432, likes: 31,
  },
  {
    id: 'mkt-002', title: '社交媒体广告合集',
    description: '社交媒体广告素材组合图，适合投前展示',
    category: 'marketing', ai_platform: 'midjourney',
    prompt_text: 'Social media ad mockup showing multiple devices, iPhone screen with Instagram ad, iPad, and laptop, modern office desk setup, professional marketing presentation style, clean and organized, 8K --ar 16:9 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"100","version":"6.1"}',
    usage_guide: '广告投放素材预览图。多设备展示适合广告提案或案例展示页面。',
    is_free: 0, price: 5, downloads: 234, likes: 19,
  },
  {
    id: 'mkt-003', title: 'Landing Page Hero',
    description: '落地页Hero区域背景图，吸睛的首页大图',
    category: 'marketing', ai_platform: 'midjourney',
    prompt_text: 'Stunning wide landscape composition, modern abstract blend of technology and nature, blue and purple gradient sky, futuristic city silhouette, clean space for text overlay on left side, website hero banner style, 8K --ar 21:9 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"21:9","stylize":"200","version":"6.1"}',
    usage_guide: '网站Landing Page Hero背景。超宽幅比例，左侧留白叠加主标题文案。',
    is_free: 0, price: 5, downloads: 567, likes: 43,
  },
  {
    id: 'mkt-004', title: '企业宣传册封面',
    description: '企业宣传册/画册封面设计图',
    category: 'marketing', ai_platform: 'midjourney',
    prompt_text: 'Professional corporate brochure cover, minimalist geometric design, navy blue and white color scheme, modern typography layout, abstract wave pattern, business presentation style, sophisticated and professional, 8K --ar 4:3 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"100","version":"6.1"}',
    usage_guide: '企业宣传册封面。深蓝色+白色传递专业信赖感，几何波浪增加现代感。',
    is_free: 0, price: 3, downloads: 345, likes: 26,
  },
  {
    id: 'mkt-005', title: 'Banner广告 - 促销',
    description: '网页Banner广告图，通用促销风格',
    category: 'marketing', ai_platform: 'stable-diffusion',
    prompt_text: 'web banner advertisement, sale promotion, bold typography space on the right, product showcase on the left, vibrant gradient background, modern e-commerce style, clean professional design, high contrast, eye-catching',
    negative_prompt: 'cluttered, text, watermark, low quality', parameters: '{"model":"SDXL","steps":"25","CFG":"7"}',
    usage_guide: '网页Banner广告。左右布局预留文案空间，SD版本可根据需要调整CFG值控制创意度。',
    is_free: 1, price: 0, downloads: 678, likes: 52,
  },

  // ======== 🎬 短视频素材 (Short Video) ========
  {
    id: 'vid-001', title: '短视频封面 - 教程类',
    description: '短视频教程/干货类封面图，高点击率风格',
    category: 'shortvideo', ai_platform: 'midjourney',
    prompt_text: 'Close-up of hands typing on a laptop keyboard, warm desk lamp lighting, coffee cup in corner, cozy study room background, educational video thumbnail style, concentrated atmosphere, warm inviting colors, 8K --ar 9:16 --v 6.1 --s 100',
    negative_prompt: '', parameters: '{"aspect":"9:16","stylize":"100","version":"6.1"}',
    usage_guide: '知识教程类短视频封面。暖色调和专注氛围增加点击意愿。',
    is_free: 0, price: 3, downloads: 345, likes: 23,
  },
  {
    id: 'vid-002', title: 'Vlog 封面',
    description: '生活Vlog封面图，温暖治愈风格',
    category: 'shortvideo', ai_platform: 'midjourney',
    prompt_text: 'A cup of coffee on a sunny windowsill, morning sunlight streaming in, cozy bedroom with plants, calm and peaceful vibe, vlog thumbnail style, warm film tones, lifestyle content, 8K --ar 9:16 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"9:16","stylize":"200","version":"6.1"}',
    usage_guide: 'Vlog封面。阳光+植物+咖啡的治愈组合，适合生活类、居家类Vlog内容。',
    is_free: 1, price: 0, downloads: 567, likes: 39,
  },
  {
    id: 'vid-003', title: '游戏视频封面',
    description: '游戏实况/攻略视频封面，动感风格',
    category: 'shortvideo', ai_platform: 'midjourney',
    prompt_text: 'Epic gaming scene composition, dramatic lighting, neon blue and purple color scheme, action pose, game character silhouette, cinematic atmosphere, YouTube gaming thumbnail style, energetic and exciting, 8K --ar 16:9 --v 6.1 --s 350',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"350","version":"6.1"}',
    usage_guide: '游戏视频封面。高stylize值增加画面冲击力，适合B站/YouTube游戏内容。',
    is_free: 0, price: 5, downloads: 234, likes: 17,
  },

  // ======== 🛒 电商广告 (E-commerce) — 更多 ========
  {
    id: 'eco-011', title: '婴儿产品温馨场景',
    description: '婴儿/儿童产品场景图，温馨柔和',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Soft baby products on a natural cotton blanket, pastel color palette, gentle morning light, plush toys around, safe and cozy atmosphere, motherhood photography, warm and tender mood, 8K --ar 4:3 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"150","version":"6.1"}',
    usage_guide: '母婴类产品。柔和色调+棉质纹理传递安全温暖的品牌调性。',
    is_free: 0, price: 3, downloads: 198, likes: 16,
  },
  {
    id: 'eco-012', title: '箱包产品展示',
    description: '皮具箱包产品展示，质感光影突出',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A premium leather handbag on a marble pedestal, dramatic side lighting highlighting texture, warm luxury boutique atmosphere, commercial product photography, rich leather details, elegant composition, 8K --ar 4:3 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"200","version":"6.1"}',
    usage_guide: '箱包/皮具类。侧光突出皮革纹理，适合展示高端手袋、钱包等产品。',
    is_free: 0, price: 5, downloads: 267, likes: 22,
  },
  {
    id: 'eco-013', title: '食品包装展示',
    description: '食品包装袋/盒的产品展示图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Premium food packaging box on a rustic wooden surface, ingredients scattered around, warm natural lighting, artisanal packaging design, commercial food photography, product label visible, organic feel, 8K --ar 1:1 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"200","version":"6.1"}',
    usage_guide: '食品包装展示。散落的原料增强产品真实感和品质感。',
    is_free: 0, price: 3, downloads: 312, likes: 25,
  },
  {
    id: 'eco-014', title: '眼镜产品展示',
    description: '眼镜/墨镜产品专业展示图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Stylish sunglasses on a reflective surface, bright studio lighting with soft shadows, fashion accessories photography, sharp focus on lens and frame, minimalist composition, summer vibe, 8K --ar 4:3 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"150","version":"6.1"}',
    usage_guide: '眼镜品类。反光表面增强时尚感，适合太阳镜、光学眼镜等产品。',
    is_free: 1, price: 0, downloads: 456, likes: 34,
  },
  {
    id: 'eco-015', title: '宠物产品场景',
    description: '宠物用品的生活场景图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A fluffy cat sitting next to a modern pet bed, cozy living room corner, soft afternoon sunlight, pet product lifestyle photography, warm and loving atmosphere, happy pet, 8K --ar 4:3 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"200","version":"6.1"}',
    usage_guide: '宠物用品。萌宠+产品的生活场景最能打动宠物主消费者。',
    is_free: 0, price: 5, downloads: 534, likes: 67,
  },
  {
    id: 'eco-016', title: '酒类产品高端场景',
    description: '红酒/威士忌等酒类产品的奢华场景图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'A bottle of premium red wine next to a crystal glass, dark moody background, dramatic spotlighting, deep ruby wine color, luxurious wine cellar atmosphere, fine dining photography, 8K, rich shadows --ar 3:2 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"3:2","stylize":"300","version":"6.1"}',
    usage_guide: '酒类产品场景。深色背景+聚光灯营造高端奢华感，适合展示红酒、洋酒等。',
    is_free: 0, price: 8, downloads: 398, likes: 35,
  },

  // ======== 📱 社交媒体 — 更多 ========
  {
    id: 'soc-008', title: '小红书封面 - 旅行',
    description: '旅行攻略类小红书封面，治愈风景风格',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'A person standing on a mountain viewpoint with arms open, breathtaking sunrise over clouds, golden and pink sky, travel photography, inspirational scene, dreamy atmosphere, 8K --ar 3:4 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"250","version":"6.1"}',
    usage_guide: '旅行类封面。日出+云端+背影的组合是小红书旅行赛道的高赞公式。',
    is_free: 0, price: 3, downloads: 567, likes: 78,
  },
  {
    id: 'soc-009', title: 'INS风桌面布置',
    description: 'Instagram风桌面/书桌布置图',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Minimalist wooden desk setup, MacBook, small plant, ceramic coffee cup, natural lighting from window, aesthetic workspace, clean and organized, Instagram desk aesthetic, warm earthy tones, 8K --ar 4:3 --v 6.1 --s 150',
    negative_prompt: '', parameters: '{"aspect":"4:3","stylize":"150","version":"6.1"}',
    usage_guide: '氛围感桌面图。适合生活方式类社交媒体内容，展示数字游民/远程办公调性。',
    is_free: 1, price: 0, downloads: 678, likes: 45,
  },
  {
    id: 'soc-010', title: '节日祝福图',
    description: '节日/节气品牌祝福社交媒体图',
    category: 'social', ai_platform: 'midjourney',
    prompt_text: 'Elegant greeting card style, gold foil texture background, soft floral elements, warm elegant typography space, celebration mood, luxury paper texture, 8K --ar 1:1 --v 6.1 --s 200',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"200","version":"6.1"}',
    usage_guide: '节日祝福社交图。金箔底纹+花卉元素传递高级感，适合品牌节日问候。',
    is_free: 0, price: 3, downloads: 234, likes: 19,
  },

  // ======== 🎨 风格化广告 (Special Style) ========
  {
    id: 'spc-001', title: '水彩风格产品插画',
    description: '水彩手绘风格的产品插画图，适合文艺品牌',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: 'Watercolor illustration of a perfume bottle, soft pastel colors, artistic brush strokes, elegant floral elements around, hand-painted texture, delicate and dreamy, art print style, 8K --ar 3:4 --v 6.1 --s 400',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"400","version":"6.1"}',
    usage_guide: '水彩风格适合文艺/小众品牌。高stylize值增加艺术感和手绘效果。',
    is_free: 0, price: 8, downloads: 312, likes: 34,
  },
  {
    id: 'spc-002', title: '3D渲染产品风格',
    description: 'C4D风格的3D产品渲染图',
    category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: '3D render of a modern sneaker, isometric view, soft pastel blue background, smooth clay-like material, playful and trendy, 3D product visualization, clean studio lighting, 8K --ar 1:1 --v 6.1 --s 250',
    negative_prompt: '', parameters: '{"aspect":"1:1","stylize":"250","version":"6.1"}',
    usage_guide: '3D渲染风格产品图。等距视图+柔和配色符合当前电商设计趋势。',
    is_free: 0, price: 5, downloads: 456, likes: 52,
  },
  {
    id: 'spc-003', title: '中国风品牌视觉',
    description: '国潮/中国风的品牌视觉图',
    category: 'branding', ai_platform: 'midjourney',
    prompt_text: 'Chinese traditional ink painting style, elegant peony flowers, gold and red color palette, silk texture background, modern luxury reinterpretation of classical Chinese aesthetics, 8K --ar 3:4 --v 6.1 --s 300',
    negative_prompt: '', parameters: '{"aspect":"3:4","stylize":"300","version":"6.1"}',
    usage_guide: '国潮/中国风品牌视觉。水墨+牡丹+鎏金配色，适合美妆、白酒、文化品牌。',
    is_free: 0, price: 8, downloads: 678, likes: 89,
  },
  {
    id: 'spc-004', title: '赛博朋克广告',
    description: '赛博朋克风格的广告视觉图',
    category: 'campaign', ai_platform: 'midjourney',
    prompt_text: 'Cyberpunk cityscape with neon signs, rain-slicked streets, futuristic product glowing with neon light, blue and pink color scheme, sci-fi advertising style, high contrast, cinematic, blade runner atmosphere, 8K --ar 16:9 --v 6.1 --s 350',
    negative_prompt: '', parameters: '{"aspect":"16:9","stylize":"350","version":"6.1"}',
    usage_guide: '赛博朋克风格适合科技产品、游戏、潮流品牌的推广素材。',
    is_free: 0, price: 5, downloads: 534, likes: 61,
  },
];

// ====== 插入模板 ======
const insertTemplate = db.prepare(`
  INSERT INTO templates (id, title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, preview_url, is_free, price, downloads, likes)
  VALUES (@id, @title, @description, @category, @ai_platform, @prompt_text, @negative_prompt, @parameters, @usage_guide, @preview_url, @is_free, @price, @downloads, @likes)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insertTemplate.run({
      ...item,
      preview_url: `/images/${item.id}.jpg`,
      parameters: item.parameters || '{}',
      negative_prompt: item.negative_prompt || '',
      usage_guide: item.usage_guide || '',
    });
  }
});

insertMany(templates);

console.log(`✅ 已导入 ${templates.length} 个模板`);
console.log('✅ 种子数据初始化完成！');

// 关闭数据库连接
db.close();
