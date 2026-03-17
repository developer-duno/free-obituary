// src/search-module.js
// import { ObituaryService } from './application/ObituaryService.js'; // 전역 서비스 사용
// import { ObituaryRepository } from './infrastructure/ObituaryRepository.js'; // 전역 서비스 사용
import { AppUtils, EditModeManager } from '../common/utils.js';

(function() {
    "use strict";

    let obituaryServiceInstance; // 전역 서비스 인스턴스

    document.addEventListener('DOMContentLoaded', function() {

        // 서비스 인스턴스 가져오기
        if (window.appServices && window.appServices.obituaryService) {
            obituaryServiceInstance = window.appServices.obituaryService;
        } else {
            console.error("ObituaryService를 window.appServices에서 찾을 수 없습니다.");
            AppUtils.showToast("페이지 로딩 심각한 오류 [S00_Srv]"); return;
        }

        if (!AppUtils || !EditModeManager) {
            console.error("AppUtils 또는 EditModeManager 모듈을 찾을 수 없습니다. (search-module)");
            return;
        }

        const searchButton = document.querySelector('.search-form .search-button');
        if (searchButton) {
            searchButton.addEventListener('click', handleSearchObituary);
        } else {
            console.warn("검색 버튼을 찾을 수 없습니다.");
        }
    });

    async function handleSearchObituary() {
        if (!obituaryServiceInstance || !AppUtils) {
            console.error("서비스가 준비되지 않았습니다. [S02]");
            return;
        }

        const searchKeywordInput = document.getElementById('searchKeyword');
        const searchResultContainer = document.getElementById('searchResultContainer');
        const resultDeceasedNameSpan = document.getElementById('resultDeceasedName');
        const resultDepartureDateSpan = document.getElementById('resultDepartureDate');
        const resultViewCountSpan = document.getElementById('resultViewCount');
        
        if (!searchKeywordInput || !searchResultContainer || !resultDeceasedNameSpan || !resultDepartureDateSpan || !resultViewCountSpan) {
            AppUtils.showToast("필요한 페이지 요소를 찾을 수 없습니다. [S03]");
            console.error("필수 DOM 요소 누락"); return;
        }

        const keyword = searchKeywordInput.value.trim();
        if (!keyword) {
            AppUtils.showToast("고인명을 입력해주세요. [S04]");
            searchKeywordInput.focus(); return;
        }
        
        AppUtils.showLoading();
        searchResultContainer.style.display = 'none';
        // currentFoundObituary = null; // 더 이상 사용하지 않음, 직접 Entity 사용

        try {
            const results = await obituaryServiceInstance.searchObituariesByDeceasedName(keyword);
            let foundObituaryEntity = null;
            if (results && results.length > 0) {
                foundObituaryEntity = results[0]; // 첫 번째 Obituary Entity 사용
            }

            if (foundObituaryEntity) {
                // Entity 내부 VO 사용
                resultDeceasedNameSpan.textContent = foundObituaryEntity.deceasedInfo.name || '-';
                resultDepartureDateSpan.textContent = AppUtils.formatDateTimeDetailed(foundObituaryEntity.funeralInfo.departureDate, foundObituaryEntity.funeralInfo.departureTime, true, true) || '-';
                resultViewCountSpan.textContent = foundObituaryEntity.viewCount !== undefined ? foundObituaryEntity.viewCount.toString() : '-';
                
                searchResultContainer.style.display = 'block';

                const previewButton = searchResultContainer.querySelector('.preview-btn');
                const manageButton = searchResultContainer.querySelector('.manage-btn');

                if (previewButton) {
                    previewButton.onclick = () => handleGoToPreview(foundObituaryEntity.id);
                }
                if (manageButton) {
                    manageButton.dataset.obituaryId = foundObituaryEntity.id;
                    manageButton.onclick = handleGoToManage;
                }
                AppUtils.showToast("부고 정보를 찾았습니다.", 2000);
            } else {
                AppUtils.showToast("일치하는 부고 정보를 찾을 수 없습니다. [S06]");
                searchKeywordInput.focus();
            }
        } catch (error) {
            console.error("부고 검색 오류 (search-module):", error);
            AppUtils.showToast(`검색 중 오류 발생: ${error.message} [S07]`, 5000);
        } finally {
            AppUtils.hideLoading();
        }
    }

    function handleGoToPreview(obituaryId) {
        if (!obituaryId || !AppUtils.isValidObituaryId(obituaryId)) {
            AppUtils.showToast("유효하지 않은 부고 ID입니다. [S08]"); return;
        }
        window.location.href = `preview.html?id=${encodeURIComponent(obituaryId)}`;
    }

    async function handleGoToManage(event) { // event 객체에서 ID 추출
        const obituaryId = event.currentTarget.dataset.obituaryId;
        if (!obituaryId || !AppUtils || !obituaryServiceInstance || !EditModeManager) {
            if(AppUtils) AppUtils.showToast("관리 기능을 실행할 수 없습니다. [S09]", 'error');
            else AppUtils.showToast("관리 기능을 실행할 수 없습니다. [S09]", "error");
            return;
        }
        
        const searchPasswordInput = document.getElementById('searchPassword');
        const password = searchPasswordInput ? searchPasswordInput.value.trim() : '';

        if (!password) {
            AppUtils.showToast("부고 관리를 위해 비밀번호를 입력해주세요. [S10]");
            searchPasswordInput?.focus(); return;
        }
        
        AppUtils.showLoading();
        try {
            // 서비스의 verifyAndGetObituary는 Entity를 반환하므로, 성공 여부만 확인
            const verifiedObituary = await obituaryServiceInstance.verifyAndGetObituary(obituaryId, password);
            if (verifiedObituary) {
                EditModeManager.setEditMode(obituaryId, 'search'); // 수정 페이지로 가기 전 edit 모드 설정
                window.location.href = 'write.html'; // 수정은 write.html에서 진행
            } else {
                // 서비스에서 null을 반환하거나 Error를 throw 하지 않는 경우 (거의 없음, 서비스가 Error throw)
                AppUtils.showToast("비밀번호가 일치하지 않거나 부고 정보를 찾을 수 없습니다. [S12]", 'error');
                searchPasswordInput?.focus();
            }
        } catch (error) {
            console.error("관리 모드 전환 오류 (search-module):", error);
            AppUtils.showToast(error.message || "관리 모드 전환 중 오류 발생 [S13]", 'error');
        } finally {
            AppUtils.hideLoading();
        }
    }

})(); 