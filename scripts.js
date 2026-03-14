import { AppUtils } from './src/common/utils.js';
import { LocalStorageObituaryRepository } from './src/infrastructure/persistence/LocalStorageObituaryRepository.js';
import { ObituaryService } from './src/application/ObituaryService.js';
import { WreathService } from './src/application/WreathService.js';
import { GuestbookService } from './src/application/GuestbookService.js';

// --- Application Services Initialization ---
// 애플리케이션 전역에서 사용할 서비스 인스턴스
const obituaryRepositoryInstance = new LocalStorageObituaryRepository();
const obituaryServiceInstance = new ObituaryService(obituaryRepositoryInstance);
const wreathServiceInstance = new WreathService(obituaryRepositoryInstance);
const guestbookServiceInstance = new GuestbookService(obituaryRepositoryInstance);

// 다른 모듈에서 서비스 인스턴스를 사용할 수 있도록 노출
// 방법 1: 전역 객체 사용 (간단하지만 전역 스코프 오염 가능성)
if (!window.appServices) {
    window.appServices = {};
}
window.appServices.obituaryService = obituaryServiceInstance;
window.appServices.wreathService = wreathServiceInstance;
window.appServices.guestbookService = guestbookServiceInstance;

// AppUtils를 window에 노출 (사이드바 토글 등 인라인 스크립트에서 사용)
window.AppUtils = AppUtils;

// Search.html 등 인라인 스크립트에서 사용하는 전역 함수 (호환용)
window.showLoading = function() { AppUtils.showLoading(); };
window.hideLoading = function() { AppUtils.hideLoading(); };

// 방법 2: ES6 모듈로 export (각 모듈에서 import하여 사용)
// export const obituaryService = obituaryServiceInstance; 
// (이 경우, 이 파일을 import하는 모든 곳에서 동일한 인스턴스를 참조하게 됨)

document.addEventListener('DOMContentLoaded', function() {
    // 공통 UI 초기화 (AppUtils 사용)
    if (AppUtils && typeof AppUtils.markActivePage === 'function') AppUtils.markActivePage();
    if (AppUtils && typeof AppUtils.initGlobalEventListeners === 'function') AppUtils.initGlobalEventListeners();
    if (AppUtils && typeof AppUtils.initModalOutsideClick === 'function') AppUtils.initModalOutsideClick();
    if (AppUtils && typeof AppUtils.connectLabelsToInputs === 'function') AppUtils.connectLabelsToInputs();
    if (AppUtils && typeof AppUtils.addTouchFeedback === 'function') AppUtils.addTouchFeedback();
    if (AppUtils && typeof AppUtils.initExtendedCommonFeatures === 'function') AppUtils.initExtendedCommonFeatures();

    // 템플릿 적용 (write.html 제외)
    if (!window.location.pathname.includes('write.html')) {
        if (AppUtils && typeof AppUtils.applyTemplateFromSessionOrParam === 'function') {
            AppUtils.applyTemplateFromSessionOrParam(); 
        }
    }

    // console.log('Application services initialized and common UI scripts executed.');
    // console.log('Obituary Service is available on window.appServices.obituaryService');
});

/**
 * 폼 입력 필드에 값 설정 (안전하게)
 */
