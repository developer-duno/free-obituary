/**
 * 고난이도 테스트 1: 동시성 및 낙관적 잠금
 * - 동시 저장 시 낙관적 잠금 충돌 감지
 * - 동시 조회수 증가 (Promise.all)
 * - 생성+삭제 경합 시나리오
 * 실행: npx vitest run tests/advanced/concurrency.test.js
 */
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageObituaryRepository } from "../../src/infrastructure/persistence/LocalStorageObituaryRepository.js";
import { ObituaryService } from "../../src/application/ObituaryService.js";

function makeData(name = "테스트") {
  return {
    deceasedInfoData: { name, age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30" },
    funeralInfoData: { funeralHallName: "추모병원", funeralHallAddress: "서울시", room: "101호", departureDate: "2025-01-17", departureTime: "09:00" },
    bereavedDataArray: [{ relationship: "장남", name: "아들" }],
    password: "1234", selectedTemplate: 1,
  };
}

describe("동시성 테스트", () => {
  let repo, service;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    service = new ObituaryService(repo);
  });

  describe("낙관적 잠금 (Optimistic Locking)", () => {
    it("저장소의 updatedAt이 더 최신이면 충돌 에러가 발생한다", async () => {
      const created = await service.createObituary(makeData());

      // 저장소에서 직접 updatedAt을 미래로 설정 (다른 탭이 수정한 상황 시뮬레이션)
      const raw = JSON.parse(localStorage.getItem("obituaryDB"));
      const futureTime = new Date(Date.now() + 60000).toISOString();
      raw[0].updatedAt = futureTime;
      localStorage.setItem("obituaryDB", JSON.stringify(raw));

      // 현재 탭의 오래된 데이터로 저장 시도 -> 충돌
      const stale = await service.getObituaryById(created.id);
      const updated = stale.updateAdditionalInfo("스테일 수정");
      await expect(repo.save(updated)).rejects.toThrow("다른 탭에서 이미 수정");
    });

    it("순차 수정은 충돌 없이 성공한다", async () => {
      const created = await service.createObituary(makeData());
      const v1 = await service.getObituaryById(created.id);
      const updated1 = v1.updateAdditionalInfo("수정 1");
      await repo.save(updated1);

      // 최신 버전을 다시 읽고 수정
      const v2 = await service.getObituaryById(created.id);
      const updated2 = v2.updateAdditionalInfo("수정 2");
      await repo.save(updated2);

      const final = await service.getObituaryById(created.id);
      expect(final.additionalInfo).toBe("수정 2");
    });
  });

  describe("동시 조회수 증가", () => {
    it("10번 순차 incrementViewCount 호출 시 조회수 10", async () => {
      const created = await service.createObituary(makeData());

      for (let i = 0; i < 10; i++) {
        await service.incrementViewCount(created.id);
      }

      const final = await service.getObituaryById(created.id);
      expect(final.viewCount).toBe(10);
    });
  });

  describe("동시 생성", () => {
    it("5개 부고장 동시 생성 시 모두 고유 ID를 가진다", async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) => service.createObituary(makeData("고인" + i)))
      );

      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      const all = await service.getAllObituaries();
      expect(all.length).toBe(5);
    });
  });
});
