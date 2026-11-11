// 本项目原创的轻量知识点规则；不是国家平台课程 API 或教材目录。
export const PLATFORM_URL='https://basic.smartedu.cn/';
export const topicRules=[
 {id:'number',name:'数轴与绝对值',keywords:['数轴','绝对值','相反数'],search:'七年级 数学 数轴 绝对值',learn:['数轴的原点、正方向和单位长度','绝对值与数轴上两点的距离'],reason:'先分清坐标的位置与距离的含义。'},
 {id:'segment',name:'线段与中点',keywords:['线段','中点','射线'],search:'七年级 数学 直线 射线 线段 中点',learn:['线段的和差关系','线段中点的定义'],reason:'先看点的先后顺序，再看哪条线段被平分。'},
 {id:'work',name:'工程问题',keywords:['工程','工作效率','合作完成','单独做'],search:'七年级 数学 一元一次方程 工程问题',learn:['工作量、工作效率和时间的关系','用一元一次方程解决工程问题'],reason:'先理解总工作量看作 1，以及合作相加的是效率。'},
 {id:'kit',name:'配套问题',keywords:['配套','螺栓','螺母','零件'],search:'七年级 数学 一元一次方程 配套问题',learn:['从一套的数量比建立等量关系','用一元一次方程解决配套问题'],reason:'先画出一套，再把比例翻译成产量关系。'},
 {id:'equation',name:'一元一次方程',keywords:['一元一次方程','解方程','移项','去括号'],search:'七年级 数学 一元一次方程 等式的性质',learn:['等式的性质与解方程','去括号、移项和检验'],reason:'检查每一步是否保持等式两边相等。'}
];
const moreTopics=[
 ['signed','正数与负数','数与运算',['正数','负数','相反意义'],['相反意义的量与符号','有理数的分类']],
 ['rational','有理数的四则运算','数与运算',['有理数','加减','乘除','混合运算'],['运算法则与运算顺序','符号判断与简便运算']],
 ['power','乘方与科学记数法','数与运算',['乘方','科学记数法','幂','指数'],['底数、指数与乘方','科学记数法的形式']],
 ['expression','代数式与求值','整式与方程',['代数式','求值','用字母表示'],['列代数式与规范书写','代入与求值']],
 ['polynomial','单项式与多项式','整式与方程',['单项式','多项式','系数','次数'],['项、系数和次数','整式的概念']],
 ['terms','整式加减与合并同类项','整式与方程',['同类项','整式加减','合并'],['识别同类项','合并时字母及指数不变']],
 ['brackets','去括号与等式的性质','整式与方程',['去括号','分配律','等式的性质'],['符号与去括号','等式两边的相同运算']],
 ['travel','行程问题','方程应用',['行程','相遇','追及','速度','路程'],['路程、速度与时间','相遇与追及的等量关系']],
 ['price','销售与利润问题','方程应用',['利润','售价','进价','折扣','打折'],['售价、进价和利润','百分比和折扣']],
 ['allocation','和差倍分与分配问题','方程应用',['分配','倍数','多出','少了','余数'],['数量之间的和差倍分关系','从两种分配方式找等量关系']],
 ['angle','角与角平分线','图形与几何',['角平分线','余角','补角','角度','度分秒'],['角的度量与和差','角平分线、余角与补角']],
 ['solid','几何体与展开图','图形与几何',['展开图','正方体','几何体','三视图'],['立体图形与平面图形','从展开图认识几何体']],
 ['parallel','相交线与平行线','图形与几何',['平行线','相交线','同位角','内错角','同旁内角','对顶角'],['角的位置关系','平行线的判定与性质']],
 ['root','平方根、立方根与实数','数与运算',['平方根','算术平方根','立方根','实数','无理数'],['平方根与算术平方根的区别','实数与数轴']],
 ['coordinate','平面直角坐标系','图形与几何',['坐标系','象限','横坐标','纵坐标','有序数对'],['有序数对与点的位置','坐标变化与平移']],
 ['system','二元一次方程组','整式与方程',['二元一次','方程组','代入消元','加减消元'],['代入与加减消元','方程组的实际应用']],
 ['inequality','不等式与不等式组','整式与方程',['不等式','不等号','不等关系','解集'],['不等式的性质与解集','负数乘除引起方向变化']],
 ['statistics','数据收集与统计图','统计与数据',['统计图','直方图','调查','抽样','频数','扇形图','条形图'],['全面调查与抽样调查','读图与数据分析']]
];
for(const [id,name,group,keywords,learn] of moreTopics)topicRules.push({id,name,group,keywords,learn,search:'七年级 数学 '+name,reason:'先确认题目条件，再回看“'+learn[0]+'”。'});
for(const t of topicRules)if(!t.group)t.group=['work','kit'].includes(t.id)?'方程应用':t.id==='number'?'数与运算':t.id==='equation'?'整式与方程':'图形与几何';
export function inferTopics(item){
 if(!item)return [];
 const known=topicRules.find(t=>t.id===item.id&&!item.live);
 if(known)return [{...known,basis:'原创样题的已标注知识点',confirmed:true}];
 const text=[item.question,item.topic,item.chapter].filter(v=>typeof v==='string').join(' ');
 const matches=topicRules.filter(t=>t.keywords.some(k=>text.includes(k))).map(t=>({...t,basis:'关键词候选：'+t.keywords.filter(k=>text.includes(k)).join('、'),confirmed:false}));
 if(!matches.some(t=>['equation','system','inequality'].includes(t.id))&&/[=＝]/.test(text)&&/[xyz]/i.test(text)&&!/[²³^]|二次|分式/.test(text)){const t=topicRules.find(t=>t.id==='equation');matches.push({...t,basis:'式子中有字母与等号，方程类型需人工核对',confirmed:false});}
 return matches.slice(0,3);
}
export function validateCourseUrl(value){
 let url;try{url=new URL(value);}catch{return false;}
 if(url.protocol!=='https:'||!['basic.smartedu.cn','www.zxx.edu.cn','zxx.edu.cn'].includes(url.hostname)||url.username||url.password||url.port)return false;
 if((url.pathname==='/'&&!url.hash)||/signin|login|callback|logout/i.test(url.pathname))return false;
 for(const k of url.searchParams.keys())if(/token|authorization|password|secret|code|session/i.test(k))return false;
 if(/token=|password=|authorization=|secret=/i.test(url.hash))return false;
 return true;
}
export function matchingCourses(courses,topicId,edition){
 if(!edition?.trim()||!Array.isArray(courses))return [];
 const normalized=edition.trim().replace(/\s/g,'');
 return courses.filter(c=>c.topicId===topicId&&typeof c.edition==='string'&&c.edition.replace(/\s/g,'')===normalized&&c.reviewedByParent===true&&validateCourseUrl(c.url));
}
