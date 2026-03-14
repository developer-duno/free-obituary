import { EditModeManager, AppUtils } from '../../common/utils.js';
import { initDateTimePickers } from './date-time-picker.js';
import { initFuneralHallSearch } from './funeral-hall-search.js';
import { initAccountManager, getAccountData, fillAccountData } from './account-manager.js';
import { initBereavedManager, getBereavedData as getBereaved, fillBereavedData as fillBereaved } from './bereaved-manager.js';
import { initMessageTemplates, setMessageData } from './message-templates.js';
import { initPhotoEditor, getPhotoData, setPhotoData, clearPhotoData } from './photo-editor.js';
import { validateObituaryFormLogic, writePageRequiredFields } from './form-validation.js';
import { TemplateSelector } from '../../common/template-selector.js';

// write-module.js
(function() {
    "use strict";

    let obituaryServiceInstance;
    let templateSelectorInstance;
    let currentObituaryId = null;
    let isEditMode = false;

    const DOMElements = {
        obituaryForm: null,
        deceasedNameInput: null,
        passwordInput: null,
        submitButton: null,
        templateSelectButton: null,
        selectedTemplateHidden: null,
        loadingOverlay: null,
    };

    document.addEventListener('DOMContentLoaded', function() {
        console.log("write-module.js init start");

        if (window.appServices && window.appServices.obituaryService) {
            obituaryServiceInstance = window.appServices.obituaryService;
        } else {
            console.error("ObituaryService not found on window.appServices");
            AppUtils.showToast("페이지 로딩 오류 [WM00_Srv]");
            return;
        }
        
        try {
            if (!AppUtils || !TemplateSelector) {
                AppUtils.showToast("페이지 로딩 오류 [WM00_Lib]", "error");
                return;
            }
            templateSelectorInstance = new TemplateSelector({
                onSelect: handleTemplateSelection,
                domIds: { 
                    modal: 'template-modal',
                    grid: 'template-grid',
                    loadingIndicator: 'template-loading-indicator',
                    closeButton: 'template-modal-close-button'
                }
            });
        } catch (error) {
            console.error("TemplateSelector init error:", error);
            AppUtils.showToast("페이지 초기화 오류 [WM01_Lib]", 'error', 5000);
            return;
        }
        
        if (AppUtils && typeof AppUtils.initTemplateSelectionLogic === 'function') {
            AppUtils.initTemplateSelectionLogic();
        }

        initDOMElements();
        setupEventListeners();
        handleEditMode();
        setupBeforeUnloadWarning();
        initializePageComponents();
        
        console.log("write-module.js init complete");
    });

    function initDOMElements() {
        DOMElements.obituaryForm = document.getElementById('obituaryForm');
        DOMElements.deceasedNameInput = document.getElementById('deceased-name');
        DOMElements.passwordInput = document.getElementById('password');
        DOMElements.submitButton = document.getElementById('submit-button'); 
        DOMElements.templateSelectButton = document.getElementById('template-select-btn');
        DOMElements.selectedTemplateHidden = document.getElementById('selected-template-hidden');
        DOMElements.loadingOverlay = document.getElementById('loading-overlay');
    }

    function setupEventListeners() {
        if (DOMElements.obituaryForm) {
            DOMElements.obituaryForm.addEventListener('submit', handleFormSubmit);
        }
        if (DOMElements.templateSelectButton) {
            DOMElements.templateSelectButton.addEventListener('click', openTemplateModal);
        }
        const useAccountCheckbox = document.getElementById('use-account');
        if (useAccountCheckbox) {
            useAccountCheckbox.addEventListener('change', function() {
                document.getElementById('account-info')?.classList.toggle('hidden', !this.checked);
            });
        }
    }

    async function handleEditMode() {
        if (EditModeManager && EditModeManager.isEditMode()) {
            isEditMode = true;
            currentObituaryId = EditModeManager.getEditObituaryId();
            if (DOMElements.submitButton) {
                DOMElements.submitButton.textContent = '수정 완료';
                DOMElements.submitButton.setAttribute('data-edit-mode', 'true');
            }
            if (DOMElements.passwordInput) {
                DOMElements.passwordInput.placeholder = '비밀번호 변경 시에만 입력';
                DOMElements.passwordInput.removeAttribute('required'); 
            }
            
            let cancelButton = document.getElementById('cancel-edit-button');
            if (!cancelButton && DOMElements.submitButton && DOMElements.submitButton.parentNode) {
                cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancel-edit-button';
                cancelButton.className = 'styled-button cancel-button'; 
                cancelButton.textContent = '수정 취소';
                cancelButton.style.marginRight = '10px';
                DOMElements.submitButton.parentNode.insertBefore(cancelButton, DOMElements.submitButton);
                cancelButton.addEventListener('click', function() {
                    if (confirm('수정을 취소하시겠습니까?')) {
                        EditModeManager.clearEditMode();
                        window.location.href = 'manage.html?id=' + currentObituaryId; 
                    }
                });
            }
            
            if (currentObituaryId && obituaryServiceInstance) {
                AppUtils.showLoading();
                try {
                    const obituaryEntity = await obituaryServiceInstance.getObituaryById(currentObituaryId);
                    if (obituaryEntity) {
                        const form = DOMElements.obituaryForm;
                        if (form) {
                            if (obituaryEntity.deceasedInfo) {
                                form.elements['deceased-name'].value = obituaryEntity.deceasedInfo.name || '';
                                form.elements['deceased-age'].value = obituaryEntity.deceasedInfo.age || '';
                                form.elements['gender'].value = obituaryEntity.deceasedInfo.gender || '';
                                form.elements['deceased-title'].value = obituaryEntity.deceasedInfo.title || '';
                                form.elements['death-date'].value = obituaryEntity.deceasedInfo.deathDate || '';
                                form.elements['death-time'].value = obituaryEntity.deceasedInfo.deathTime || '';
                                if (form.elements['death-expression']) form.elements['death-expression'].value = obituaryEntity.deceasedInfo.deathExpression || '';
                            }
                            if (obituaryEntity.funeralInfo) {
                                form.elements['coffin-date'].value = obituaryEntity.funeralInfo.coffinDate || '';
                                form.elements['coffin-time'].value = obituaryEntity.funeralInfo.coffinTime || '';
                                form.elements['departure-date'].value = obituaryEntity.funeralInfo.departureDate || '';
                                form.elements['departure-time'].value = obituaryEntity.funeralInfo.departureTime || '';
                                form.elements['funeral-hall-name'].value = obituaryEntity.funeralInfo.funeralHallName || '';
                                form.elements['funeral-hall-address'].value = obituaryEntity.funeralInfo.funeralHallAddress || '';
                                form.elements['funeral-hall-phone'].value = obituaryEntity.funeralInfo.funeralHallPhone || '';
                                form.elements['funeral-hall-room'].value = obituaryEntity.funeralInfo.room || '';
                                form.elements['cemetery'].value = obituaryEntity.funeralInfo.cemetery || '';
                            }
                            if (form.elements['additional-info']) form.elements['additional-info'].value = obituaryEntity.additionalInfo || '';
                            if (obituaryEntity.bereaved && obituaryEntity.bereaved.length > 0) {
                                fillBereaved(obituaryEntity.bereaved.map(b => b));
                            }
                            if (obituaryEntity.portraitImage) {
                                setPhotoData(obituaryEntity.portraitImage);
                            }
                            if (obituaryEntity.selectedTemplate) {
                                if (DOMElements.selectedTemplateHidden) DOMElements.selectedTemplateHidden.value = obituaryEntity.selectedTemplate;
                                updateTemplatePreview(obituaryEntity.selectedTemplate);
                                if (templateSelectorInstance && typeof templateSelectorInstance.selectTemplate === 'function') {
                                    templateSelectorInstance.selectTemplate(obituaryEntity.selectedTemplate, false);
                                }
                            }
                            // 메시지 복원
                            if (obituaryEntity.messageContent) {
                                const selectedMsgEl = document.getElementById('selected-message');
                                if (selectedMsgEl) selectedMsgEl.textContent = obituaryEntity.messageContent;
                                const msgTypeEl = document.getElementById('message-type');
                                if (msgTypeEl) msgTypeEl.value = obituaryEntity.messageType || '';
                                const msgContentEl = document.getElementById('message-content-hidden');
                                if (msgContentEl) msgContentEl.value = obituaryEntity.messageContent;
                            }
                            // 계좌 정보 복원
                            if (obituaryEntity.accountInfo && typeof fillAccountData === 'function') {
                                fillAccountData(obituaryEntity.accountInfo);
                            }
                        }
                    } else {
                        AppUtils.showToast('부고 정보를 불러올 수 없습니다. [WM_Ld01]', 'error');
                        EditModeManager.clearEditMode();
                    }
                } catch (error) {
                    console.error('Edit mode load error:', error);
                    AppUtils.showToast('데이터 로드 오류 [WM_Ld02]', 'error');
                } finally {
                    AppUtils.hideLoading();
                }
            }
        } else {
            if (DOMElements.passwordInput) {
                DOMElements.passwordInput.placeholder = '비밀번호 4자리 이상 (필수)';
                DOMElements.passwordInput.setAttribute('required', 'true');
            }
            if (DOMElements.submitButton) DOMElements.submitButton.textContent = '작성 완료';
            const initialTemplate = AppUtils.getUrlParameter('template') || sessionStorage.getItem('selectedTemplate');
            if (initialTemplate) {
                updateTemplatePreview(initialTemplate);
                if(DOMElements.selectedTemplateHidden) DOMElements.selectedTemplateHidden.value = initialTemplate;
                if(sessionStorage.getItem('selectedTemplate') !== initialTemplate) sessionStorage.setItem('selectedTemplate', initialTemplate);
            }
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (!obituaryServiceInstance) {
            AppUtils.showToast('서비스가 준비되지 않았습니다. [WMFS01]', 'error');
            return;
        }

        const collectedData = collectFormData(); 
        if (!collectedData) {
            AppUtils.showToast('폼 데이터 수집 실패 [WMFS02]', 'error');
            return;
        }

        const validationPassed = validateObituaryFormLogic(DOMElements.obituaryForm, writePageRequiredFields);
        if (!validationPassed) {
            return;
        }

        AppUtils.showLoading();
        try {
            let resultObituary;
            if (isEditMode && currentObituaryId) {
                const currentPassword = prompt("수정을 위해 현재 비밀번호를 입력해주세요.");
                if (currentPassword === null) { AppUtils.hideLoading(); return; }
                if (currentPassword.trim() === '') {
                    AppUtils.showToast('현재 비밀번호를 입력해야 합니다.', 'warning');
                    AppUtils.hideLoading(); return;
                }
                resultObituary = await obituaryServiceInstance.updateObituary(currentObituaryId, collectedData, currentPassword);
                AppUtils.showToast('부고가 성공적으로 수정되었습니다.', 'success');
                EditModeManager.clearEditMode();
                window.location.href = 'preview.html?id=' + resultObituary.id;
            } else {
                if (!collectedData.password || collectedData.password.trim() === '') {
                    AppUtils.hideLoading();
                    AppUtils.showToast('비밀번호를 반드시 입력해야 합니다.', 'warning');
                    DOMElements.passwordInput?.focus();
                    return;
                }
                resultObituary = await obituaryServiceInstance.createObituary(collectedData);
                AppUtils.showToast('부고가 성공적으로 등록되었습니다.', 'success');
                window.location.href = 'preview.html?id=' + resultObituary.id;
            }
        } catch (error) {
            console.error('Obituary submit error:', error);
            AppUtils.showToast(error.message || '부고 처리 중 오류 발생', 'error');
        } finally {
            AppUtils.hideLoading();
        }
    }

    function collectFormData() {
        const form = DOMElements.obituaryForm;
        if (!form) { console.error("Form not found"); return null; }

        const deceasedInfoData = {
            name: form.elements['deceased-name']?.value,
            age: form.elements['deceased-age']?.value,
            title: form.elements['deceased-title']?.value,
            gender: form.elements['gender']?.value,
            deathDate: form.elements['death-date']?.value,
            deathTime: form.elements['death-time']?.value,
            deathExpression: form.elements['death-expression']?.value || ''
        };

        const funeralInfoData = {
            funeralHallName: form.elements['funeral-hall-name']?.value,
            funeralHallAddress: form.elements['funeral-hall-address']?.value,
            funeralHallPhone: form.elements['funeral-hall-phone']?.value,
            room: form.elements['funeral-hall-room']?.value,
            departureDate: form.elements['departure-date']?.value,
            departureTime: form.elements['departure-time']?.value,
            cemetery: form.elements['cemetery']?.value,
            coffinDate: form.elements['coffin-date']?.value,
            coffinTime: form.elements['coffin-time']?.value
        };

        const bereavedDataArray = (typeof getBereaved === 'function') ? getBereaved() : [];

        let accountDetails = null;
        if (typeof getAccountData === 'function') {
            accountDetails = getAccountData();
        }

        const messageType = document.getElementById('message-type')?.value || document.querySelector('.msg-btn.active')?.dataset.type || '직접';
        let messageContent = document.getElementById('message-content-hidden')?.value;
        if (!messageContent && messageType === '직접') {
            messageContent = form.elements['custom-message']?.value;
        }
        if (!messageContent) {
            messageContent = document.getElementById('selected-message')?.textContent;
        }
        const additionalInfoFromForm = form.elements['additional-info']?.value || '';

        const collected = {
            deceasedInfoData: deceasedInfoData,
            funeralInfoData: funeralInfoData,
            bereavedDataArray: bereavedDataArray, 
            additionalInfo: additionalInfoFromForm,
            messageContent: messageContent?.trim() || '',
            messageType: messageType,
            accountInfo: accountDetails,
            password: DOMElements.passwordInput?.value,
            selectedTemplate: DOMElements.selectedTemplateHidden?.value || sessionStorage.getItem('selectedTemplate'),
            portraitImage: typeof getPhotoData === 'function' ? getPhotoData() : null
        };

        if (isEditMode && (!collected.password || collected.password.trim() === '')) {
            delete collected.password;
        }


        return collected;
    }

    function openTemplateModal() {
        if (templateSelectorInstance) {
            const currentTemplate = DOMElements.selectedTemplateHidden?.value || sessionStorage.getItem('selectedTemplate');
            templateSelectorInstance.openModal(currentTemplate);
        } else {
            AppUtils.showToast("템플릿 선택 기능을 사용할 수 없습니다. [WM07]", 3000);
        }
    }

    function handleTemplateSelection(templateNumber) {
        console.log("Template selected:", templateNumber);
        if (DOMElements.selectedTemplateHidden) {
            DOMElements.selectedTemplateHidden.value = templateNumber;
        }
        sessionStorage.setItem('selectedTemplate', templateNumber);
        sessionStorage.setItem('selectedTemplateSrc', 'image/' + templateNumber + '.jpg');
        updateTemplatePreview(templateNumber);
        if(AppUtils && typeof AppUtils.applyTemplateFromSessionOrParam === 'function'){
            AppUtils.applyTemplateFromSessionOrParam(templateNumber);
        }
    }
    
    function updateTemplatePreview(templateNumber) {
        const templateTextEl = DOMElements.templateSelectButton?.querySelector('.option-text');
        if (templateTextEl) {
            templateTextEl.textContent = '선택된 디자인: ' + templateNumber + '번';
        }
        const templateImageEl = document.getElementById('selected-template-image');
        if (templateImageEl) {
            templateImageEl.src = 'image/' + templateNumber + '.jpg';
        }
    }

    function initializePageComponents() {
        try {
            if (typeof $ !== 'undefined' && typeof $.fn.select2 === 'function') {
                $('.relationship-select').select2({
                    placeholder: "관계 선택",
                    allowClear: true,
                    language: "ko" 
                });
            }
        } catch (e) { console.error('Select2 초기화 오류:', e); }

        const components = [
            ['날짜/시간 선택', initDateTimePickers],
            ['장례식장 검색', initFuneralHallSearch],
            ['계좌 관리', initAccountManager],
            ['상주 관리', initBereavedManager],
            ['메시지 템플릿', initMessageTemplates],
            ['사진 편집', initPhotoEditor],
        ];
        for (const [name, initFn] of components) {
            try {
                if (typeof initFn === 'function') initFn();
            } catch (e) { console.error(name + ' 초기화 오류:', e); }
        }
        
        const urlTemplate = AppUtils.getUrlParameter('template');
        if (urlTemplate) {
            sessionStorage.setItem('selectedTemplate', urlTemplate);
            if (DOMElements.selectedTemplateHidden) DOMElements.selectedTemplateHidden.value = urlTemplate;
            updateTemplatePreview(urlTemplate);
            if(AppUtils && typeof AppUtils.applyTemplateFromSessionOrParam === 'function'){
                 AppUtils.applyTemplateFromSessionOrParam(urlTemplate);
            }
        } else {
            const sessionTemplate = sessionStorage.getItem('selectedTemplate');
            if(sessionTemplate){
                if (DOMElements.selectedTemplateHidden) DOMElements.selectedTemplateHidden.value = sessionTemplate;
                updateTemplatePreview(sessionTemplate);
                if(AppUtils && typeof AppUtils.applyTemplateFromSessionOrParam === 'function'){
                    AppUtils.applyTemplateFromSessionOrParam(sessionTemplate);
                }
            }
        }

        const useAccountCheckbox = document.getElementById('use-account');
        if (useAccountCheckbox) {
            document.getElementById('account-info')?.classList.toggle('hidden', !useAccountCheckbox.checked);
        }
    }

    function setupBeforeUnloadWarning() {
        window.addEventListener('beforeunload', function (e) {
            const msg = '변경사항이 저장되지 않을 수 있습니다.';
            (e || window.event).returnValue = msg;
            return msg;
        });
    }

})();
