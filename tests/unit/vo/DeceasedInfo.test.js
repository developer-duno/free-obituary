/**
 * DeceasedInfo Value Object 단위 테스트
 * 고인 정보 생성, 필수값 검증, 길이 제한, 불변성 테스트
 * 실행: npm run test:unit -- DeceasedInfo
 */
import { describe, it, expect } from "vitest";
import { DeceasedInfo } from "../../../src/domain/obituary/vo/DeceasedInfo.js";

const validData = {
  name: "홍길동", age: 80, title: "전 교장", gender: "male",
  deathDate: "2025-01-15", deathTime: "14:30", deathExpression: "별세", nameHanja: "洪吉童"
};

describe("DeceasedInfo VO", () => {
  describe("정상 생성", () => {
    it("모든 필드가 유효하면 정상 생성된다", () => {
      const info = new DeceasedInfo(validData);
      expect(info.name).toBe("홍길동");
      expect(info.age).toBe(80);
      expect(info.gender).toBe("male");
      expect(info.nameHanja).toBe("洪吉童");
    });
    it("선택 필드 없이도 생성 가능하다", () => {
      const info = new DeceasedInfo({ name: "김철수", deathDate: "2025-03-01" });
      expect(info.name).toBe("김철수");
      expect(info.nameHanja).toBe("");
    });
  });

  describe("필수값 검증", () => {
    it("이름이 비어있으면 에러 발생", () => {
      expect(() => new DeceasedInfo({ ...validData, name: "" })).toThrow();
    });
    it("이름이 null이면 에러 발생", () => {
      expect(() => new DeceasedInfo({ ...validData, name: null })).toThrow();
    });
    it("별세일이 없으면 에러 발생", () => {
      expect(() => new DeceasedInfo({ ...validData, deathDate: null })).toThrow();
    });
  });

  describe("길이 제한", () => {
    it("이름 50자 초과 시 에러", () => {
      expect(() => new DeceasedInfo({ ...validData, name: "ㄱ".repeat(51) })).toThrow();
    });
    it("이름 50자는 정상", () => {
      expect(new DeceasedInfo({ ...validData, name: "ㄱ".repeat(50) }).name.length).toBe(50);
    });
    it("한자 이름 50자 초과 시 에러", () => {
      expect(() => new DeceasedInfo({ ...validData, nameHanja: "漢".repeat(51) })).toThrow();
    });
    it("직함 20자 초과 시 에러", () => {
      expect(() => new DeceasedInfo({ ...validData, title: "ㄱ".repeat(21) })).toThrow();
    });
  });

  describe("나이 검증", () => {
    it("나이 0은 유효", () => { expect(new DeceasedInfo({ ...validData, age: 0 }).age).toBe(0); });
    it("나이 200은 유효", () => { expect(new DeceasedInfo({ ...validData, age: 200 }).age).toBe(200); });
    it("나이 201은 에러", () => { expect(() => new DeceasedInfo({ ...validData, age: 201 })).toThrow(); });
    it("음수 나이는 에러", () => { expect(() => new DeceasedInfo({ ...validData, age: -1 })).toThrow(); });
  });

  describe("성별 검증", () => {
    it("유효한 성별", () => {
      expect(new DeceasedInfo({ ...validData, gender: "female" }).gender).toBe("female");
    });
    it("잘못된 성별은 빈문자열로 대체", () => {
      expect(new DeceasedInfo({ ...validData, gender: "invalid" }).gender).toBe("");
    });
  });

  describe("불변성", () => {
    it("Object.freeze로 속성 변경 불가", () => {
      const info = new DeceasedInfo(validData);
      expect(() => { info.name = "변경"; }).toThrow();
    });
  });

  describe("메서드", () => {
    it("getFullNameWithTitle()이 직함+이름 반환", () => {
      expect(new DeceasedInfo(validData).getFullNameWithTitle()).toBe("전 교장 홍길동");
    });
    it("직함 없으면 이름만 반환", () => {
      expect(new DeceasedInfo({ ...validData, title: undefined }).getFullNameWithTitle()).toBe("홍길동");
    });
  });
});
