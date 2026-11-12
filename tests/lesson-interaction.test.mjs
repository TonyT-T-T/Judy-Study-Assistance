import test from 'node:test';
import assert from 'node:assert/strict';
import {samples} from '../dist/samples.js';
import {lessonSteps,stepContext,sampleStepReply} from '../dist/lesson-interaction.js';
import {validateLesson,validateFocusStep} from '../worker/api.js';
test('all synthetic worked examples pair every detailed step with a reason and a check question',()=>{for(const s of samples){assert.ok(s.steps.length>=6);assert.equal(s.stepReasons.length,s.steps.length);assert.equal(s.stepQuestions.length,s.steps.length);for(const step of lessonSteps(s)){assert.ok(step.reason.length>10);assert.ok(step.question);assert.equal(stepContext(s,step.index).text,step.text);}}});
test('step-specific explanation addresses the selected operation and retains teacher question',()=>{const s=samples.find(s=>s.id==='work');const reply=sampleStepReply(s,4);assert.match(reply,/第 5 步/);assert.match(reply,/等式两边/);assert.match(reply,/为什么可以两边同时乘12/);assert.equal(stepContext(s,99),null);});
test('legacy stored lessons still render without fabricated step reasons',()=>{const s={steps:['这是旧的第一步','这是旧的第二步']};const steps=lessonSteps(s);assert.equal(steps.length,2);assert.equal(steps[0].reason,'');assert.ok(steps[0].question);});
test('malformed step arrays and invalid followup focus are rejected',()=>{assert.throws(()=>validateLesson({...samples[0],stepReasons:['wrong length']}),/MODEL_SCHEMA/);assert.throws(()=>validateFocusStep({index:12,text:'outside range'}),/INVALID_FOCUS_STEP/);assert.throws(()=>validateFocusStep({index:0,text:''}),/INVALID_FOCUS_STEP/);assert.equal(validateFocusStep(undefined),null);assert.equal(validateFocusStep({index:0,text:'真实题目的步骤',reason:'等式的性质'}).index,0);});
