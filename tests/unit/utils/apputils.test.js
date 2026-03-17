// AppUtils 유틸리티 함수 단위 테스트
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { escapeHTML,formatDate,formatKoreanDate,formatDateTimeDetailed,getWeekday,isValidObituaryId,formatPhoneNumber,isMobileDevice,debounce,showToast,showConfirm } from '../../../src/common/utils.js';

describe('escapeHTML',()=>{
  it('일반텍스트',()=>{expect(escapeHTML('안녕')).toBe('안녕');expect(escapeHTML('hello')).toBe('hello')});
  it('script',()=>{const i="<script>alert('xss')</script>";expect(escapeHTML(i)).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;")});
  it('&',()=>{expect(escapeHTML('A & B')).toBe('A &amp; B')});
  it('quotes',()=>{expect(escapeHTML('say "hi"')).toBe('say &quot;hi&quot;')});
  it('sq',()=>{expect(escapeHTML("it's")).toBe("it&#039;s")});
  it('<>',()=>{expect(escapeHTML('<div>')).toBe('&lt;div&gt;')});
  it('empty',()=>{expect(escapeHTML('')).toBe('')});
  it('null',()=>{expect(escapeHTML(null)).toBe('')});
  it('undef',()=>{expect(escapeHTML(undefined)).toBe('')});
  it('num',()=>{expect(escapeHTML(123)).toBe('')});
  it('xss',()=>{expect(escapeHTML('"><img src=x onerror=alert(1)>')).toBe('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')});
});
describe('formatDate',()=>{
  it('dash',()=>{expect(formatDate('2024-03-15')).toBe('2024년 3월 15일')});
  it('dot',()=>{expect(formatDate('2024.03.15')).toBe('2024년 3월 15일')});
  it('slash',()=>{expect(formatDate('2024/03/15')).toBe('2024년 3월 15일')});
  it('time',()=>{expect(formatDate('2024-03-15T14:30:00',true)).toBe('2024년 3월 15일 14시 30분')});
  it('Date',()=>{expect(formatDate(new Date(2024,2,15))).toBe('2024년 3월 15일')});
  it('empty',()=>{expect(formatDate('')).toBe('')});
  it('null',()=>{expect(formatDate(null)).toBe('')});
  it('undef',()=>{expect(formatDate(undefined)).toBe('')});
  it('bad',()=>{expect(typeof formatDate('bad')).toBe('string')});
});
describe('formatKoreanDate',()=>{
  it('weekday',()=>{expect(formatKoreanDate('2024-03-15')).toBe('2024년 3월 15일 (금)')});
  it('Date',()=>{expect(formatKoreanDate(new Date(2024,2,15))).toBe('2024년 3월 15일 (금)')});
  it('월',()=>{expect(formatKoreanDate('2024-03-18')).toContain('(월)')});
  it('일',()=>{expect(formatKoreanDate('2024-03-17')).toContain('(일)')});
  it('empty',()=>{expect(formatKoreanDate('')).toBe('');expect(formatKoreanDate(null)).toBe('')});
});
describe('formatDateTimeDetailed',()=>{
  it('am',()=>{expect(formatDateTimeDetailed('2024-03-15','09:30')).toBe('2024년 3월 15일 (금) 오전 9시 30분')});
  it('pm',()=>{expect(formatDateTimeDetailed('2024-03-15','14:00')).toBe('2024년 3월 15일 (금) 오후 2시')});
  it('dateOnly',()=>{expect(formatDateTimeDetailed('2024-03-15',null,true,false)).toBe('2024년 3월 15일 (금)')});
  it('noDay',()=>{expect(formatDateTimeDetailed('2024-03-15','09:30',false)).toBe('2024년 3월 15일 오전 9시 30분')});
  it('empty',()=>{expect(formatDateTimeDetailed('')).toBe('');expect(formatDateTimeDetailed(null)).toBe('')});
  it('korean+time',()=>{const r=formatDateTimeDetailed('2024년 3월 15일','14:00');expect(r).toContain('오후 2시')});
});
describe('getWeekday',()=>{
  it('금',()=>{expect(getWeekday(new Date(2024,2,15))).toBe('금')});
  it('월',()=>{expect(getWeekday(new Date(2024,2,18))).toBe('월')});
  it('일',()=>{expect(getWeekday(new Date(2024,2,17))).toBe('일')});
  it('토',()=>{expect(getWeekday(new Date(2024,2,16))).toBe('토')});
  it('invalid',()=>{expect(getWeekday(new Date('x'))).toBe('')});
  it('nonDate',()=>{expect(getWeekday('2024-03-15')).toBe('');expect(getWeekday(null)).toBe('')});
});
describe('isValidObituaryId',()=>{
  it('valid',()=>{expect(isValidObituaryId('abc-123_XYZ')).toBe(true)});
  it('4char',()=>{expect(isValidObituaryId('abcd')).toBe(true)});
  it('50',()=>{expect(isValidObituaryId('a'.repeat(50))).toBe(true)});
  it('3char',()=>{expect(isValidObituaryId('abc')).toBe(false)});
  it('51',()=>{expect(isValidObituaryId('a'.repeat(51))).toBe(false)});
  it('special',()=>{expect(isValidObituaryId('a!@#')).toBe(false);expect(isValidObituaryId('a b')).toBe(false);expect(isValidObituaryId('a.b')).toBe(false)});
  it('empty',()=>{expect(isValidObituaryId('')).toBe(false)});
  it('null',()=>{expect(isValidObituaryId(null)).toBe(false)});
  it('undef',()=>{expect(isValidObituaryId(undefined)).toBe(false)});
  it('number',()=>{expect(isValidObituaryId(12345)).toBe(false)});
});
describe('formatPhoneNumber',()=>{
  it('010',()=>{expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678')});
  it('02',()=>{expect(formatPhoneNumber('0212345678')).toBe('021-234-5678')});
  it('formatted',()=>{expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678')});
  it('empty',()=>{expect(formatPhoneNumber('')).toBe('')});
  it('null',()=>{expect(formatPhoneNumber(null)).toBe('')});
  it('short',()=>{expect(formatPhoneNumber('123')).toBe('123')});
});
describe('isMobileDevice',()=>{
  it('bool',()=>{expect(typeof isMobileDevice()).toBe('boolean')});
});
describe('debounce',()=>{
  beforeEach(()=>{vi.useFakeTimers()});afterEach(()=>{vi.useRealTimers()});
  it('대기후실행',()=>{const fn=vi.fn();const d=debounce(fn,200);d();expect(fn).not.toHaveBeenCalled();vi.advanceTimersByTime(200);expect(fn).toHaveBeenCalledTimes(1)});
  it('마지막만',()=>{const fn=vi.fn();const d=debounce(fn,300);d('a');d('b');d('c');vi.advanceTimersByTime(300);expect(fn).toHaveBeenCalledTimes(1);expect(fn).toHaveBeenCalledWith('c')});
  it('리셋',()=>{const fn=vi.fn();const d=debounce(fn,300);d();vi.advanceTimersByTime(200);expect(fn).not.toHaveBeenCalled();d();vi.advanceTimersByTime(200);expect(fn).not.toHaveBeenCalled();vi.advanceTimersByTime(100);expect(fn).toHaveBeenCalledTimes(1)});
  it('300ms',()=>{const fn=vi.fn();const d=debounce(fn);d();vi.advanceTimersByTime(299);expect(fn).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(fn).toHaveBeenCalledTimes(1)});
});
describe('showToast',()=>{
  beforeEach(()=>{vi.useFakeTimers();document.body.innerHTML=''});afterEach(()=>{vi.useRealTimers()});
  it('create',()=>{showToast('테스트');const t=document.getElementById('toast-message');expect(t).not.toBeNull();expect(t.textContent).toBe('테스트')});
  it('info',()=>{showToast('x','info');expect(document.getElementById('toast-message').classList.contains('toast-info')).toBe(true)});
  it('error',()=>{showToast('x','error');expect(document.getElementById('toast-message').classList.contains('toast-error')).toBe(true)});
  it('success',()=>{showToast('x','success');expect(document.getElementById('toast-message').classList.contains('toast-success')).toBe(true)});
  it('aria',()=>{showToast('a');const t=document.getElementById('toast-message');expect(t.getAttribute('role')).toBe('status');expect(t.getAttribute('aria-live')).toBe('polite')});
  it('remove',()=>{showToast('x','info',1000);vi.advanceTimersByTime(1300);expect(document.getElementById('toast-message')).toBeNull()});
  it('reuse',()=>{showToast('첫');showToast('둘');expect(document.querySelectorAll('#toast-message').length).toBe(1);expect(document.getElementById('toast-message').textContent).toBe('둘')});
});
describe('showConfirm',()=>{
  beforeEach(()=>{document.body.innerHTML=''});
  it('modal',()=>{showConfirm('ok?');const m=document.getElementById('custom-confirm-modal');expect(m).not.toBeNull();expect(m.getAttribute('role')).toBe('dialog')});
  it('msg',()=>{showConfirm('del?');expect(document.querySelector('.confirm-modal-message').textContent).toBe('del?')});
  it('ok->true',async()=>{const p=showConfirm('ok');document.querySelector('.confirm-modal-ok').click();expect(await p).toBe(true)});
  it('cancel->false',async()=>{const p=showConfirm('c');document.querySelector('.confirm-modal-cancel').click();expect(await p).toBe(false)});
  it('overlay->false',async()=>{const p=showConfirm('o');document.getElementById('custom-confirm-modal').dispatchEvent(new Event('click',{bubbles:true}));expect(await p).toBe(false)});
  it('remove',async()=>{const p=showConfirm('r');document.querySelector('.confirm-modal-ok').click();await p;expect(document.getElementById('custom-confirm-modal')).toBeNull()});
  it('recreate',async()=>{showConfirm('1');const p2=showConfirm('2');expect(document.querySelectorAll('#custom-confirm-modal').length).toBe(1);document.querySelector('.confirm-modal-cancel').click();await p2});
});
