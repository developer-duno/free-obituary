/**
 * 고난이도 테스트 2: 저장소 한계 및 대량 데이터
 * - 대용량 데이터 저장/조회
 * - 자동 정리(cleanup) 동작 확인
 * - 100건 대량 생성/검색 성능
 * 실행: npx vitest run tests/advanced/storage-limits.test.js
 */
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageObituaryRepository } from "../../src/infrastructure/persistence/LocalStorageObituaryRepository.js";
import { ObituaryService } from "../../src/application/ObituaryService.js";

function makeData(name = "테스트", depDate = "2099-01-17") {
  return {
    deceasedInfoData: { name, age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30" },
    funeralInfoData: { funeralHallName: "추모병원", funeralHallAddress: "서울시", room: "101호", departureDate: depDate, departureTime: "09:00" },
    bereavedDataArray: [{ relationship: "장남", name: "아들" }],
    password: "1234", selectedTemplate: 1,
  };
}

describe("저장소 한계 테스트", () => {
  let repo, service;
  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    service = new ObituaryService(repo);
  });

  describe("대량 데이터", () => {
    it("50건 부고장 연속 생성 후 전체 조회", async () => {
      for (let i = 0; i < 50; i++) {
        await service.createObituary(makeData("고인" + i));
      }
      const all = await service.getAllObituaries();
      expect(all.length).toBe(50);
    }, 30000);

    it("50건 중 이름 부분 검색", async () => {
      for (let i = 0; i < 50; i++) {
        await service.createObituary(makeData("고인" + i));
      }
      const results = await service.searchObituariesByDeceasedName("고인1");
      // 고인1, 고인10~고인19 = 11건
      expect(results.length).toBe(11);
    }, 30000);
  });

  describe("자동 정리 (Auto Cleanup)", () => {
    it("30일 이전 발인일 부고장은 정리된다", async () => {
      // 60일 전 발인일로 만료 부고 생성
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 60);
      const pastStr = pastDate.toISOString().split("T")[0];

      await service.createObituary(makeData("만료부고", pastStr));
      await service.createObituary(makeData("활성부고", "2099-12-31"));

      // 리포지토리 재초기화 (cleanup 트리거)
      const repo2 = new LocalStorageObituaryRepository();
      const service2 = new ObituaryService(repo2);
      const all = await service2.getAllObituaries();

      // 만료 부고는 정리되고 활성 부고만 남아야 함
      expect(all.length).toBe(1);
      expect(all[0].deceasedInfo.name).toBe("활성부고");
    });

    it("25일 전 발인일 부고장은 유지된다", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 25);
      const recentStr = recentDate.toISOString().split("T")[0];

      await service.createObituary(makeData("최근부고", recentStr));

      const repo2 = new LocalStorageObituaryRepository();
      const service2 = new ObituaryService(repo2);
      const all = await service2.getAllObituaries();
      expect(all.length).toBe(1);
    });
  });

  describe("대용량 이미지", () => {
    it("대용량 base64 이미지 포함 부고장 저장/조회", async () => {
      // 100KB 크기의 가짜 base64 이미지 데이터
      const largeImage = "data:image/jpeg;base64," + "A".repeat(100000);
      const data = makeData("이미지테스트");
      data.portraitImage = largeImage;
      const created = await service.createObituary(data);

      const found = await service.getObituaryById(created.id);
      expect(found.portraitImage).toBe(largeImage);
    });
  });

  describe("저장소 사용량", () => {
    it("getStorageUsage()가 KB 단위 숫자를 반환한다", async () => {
      await service.createObituary(makeData());
      const usage = repo.getStorageUsage();
      expect(typeof usage).toBe("number");
      expect(usage).toBeGreaterThan(0);
    });
  });
});
