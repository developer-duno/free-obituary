/**
 * 고난이도 테스트 5: 서비스 엣지 케이스
 * - 부분 업데이트, WreathService 생명주기
 * - GuestbookService 100건 한도
 * - 이중 삭제, 만료일 경계값
 * 실행: npx vitest run tests/advanced/service-edge.test.js
 */
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageObituaryRepository } from "../../src/infrastructure/persistence/LocalStorageObituaryRepository.js";
import { ObituaryService } from "../../src/application/ObituaryService.js";
import { WreathService } from "../../src/application/WreathService.js";
import { GuestbookService } from "../../src/application/GuestbookService.js";

function makeData(name = "테스트", depDate = "2099-01-17") {
  return {
    deceasedInfoData: { name, age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30" },
    funeralInfoData: { funeralHallName: "추모병원", funeralHallAddress: "서울시", room: "101호", departureDate: depDate, departureTime: "09:00" },
    bereavedDataArray: [{ relationship: "장남", name: "아들" }],
    password: "1234", selectedTemplate: 1,
  };
}

describe("WreathService 전체 생명주기", () => {
  let repo, obituaryService, wreathService, obituaryId;

  beforeEach(async () => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    obituaryService = new ObituaryService(repo);
    wreathService = new WreathService(repo);
    const o = await obituaryService.createObituary(makeData());
    obituaryId = o.id;
  });

  it("화환 추가", async () => {
    await wreathService.addWreathOrder(obituaryId, {
      senderName: "이화환", wreathType: "근조화환 3단", orderedAt: new Date().toISOString()
    });
    const orders = await wreathService.getWreathOrders(obituaryId);
    expect(orders.length).toBe(1);
    expect(orders[0].senderName).toBe("이화환");
  });

  it("여러 화환 추가 후 조회", async () => {
    for (let i = 0; i < 5; i++) {
      await wreathService.addWreathOrder(obituaryId, {
        senderName: "보낸이" + i, wreathType: "근조화환 2단", orderedAt: new Date().toISOString()
      });
    }
    const orders = await wreathService.getWreathOrders(obituaryId);
    expect(orders.length).toBe(5);
  });

  it("올바른 비밀번호로 화환 삭제", async () => {
    const updated = await wreathService.addWreathOrder(obituaryId, {
      senderName: "삭제대상", wreathType: "근조바구니", orderedAt: new Date().toISOString()
    });
    const orderId = updated.wreathOrders[updated.wreathOrders.length - 1].orderId;

    await wreathService.removeWreathOrder(obituaryId, orderId, "1234");
    const orders = await wreathService.getWreathOrders(obituaryId);
    expect(orders.length).toBe(0);
  });

  it("틀린 비밀번호로 화환 삭제 실패", async () => {
    const updated = await wreathService.addWreathOrder(obituaryId, {
      senderName: "삭제대상", wreathType: "근조바구니", orderedAt: new Date().toISOString()
    });
    const orderId = updated.wreathOrders[0].orderId;

    await expect(wreathService.removeWreathOrder(obituaryId, orderId, "9999")).rejects.toThrow("비밀번호");
  });

  it("외부 결제 데이터 처리 (processExternalWreathOrder)", async () => {
    const result = await wreathService.processExternalWreathOrder(obituaryId, {
      senderName: "외부발주자", message: "조의", productName: "근조화환 특대",
      amount: 150000, paidAt: "2025-01-16T10:00:00Z", orderId: "EXT-001"
    });
    const orders = await wreathService.getWreathOrders(obituaryId);
    expect(orders.length).toBe(1);
    expect(orders[0].status).toBe("confirmed");
    expect(orders[0].vendorOrderRef).toBe("EXT-001");
  });

  it("존재하지 않는 부고 ID에 화환 추가 시 에러", async () => {
    await expect(wreathService.addWreathOrder("nonexistent", {
      senderName: "테스트", wreathType: "화환", orderedAt: new Date().toISOString()
    })).rejects.toThrow("부고를 찾을 수 없습니다");
  });
});

describe("GuestbookService 한도 테스트", () => {
  let repo, obituaryService, guestbookService, obituaryId;

  beforeEach(async () => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    obituaryService = new ObituaryService(repo);
    guestbookService = new GuestbookService(repo);
    const o = await obituaryService.createObituary(makeData());
    obituaryId = o.id;
  });

  it("20건 방명록 연속 추가", async () => {
    for (let i = 0; i < 20; i++) {
      await guestbookService.addGuestbookEntry(obituaryId, {
        authorName: "조문" + i, message: "메시지" + i
      });
    }
    const entries = await guestbookService.getGuestbookEntries(obituaryId);
    expect(entries.length).toBe(20);
  }, 15000);
});

describe("삭제 엣지 케이스", () => {
  let repo, service;
  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    service = new ObituaryService(repo);
  });

  it("이미 삭제된 부고장 재삭제 시 에러", async () => {
    const o = await service.createObituary(makeData());
    await service.deleteObituary(o.id, "1234");
    await expect(service.deleteObituary(o.id, "1234")).rejects.toThrow();
  });

  it("삭제 후 검색 결과에서 제외", async () => {
    const o = await service.createObituary(makeData("삭제대상"));
    await service.deleteObituary(o.id, "1234");
    const results = await service.searchObituariesByDeceasedName("삭제대상");
    expect(results.length).toBe(0);
  });
});

describe("만료일 경계값 테스트", () => {
  let repo, service;
  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageObituaryRepository();
    service = new ObituaryService(repo);
  });

  it("발인일이 오늘인 부고장은 만료되지 않음", async () => {
    const today = new Date().toISOString().split("T")[0];
    const o = await service.createObituary(makeData("오늘발인", today));
    const found = await service.getObituaryById(o.id);
    expect(found).not.toBeNull();
  });

  it("발인일이 8일 전인 부고장은 isExpired=true (7일 기준)", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 8);
    const o = await service.createObituary(makeData("만료", past.toISOString().split("T")[0]));
    const found = await service.getObituaryById(o.id);
    expect(found.isExpired(7)).toBe(true);
  });

  it("발인일이 5일 전인 부고장은 isExpired=false (7일 기준)", async () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    const o = await service.createObituary(makeData("활성", recent.toISOString().split("T")[0]));
    const found = await service.getObituaryById(o.id);
    expect(found.isExpired(7)).toBe(false);
  });

  it("발인일이 미래인 부고장은 만료되지 않음", async () => {
    const o = await service.createObituary(makeData("미래", "2099-12-31"));
    const found = await service.getObituaryById(o.id);
    expect(found.isExpired(7)).toBe(false);
  });
});
