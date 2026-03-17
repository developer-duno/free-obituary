/**
 * 엣지 케이스 테스트: 극단값, XSS, 특수문자, 저장소 한계
 * 실행: npm run test:edge
 */
import { describe, it, expect, beforeEach } from "vitest";
import { DeceasedInfo } from "../../src/domain/obituary/vo/DeceasedInfo.js";
import { GuestbookEntry } from "../../src/domain/obituary/vo/GuestbookEntry.js";
import { BereavedPerson } from "../../src/domain/obituary/vo/BereavedPerson.js";
import { LocalStorageObituaryRepository } from "../../src/infrastructure/persistence/LocalStorageObituaryRepository.js";
import { ObituaryService } from "../../src/application/ObituaryService.js";

describe("XSS 방어 테스트", () => {
  it("이름에 script 태그가 그대로 저장된다 (HTML 이스케이프는 출력 시)", () => {
    const info = new DeceasedInfo({
      name: "<script>alert(1)</script>",
      deathDate: "2025-01-15"
    });
    expect(info.name).toBe("<script>alert(1)</script>");
  });

  it("방명록 메시지에 HTML 태그 포함 가능", () => {
    const entry = new GuestbookEntry({
      authorName: "테스터",
      message: "<img src=x onerror=alert(1)>"
    });
    expect(entry.message).toContain("<img");
  });
});

describe("유니코드/이모지 테스트", () => {
  it("한국어 이름 정상 처리", () => {
    expect(new DeceasedInfo({ name: "홍길동", deathDate: "2025-01-15" }).name).toBe("홍길동");
  });
  it("한자 이름 정상 처리", () => {
    expect(new DeceasedInfo({ name: "홍길동", deathDate: "2025-01-15", nameHanja: "洪吉童" }).nameHanja).toBe("洪吉童");
  });
  it("이모지 포함 이름", () => {
    const info = new DeceasedInfo({ name: "홍길동", deathDate: "2025-01-15" });
    expect(info.name).toBeTruthy();
  });
});

describe("공백/트림 테스트", () => {
  it("공백만 있는 이름은 에러", () => {
    expect(() => new DeceasedInfo({ name: "   ", deathDate: "2025-01-15" })).toThrow();
  });
  it("공백만 있는 유가족 이름은 에러", () => {
    expect(() => new BereavedPerson({ relationship: "장남", name: "   " })).toThrow();
  });
  it("방명록 공백 메시지 에러", () => {
    expect(() => new GuestbookEntry({ authorName: "김", message: "   " })).toThrow();
  });
});

describe("경계값 테스트", () => {
  it("나이 정확히 0", () => { expect(new DeceasedInfo({ name: "A", deathDate: "2025-01-01", age: 0 }).age).toBe(0); });
  it("나이 정확히 200", () => { expect(new DeceasedInfo({ name: "A", deathDate: "2025-01-01", age: 200 }).age).toBe(200); });
  it("메시지 정확히 200자", () => {
    expect(new GuestbookEntry({ authorName: "김", message: "A".repeat(200) }).message.length).toBe(200);
  });
  it("메시지 201자 에러", () => {
    expect(() => new GuestbookEntry({ authorName: "김", message: "A".repeat(201) })).toThrow();
  });
});

describe("저장소 복원력 테스트", () => {
  beforeEach(() => { localStorage.clear(); });

  it("빈 localStorage에서 리포지토리 초기화", () => {
    const repo = new LocalStorageObituaryRepository();
    expect(repo).toBeDefined();
  });

  it("손상된 JSON에서 복구", () => {
    localStorage.setItem("obituaryDB", "이것은 유효하지 않은 JSON입니다");
    const repo = new LocalStorageObituaryRepository();
    expect(repo).toBeDefined();
  });

  it("빈 배열 상태에서 정상 동작", async () => {
    localStorage.setItem("obituaryDB", "[]");
    const repo = new LocalStorageObituaryRepository();
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });

  it("부고장 생성 후 localStorage에 데이터 존재", async () => {
    const repo = new LocalStorageObituaryRepository();
    const service = new ObituaryService(repo);
    await service.createObituary({
      deceasedInfoData: { name: "테스트", age: 80, gender: "male", deathDate: "2025-01-15" },
      funeralInfoData: { funeralHallName: "테스트", funeralHallAddress: "주소", room: "101" },
      bereavedDataArray: [{ relationship: "장남", name: "아들" }],
      password: "1234", selectedTemplate: 1,
    });
    const stored = localStorage.getItem("obituaryDB");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored).length).toBe(1);
  });
});
