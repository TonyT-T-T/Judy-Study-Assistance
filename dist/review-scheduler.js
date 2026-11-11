import {fsrs,createEmptyCard,Rating} from './vendor/ts-fsrs.js';
export const REVIEW_VERSION='ts-fsrs@5.4.2';
// 数学理解并非纯记忆；算法只建议复习时间，不估计真实成绩或知识掌握率。
const scheduler=fsrs({request_retention:0.9,maximum_interval:90,enable_fuzz:false,enable_short_term:false});
export const reviewRatings={again:Rating.Again,hard:Rating.Hard,good:Rating.Good,easy:Rating.Easy};
export function restoreCard(raw,now=new Date()){
 if(!raw)return createEmptyCard(now);
 if(!raw||typeof raw!=='object')throw new Error('INVALID_REVIEW_CARD');
 const fields=['stability','difficulty','elapsed_days','scheduled_days','reps','lapses','state'];
 if(!fields.every(k=>typeof raw[k]==='number'&&Number.isFinite(raw[k])&&raw[k]>=0)||raw.difficulty>10||raw.stability>1e7||raw.scheduled_days>1e6||raw.reps>1e6||raw.lapses>raw.reps||!Number.isInteger(raw.reps)||!Number.isInteger(raw.lapses)||!Number.isInteger(raw.state)||raw.state>3||(raw.learning_steps!==undefined&&(!Number.isInteger(raw.learning_steps)||raw.learning_steps<0||raw.learning_steps>100)))throw new Error('INVALID_REVIEW_CARD');
 const due=new Date(raw.due),last=raw.last_review?new Date(raw.last_review):undefined;
 if(!Number.isFinite(due.getTime())||(last&&!Number.isFinite(last.getTime())))throw new Error('INVALID_REVIEW_DATE');
 return {...createEmptyCard(now),...Object.fromEntries(fields.map(k=>[k,raw[k]])),...(Number.isFinite(raw.learning_steps)?{learning_steps:raw.learning_steps}:{}),due,last_review:last};
}
export function nextReview(raw,rating,now=new Date()){
 if(!(rating in reviewRatings))throw new Error('INVALID_REVIEW_RATING');
 const date=new Date(now);if(!Number.isFinite(date.getTime()))throw new Error('INVALID_REVIEW_DATE');
 const card=restoreCard(raw,date);
 if(card.last_review&&date<card.last_review)throw new Error('REVIEW_BEFORE_LAST');
 const result=scheduler.next(card,date,reviewRatings[rating]);
 const serialized=JSON.parse(JSON.stringify(result.card));
 return {card:serialized,log:JSON.parse(JSON.stringify(result.log)),due:result.card.due.toISOString(),algorithm:REVIEW_VERSION,rating};
}
