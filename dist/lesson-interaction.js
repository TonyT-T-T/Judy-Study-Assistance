export function lessonSteps(lesson){
 if(!Array.isArray(lesson?.steps))return [];
 return lesson.steps.map((text,index)=>({
  index,text,
  reason:typeof lesson.stepReasons?.[index]==='string'?lesson.stepReasons[index]:'',
  question:typeof lesson.stepQuestions?.[index]==='string'?lesson.stepQuestions[index]:'你卡在题目条件、列式依据，还是这一步的计算？'
 }));
}
export function stepContext(lesson,index){
 if(!Number.isInteger(index))return null;
 const step=lessonSteps(lesson)[index];if(!step)return null;
 return {index:step.index,text:step.text,reason:step.reason};
}
export function sampleStepReply(lesson,index){
 const step=lessonSteps(lesson)[index];if(!step)return '请先选择你不理解的具体步骤。';
 return '我们只看第 '+(index+1)+' 步，先不急着往下做。\n'+(step.reason||'这份旧讲解暂未保存该步的依据，可以结合已知条件一起核对：'+step.text)+'\n想一想：'+step.question;
}
