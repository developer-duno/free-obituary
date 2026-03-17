import { AppUtils } from './src/common/utils.js';
import { LocalStorageObituaryRepository } from './src/infrastructure/persistence/LocalStorageObituaryRepository.js';
import { ObituaryService } from './src/application/ObituaryService.js';
import { WreathService } from './src/application/WreathService.js';
import { GuestbookService } from './src/application/GuestbookService.js';

// --- localStorage 사용 가능 여부 확인 ---
function isLocalStorageAvailable() {
    try {
        const key = '__ls_test__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

// --- Application Services Initialization ---
let obituaryServiceInstance = null;
let wreathServiceInstance = null;
let guestbookServiceInstance = null;

try {
    if (!isLocalStorageAvailable()) {
        throw new Error('localStorage를 사용할 수 없습니다. 프라이빗 브라우징 모드에서는 일부 기능이 제한됩니다.');
    }
    const obituaryRepositoryInstance = new LocalStorageObituaryRepository();
    obituaryServiceInstance = new ObituaryService(obituaryRepositoryInstance);
    wreathServiceInstance = new WreathService(obituaryRepositoryInstance);
    guestbookServiceInstance = new GuestbookService(obituaryRepositoryInstance);
} catch (error) {
    console.error('서비스 초기화 실패:', error);
    document.addEventListener('DOMContentLoaded', () => {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#d32f2f;color:#fff;padding:12px;text-align:center;z-index:99999;font-size:14px;';
        msg.textContent = '저장소 접근에 실패했습니다. 프라이빗 브라우징 모드를 해제하거나 브라우저 설정을 확인해주세요.';
        document.body.prepend(msg);
    });
}

// 다른 모듈에서 서비스 인스턴스를 사용할 수 있도록 노출
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

// --- 전역 에러 핸들러 ---
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.AppUtils) AppUtils.showToast('예기치 않은 오류가 발생했습니다.', 'error');
});

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

});

/**
 * 폼 입력 필드에 값 설정 (안전하게)
 */
