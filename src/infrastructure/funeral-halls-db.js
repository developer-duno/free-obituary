/**
 * 장례식장 데이터베이스 모듈
 * 장례식장 정보를 검색할 수 있는 기능을 제공합니다.
 */
 
// 장례식장 원본 데이터 배열
export const funeralHallRawData = [
    // ... (기존 funeralHallsDB.funeralHalls 배열의 모든 데이터 항목이 여기에 위치) ...
    // 예시 데이터 구조 (기존 데이터 구조를 따라야 함):
    // { id: "1", name: "서울아산병원 장례식장", address: "서울 송파구 올림픽로43길 88", phone: "1688-7575", region: "서울" },
    // { id: "2", name: "삼성서울병원 장례식장", address: "서울 강남구 일원로 81", phone: "02-3410-3151", region: "서울" },
    // ... 기타 모든 데이터 ...
];

// 이하 기존의 즉시 실행 함수, funeralHallsDB 객체, search, buildSearchIndices 등의 로직은
// FuneralHallRepository.js 로 이동하거나 거기서 재구현됩니다.
// 이 파일은 순수 데이터만 export 합니다.