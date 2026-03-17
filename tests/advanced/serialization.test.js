/**
 * 고난이도 테스트 4: 직렬화 무결성
 * - Obituary fromData/toDataObject 왕복 검증
 * - Date 직렬화 (JSON.stringify -> parse)
 * - 방명록/화환 배열 직렬화
 * - Object.freeze 불변성 검증
 * 실행: npx vitest run tests/advanced/serialization.test.js
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Obituary } from "../../src/domain/obituary/Obituary.js";
import { DeceasedInfo } from "../../src/domain/obituary/vo/DeceasedInfo.js";
import { FuneralInfo } from "../../src/domain/obituary/vo/FuneralInfo.js";
import { BereavedPerson } from "../../src/domain/obituary/vo/BereavedPerson.js";
import { GuestbookEntry } from "../../src/domain/obituary/vo/GuestbookEntry.js";
import { WreathOrder } from "../../src/domain/obituary/vo/WreathOrder.js";
import { hashPasswordSync } from "../../src/common/password-utils.js";

function makeObituary(overrides = {}) {
  return new Obituary({
    deceasedInfo: new DeceasedInfo({ name: "홍길동", age: 80, gender: "male", deathDate: "2025-01-15", deathTime: "14:30", deathExpression: "별세", nameHanja: "洪吉童" }),
    funeralInfo: new FuneralInfo({ funeralHallName: "추모병원", funeralHallAddress: "서울시", room: "101호", departureDate: "2025-01-17", departureTime: "09:00", cemetery: "납골당" }),
    bereaved: [new BereavedPerson({ relationship: "장남", name: "홍길순", phone: "010-1234-5678" })],
    password: hashPasswordSync("1234"),
    selectedTemplate: 5,
    additionalInfo: "추가 안내",
    messageContent: "삼가 명복을 빕니다.",
    messageType: "일반",
    ...overrides,
  });
}

describe("직렬화 무결성 테스트", () => {

  describe("Obituary 왕복 직렬화 (roundtrip)", () => {
    it("toDataObject -> fromData 왕복 시 모든 필드가 보존된다", () => {
      const original = makeObituary();
      const dto = original._toDataObject();
      const restored = Obituary.fromData(dto);

      expect(restored.deceasedInfo.name).toBe("홍길동");
      expect(restored.deceasedInfo.age).toBe(80);
      expect(restored.deceasedInfo.nameHanja).toBe("洪吉童");
      expect(restored.funeralInfo.funeralHallName).toBe("추모병원");
      expect(restored.funeralInfo.cemetery).toBe("납골당");
      expect(restored.bereaved.length).toBe(1);
      expect(restored.bereaved[0].name).toBe("홍길순");
      expect(restored.selectedTemplate).toBe(5);
      expect(restored.additionalInfo).toBe("추가 안내");
      expect(restored.messageContent).toBe("삼가 명복을 빕니다.");
    });

    it("JSON.stringify -> JSON.parse 왕복 시 데이터 보존", () => {
      const original = makeObituary();
      const dto = original._toDataObject();
      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);
      const restored = Obituary.fromData(parsed);

      expect(restored.deceasedInfo.name).toBe("홍길동");
      expect(restored.id).toBe(original.id);
    });
  });

  describe("Date 직렬화", () => {
    it("createdAt이 JSON 왕복 후에도 유효한 Date로 복원된다", () => {
      const original = makeObituary();
      const dto = original._toDataObject();
      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);
      const restored = Obituary.fromData(parsed);

      expect(restored.createdAt).toBeInstanceOf(Date);
      expect(restored.createdAt.getTime()).toBeGreaterThan(0);
    });
  });

  describe("방명록/화환 배열 직렬화", () => {
    it("방명록 항목이 직렬화 후 복원된다", () => {
      const o = makeObituary();
      const entry = new GuestbookEntry({ authorName: "김조문", relationship: "친구", message: "명복을 빕니다" });
      const withEntry = o.addGuestbookEntry(entry);
      const dto = withEntry._toDataObject();
      const json = JSON.stringify(dto);
      const restored = Obituary.fromData(JSON.parse(json));

      expect(restored.guestbookEntries.length).toBe(1);
      expect(restored.guestbookEntries[0].authorName).toBe("김조문");
    });

    it("화환 주문이 직렬화 후 복원된다", () => {
      const o = makeObituary();
      const wreath = new WreathOrder({ senderName: "이화환", wreathType: "근조화환 3단", orderedAt: new Date() });
      const withWreath = o.addWreathOrder(wreath);
      const dto = withWreath._toDataObject();
      const json = JSON.stringify(dto);
      const restored = Obituary.fromData(JSON.parse(json));

      expect(restored.wreathOrders.length).toBe(1);
      expect(restored.wreathOrders[0].senderName).toBe("이화환");
    });
  });

  describe("불변성 (Object.freeze) 검증", () => {
    it("Obituary의 bereaved 배열 직접 push 불가 (strict mode)", () => {
      const o = makeObituary();
      expect(() => { o.bereaved.push(new BereavedPerson({ relationship: "차남", name: "홍차남" })); }).toThrow();
    });

    it("update 메서드는 새 인스턴스를 반환하고 원본 불변", () => {
      const o = makeObituary();
      const updated = o.updateAdditionalInfo("변경된 정보");
      expect(o.additionalInfo).toBe("추가 안내");
      expect(updated.additionalInfo).toBe("변경된 정보");
      expect(o).not.toBe(updated);
    });

    it("incrementViewCount()가 this를 반환하고 카운트 증가", () => {
      const o = makeObituary();
      const inc = o.incrementViewCount();
      // incrementViewCount는 this를 반환 (뮤터블 예외: 조회수는 성능상 직접 변경)
      expect(inc).toBe(o);
      expect(inc.viewCount).toBe(1);
    });
  });
});
