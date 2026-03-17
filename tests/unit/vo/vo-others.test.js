/**
 * BereavedPerson + GuestbookEntry + FuneralInfo Value Object 단위 테스트
 * 실행: npm run test:unit -- vo-others
 */
import { describe, it, expect } from "vitest";
import { BereavedPerson } from "../../../src/domain/obituary/vo/BereavedPerson.js";
import { GuestbookEntry } from "../../../src/domain/obituary/vo/GuestbookEntry.js";
import { FuneralInfo } from "../../../src/domain/obituary/vo/FuneralInfo.js";

describe("BereavedPerson VO", () => {
  const v = { relationship: "장남", name: "홍길순", phone: "010-1234-5678", isRepresentative: true };
  it("정상 생성", () => {
    const p = new BereavedPerson(v);
    expect(p.relationship).toBe("장남");
    expect(p.name).toBe("홍길순");
    expect(p.isRepresentative).toBe(true);
  });
  it("선택 필드 기본값", () => {
    const p = new BereavedPerson({ relationship: "장녀", name: "홍영희" });
    expect(p.phone).toBeNull();
    expect(p.isRepresentative).toBe(false);
  });
  it("관계 비어있으면 에러", () => { expect(() => new BereavedPerson({ ...v, relationship: "" })).toThrow(); });
  it("이름 비어있으면 에러", () => { expect(() => new BereavedPerson({ ...v, name: "" })).toThrow(); });
  it("관계 20자 초과 에러", () => { expect(() => new BereavedPerson({ ...v, relationship: "ㄱ".repeat(21) })).toThrow(); });
  it("이름 50자 초과 에러", () => { expect(() => new BereavedPerson({ ...v, name: "ㄱ".repeat(51) })).toThrow(); });
  it("불변성", () => { expect(() => { new BereavedPerson(v).name = "X"; }).toThrow(); });
  it("getInfoString()", () => { expect(new BereavedPerson(v).getInfoString()).toContain("장남: 홍길순"); });
});

describe("GuestbookEntry VO", () => {
  const v = { authorName: "김조문", relationship: "친구", message: "삼가 고인의 명복을 빕니다." };
  it("정상 생성 + 자동 ID", () => {
    const e = new GuestbookEntry(v);
    expect(e.authorName).toBe("김조문");
    expect(e.entryId).toMatch(/^GB_/);
    expect(e.createdAt).toBeInstanceOf(Date);
  });
  it("작성자 이름 비어있으면 에러", () => { expect(() => new GuestbookEntry({ ...v, authorName: "" })).toThrow(); });
  it("메시지 비어있으면 에러", () => { expect(() => new GuestbookEntry({ ...v, message: "" })).toThrow(); });
  it("작성자 이름 20자 초과 에러", () => { expect(() => new GuestbookEntry({ ...v, authorName: "ㄱ".repeat(21) })).toThrow(); });
  it("관계 10자 초과 에러", () => { expect(() => new GuestbookEntry({ ...v, relationship: "ㄱ".repeat(11) })).toThrow(); });
  it("메시지 200자 초과 에러", () => { expect(() => new GuestbookEntry({ ...v, message: "ㄱ".repeat(201) })).toThrow(); });
  it("메시지 200자 허용", () => { expect(new GuestbookEntry({ ...v, message: "ㄱ".repeat(200) }).message.length).toBe(200); });
  it("매번 다른 ID 생성", () => {
    expect(new GuestbookEntry(v).entryId).not.toBe(new GuestbookEntry(v).entryId);
  });
  it("불변성", () => { expect(() => { new GuestbookEntry(v).message = "X"; }).toThrow(); });
});

describe("FuneralInfo VO", () => {
  const v = { funeralHallName: "서울추모병원", funeralHallAddress: "서울시 강남구",
    funeralHallPhone: "02-1234-5678", room: "101호",
    departureDate: "2025-01-17", departureTime: "09:00",
    cemetery: "납골당", coffinDate: "2025-01-15", coffinTime: "18:00" };
  it("정상 생성", () => { expect(new FuneralInfo(v).funeralHallName).toBe("서울추모병원"); });
  it("빈 객체로 생성 가능", () => { expect(new FuneralInfo({}).funeralHallName).toBeUndefined(); });
  it("장지 100자 초과 에러", () => { expect(() => new FuneralInfo({ ...v, cemetery: "ㄱ".repeat(101) })).toThrow(); });
  it("발인 날짜+시간 포맷", () => { expect(new FuneralInfo(v).getFormattedDepartureDateTime()).toBe("2025-01-17 09:00"); });
  it("발인일 없으면 빈 문자열", () => { expect(new FuneralInfo({}).getFormattedDepartureDateTime()).toBe(""); });
  it("입관 날짜+시간 포맷", () => { expect(new FuneralInfo(v).getFormattedCoffinDateTime()).toBe("2025-01-15 18:00"); });
  it("불변성", () => { expect(() => { new FuneralInfo(v).room = "X"; }).toThrow(); });
});
