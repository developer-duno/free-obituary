/**
 * 고난이도 테스트 3: 비밀번호 보안
 * - bcryptjs 해싱/검증 직접 테스트
 * - 평문 -> 해시 마이그레이션
 * - 비밀번호 변경 전체 플로우
 * - isHashed() 정확성
 * 실행: npx vitest run tests/advanced/password-security.test.js
 */
import { describe, it, expect } from "vitest";
import { hashPassword, hashPasswordSync, verifyPassword, verifyPasswordSync, isHashed, migratePasswordIfNeeded } from "../../src/common/password-utils.js";

describe("비밀번호 보안 고급 테스트", () => {

  describe("isHashed() 정확성", () => {
    it("bcrypt 해시 감지 ($2a)", () => {
      expect(isHashed("$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV")).toBe(true);
    });
    it("bcrypt 해시 감지 ($2b)", () => {
      expect(isHashed("$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV")).toBe(true);
    });
    it("평문 감지", () => {
      expect(isHashed("1234")).toBe(false);
      expect(isHashed("password")).toBe(false);
    });
    it("빈 문자열/null/undefined", () => {
      expect(isHashed("")).toBe(false);
      expect(isHashed(null)).toBe(false);
      expect(isHashed(undefined)).toBe(false);
    });
  });

  describe("hashPassword 비동기", () => {
    it("4자리 비밀번호 해싱", async () => {
      const hash = await hashPassword("1234");
      expect(isHashed(hash)).toBe(true);
      expect(hash.length).toBeGreaterThan(50);
    });
    it("긴 비밀번호 해싱", async () => {
      const hash = await hashPassword("a".repeat(100));
      expect(isHashed(hash)).toBe(true);
    });
    it("null 입력 시 에러", async () => {
      await expect(hashPassword(null)).rejects.toThrow();
    });
    it("빈 문자열 시 에러", async () => {
      await expect(hashPassword("")).rejects.toThrow();
    });
    it("같은 평문이라도 매번 다른 해시 생성 (salt)", async () => {
      const h1 = await hashPassword("1234");
      const h2 = await hashPassword("1234");
      expect(h1).not.toBe(h2);
    });
  });

  describe("hashPasswordSync 동기", () => {
    it("동기 해싱 결과도 유효한 해시", () => {
      const hash = hashPasswordSync("1234");
      expect(isHashed(hash)).toBe(true);
    });
    it("비동기와 동기 결과 모두 검증 가능", async () => {
      const syncHash = hashPasswordSync("5678");
      const asyncHash = await hashPassword("5678");
      expect(await verifyPassword("5678", syncHash)).toBe(true);
      expect(await verifyPassword("5678", asyncHash)).toBe(true);
    });
  });

  describe("verifyPassword 검증", () => {
    it("올바른 비밀번호 검증 성공", async () => {
      const hash = await hashPassword("1234");
      expect(await verifyPassword("1234", hash)).toBe(true);
    });
    it("틀린 비밀번호 검증 실패", async () => {
      const hash = await hashPassword("1234");
      expect(await verifyPassword("9999", hash)).toBe(false);
    });
    it("평문 저장값에 대해 false 반환 (보안 정책)", async () => {
      expect(await verifyPassword("1234", "1234")).toBe(false);
    });
    it("null 입력 시 false 반환", async () => {
      expect(await verifyPassword(null, "hash")).toBe(false);
      expect(await verifyPassword("1234", null)).toBe(false);
    });
  });

  describe("verifyPasswordSync 동기 검증", () => {
    it("동기 검증 성공", () => {
      const hash = hashPasswordSync("1234");
      expect(verifyPasswordSync("1234", hash)).toBe(true);
    });
    it("평문에 대해 false", () => {
      expect(verifyPasswordSync("1234", "1234")).toBe(false);
    });
  });

  describe("migratePasswordIfNeeded 마이그레이션", () => {
    it("평문을 해시로 마이그레이션", async () => {
      const migrated = await migratePasswordIfNeeded("1234");
      expect(isHashed(migrated)).toBe(true);
      expect(await verifyPassword("1234", migrated)).toBe(true);
    });
    it("이미 해시된 값은 그대로 반환", async () => {
      const hash = await hashPassword("1234");
      const result = await migratePasswordIfNeeded(hash);
      expect(result).toBe(hash);
    });
    it("null/빈값은 그대로 반환", async () => {
      expect(await migratePasswordIfNeeded(null)).toBeNull();
      expect(await migratePasswordIfNeeded("")).toBe("");
    });
  });

  describe("비밀번호 변경 전체 플로우", () => {
    it("생성 -> 검증 -> 변경 -> 구 비밀번호 실패 -> 신 비밀번호 성공", async () => {
      const oldHash = await hashPassword("1234");
      expect(await verifyPassword("1234", oldHash)).toBe(true);

      const newHash = await hashPassword("5678");
      expect(await verifyPassword("1234", newHash)).toBe(false);
      expect(await verifyPassword("5678", newHash)).toBe(true);
    });
  });
});
