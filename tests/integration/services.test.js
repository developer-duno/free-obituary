/**
 * 통합 테스트: ObituaryService + LocalStorageObituaryRepository
 * 부고장 CRUD 전체 흐름, 비밀번호 검증, 조회수, 검색 테스트
 * 실행: npm run test:integration
 */
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageObituaryRepository } from "../../src/infrastructure/persistence/LocalStorageObituaryRepository.js";
import { ObituaryService } from "../../src/application/ObituaryService.js";
import { GuestbookService } from "../../src/application/GuestbookService.js";

// 테스트용 유효 부고 데이터
function makeValidData(overrides = {}) {
  return {
    deceasedInfoData: { name: "홍길동", age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30", deathExpression: "별세", ...overrides.deceased },
    funeralInfoData: { funeralHallName: "서울추모병원", funeralHallAddress: "서울시 강남구", room: "101호", departureDate: "2025-01-17", departureTime: "09:00", ...overrides.funeral },
    bereavedDataArray: overrides.bereaved || [{ relationship: "장남", name: "홍길순" }],
    password: overrides.password || "1234",
    selectedTemplate: 1,
    messageContent: "삼가 고인의 명복을 빕니다.",
    messageType: "일반",
    ...overrides.extra,
  };
}

describe("ObituaryService 통합 테스트", () => {
  let repo, service;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    service = new ObituaryService(repo);
  });

  describe("부고장 생성", () => {
    it("유효한 데이터로 부고장을 생성한다", async () => {
      const obituary = await service.createObituary(makeValidData());
      expect(obituary).toBeDefined();
      expect(obituary.id).toBeTruthy();
      expect(obituary.deceasedInfo.name).toBe("홍길동");
    });

    it("고인명 없이 생성하면 에러 발생", async () => {
      await expect(service.createObituary(makeValidData({ deceased: { name: "" } }))).rejects.toThrow();
    });

    it("비밀번호가 비어있어도 생성은 가능하다 (서비스 레벨 허용)", async () => {
      const o = await service.createObituary(makeValidData({ password: "" }));
      expect(o).toBeDefined();
    });
  });

  describe("부고장 조회", () => {
    it("ID로 부고장을 조회한다", async () => {
      const created = await service.createObituary(makeValidData());
      const found = await service.getObituaryById(created.id);
      expect(found).toBeDefined();
      expect(found.deceasedInfo.name).toBe("홍길동");
    });

    it("존재하지 않는 ID는 null 반환", async () => {
      const found = await service.getObituaryById("nonexistent-id");
      expect(found).toBeNull();
    });

    it("고인명으로 검색한다 (대소문자 무관)", async () => {
      await service.createObituary(makeValidData());
      const results = await service.searchObituariesByDeceasedName("홍길");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("전체 목록 조회", async () => {
      await service.createObituary(makeValidData());
      await service.createObituary(makeValidData({ deceased: { name: "김영희" } }));
      const all = await service.getAllObituaries();
      expect(all.length).toBe(2);
    });
  });

  describe("비밀번호 검증", () => {
    it("올바른 비밀번호 검증 성공", async () => {
      const o = await service.createObituary(makeValidData());
      const result = await service.verifyObituaryPassword(o.id, "1234");
      expect(result).toBe(true);
    });

    it("틀린 비밀번호 검증 실패", async () => {
      const o = await service.createObituary(makeValidData());
      const result = await service.verifyObituaryPassword(o.id, "9999");
      expect(result).toBe(false);
    });
  });

  describe("부고장 수정", () => {
    it("올바른 비밀번호로 수정 성공", async () => {
      const o = await service.createObituary(makeValidData());
      const updated = await service.updateObituary(o.id, {
        deceasedInfoData: { name: "김수정", age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30" },
        funeralInfoData: o.funeralInfo,
        bereavedDataArray: [{ relationship: "장남", name: "홍길순" }],
      }, "1234");
      expect(updated.deceasedInfo.name).toBe("김수정");
    });

    it("틀린 비밀번호로 수정 실패", async () => {
      const o = await service.createObituary(makeValidData());
      await expect(service.updateObituary(o.id, {}, "9999")).rejects.toThrow();
    });
  });

  describe("부고장 삭제", () => {
    it("올바른 비밀번호로 삭제", async () => {
      const o = await service.createObituary(makeValidData());
      const result = await service.deleteObituary(o.id, "1234");
      expect(result).toBe(true);
      expect(await service.getObituaryById(o.id)).toBeNull();
    });

    it("틀린 비밀번호로 삭제 실패", async () => {
      const o = await service.createObituary(makeValidData());
      await expect(service.deleteObituary(o.id, "9999")).rejects.toThrow();
    });
  });

  describe("조회수", () => {
    it("조회수 증가", async () => {
      const o = await service.createObituary(makeValidData());
      await service.incrementViewCount(o.id);
      const found = await service.getObituaryById(o.id);
      expect(found.viewCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("GuestbookService 통합 테스트", () => {
  let repo, obituaryService, guestbookService, obituaryId;

  beforeEach(async () => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    obituaryService = new ObituaryService(repo);
    guestbookService = new GuestbookService(repo);
    const o = await obituaryService.createObituary(makeValidData());
    obituaryId = o.id;
  });

  it("방명록 추가", async () => {
    await guestbookService.addGuestbookEntry(obituaryId, { authorName: "김조문", message: "명복을 빕니다." });
    const entries = await guestbookService.getGuestbookEntries(obituaryId);
    expect(entries.length).toBe(1);
    expect(entries[0].authorName).toBe("김조문");
  });

  it("작성자 이름 20자 초과 에러", async () => {
    await expect(guestbookService.addGuestbookEntry(obituaryId, {
      authorName: "ㄱ".repeat(21), message: "테스트"
    })).rejects.toThrow();
  });

  it("메시지 비어있으면 에러", async () => {
    await expect(guestbookService.addGuestbookEntry(obituaryId, {
      authorName: "김조문", message: ""
    })).rejects.toThrow();
  });

  it("올바른 비밀번호로 방명록 삭제", async () => {
    const updated = await guestbookService.addGuestbookEntry(obituaryId, { authorName: "김조문", message: "명복을 빕니다." });
    const entryId = updated.guestbookEntries[updated.guestbookEntries.length - 1].entryId;
    await guestbookService.removeGuestbookEntry(obituaryId, entryId, "1234");
    const entries = await guestbookService.getGuestbookEntries(obituaryId);
    expect(entries.length).toBe(0);
  });
});
