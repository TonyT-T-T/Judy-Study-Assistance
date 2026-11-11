export const GRADE_NAMES=['初一','初二','初三'];
const bounded=(value,n=100)=>typeof value==='string'?value.trim().slice(0,n):'';
export function normalizeProfile(raw={}){
 const grade=GRADE_NAMES.includes(raw.grade)?raw.grade:'初一';
 const edition=bounded(raw.edition);
 return {grade,edition,scope:'初中三年（七至九年级）',textbookVerified:raw.textbookVerified===true&&!!edition,semester:['上册','下册','全年'].includes(raw.semester)?raw.semester:'全年',currentChapter:bounded(raw.currentChapter),learningGoal:bounded(raw.learningGoal,200),coveredTopics:Array.isArray(raw.coveredTopics)?[...new Set(raw.coveredTopics.filter(x=>typeof x==='string'&&x.length<=40))].slice(0,80):[]};
}
export function profileContext(raw={}){
 const p=normalizeProfile(raw);
 return '课程范围：人教版初中三年，七至九年级。当前学习年级：'+p.grade+'；册次：'+p.semester+'。教材描述：'+(p.edition||'人教版，北京使用；具体版次待核对')+'。'+(p.textbookVerified?'家长标记已核对教材描述；仍不得编造章节号或课本页码。':'具体版次与目录尚未核对，不要推断出版年份、章次或页码。')+' 当前章节：'+(p.currentChapter||'未指定，不限制只讲当前章节')+'。已学范围（家长标记）：'+(p.coveredTopics.join('、')||'未提供')+'。学习目标：'+(p.learningGoal||'理解原理、独立解题并积累方法')+'。可回溯以前的先修知识；若需要高年级方法，先说明并给适合当前年级的解释。';
}
