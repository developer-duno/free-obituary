"use strict";

const IMAGE_PATH = 'image/';
const TEMPLATE_NAMES = {
    1: '백국화 (흰배경)', 2: '국화 한송이 (회색)', 3: '국화 (초록배경)',
    4: '국화 (어두운배경)', 5: '국화 (황금배경)', 6: '국화 (회색 삼각)',
    7: '국화 리본 (베이지)', 8: '국화 수묵화 (회색)', 9: '리본 국화 (회색)',
    10: '국화 (남색배경)', 11: '국화 수묵 (밝은회색)', 12: '십자가 설경 (기독교)',
    13: '국화 세밀화 (회색)', 14: '근조 하늘 (일반)', 15: '추모 리본 (꽃)',
    16: '추모 리본 (수묵)', 17: '십자가 꽃 (기독교)', 18: '소천 십자가 (기독교)',
    19: '국화 수채화 (밝은)', 20: '근조 국화 (흰배경)', 21: '근조 국화 (흑백)',
    22: '근조 꽃잎 (회색)', 23: '국화 선화 (흰배경)', 24: '국화 수채 (흰배경)',
    25: '국화 판화 (회색)', 26: '백합 십자가 (기독교)', 27: '촛불 십자가 (기독교)',
    28: '성찬 십자가 (기독교)', 29: '기도손 (기독교)', 30: '십자가 꽃 (기독교)',
    31: '연꽃 왕생 (불교)', 32: '연꽃 명복 (불교)', 33: '부처 명복 (불교)'
}; // 상수화

export class TemplateSelector {
    constructor(customOptions = {}) {
        this.isInitialized = false;
        this.elements = {};
        this.options = {};
        this.loadingTimeout = null;
        this.totalImages = 33; // 총 템플릿 이미지 개수

        // DOM 요소 ID는 생성자 옵션으로 받거나 기본값을 사용할 수 있습니다.
        this.domIds = {
            grid: 'template-grid', // CSS 선택자로 변경 가능: '.template-grid'
            modal: 'template-modal',
            closeButton: 'template-modal-close-button', // 모달 내 닫기 버튼 ID
            loadingIndicator: 'template-loading-indicator', // 템플릿 로딩 중 표시
            // modalContainer: '.modal-scroll-container' // CSS 선택자 예시
        };

        // 옵션 병합 (customOptions가 domIds를 포함할 수 있음)
        this.options = { ...customOptions }; 
        if (customOptions.domIds) {
            this.domIds = { ...this.domIds, ...customOptions.domIds };
        }

        // AppUtils가 준비되면 초기화 시도, 아니면 DOMContentLoaded 시점에 초기화
        if (window.AppUtils) {
            this._init();
        } else {
            document.addEventListener('DOMContentLoaded', () => this._init());
        }
    }

    _init() {
        if (this.isInitialized) {
            if (this.options) { // 새 옵션이 있다면 업데이트
                // this.options = { ...this.options, ...newOptions }; 
            }
            return;
        }

        this.elements = {
            templateGrid: document.getElementById(this.domIds.grid) || document.querySelector('.' + this.domIds.grid),
            modal: document.getElementById(this.domIds.modal),
            closeBtn: document.getElementById(this.domIds.closeButton) || document.querySelector('.' + this.domIds.closeButton),
            loadingIndicator: document.getElementById(this.domIds.loadingIndicator),
        };

        if (!this.elements.templateGrid || !this.elements.modal) {
            console.warn('TemplateSelector: 필수 요소를 찾을 수 없습니다. (grid, modal)');
            return; // 초기화 실패
        }
        
        this._setupEventListeners();
        this.isInitialized = true;
        // setTimeout(() => this._preloadTemplateImages(), 500); // 필요시 미리 로딩
    }

    _setupEventListeners() {
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeModal());
        }
        // 모달 외부 클릭 시 닫기 (overlay 등)
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (event) => {
                if (event.target === this.elements.modal) { // 모달 배경 클릭 시
                    this.closeModal();
                }
            });
        }
    }

    openModal(currentTemplateId = null) {
        if (!this.isInitialized) {
            console.warn('TemplateSelector가 초기화되지 않았습니다. openModal 호출 전 init 필요.');
            // 강제 초기화 시도 또는 에러 처리
             this._init(); // 재시도
             if(!this.isInitialized) return;
        }

        if (!this.elements.modal) {
            console.error('TemplateSelector: 모달 요소를 찾을 수 없습니다.');
            return;
        }

        this.elements.modal.style.display = 'block'; // 또는 flex 등
        document.body.classList.add('modal-open');

        // 그리드가 비어있거나, 다시 로드해야 하는 경우 (예: 선택된 템플릿이 바뀔 수 있을 때)
        // 여기서는 항상 그리드를 새로 채우도록 변경 (기존 로직 유지)
        this._initTemplateGrid(currentTemplateId);
    }

    closeModal() {
        if (!this.elements.modal) return;
        this.elements.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
    }

    _initTemplateGrid(currentTemplateId = null) {
        if (!this.elements.templateGrid || !this.elements.loadingIndicator) return;

        this.elements.templateGrid.innerHTML = ''; // 항상 새로 그림
        if(this.elements.loadingIndicator) this.elements.loadingIndicator.style.display = 'block';

        let loadedImages = 0;
        const showLoadingThreshold = 5; // 이 개수만큼 로드되면 로딩 숨김

        this.loadingTimeout = setTimeout(() => {
            if (this.elements.loadingIndicator) this.elements.loadingIndicator.style.display = 'none';
        }, 6000); // 최대 로딩 시간

        const updateLoadingStatus = () => {
            loadedImages++;
            if (loadedImages >= showLoadingThreshold && this.elements.loadingIndicator) {
                this.elements.loadingIndicator.style.display = 'none';
                clearTimeout(this.loadingTimeout);
            }
        };

        for (let i = 1; i <= this.totalImages; i++) {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.setAttribute('data-template', i.toString());

            if (currentTemplateId && parseInt(currentTemplateId) === i) {
                templateItem.classList.add('selected');
                // selected 스타일은 CSS로 관리하는 것이 좋음
            }

            const img = new Image();
            img.className = 'template-image';
            img.loading = 'lazy';
            img.alt = TEMPLATE_NAMES[i] || `템플릿 ${i}`;
            img.onload = updateLoadingStatus;
            img.onerror = () => {
                console.error(`이미지 로드 실패: ${IMAGE_PATH}${i}.jpg`);
                updateLoadingStatus();
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg=='; // 대체 이미지
                img.style.objectFit = 'contain'; img.style.padding = '10px';
            };
            img.src = `${IMAGE_PATH}${i}.jpg`;

            templateItem.appendChild(img);
            templateItem.addEventListener('click', (e) => {
                e.preventDefault();
                this._selectTemplate(i, templateItem);
            });
            this.elements.templateGrid.appendChild(templateItem);
        }
    }

    _selectTemplate(templateIndex, selectedItemElement) {
        // 이전 선택 해제 (CSS 클래스로 관리)
        const prevSelected = this.elements.templateGrid?.querySelector('.template-item.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        // 새 선택 적용
        if (selectedItemElement) {
            selectedItemElement.classList.add('selected');
        }

        try {
            sessionStorage.setItem('selectedTemplate', templateIndex.toString());
            sessionStorage.setItem('selectedTemplateSrc', `${IMAGE_PATH}${templateIndex}.jpg`);
        } catch (e) {
            console.error('세션 스토리지 접근 오류:', e);
        }

        if (this.options.onSelect && typeof this.options.onSelect === 'function') {
            this.options.onSelect(templateIndex);
        } else {
            // 기본 동작: write.html 페이지로 이동 (옵션으로 URL 설정 가능하게 하면 더 유연)
            window.location.href = `write.html?template=${templateIndex}`;
        }
        this.closeModal();
    }

    // _preloadTemplateImages() { ... } // 필요시 구현
}

// 전역 네임스페이스 AppUI에 등록 (또는 다른 방식으로 모듈 노출)
// IIFE 및 전역 노출 코드 제거
// if (typeof window !== 'undefined') {
//     if (!window.AppUI) {
//         window.AppUI = {};
//     }
//     // 사용 예: window.AppUI.templateSelector = new TemplateSelector({ onSelect: (num) => console.log(num) });
//     // 각 페이지에서 필요에 따라 new TemplateSelector()를 호출하여 사용하거나,
//     // 공통으로 사용되는 인스턴스가 필요하다면 아래처럼 할당.
//     // window.AppUI.templateSelectorInstance = new TemplateSelector(/* 기본 옵션 */);
//     // window.TemplateSelector = TemplateSelector; // 클래스 자체를 노출하여 각 페이지에서 인스턴스화 하도록 함
// } // IIFE 제거 