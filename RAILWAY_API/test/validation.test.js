import test from 'node:test';import assert from 'node:assert/strict';import {validate,publicRecord,origins} from '../src/validation.js';
const good={type:'question',author:'홍길동',title:'문의',body:'내용',turnstile_token:'token'};
test('valid question',()=>assert.equal(validate(good),null));
test('invalid empty body',()=>assert.equal(validate({...good,body:''}),'INVALID_FIELDS'));
test('invalid missing title',()=>assert.equal(validate({...good,title:''}),'INVALID_FIELDS'));
test('valid consultation',()=>assert.equal(validate({...good,type:'consultation',title:undefined,phone:'010-0000-0000'}),null));
test('only two origins',()=>{assert.equal(origins.has('https://homefilm.co.kr'),true);assert.equal(origins.has('https://evil.example'),false);});
test('record excludes turnstile',()=>assert.equal('turnstile_token' in publicRecord(good),false));
