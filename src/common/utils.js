import { TemplateSelector } from './template-selector.js';

/**
 * 토스트 메시지를 화면에 표시합니다.
 * @param {string} message - 표시할 메시지 내용.
 * @param {string} [type='info'] - 메시지 타입 ('info', 'success', 'error', 'warning').
 * @param {number} [duration=3000] - 메시지 표시 시간 (밀리초).
 */
export function showToast(message, type = 'info', duration = 3000) {
    try {
        let toast = document.getElementById('toast-message');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-message';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        
        toast.className = 'toast-message-base';
        toast.classList.add('toast-' + type);
        toast.textContent = message;

        // CSS 클래스가 적용된 후 표시 애니메이션
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
    } catch (error) {
        console.error('토스트 메시지 표시 중 오류 발생:', error);
    }
}

/**
 * 로딩 인디케이터를 화면에 표시합니다.
 */
export function showLoading() {
    if (document.getElementById('loading-overlay')) return; // 이미 있으면 중복 생성 방지

    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-overlay'; // CSS는 styles.css에 정의되어 있다고 가정
    loadingEl.id = 'loading-overlay';
    loadingEl.innerHTML = '<div class="loading-spinner"></div>'; 
    document.body.appendChild(loadingEl);
}

/**
 * 화면에 표시된 로딩 인디케이터를 숨깁니다.
 */
export function hideLoading() {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

/**
 * 텍스트를 클립보드에 복사합니다.
 * @param {string} text - 복사할 텍스트.
 */
export function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('클립보드에 복사되었습니다.'))
                .catch(err => {
                    console.error('클립보드 복사 오류 (navigator.clipboard):', err);
                    fallbackCopyToClipboard(text);
                });
        } else {
            fallbackCopyToClipboard(text);
        }
    } catch (e) {
        console.error('클립보드 복사 시도 중 오류:', e);
        showToast('클립보드 복사에 실패했습니다.', 3000);
    }
}

/**
 * 클립보드 복사 대체 방법을 제공합니다 (주로 HTTP 환경 또는 구형 브라우저용).
 * @param {string} text - 복사할 텍스트.
 */
export function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // 화면에 보이지 않게
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999); // 모바일 기기에서의 선택을 위해
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('클립보드에 복사되었습니다.');
        } else {
            throw new Error('document.execCommand(copy) 실패');
        }
    } catch (e) {
        console.error('클립보드 대체 복사 오류:', e);
        showToast('클립보드 복사에 실패했습니다. 직접 복사해주세요.', 3000);
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * HTML 문자열을 이스케이프 처리합니다.
 * @param {string} str - 이스케이프 처리할 HTML 문자열.
 * @returns {string} 이스케이프 처리된 문자열.
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 날짜 문자열 또는 Date 객체를 'YYYY년 MM월 DD일' 또는 'YYYY년 MM월 DD일 HH시 MM분' 형식으로 포맷팅합니다.
 * @param {string | Date} dateInput - 날짜 문자열 (예: '2023-10-26' 또는 '2023-10-26T10:20:00') 또는 Date 객체.
 * @param {boolean} [includeTime=false] - 시간 정보 포함 여부.
 * @returns {string} 포맷팅된 날짜 문자열 또는 오류 시 원본 반환.
 */
export function formatDate(dateInput, includeTime = false) {
    if (!dateInput) return '';
    
    let date;
    try {
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            // ISO 8601 형식 (YYYY-MM-DDTHH:mm:ss.sssZ) 이나 YYYY-MM-DD 형식을 처리
            if (dateInput.includes('T')) {
                date = new Date(dateInput);
            } else {
                // YYYY-MM-DD 또는 YYYY.MM.DD 또는 YYYY/MM/DD
                const parts = dateInput.split(/[-./]/);
                if (parts.length === 3) {
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    throw new Error('날짜 형식 분석 불가');
                }
            }
        } else {
             throw new Error('지원하지 않는 날짜 입력 타입');
        }

        if (isNaN(date.getTime())) {
            console.warn('유효하지 않은 날짜:', dateInput);
            return typeof dateInput === 'string' ? dateInput : ''; // 유효하지 않으면 원본 문자열이나 빈 문자열 반환
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        let formattedDate = `${year}년 ${month}월 ${day}일`;
        
        if (includeTime) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedTime = `${String(hours).padStart(2, '0')}시 ${String(minutes).padStart(2, '0')}분`;
            formattedDate += ` ${formattedTime}`;
        }
        
        return formattedDate;
    } catch (error) {
        console.error('날짜 포맷 중 오류:', error, '입력값:', dateInput);
        return typeof dateInput === 'string' ? dateInput : ''; // 오류 발생 시 원본 문자열이나 빈 문자열 반환
    }
}

/**
 * 현재 기기가 모바일 기기인지 확인합니다.
 * @returns {boolean} 모바일 기기이면 true, 아니면 false.
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768); // 너비 기반 체크도 추가
}

/**
 * 전화번호 문자열을 하이픈(-)을 포함하여 포맷팅합니다.
 * @param {string} phoneNumber - 포맷팅할 전화번호 문자열.
 * @returns {string} 포맷팅된 전화번호 문자열.
 */
export function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const cleaned = ('' + phoneNumber).replace(/\D/g, ''); // 숫자만 추출
    const match = cleaned.match(/^(\d{2,3})(\d{3,4})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phoneNumber; // 매칭 안되면 원본 반환
}

/**
 * URL 쿼리 파라미터 값을 가져옵니다.
 * @param {string} name - 가져올 파라미터의 이름.
 * @returns {string | null} 파라미터 값 또는 찾지 못한 경우 null.
 */
export function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * 디바운스 함수: 지정된 시간 동안 호출이 없을 때만 함수를 실행합니다.
 * @param {Function} func - 실행할 함수.
 * @param {number} [wait=300] - 대기 시간 (밀리초).
 * @returns {Function} 디바운스된 함수.
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 필요한 경우 추가적인 유틸리티 함수들을 여기에 추가합니다.
// 예: function isEmpty(value) { ... }
// 예: function generateUUID() { ... }

// 요일 반환 함수 (scripts.js에서 가져옴)
export function getWeekday(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return weekdays[date.getDay()];
}

// 한국어 날짜 포맷 함수 (scripts.js에서 가져옴, 기존 utils.js의 formatDate와 기능 통합 고려)
// 이 함수는 요일 포함 여부를 인자로 받지 않으므로, preview-module의 formatDisplayDateTime과 완전히 같지는 않음.
// 더 상세한 포맷팅이 필요하면 아래 formatDateTimeDetailed를 사용한다.
export function formatKoreanDate(dateInput) {
    if (!dateInput) return '';
    let date;
    try {
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput.replace(/[-.]/g, '/')); // YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD 처리
        } else {
            throw new Error('지원하지 않는 날짜 입력 타입');
        }

        if (isNaN(date.getTime())) {
            console.warn('유효하지 않은 날짜:', dateInput);
            return typeof dateInput === 'string' ? dateInput : '';
        }
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${getWeekday(date)})`;
    } catch (error) {
        console.error('한국어 날짜 포맷 중 오류:', error, '입력값:', dateInput);
        return typeof dateInput === 'string' ? dateInput : '';
    }
}

// preview-module.js의 formatDisplayDateTime과 scripts.js의 formatDateTimeInline 기능을 통합한 상세 날짜/시간 포맷 함수
export function formatDateTimeDetailed(dateStr, timeStr, includeDay = true, includeTime = true) {
    if (!dateStr) return '';
    let date;
    try {
        if (dateStr instanceof Date) {
            date = dateStr;
        } else if (typeof dateStr === 'string') {
            // 이미 한국어 포맷인 경우 그대로 반환
            if (/^\d{4}년/.test(dateStr)) {
                if (includeTime && timeStr) {
                    const timeParts = String(timeStr).split(':');
                    let hours = parseInt(timeParts[0], 10);
                    const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        const ampm = hours < 12 || hours === 24 ? '오전' : '오후';
                        hours = hours % 12 || 12;
                        const formattedTime = ampm + ' ' + hours + '시' + (minutes > 0 ? ' ' + String(minutes).padStart(2, '0') + '분' : '');
                        return dateStr + ' ' + formattedTime;
                    }
                }
                return dateStr;
            }
            date = new Date(dateStr.replace(/[-.]/g, '/')); 
        } else {
            return dateStr; // 알 수 없는 타입은 그대로 반환
        }

        if (isNaN(date.getTime())) {
             console.warn('formatDateTimeDetailed: 유효하지 않은 날짜:', dateStr);
             return dateStr;
        }

        let formattedString = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
        
        if (includeDay) {
            formattedString += ` (${getWeekday(date)})`;
        }

        if (includeTime && timeStr) {
            const timeParts = String(timeStr).split(':');
            let hours = parseInt(timeParts[0], 10);
            const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

            if (!isNaN(hours) && !isNaN(minutes)) {
                const ampm = hours < 12 || hours === 24 ? '오전' : '오후'; // 24시는 오전 0시로 처리 가능성
                hours = hours % 12 || 12;
                const formattedTime = `${ampm} ${hours}시${minutes > 0 ? ` ${String(minutes).padStart(2, '0')}분` : ''}`;
                formattedString += ` ${formattedTime}`;
            }
        } else if (includeTime && (date.getHours() !== 0 || date.getMinutes() !== 0)) {
            // timeStr이 제공되지 않았지만 Date 객체에 시간 정보가 있을 경우
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours < 12 || hours === 24 ? '오전' : '오후';
            hours = hours % 12 || 12;
            const formattedTime = `${ampm} ${hours}시${minutes > 0 ? ` ${String(minutes).padStart(2, '0')}분` : ''}`;
            formattedString += ` ${formattedTime}`;
        }
        return formattedString;
    } catch (error) {
        console.error('상세 날짜/시간 포맷 중 오류:', error, '입력값:', dateStr, timeStr);
        return dateStr; // 오류 시 원본 dateStr 반환
    }
}

/**
 * 선택된 템플릿에 따라 페이지 전체에 스타일을 적용합니다.
 * body 요소에 data-template 속성을 설정하고, 필요한 경우 CSS 변수를 업데이트합니다.
 * 인자가 없으면 세션 스토리지에서 템플릿 정보를 읽어 사용합니다.
 * @param {string | number | null} [templateParam=null] - 적용할 템플릿 번호. null이면 세션에서 로드.
 */
export function applyTemplateFromSessionOrParam(templateParam = null) {
    const templateToApply = templateParam ? String(templateParam) : sessionStorage.getItem('selectedTemplate');

    if (!templateToApply) {
        console.warn('Applying template: No template specified and none in session storage.');
        return;
    }

    document.body.setAttribute('data-template', templateToApply);

    // 템플릿 이미지 업데이트 (scripts.js의 applyTemplateFromSession 로직 일부 통합)
    const templateImageElement = document.getElementById('templateImage');
    if (templateImageElement) {
        const storedSrc = sessionStorage.getItem('selectedTemplateSrc');
        // S7: sessionStorage 템플릿 소스 검증 (인젝션 방지)
        const imageSrc = (storedSrc && /^image\/\d+\.jpg$/.test(storedSrc)) ? storedSrc : `image/${templateToApply}.jpg`;
        templateImageElement.src = imageSrc;
    }

    const rootStyle = document.documentElement.style;
    switch (templateToApply) {
        case '1': // 기본 (파란색 계열)
            rootStyle.setProperty('--primary-color', '#5271C2');
            rootStyle.setProperty('--accent-color', '#8CAAE6');
            break;
        case '2': // 심플 (남색 계열)
            rootStyle.setProperty('--primary-color', '#3A4D7C');
            rootStyle.setProperty('--accent-color', '#6E84B5');
            break;
        case '3': // 전통 (회색 계열)
            rootStyle.setProperty('--primary-color', '#4F4F4F');
            rootStyle.setProperty('--accent-color', '#8F8F8F');
            break;
        case '4': // 미니멀 (검은색 계열)
            rootStyle.setProperty('--primary-color', '#333333');
            rootStyle.setProperty('--accent-color', '#666666');
            break;
        default:
            break;
    }
}

export function initTemplateSelectionLogic() {
    const commonOpenModalLogic = (event) => {
        event.preventDefault();
        // AppUtils.toggleSidebar가 존재하고, 사이드바가 열려있으면 닫는 로직 (현재 AppUtils 객체에 toggleSidebar가 있다고 가정)
        if (window.AppUtils && AppUtils.toggleSidebar && document.getElementById('sidebar')?.classList.contains('active')){
            AppUtils.toggleSidebar();
        }
        createAndShowTemplateModalInternal();
    };

    const sidebarWriteLinkIndex = document.getElementById('sidebarWriteLinkIndex');
    if (sidebarWriteLinkIndex) {
        sidebarWriteLinkIndex.addEventListener('click', commonOpenModalLogic);
    }
    const sidebarWriteLinkSearch = document.getElementById('sidebarWriteLink');
    if (sidebarWriteLinkSearch) {
        sidebarWriteLinkSearch.addEventListener('click', commonOpenModalLogic);
    }
    const mainWriteButtons = document.querySelectorAll('.main-write-button, a.container-button[href="#"] ');
    mainWriteButtons.forEach(btn => {
        if (btn.textContent.includes('부고장 작성') || btn.classList.contains('main-write-button')){
            if (btn.tagName === 'A') btn.setAttribute('href', '#');
            btn.removeEventListener('click', commonOpenModalLogic); // 중복 방지
            btn.addEventListener('click', commonOpenModalLogic);
        }
    });
}

export function initGlobalEventListeners() {
    // 헤더 버튼
    const backButton = document.querySelector('.header .back-button');
    if (backButton) {
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // backButton.style.display = 'none'; // index.html에서는 보통 뒤로가기 버튼 숨김
        } else {
            backButton.addEventListener('click', () => history.back());
        }
    }

    const logo = document.querySelector('.header .logo');
    if (logo) {
        logo.addEventListener('click', () => location.href='index.html');
    }

    const menuButton = document.querySelector('.header .menu-button');
    // AppUtils.toggleSidebar가 존재한다고 가정하고 호출
    if (menuButton && window.AppUtils && typeof AppUtils.toggleSidebar === 'function') {
        menuButton.addEventListener('click', AppUtils.toggleSidebar);
    }

    // 사이드바 닫기 버튼
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseBtn = sidebar?.querySelector('.close-btn');
    if (sidebarCloseBtn && window.AppUtils && typeof AppUtils.toggleSidebar === 'function'){
        sidebarCloseBtn.addEventListener('click', AppUtils.toggleSidebar);
    }
}

export function addTouchFeedback() {
    const buttons = document.querySelectorAll('button, .button, [role="button"], .btn');
    buttons.forEach(button => {
        if (button.getAttribute('data-touch-feedback') === 'true') return;
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.opacity = '0.9';
        });
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            this.style.opacity = '';
        });
        button.setAttribute('data-touch-feedback', 'true');
    });
}

export function connectLabelsToInputs() {
    const labels = document.querySelectorAll('label[for]');
    labels.forEach(label => {
        const forAttribute = label.getAttribute('for');
        if (forAttribute) {
            const input = document.getElementById(forAttribute);
            if (input) {
                label.addEventListener('click', function() {
                    input.focus();
                });
            }
        }
    });
}

export function initModalOutsideClick() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                // AppUtils.closeModal이 존재한다고 가정하고 호출
                if (window.AppUtils && typeof AppUtils.closeModal === 'function') {
                    if (modal.id === 'accountEditModal' || modal.id === 'datesEditModal') {
                         // 특정 모달에 대한 특별한 closeAccountModal, closeDatesModal 함수가 있다면
                         // AppUtils.closeModal(modal.id) 대신 해당 함수를 호출하도록 분기할 수 있으나,
                         // 여기서는 AppUtils.closeModal로 일원화 시도.
                         // 만약 closeAccountModal 등이 AppUtils.closeModal과 다른 동작을 한다면 별도 처리 필요.
                        AppUtils.closeModal(modal.id); 
                    } else {
                        AppUtils.closeModal(modal.id);
                    }
                } else {
                    // 폴백: AppUtils.closeModal이 없을 경우 직접 스타일 변경 (기존 scripts.js 로직)
                    modal.style.display = 'none'; 
                }
            }
        });
    });
}

export function navigateToManagePage(obituaryId = null) {
    const idToNavigate = obituaryId || sessionStorage.getItem('currentObituaryId');
    if (idToNavigate && isValidObituaryId(idToNavigate)) {
        window.location.href = `manage.html?id=${encodeURIComponent(idToNavigate)}`;
    } else {
        window.location.href = 'manage.html';
    }
}

export function optimizeTouchEvents() {
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    const clickableElements = document.querySelectorAll('button, a, .clickable');
    clickableElements.forEach(el => {
        el.addEventListener('touchend', function(event) {
            event.preventDefault();
            // el.click(); // 실제 클릭 트리거는 주석 처리 유지 (부작용 가능성)
        });
    });
}

export function optimizeInputFormats() {
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function(e) {
            if (window.AppUtils && window.AppUtils.formatPhoneNumber) {
                e.target.value = window.AppUtils.formatPhoneNumber(e.target.value);
            } else {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.substring(0, 11);
                if (value.length > 3 && value.length <= 7) {
                    value = value.replace(/(\d{3})(\d+)/, '$1-$2');
                } else if (value.length > 7) {
                    value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
                }
                e.target.value = value;
            }
        });
    });
}

export function initExtendedCommonFeatures() {
    if (typeof optimizeTouchEvents === 'function') optimizeTouchEvents(); // AppUtils 내부 함수 호출
    if (typeof optimizeInputFormats === 'function') optimizeInputFormats(); // AppUtils 내부 함수 호출
}


/** URL ID 파라미터 검증 (인젝션 방지) */
export function isValidObituaryId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[a-zA-Z0-9_\-]{4,50}$/.test(id);
}

export const AppUtils = {
    showToast,
    showLoading,
    hideLoading,
    copyToClipboard,
    fallbackCopyToClipboard,
    escapeHTML,
    getWeekday,
    formatKoreanDate,
    formatDateTimeDetailed,
    formatDate,
    isMobileDevice,
    formatPhoneNumber,
    getUrlParameter,
    debounce,
    applyTemplateFromSessionOrParam,
    setText,
    toggleSidebar,
    openModal,
    closeModal,
    markActivePage,
    openTemplateModalForWrite,
    initTemplateSelectionLogic,
    initGlobalEventListeners,
    addTouchFeedback,
    connectLabelsToInputs,
    initModalOutsideClick,
    navigateToManagePage,
    optimizeTouchEvents,
    optimizeInputFormats,
    initExtendedCommonFeatures,
    scrollToElement,
    isValidObituaryId
};

export const EditModeManager = {
    setEditMode: function(obituaryId) {
        sessionStorage.setItem('editMode', 'true');
        sessionStorage.setItem('editObituaryId', obituaryId);
    },
    isEditMode: function() {
        return sessionStorage.getItem('editMode') === 'true';
    },
    getEditObituaryId: function() {
        return sessionStorage.getItem('editObituaryId');
    },
    clearEditMode: function() {
        sessionStorage.removeItem('editMode');
        sessionStorage.removeItem('editObituaryId');
        sessionStorage.removeItem('originalObituaryData');
        sessionStorage.removeItem('obituaryData');
    }
};

/**
 * 요소에 텍스트 또는 HTML을 설정합니다.
 * @param {string} elementId - 대상 요소 ID
 * @param {string} text - 표시할 텍스트
 * @param {boolean} [isHtml=false] - true면 innerHTML 사용. ⚠️ 사용자 입력은 반드시 escapeHTML()로 이스케이프 후 전달하세요.
 */
export function setText(elementId, text, isHtml = false) {
    const element = document.getElementById(elementId);
    if (element) {
        if (isHtml) {
            element.innerHTML = text || '-';
        } else {
            element.textContent = text || '-';
        }
    } else {
        console.warn(`Element with ID '${elementId}' not found for setText.`);
    }
}

// --- AppUtils에 추가될 함수들 ---
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

export function markActivePage() {
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && currentPage === linkHref) {
            link.classList.add('active');
        }
    });
}

/**
 * 특정 요소로 부드럽게 스크롤합니다.
 * @param {string | HTMLElement} target - 스크롤할 대상 요소의 ID 또는 HTMLElement 객체.
 * @param {number} [offset=0] - 스크롤 위치 조정값 (픽셀 단위).
 * @param {string} [behavior='smooth'] - 스크롤 동작 방식 ('auto' 또는 'smooth').
 */
export function scrollToElement(target, offset = 0, behavior = 'smooth') {
    try {
        let element;
        if (typeof target === 'string') {
            element = document.getElementById(target);
        }
        else if (target instanceof HTMLElement) {
            element = target;
        }

        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: behavior
            });
        } else {
            console.warn(`[scrollToElement] Target element not found: ${target}`);
        }
    } catch (error) {
        console.error('[scrollToElement] Error scrolling to element:', error);
    }
}

// --- AppUtils에 추가될 함수들 (템플릿 선택 관련) ---
// TemplateSelector 클래스는 이미 window.TemplateSelector로 노출되어 있다고 가정합니다.
// 또는 AppUtils.js 상단에서 import { TemplateSelector } from './template-selector.js'; 와 같이 가져올 수 있습니다.

function createAndShowTemplateModalInternal() { // 내부 호출용 함수, AppUtils에는 openTemplateModalForWrite로 노출
    if (!TemplateSelector) {
        console.error('TemplateSelector 클래스가 import되지 않았거나 유효하지 않습니다.');
        if (AppUtils && AppUtils.showToast) AppUtils.showToast('템플릿 선택 기능을 사용할 수 없습니다. [UTS01]', 'error', 3000);
        return;
    }

    const handleTemplateSelect = function(templateIndex) {
        try {
            sessionStorage.setItem('selectedTemplate', templateIndex.toString());
            sessionStorage.setItem('selectedTemplateSrc', `image/${templateIndex}.jpg`);
        } catch (e) {
            console.error('세션 스토리지 접근 오류:', e);
        }
        window.location.href = `write.html?template=${templateIndex}`;
    };
    const templateSelectorInstance = new TemplateSelector({
        onSelect: handleTemplateSelect,
    });
    templateSelectorInstance.openModal(sessionStorage.getItem('selectedTemplate'));
}

export function openTemplateModalForWrite(event) {
    if(event) event.preventDefault();
    createAndShowTemplateModalInternal();
} 