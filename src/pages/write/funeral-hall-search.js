/**
 * 장례식장 검색 기능 모듈
 * write.html 페이지에서 사용하는 검색 기능을 제공합니다.
 */

import { AppUtils } from '../../common/utils.js';
import { FuneralHallService } from '../../application/FuneralHallService.js';

// 즉시 실행 함수로 스코프 분리
// (function() {

// 초기화 완료 여부 추적
let isInitialized = false;
let funeralHallServiceInstance = null; // 서비스 인스턴스 추가
    
// 디바운스 타이머
let searchDebounceTimer = null;
    
// 디바운스 지연 시간 (ms)
const DEBOUNCE_DELAY = 300;
    
// 최소 검색어 길이
const MIN_QUERY_LENGTH = 2;
    
// 최대 검색 결과 수
const MAX_RESULTS = 10;
    
// 장례식장 검색 기능 초기화 함수 - export 키워드 추가
export function initFuneralHallSearch() {
    // 이미 초기화된 경우 중복 실행 방지
    if (isInitialized) {
        return;
    }
    
    try {
        // 서비스 인스턴스 생성
        funeralHallServiceInstance = new FuneralHallService();
        
        // 필요한 요소 선택
        const elements = {
            searchInput: document.getElementById('searchInput'),
            searchResults: document.getElementById('searchResults'),
            funeralHallName: document.getElementById('funeral-hall-name'),
            funeralHallAddress: document.getElementById('funeral-hall-address'),
            funeralHallPhone: document.getElementById('funeral-hall-phone')
        };
        
        // 요소 확인
        validateElements(elements);
        
        // 검색 결과 컨테이너 스타일 설정
        setupSearchResultsContainer(elements.searchResults);
        
        // 이벤트 리스너 등록
        setupEventListeners(elements);
        
        // 초기화 완료 표시
        isInitialized = true;

        // 장례식장 검색 레이아웃 및 직접입력 버튼 스타일 추가 (기존)
        const existingLayoutStyles = document.createElement('style');
        existingLayoutStyles.id = 'funeral-layout-styles'; // ID 추가하여 구분
        existingLayoutStyles.textContent = `
            .input-row-labeled {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                width: 100%;
            }

            .field-label {
                width: 80px;
                text-align: right;
                padding-right: 12px;
                font-size: 16px;
                font-weight: bold;
                color: #333;
                white-space: nowrap;
                line-height: 1.2;
            }

            .field-input {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }

            .field-input input {
                flex: 1;
                padding: 10px 12px;
                line-height: 1.5;
                height: 42px;
                box-sizing: border-box;
                margin-bottom: 0;
            }
            
            .field-input:last-child {
                margin-bottom: 0;
            }

            .direct-input-btn {
                height: 42px !important;
                box-sizing: border-box !important;
            }
            
            .direct-input-btn:hover {
                background-color: #e0e0e0 !important;
            }

            #searchResults {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                z-index: 100;
            }

            @media (max-width: 480px) {
                .input-row-labeled {
                    margin-bottom: 15px;
                }
                
                .field-input {
                    margin-bottom: 12px;
                }
                
                .field-label {
                    width: 70px;
                    font-size: 15px;
                }
                
                .field-input input {
                    padding: 8px 10px;
                    height: 38px;
                }
                
                .direct-input-btn {
                    height: 38px !important;
                    padding: 0 10px !important;
                    font-size: 13px !important;
                }
            }
        `;
        // document.head.appendChild(existingLayoutStyles); // 중복 방지 위해 이 라인은 제거하고 아래에서 한 번에 추가

        // common.js에서 가져온 장례식장 검색 결과 스타일 추가
        const commonSearchStyles = document.createElement('style');
        commonSearchStyles.id = 'funeral-search-styles'; // ID로 중복 방지
        commonSearchStyles.textContent = `
            /* 검색 결과 컨테이너 */
            .funeral-search-results {
                position: absolute;
                width: 100%;
                max-height: 300px;
                overflow-y: auto;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 5px;
                z-index: 100;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                margin-top: 2px;
            }
            
            /* 검색 결과 항목 */
            .search-item {
                padding: 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background-color 0.2s ease;
            }
            
            .search-item:last-child {
                border-bottom: none;
            }
            
            .search-item:hover,
            .search-item.selected {
                background-color: #f5f5f5;
            }
            
            /* 검색 결과 없음 메시지 */
            .search-item.no-results {
                padding: 15px;
                text-align: center;
                color: #888;
                cursor: default;
            }
            
            /* 장례식장 정보 스타일 */
            .hall-name {
                font-weight: bold;
                margin-bottom: 3px;
            }
            
            .hall-address,
            .hall-phone {
                font-size: 12px;
                color: #666;
                margin-bottom: 2px;
            }
            
            /* 읽기 전용 필드 스타일 */
            .readonly-field {
                background-color: #f9f9f9;
                cursor: default;
                border-color: #ddd;
            }
            
            /* 수정 버튼 스타일 */
            .edit-btn {
                padding: 3px 8px;
                font-size: 12px;
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 3px;
                margin-left: 5px;
                cursor: pointer;
                color: #555;
                transition: background-color 0.2s ease;
            }
            
            .edit-btn:hover {
                background-color: #e0e0e0;
            }
        `;
        // 두 스타일 모두 document.head에 추가 (ID로 중복 체크는 각 스타일 생성시 이미 고려됨)
        if (!document.getElementById(existingLayoutStyles.id)) {
             document.head.appendChild(existingLayoutStyles);
        }
        if (!document.getElementById(commonSearchStyles.id)) {
             document.head.appendChild(commonSearchStyles);
        }

        // 직접입력 버튼 초기 생성
        setTimeout(() => {
            createDirectInputButton(elements);
        }, 500);
    } catch (error) {
        handleError("장례식장 검색 기능 초기화 중 오류 발생", error);
    }
}

/**
 * 필수 DOM 요소 검증
 * @param {Object} elements - DOM 요소 객체
 */
function validateElements(elements) {
    if (!elements.searchInput) {
        throw new Error('searchInput 요소를 찾을 수 없습니다');
    }
    if (!elements.searchResults) {
        throw new Error('searchResults 요소를 찾을 수 없습니다');
    }
    if (!elements.funeralHallName) {
        throw new Error('funeralHallName 요소를 찾을 수 없습니다');
    }
    
    // 검색 컨테이너 위치 설정
    const searchContainer = elements.searchInput.closest('.search-container');
    if (searchContainer) {
        searchContainer.style.position = 'relative';
    }
}

/**
 * 검색 결과 컨테이너 스타일 설정
 * @param {HTMLElement} searchResults - 검색 결과 컨테이너
 */
function setupSearchResultsContainer(searchResults) {
    // 기존 클래스 추가 또는 인라인 스타일 설정
    searchResults.style.display = 'none';
    
    // 클래스 추가
    searchResults.classList.add('funeral-search-results');
}

/**
 * 장례식장 데이터베이스 존재 확인 및 생성
 */
// function ensureFuneralHallsDB() {
//     if (!window.funeralHallsDB || typeof window.funeralHallsDB.search !== 'function') {
//         createDefaultDatabase();
//     }
// }

/**
 * 이벤트 리스너 설정
 * @param {Object} elements - DOM 요소 객체
 */
function setupEventListeners(elements) {
    const { searchInput, searchResults } = elements;
    
    // 입력 이벤트 (디바운싱 적용)
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            performSearch(elements);
        }, DEBOUNCE_DELAY);
    });
    
    // 포커스 이벤트
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= MIN_QUERY_LENGTH) {
            performSearch(elements);
        }
    });
    
    // 키보드 이벤트 (화살표 키 이동 지원)
    searchInput.addEventListener('keydown', (e) => {
        handleKeyboardNavigation(e, elements);
    });
    
    // 외부 클릭 시 검색 결과 숨김
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

/**
 * 키보드 탐색 처리
 * @param {KeyboardEvent} e - 키보드 이벤트
 * @param {Object} elements - DOM 요소 객체
 */
function handleKeyboardNavigation(e, elements) {
    const { searchResults } = elements;
    const items = searchResults.querySelectorAll('.search-item');
    
    // 현재 선택된 아이템 인덱스 찾기
    let currentIndex = -1;
    items.forEach((item, idx) => {
        if (item.classList.contains('selected')) {
            currentIndex = idx;
        }
    });
    
    // 키보드 방향키 처리
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (searchResults.style.display === 'none') {
                performSearch(elements);
                return;
            }
            selectSearchItem(items, currentIndex + 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectSearchItem(items, currentIndex - 1);
            break;
        case 'Enter':
            e.preventDefault();
            const selectedItem = searchResults.querySelector('.search-item.selected');
            if (selectedItem) {
                selectedItem.click();
            }
            break;
        case 'Escape':
            searchResults.style.display = 'none';
            break;
    }
}

/**
 * 검색 결과 항목 선택
 * @param {NodeList} items - 검색 결과 항목 목록
 * @param {number} index - 선택할 항목 인덱스
 */
function selectSearchItem(items, index) {
    if (items.length === 0) return;
    
    // 모든 항목 선택 해제
    items.forEach(item => item.classList.remove('selected'));
    
    // 범위 내 인덱스로 조정
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    
    // 항목 선택 및 스크롤 조정
    items[index].classList.add('selected');
    items[index].scrollIntoView({ block: 'nearest' });
}

/**
 * 검색 실행 함수
 * @param {Object} elements - DOM 요소 객체
 */
async function performSearch(elements) {
    const { searchInput, searchResults } = elements;
    const query = searchInput.value.trim();
    
    // 최소 글자 수 확인
    if (query.length < MIN_QUERY_LENGTH) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }
    
    try {
        // 검색 수행
        const results = await searchFuneralHalls(query);
        
        // 검색 결과 표시
        displaySearchResults(results, elements);
    } catch (error) {
        handleError("검색 수행 중 오류 발생", error);
        showNoResultsMessage(searchResults, "검색 중 오류가 발생했습니다");
    }
}

/**
 * 장례식장 검색 함수
 * @param {string} query - 검색어
 * @returns {Array} - 검색 결과 배열
 */
async function searchFuneralHalls(query) {
    if (!funeralHallServiceInstance) {
        console.error('[FuneralHallSearch] FuneralHallService가 초기화되지 않았습니다.');
        return [];
    }
    return await funeralHallServiceInstance.searchHalls(query);
}

/**
 * 검색 결과 표시 함수
 * @param {Array} results - 검색 결과 배열
 * @param {Object} elements - DOM 요소 객체
 */
function displaySearchResults(results, elements) {
    const { searchResults } = elements;
    searchResults.innerHTML = '';
    
    // 직접입력 버튼이 검색창에 표시되도록 추가
    const directInputBtn = createDirectInputButton(elements);
    
    if (results.length === 0) {
        showNoResultsMessage(searchResults);
        return;
    }
    
    // 검색 결과 항목 생성
    results.forEach(hall => {
        const resultItem = createSearchResultItem(hall, elements);
        searchResults.appendChild(resultItem);
    });
    
    // 검색 결과 표시
    searchResults.style.display = 'block';
}

/**
 * 직접입력 버튼 생성 및 추가
 * @param {Object} elements - DOM 요소 객체
 */
function createDirectInputButton(elements) {
    // 기존 버튼이 있으면 제거
    const existingBtn = document.getElementById('directInputBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // 검색창 컨테이너 찾기
    const searchContainer = elements.searchInput.closest('.field-input');
    if (!searchContainer) return null;
    
    // 입력란의 계산된 스타일 가져오기
    const inputStyles = window.getComputedStyle(elements.searchInput);
    const inputHeight = elements.searchInput.offsetHeight;
    
    // 버튼 컨테이너 생성
    const btnContainer = document.createElement('div');
    btnContainer.style.marginLeft = '8px';
    btnContainer.style.display = 'flex';
    btnContainer.style.alignItems = 'center';
    
    // 직접입력 버튼 생성
    const directInputBtn = document.createElement('button');
    directInputBtn.id = 'directInputBtn';
    directInputBtn.type = 'button';
    directInputBtn.className = 'direct-input-btn';
    directInputBtn.textContent = '직접입력';
    
    // 버튼 높이를 입력란과 일치시키기
    directInputBtn.style.height = `${inputHeight}px`;
    directInputBtn.style.boxSizing = 'border-box';
    directInputBtn.style.padding = '0 15px';
    directInputBtn.style.fontSize = '14px';
    directInputBtn.style.fontWeight = 'bold';
    directInputBtn.style.backgroundColor = '#f0f0f0';
    directInputBtn.style.border = '1px solid #ddd';
    directInputBtn.style.borderRadius = '4px';
    directInputBtn.style.cursor = 'pointer';
    directInputBtn.style.whiteSpace = 'nowrap';
    directInputBtn.style.lineHeight = '1';
    directInputBtn.style.display = 'flex';
    directInputBtn.style.alignItems = 'center';
    directInputBtn.style.justifyContent = 'center';
    
    // 직접입력 상태 추적을 위한 변수
    let isDirectInput = false;

    // 버튼 클릭 이벤트 수정
    directInputBtn.addEventListener('click', () => {
        isDirectInput = !isDirectInput; // 상태 토글

        if (isDirectInput) {
            // 직접입력 모드로 전환
            elements.searchInput.style.display = 'none'; // 검색창 숨기기
            elements.searchResults.style.display = 'none'; // 검색 결과 숨기기
            directInputBtn.textContent = '검색하기'; // 버튼 텍스트 변경

            [elements.funeralHallName, elements.funeralHallAddress, elements.funeralHallPhone].forEach(field => {
                if (field) {
                    field.removeAttribute('readonly');
                    field.classList.remove('readonly-field');
                    field.value = ''; // 값 초기화
                }
            });

            elements.funeralHallName.focus(); // 첫 번째 필드에 포커스
        } else {
            // 검색 모드로 전환
            elements.searchInput.style.display = 'block'; // 검색창 표시
            directInputBtn.textContent = '직접입력'; // 버튼 텍스트 변경

            // 입력 필드 초기화
            [elements.funeralHallName, elements.funeralHallAddress, elements.funeralHallPhone].forEach(field => {
                if (field) {
                    field.value = '';
                }
            });

            elements.searchInput.value = ''; // 검색창 초기화
            elements.searchInput.focus(); // 검색창에 포커스
        }
    });
    
    // 버튼을 컨테이너에 추가
    btnContainer.appendChild(directInputBtn);
    
    // 버튼 컨테이너를 검색창 컨테이너에 추가
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.appendChild(btnContainer);
    
    return directInputBtn;
}

/**
 * 검색 결과 없음 메시지 표시
 * @param {HTMLElement} container - 표시할 컨테이너
 * @param {string} message - 표시할 메시지
 */
function showNoResultsMessage(container, message = '검색 결과가 없습니다') {
    const noResultItem = document.createElement('div');
    noResultItem.className = 'search-item no-results';
    noResultItem.textContent = message;
    container.appendChild(noResultItem);
    container.style.display = 'block';
}

/**
 * 검색 결과 항목 생성
 * @param {Object} hall - 장례식장 정보 객체
 * @param {Object} elements - DOM 요소 객체
 * @returns {HTMLElement} - 생성된 결과 항목 요소
 */
function escapeHtml(str) {
    if (AppUtils && typeof AppUtils.escapeHTML === 'function') {
        return AppUtils.escapeHTML(str);
    }
    if (str == null) return '';
    const s = String(str);
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function createSearchResultItem(hall, elements) {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-item';
    
    resultItem.innerHTML = `
        <div class="hall-name">${escapeHtml(hall.name)}</div>
        ${hall.address ? `<div class="hall-address">${escapeHtml(hall.address)}</div>` : ''}
        ${hall.phone ? `<div class="hall-phone">${escapeHtml(hall.phone)}</div>` : ''}
    `;
    
    // 항목 클릭 시 정보 설정
    resultItem.addEventListener('click', () => {
        selectFuneralHall(hall, elements);
    });
    
    return resultItem;
}

/**
 * 장례식장 선택 처리
 * @param {Object} hall - 선택된 장례식장 정보
 * @param {Object} elements - DOM 요소 객체
 */
function selectFuneralHall(hall, elements) {
    const { searchResults, funeralHallName, funeralHallAddress, funeralHallPhone } = elements;
    
    // 장례식장 정보 설정
    funeralHallName.value = hall.name || '';
    
    if (funeralHallAddress) {
        funeralHallAddress.value = hall.address || '';
    }
    
    if (funeralHallPhone) {
        funeralHallPhone.value = hall.phone || '';
    }
    
    // 검색 결과 숨김
    searchResults.style.display = 'none';
    
    // 필드를 readonly로 설정
    [funeralHallName, funeralHallAddress, funeralHallPhone].forEach(field => {
        if (field) {
            field.setAttribute('readonly', true);
            field.classList.add('readonly-field');
        }
    });
    
    // 수정 버튼 표시 (선택 사항)
    displayEditButton(elements);
    
    // 사용자 정의 이벤트 발생
    triggerFuneralHallSelectEvent(hall);
}

/**
 * 수정 버튼 표시 (필요한 경우)
 * @param {Object} elements - DOM 요소 객체
 */
function displayEditButton(elements) {
    // 기존 버튼 찾거나 새로 생성
    let editBtn = document.getElementById('funeralHallEditBtn');
    
    if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.id = 'funeralHallEditBtn';
        editBtn.type = 'button';
        editBtn.className = 'edit-btn';
        editBtn.textContent = '직접 기재'; // "수정"에서 "직접 기재"로 텍스트 변경
        
        // 버튼 스타일 추가
        editBtn.style.padding = '8px 15px';
        editBtn.style.fontSize = '14px';
        editBtn.style.marginBottom = '10px';
        editBtn.style.border = '1px solid #ddd';
        editBtn.style.borderRadius = '6px';
        editBtn.style.backgroundColor = '#f8f8f8';
        editBtn.style.cursor = 'pointer';
        
        editBtn.addEventListener('click', () => {
            // readonly 해제
            [elements.funeralHallName, elements.funeralHallAddress, elements.funeralHallPhone].forEach(field => {
                if (field) {
                    field.removeAttribute('readonly');
                    field.classList.remove('readonly-field');
                }
            });
            
            // 수정 버튼 숨김
            editBtn.style.display = 'none';
            
            // 첫 번째 필드에 포커스
            elements.funeralHallName.focus();
        });
        
        // 버튼 추가 위치 변경: 검색 컨테이너 전체 위에 배치
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && searchContainer.parentNode) {
            // 검색 컨테이너 앞에 버튼 추가
            searchContainer.parentNode.insertBefore(editBtn, searchContainer);
        } else {
            // 대체 위치: 장례식장 이름 필드 위에 배치
            const container = elements.funeralHallName.parentNode;
            container.insertBefore(editBtn, elements.funeralHallName);
        }
    } else {
        // 기존 버튼이 있으면 표시만 변경
        editBtn.style.display = 'block';
        editBtn.textContent = '직접 기재'; // 텍스트 업데이트
    }
}

/**
 * 장례식장 선택 커스텀 이벤트 발생
 * @param {Object} hall - 선택된 장례식장 정보
 */
function triggerFuneralHallSelectEvent(hall) {
    const event = new CustomEvent('funeralHallSelect', {
        detail: {
            hall: hall
        },
        bubbles: true
    });
    
    document.dispatchEvent(event);
}

/**
 * 오류 처리 함수
 * @param {string} message - 오류 메시지
 * @param {Error} error - 오류 객체
 */
function handleError(message, error) {
    console.error(`${message}:`, error);
    
    // commonUtils 모듈이 있는 경우 이를 사용
    if (window.commonUtils && typeof window.commonUtils.showToast === 'function') {
        window.commonUtils.showToast(`${message}: ${error.message}`);
        return;
    }
    
    // 없으면 기본 알림 표시
    alert(`${message}: ${error.message}`);
}


// 전역에 초기화 함수 노출 (다른 스크립트에서 직접 호출 가능)
// window.funeralHallSearch = {
//    init: initFuneralHallSearch,
//    // 필요한 경우 다른 함수도 여기에 추가하여 노출할 수 있습니다.
//    // 예를 들어, 외부에서 직접 검색을 트리거해야 하는 경우:
//    // search: performSearch // (performSearch는 elements를 인자로 받으므로, 이 방식은 부적합할 수 있음)
// };
// })(); // IIFE 끝 부분 제거