// Obituary 엔티티 단위 테스트
import { describe, it, expect } from 'vitest';
import { Obituary } from '../../../src/domain/obituary/Obituary.js';
import { DeceasedInfo } from '../../../src/domain/obituary/vo/DeceasedInfo.js';
import { FuneralInfo } from '../../../src/domain/obituary/vo/FuneralInfo.js';
import { BereavedPerson } from '../../../src/domain/obituary/vo/BereavedPerson.js';
import { WreathOrder } from '../../../src/domain/obituary/vo/WreathOrder.js';
import { GuestbookEntry } from '../../../src/domain/obituary/vo/GuestbookEntry.js';

const PW='$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX';
function mkDI(o={}){return new DeceasedInfo({name:'김철수',age:78,deathDate:'2024-03-15',gender:'male',...o})}
function mkFI(o={}){return new FuneralInfo({funeralHallName:'서울',departureDate:'2024-03-18',...o})}
function mkB(){return[new BereavedPerson({relationship:'장남',name:'김영희'})]}
function mkO(o={}){return new Obituary({deceasedInfo:mkDI(),funeralInfo:mkFI(),bereaved:mkB(),password:PW,selectedTemplate:1,...o})}

describe('Obituary 생성',()=>{
  it('valid',()=>{const o=mkO();expect(o.id).toBeDefined();expect(o.deceasedInfo).toBeInstanceOf(DeceasedInfo);expect(o.viewCount).toBe(0)});
  it('no pw',()=>{expect(()=>new Obituary({deceasedInfo:mkDI(),funeralInfo:mkFI(),bereaved:[],password:''})).toThrow()});
  it('bad DI',()=>{expect(()=>new Obituary({deceasedInfo:{},funeralInfo:mkFI(),bereaved:[],password:PW})).toThrow()});
});

describe('_generateId',()=>{
  it('string',()=>{expect(typeof Obituary._generateId()).toBe('string')});
  it('unique',()=>{const s=new Set(Array.from({length:100},()=>Obituary._generateId()));expect(s.size).toBe(100)});
});

describe('fromData',()=>{
  it('create',()=>{
    const d={id:'tid',deceasedInfo:{name:'김',age:78,deathDate:'2024-03-15',gender:'male'},funeralInfo:{funeralHallName:'s',departureDate:'2024-03-18'},bereaved:[{relationship:'r',name:'n'}],password:PW,selectedTemplate:1,viewCount:5};
    const o=Obituary.fromData(d);expect(o.id).toBe('tid');expect(o.viewCount).toBe(5)});
  it('null err',()=>{expect(()=>Obituary.fromData(null)).toThrow()});
});

describe('_toDataObject roundtrip',()=>{
  it('consistent',()=>{const o1=mkO();const dto=o1._toDataObject();const o2=Obituary.fromData(dto);expect(o2.id).toBe(o1.id);expect(o2.deceasedInfo.name).toBe(o1.deceasedInfo.name)});
});
describe('incrementViewCount',()=>{
  it('+1',()=>{const o=mkO();expect(o.viewCount).toBe(0);o.incrementViewCount();expect(o.viewCount).toBe(1);o.incrementViewCount();expect(o.viewCount).toBe(2)});
});

describe('isExpired',()=>{
  it('past expired',()=>{const d=new Date();d.setDate(d.getDate()-10);const o=mkO({funeralInfo:mkFI({departureDate:d.toISOString().split('T')[0]})});expect(o.isExpired()).toBe(true)});
  it('future not expired',()=>{const d=new Date();d.setDate(d.getDate()+5);const o=mkO({funeralInfo:mkFI({departureDate:d.toISOString().split('T')[0]})});expect(o.isExpired()).toBe(false)});
});

describe('update immutability',()=>{
  it('updateDeceasedInfo',()=>{const o1=mkO();const o2=o1.updateDeceasedInfo({name:'박',deathDate:'2024-03-16'});expect(o2).not.toBe(o1);expect(o2.deceasedInfo.name).toBe('박');expect(o1.deceasedInfo.name).toBe('김철수')});
  it('updateFuneralInfo',()=>{const o1=mkO();const o2=o1.updateFuneralInfo({funeralHallName:'부산',departureDate:'2024-03-20'});expect(o2).not.toBe(o1);expect(o2.funeralInfo.funeralHallName).toBe('부산')});
  it('updateTemplate',()=>{const o1=mkO();const o2=o1.updateTemplate(5);expect(o2).not.toBe(o1);expect(o2.selectedTemplate).toBe(5);expect(o1.selectedTemplate).toBe(1)});
});

describe('addGuestbookEntry',()=>{
  it('add',()=>{const o1=mkO();const e=new GuestbookEntry({authorName:'홍',message:'삼가고인',createdAt:new Date()});const o2=o1.addGuestbookEntry(e);expect(o2.guestbookEntries.length).toBe(1);expect(o1.guestbookEntries.length).toBe(0)});
  it('bad type',()=>{expect(()=>mkO().addGuestbookEntry({})).toThrow()});
});

describe('removeGuestbookEntry',()=>{
  it('remove by id',()=>{const e=new GuestbookEntry({entryId:'GB_1',authorName:'홍',message:'msg',createdAt:new Date()});const o1=mkO({guestbookEntries:[e]});const o2=o1.removeGuestbookEntry('GB_1');expect(o2.guestbookEntries.length).toBe(0);expect(o1.guestbookEntries.length).toBe(1)});
});

describe('addWreathOrder',()=>{
  it('add',()=>{const o1=mkO();const w=new WreathOrder({senderName:'이',wreathType:'근조화환 3단',orderedAt:new Date()});const o2=o1.addWreathOrder(w);expect(o2.wreathOrders.length).toBe(1);expect(o1.wreathOrders.length).toBe(0)});
  it('bad type',()=>{expect(()=>mkO().addWreathOrder({})).toThrow()});
});
