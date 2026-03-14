/**
 * 상주 정보 관리 모듈
 * 상주 정보 관련 기능을 처리합니다.
 */
// (function() { // IIFE 시작 부분 제거

// 모듈 상태 관리
const state = {
    initialized: false
};

// 초기화 함수
export function initBereavedManager() { // init을 initBereavedManager로 변경하고 export 추가
    if (state.initialized) return;
    
    try {
        // 초기 상태 설정
        hideAllSecondaryOptions();
        setupEventListeners();
        
        state.initialized = true;
        console.log("✅ 상주 정보 관리 모듈 초기화 완료");
    } catch (error) {
        console.error("상주 정보 관리 모듈 초기화 실패:", error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const addBtn = document.getElementById('add-bereaved');
    const removeBtn = document.getElementById('remove-bereaved');
    
    if (addBtn) {
        addBtn.addEventListener('click', addEntry);
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', removeEntry);
    }
    
    // 기존 상주 관계 드롭다운에 이벤트 리스너 추가
    document.querySelectorAll('.relationship-select').forEach(select => {
        select.addEventListener('change', function() {
            handleRelationChange(this);
        });
    });
}

// 상주 항목 추가
function addEntry() {
    const container = document.getElementById('bereaveds-list');
    if (!container) return;
    
    const newEntry = document.createElement('div');
    newEntry.className = 'bereaved-entry';
    
    // 기본 HTML 구조 - 2차 옵션(기타 선택) 확장
    newEntry.innerHTML = `
        <select name="relationship[]" class="relationship-select" required>
            <option value="" disabled selected>상주</option>
            <option value="배우자">배우자</option>
            <option value="아들">아들</option>
            <option value="딸">딸</option>
            <option value="며느리">며느리</option>
            <option value="사위">사위</option>
            <option value="손자">손자</option>
            <option value="손녀">손녀</option>
            <option value="외손자">외손자</option>
            <option value="외손녀">외손녀</option>
            <option value="기타">기타</option>
            <option value="직접기재">직접기재</option>
        </select>
        <select class="secondary-relation-select" name="secondaryRelation[]" style="display:none !important; margin-top:5px;">
            <option value="" disabled selected>기타 선택</option>
            
            <!-- 가족/친척 관계 -->
            <option value="아버지">아버지</option>
            <option value="어머니">어머니</option>
            <option value="조부">조부</option>
            <option value="조모">조모</option>
            <option value="외조부">외조부</option>
            <option value="외조모">외조모</option>
            <option value="형">형</option>
            <option value="누나">누나</option>
            <option value="오빠">오빠</option>
            <option value="언니">언니</option>
            <option value="동생">동생</option>
            <option value="형제">형제</option>
            <option value="자매">자매</option>
            <option value="친척">친척</option>
            <option value="조카">조카</option>
            <option value="사촌">사촌</option>
            <option value="육촌">육촌</option>
            <option value="팔촌">팔촌</option>
            <option value="당숙">당숙</option>
            <option value="당숙모">당숙모</option>
            <option value="고모">고모</option>
            <option value="이모">이모</option>
            <option value="외숙모">외숙모</option>
            <option value="고모부">고모부</option>
            <option value="이모부">이모부</option>
            <option value="외숙부">외숙부</option>
            <option value="처남">처남</option>
            <option value="처형">처형</option>
            <option value="동서">동서</option>
            <option value="시누이">시누이</option>
            <option value="올케">올케</option>
            <option value="시아버지">시아버지</option>
            <option value="시어머니">시어머니</option>
            <option value="장인">장인</option>
            <option value="장모">장모</option>
            <option value="증손자">증손자</option>
            <option value="증손녀">증손녀</option>
            <option value="외증손자">외증손자</option>
            <option value="외증손녀">외증손녀</option>
            <option value="고종사촌">고종사촌</option>
            <option value="외종사촌">외종사촌</option>
            
            <!-- 사회적 관계 -->
            <option value="친구">친구</option>
            <option value="지인">지인</option>
            <option value="직장동료">직장동료</option>
            <option value="상사">상사</option>
            <option value="부하직원">부하직원</option>
            <option value="선배">선배</option>
            <option value="후배">후배</option>
            <option value="동창">동창</option>
            <option value="동문">동문</option>
            <option value="학부모">학부모</option>
            <option value="이웃">이웃</option>
            <option value="군대전우">군대전우</option>
            <option value="동호회원">동호회원</option>
            <option value="사회봉사자">사회봉사자</option>
            <option value="임차인">임차인</option>
            <option value="임대인">임대인</option>
            
            <!-- 직업/역할 관계 -->
            <option value="은사">은사</option>
            <option value="제자">제자</option>
            <option value="스승">스승</option>
            <option value="멘토">멘토</option>
            <option value="멘티">멘티</option>
            <option value="주치의">주치의</option>
            <option value="간병인">간병인</option>
            <option value="요양보호사">요양보호사</option>
            <option value="의사">의사</option>
            <option value="간호사">간호사</option>
            <option value="사회복지사">사회복지사</option>
            <option value="법률대리인">법률대리인</option>
            <option value="경영자">경영자</option>
            <option value="비서">비서</option>
            <option value="비즈니스파트너">비즈니스파트너</option>
            <option value="사업동업자">사업동업자</option>
            
            <!-- 종교 관계 -->
            <option value="목사">목사</option>
            <option value="교회신도">교회신도</option>
            <option value="신부">신부</option>
            <option value="수녀">수녀</option>
            <option value="스님">스님</option>
            <option value="신도">신도</option>
            <option value="사찰신도">사찰신도</option>
            <option value="종교지도자">종교지도자</option>
            <option value="수행자">수행자</option>
            <option value="종교인">종교인</option>
            
            <!-- 기타 일반 관계 -->
            <option value="대리인">대리인</option>
            <option value="보호자">보호자</option>
            <option value="가족지인">가족지인</option>
            <option value="고인지인">고인지인</option>
            <option value="지역주민">지역주민</option>
            <option value="후원자">후원자</option>
            <option value="후견인">후견인</option>
            <option value="유족대표">유족대표</option>
            <option value="유가족지인">유가족지인</option>
        </select>
        <input type="text" class="custom-relationship-input" name="customRelationship[]" 
               placeholder="관계 직접 입력" style="display:none !important; margin-top:5px;">
        <input type="text" name="bereavedName[]" placeholder="이름 (필수)" required>
    `;
    
    // 이벤트 리스너 추가
    const select = newEntry.querySelector('.relationship-select');
    if (select) {
        select.addEventListener('change', function() {
            handleRelationChange(this);
        });
    }
    
    container.appendChild(newEntry);
    hideAllSecondaryOptions();
}

// 상주 항목 삭제
function removeEntry() {
    const container = document.getElementById('bereaveds-list');
    if (!container || container.children.length <= 1) return;
    
    container.removeChild(container.lastElementChild);
}

// 관계 변경 처리
function handleRelationChange(select) {
    if (!select) return;
    
    const parentEntry = select.closest('.bereaved-entry');
    if (!parentEntry) return;
    
    const secondarySelect = parentEntry.querySelector('.secondary-relation-select');
    const customInput = parentEntry.querySelector('.custom-relationship-input');
    
    // 모든 추가 필드 숨기기 (display:none !important 추가)
    if (secondarySelect) {
        secondarySelect.style.cssText = 'display: none !important; margin-top: 5px;';
        secondarySelect.required = false;
    }
    if (customInput) {
        customInput.style.cssText = 'display: none !important; margin-top: 5px;';
        customInput.required = false;
    }
    
    // 선택된 값에 따라 필드 표시
    if (select.value === '기타' && secondarySelect) {
        secondarySelect.style.cssText = 'display: block !important; margin-top: 5px;';
        secondarySelect.required = true;
    } else if (select.value === '직접기재' && customInput) {
        customInput.style.cssText = 'display: block !important; margin-top: 5px;';
        customInput.required = true;
    }
}

// 모든 2차 옵션 상태 설정
function hideAllSecondaryOptions() {
    document.querySelectorAll('.bereaved-entry').forEach(entry => {
        const select = entry.querySelector('.relationship-select');
        const secondarySelect = entry.querySelector('.secondary-relation-select');
        const customInput = entry.querySelector('.custom-relationship-input');
        
        // 기본적으로 모든 2차 옵션 숨기기
        if (secondarySelect) {
            secondarySelect.style.cssText = 'display: none !important; margin-top: 5px;';
            secondarySelect.required = false;
        }
        if (customInput) {
            customInput.style.cssText = 'display: none !important; margin-top: 5px;';
            customInput.required = false;
        }
        
        // 선택된 값이 있는 경우에만 handleRelationChange 호출
        if (select && select.value) {
            handleRelationChange(select);
        }
    });
}

// 폼 검증
function validate() {
    let isValid = true;
    
    document.querySelectorAll('.bereaved-entry').forEach(entry => {
        const relationSelect = entry.querySelector('.relationship-select');
        const customInput = entry.querySelector('.custom-relationship-input');
        
        if (relationSelect?.value === '직접기재' && customInput) {
            if (!customInput.value.trim()) {
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// 데이터 가져오기 함수
export function getBereavedData() {
    const bereavedEntries = document.querySelectorAll('#bereaveds-list .bereaved-entry');
    const data = [];
    bereavedEntries.forEach(entry => {
        const relationSelect = entry.querySelector('.relationship-select');
        const secondarySelect = entry.querySelector('.secondary-relation-select');
        const customInput = entry.querySelector('.custom-relationship-input');
        const nameInput = entry.querySelector('input[name="bereavedName[]"]');

        if (!relationSelect || !nameInput) return;

        let relationship = relationSelect.value;
        const name = nameInput.value.trim();

        if (!relationship || !name) return;

        // 기타 선택 시 2차 관계값 사용
        if (relationship === '기타' && secondarySelect && secondarySelect.value) {
            relationship = secondarySelect.value;
        }
        // 직접기재 시 커스텀 입력값 사용
        if (relationship === '직접기재' && customInput && customInput.value.trim()) {
            relationship = customInput.value.trim();
        }

        data.push({ relationship, name });
    });
    return data;
}

// 데이터 채우기 함수
export function fillBereavedData(bereavedData = []) {
    const container = document.getElementById('bereaveds-list');
    if (!container || bereavedData.length === 0) return;

    // 기존 엔트리 모두 제거
    container.innerHTML = '';

    bereavedData.forEach(item => {
        // addEntry 로직 재사용: 빈 엔트리 추가
        addEntry();
        const entries = container.querySelectorAll('.bereaved-entry');
        const lastEntry = entries[entries.length - 1];
        if (!lastEntry) return;

        const nameInput = lastEntry.querySelector('input[name="bereavedName[]"]');
        const relationSelect = lastEntry.querySelector('.relationship-select');
        const secondarySelect = lastEntry.querySelector('.secondary-relation-select');
        const customInput = lastEntry.querySelector('.custom-relationship-input');

        if (nameInput) nameInput.value = item.name || '';

        const rel = item.relationship || '';
        // 기본 옵션에 있는지 확인
        const primaryOptions = Array.from(relationSelect.options).map(o => o.value);
        if (primaryOptions.includes(rel)) {
            relationSelect.value = rel;
        } else {
            // 2차 옵션에 있는지 확인
            const secondaryOptions = secondarySelect ? Array.from(secondarySelect.options).map(o => o.value) : [];
            if (secondaryOptions.includes(rel)) {
                relationSelect.value = '기타';
                if (secondarySelect) secondarySelect.value = rel;
            } else {
                // 커스텀 입력
                relationSelect.value = '직접기재';
                if (customInput) customInput.value = rel;
            }
        }
        handleRelationChange(relationSelect);
    });

    hideAllSecondaryOptions();
}

// 자동 초기화 및 전역 노출 코드 제거
// document.addEventListener('DOMContentLoaded', init); // 삭제
// window.bereavedManager = { init, getBereavedData, fillBereavedData, validate }; // 삭제

// })(); // IIFE 끝 부분 제거

