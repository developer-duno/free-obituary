// src/manage-module.js
import { AppUtils, EditModeManager } from '../common/utils.js';

(function() {
    "use strict";

    let obituaryServiceInstance;
    let currentObituaryId = null;
    let _currentObituaryEntity = null;

    document.addEventListener('DOMContentLoaded', initManagePage);

    function initManagePage() {
        if (window.appServices && window.appServices.obituaryService) {
            obituaryServiceInstance = window.appServices.obituaryService;
        } else {
            console.error("ObituaryService를 window.appServices에서 찾을 수 없습니다.");
            AppUtils.showToast("페이지 로딩 심각한 오류 [M00_Srv]");
            return;
        }

        try {
            if (!AppUtils || !EditModeManager) {
                console.error("AppUtils 또는 EditModeManager 모듈을 찾을 수 없습니다.");
                AppUtils.showToast("페이지 로딩 오류 [M00_Lib]", "error");
                return;
            }
        } catch (error) {
            console.error("필수 라이브러리 접근 중 오류:", error);
            AppUtils.showToast("페이지 초기화 오류 [M01_Lib]", 'error');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const rawId = urlParams.get('id') || urlParams.get('newId');
        currentObituaryId = AppUtils.isValidObituaryId(rawId) ? rawId : null;

        if (currentObituaryId) {
            loadObituaryDetails(currentObituaryId);
        } else {
            document.querySelector('.manage-title').textContent = '부고장 정보 없음';
            document.querySelectorAll('.manage-button:not(#create-new-obituary-btn)').forEach(button => {
                button.disabled = true; button.style.opacity = '0.5'; button.style.cursor = 'not-allowed';
            });
            AppUtils.showToast("표시할 부고 ID가 없습니다. [M02]");
        }
        setupEventListeners();
    }

    async function loadObituaryDetails(id) {
        if (!obituaryServiceInstance) {
            AppUtils.showToast("서비스 미준비 [M03]", 'error'); return;
        }
        AppUtils.showLoading();
        try {
            const obituaryEntity = await obituaryServiceInstance.getObituaryById(id);
            if (obituaryEntity) {
                _currentObituaryEntity = obituaryEntity;
                displayObituaryDetails(obituaryEntity);
                updatePageTitle(obituaryEntity.deceasedInfo.name);
            } else {
                AppUtils.showToast("부고 정보를 찾을 수 없습니다. [M04]", 'error');
                document.querySelector('.manage-container').innerHTML = '<p style="text-align:center; padding:20px;">부고 정보를 찾을 수 없습니다.</p>';
            }
        } catch (error) {
            console.error("부고 정보 로드 오류:", error);
            AppUtils.showToast("부고 정보 로드 오류 [M05]", 'error');
        } finally {
            AppUtils.hideLoading();
        }
    }

    function updatePageTitle(deceasedName) {
        if (deceasedName) {
            document.title = `故 ${deceasedName}님 부고 관리 | 무료 부고장`;
            const manageTitle = document.querySelector('.manage-title');
            if (manageTitle) manageTitle.textContent = `故 ${deceasedName}님 부고 관리`;
        }
    }

    function displayObituaryDetails(obituaryEntity) {
        const deceasedInfo = obituaryEntity.deceasedInfo;
        const funeralInfo = obituaryEntity.funeralInfo;

        AppUtils.setText('funeral-info-value', `${funeralInfo.funeralHallName || ''} ${funeralInfo.room || ''}`.trim());
        AppUtils.setText('deceased-info-value', `故 ${deceasedInfo.title ? deceasedInfo.title + ' ' : ''}${deceasedInfo.name || ''} (향년 ${deceasedInfo.age || '-'}세) 별세`);
        AppUtils.setText('death-time-value', AppUtils.formatDateTimeDetailed(deceasedInfo.deathDate, deceasedInfo.deathTime, true, !!deceasedInfo.deathTime));

        const coffinSection = document.getElementById('coffin-info-section');
        if (funeralInfo.coffinDate) {
            AppUtils.setText('coffin-time-value', AppUtils.formatDateTimeDetailed(funeralInfo.coffinDate, funeralInfo.coffinTime, true, !!funeralInfo.coffinTime));
            if (coffinSection) coffinSection.style.display = '';
        } else {
            if (coffinSection) coffinSection.style.display = 'none';
        }

        AppUtils.setText('departure-time-value', AppUtils.formatDateTimeDetailed(funeralInfo.departureDate, funeralInfo.departureTime, true, !!funeralInfo.departureTime));
        AppUtils.setText('cemetery-value', funeralInfo.cemetery);
        AppUtils.setText('address-value', funeralInfo.funeralHallAddress);

        const addressElement = document.getElementById('address-value');
        if (addressElement && funeralInfo.funeralHallAddress) {
            addressElement.style.cursor = 'pointer';
            addressElement.style.textDecoration = 'underline';
            addressElement.title = '클릭하여 지도에서 위치 보기';
        } else if (addressElement) {
            addressElement.style.cursor = 'default';
            addressElement.style.textDecoration = 'none';
        }

        AppUtils.setText('view-count-value', `${obituaryEntity.viewCount || 0}회`);
        if (obituaryEntity.viewCount < 10) document.getElementById('view-count-value')?.classList.add('low-views');
        else document.getElementById('view-count-value')?.classList.remove('low-views');

        const viewMapBtn = document.getElementById('view-map-btn');
        if (viewMapBtn) viewMapBtn.style.display = funeralInfo.funeralHallAddress ? 'inline-flex' : 'none';

        const viewObituaryLink = document.getElementById('view-obituary-link');
        if (viewObituaryLink) viewObituaryLink.href = `preview.html?id=${obituaryEntity.id}`;

        AppUtils.setText('additional-info-value', obituaryEntity.additionalInfo || '등록된 내용이 없습니다.');

        displayChiefMourners(obituaryEntity.bereaved);
        displayAccountInfo(obituaryEntity);
        displayStats(obituaryEntity);
    }


    function displayStats(obituaryEntity) {
        const statsGrid = document.getElementById('stats-grid');
        const statsMeta = document.getElementById('stats-meta');
        if (!statsGrid) return;

        // View count
        AppUtils.setText('stat-views', String(obituaryEntity.viewCount || 0));

        // Guestbook count
        const gbCount = obituaryEntity.guestbookEntries ? obituaryEntity.guestbookEntries.length : 0;
        AppUtils.setText('stat-guestbook', String(gbCount));

        // Wreath count
        const wreathCount = obituaryEntity.wreathOrders ? obituaryEntity.wreathOrders.length : 0;
        AppUtils.setText('stat-wreath', String(wreathCount));

        // Expiry calculation
        const appConfig = window.__APP_CONFIG__ || {};
        const expiryDays = appConfig.OBITUARY_EXPIRY_DAYS || 7;
        const depDate = obituaryEntity.funeralInfo?.departureDate;
        const expiryCard = document.getElementById('stat-expiry-card');

        if (depDate) {
            const departure = typeof depDate === 'string' ? new Date(depDate.replace(/[-.]/g, '/')) : new Date(depDate);
            const expiryDate = new Date(departure.getTime() + expiryDays * 24 * 60 * 60 * 1000);
            const now = new Date();
            const diffMs = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                AppUtils.setText('stat-expiry', '만료');
                AppUtils.setText('stat-expiry-label', '비공개 처리됨');
                if (expiryCard) expiryCard.classList.add('expired');
            } else if (diffDays <= 2) {
                AppUtils.setText('stat-expiry', diffDays + '일');
                AppUtils.setText('stat-expiry-label', '만료까지');
                if (expiryCard) expiryCard.classList.add('expiry-warning');
            } else {
                AppUtils.setText('stat-expiry', diffDays + '일');
                AppUtils.setText('stat-expiry-label', '만료까지');
            }
        } else {
            AppUtils.setText('stat-expiry', '-');
            AppUtils.setText('stat-expiry-label', '발인일 미설정');
        }

        // Meta: created & updated dates
        if (statsMeta) {
            const createdAt = obituaryEntity.createdAt;
            const updatedAt = obituaryEntity.updatedAt;
            if (createdAt) {
                const d = new Date(createdAt);
                AppUtils.setText('stat-created', '작성: ' + d.toLocaleDateString('ko-KR'));
            }
            if (updatedAt) {
                const d = new Date(updatedAt);
                AppUtils.setText('stat-updated', '수정: ' + d.toLocaleDateString('ko-KR'));
            }
            statsMeta.style.display = 'flex';
        }

        statsGrid.style.display = 'grid';
    }

    function displayAccountInfo(obituaryEntity) {
        const accountsContainer = document.getElementById('accounts-container');
        const accountSection = document.getElementById('account-info-section');
        if (!accountsContainer || !accountSection) return;

        accountsContainer.innerHTML = '';
        let accountData = null;
        try {
            if (typeof obituaryEntity.additionalInfo === 'string' && obituaryEntity.additionalInfo.startsWith('{')) {
                const parsed = JSON.parse(obituaryEntity.additionalInfo);
                if (parsed.accountInfo) accountData = parsed.accountInfo;
            } else if (obituaryEntity.accountInfo) {
                accountData = obituaryEntity.accountInfo;
            }
        } catch (e) { console.warn('계좌 정보 파싱 오류', e); }

        if (accountData && accountData.bankName && accountData.accountNumber && accountData.holder) {
            const accDiv = document.createElement('div');
            accDiv.className = 'info-row account-display-row';
            accDiv.innerHTML = `
                <span class="info-label">${AppUtils.escapeHTML(accountData.bankName)}:</span>
                <span class="info-value" title="클릭하여 복사">
                    ${AppUtils.escapeHTML(accountData.accountNumber)} (예금주: ${AppUtils.escapeHTML(accountData.holder)})
                </span>`;
            accDiv.querySelector('.info-value').addEventListener('click', () => {
                AppUtils.copyToClipboard(`${accountData.bankName} ${accountData.accountNumber} ${accountData.holder}`);
            });
            accountsContainer.appendChild(accDiv);
            accountSection.style.display = '';
        } else {
            accountSection.style.display = 'none';
        }
    }

    function displayChiefMourners(bereavedArray) {
        const container = document.getElementById('bereaved-container');
        if (!container) return;
        container.innerHTML = '';
        if (bereavedArray && bereavedArray.length > 0) {
            bereavedArray.forEach(personVO => {
                const row = document.createElement('div');
                row.className = 'info-row';
                const label = document.createElement('span');
                label.className = 'info-label';
                label.textContent = AppUtils.escapeHTML(personVO.relationship) + ':';
                const value = document.createElement('span');
                value.className = 'info-value';
                value.textContent = AppUtils.escapeHTML(personVO.name);
                row.appendChild(label);
                row.appendChild(value);
                container.appendChild(row);
            });
        } else {
            container.innerHTML = '<div class="info-row"><span class="info-label">유족:</span><span class="info-value">정보가 없습니다</span></div>';
        }
    }

    function setupEventListeners() {
        document.getElementById('preview-button')?.addEventListener('click', handlePreview);
        document.getElementById('edit-button')?.addEventListener('click', handleEdit);
        document.getElementById('share-button')?.addEventListener('click', handleShare);
        document.getElementById('create-new-obituary-btn')?.addEventListener('click', handleCreateNew);
        document.getElementById('address-value')?.addEventListener('click', handleFindAddress);
        document.getElementById('view-map-btn')?.addEventListener('click', handleFindAddress);
        document.getElementById('go-etiquette-button')?.addEventListener('click', () => {
            window.location.href = 'etiquette.html';
        });

        // 날짜 수정 모달
        document.getElementById('edit-dates-button')?.addEventListener('click', openDatesModal);
        document.querySelectorAll('.close-dates-modal').forEach(el => {
            el.addEventListener('click', closeDatesModal);
        });
        document.getElementById('save-dates-button')?.addEventListener('click', saveDatesChanges);

        // 계좌 수정 모달
        document.getElementById('edit-account-button')?.addEventListener('click', openAccountModal);
        document.querySelectorAll('.close-account-modal').forEach(el => {
            el.addEventListener('click', closeAccountModal);
        });
        document.getElementById('add-account-btn')?.addEventListener('click', addAccountEntry);
        document.getElementById('saveAccountBtn')?.addEventListener('click', saveAccountChanges);

        // 감사장
        document.getElementById('edit-thanks-button')?.addEventListener('click', handleEditThanks);

        // 삭제 모달
        document.getElementById('confirm-delete-button')?.addEventListener('click', handleDeleteObituaryWithPassword);
        document.getElementById('cancel-delete-button')?.addEventListener('click', () => {
            AppUtils.closeModal('password-confirm-modal');
        });
        const closePasswordModalButton = document.querySelector('#password-confirm-modal .close-modal-button');
        if (closePasswordModalButton) {
            closePasswordModalButton.addEventListener('click', () => AppUtils.closeModal('password-confirm-modal'));
        }
    }

    // === 기본 핸들러 ===

    function handlePreview() {
        if (currentObituaryId) window.location.href = `preview.html?id=${currentObituaryId}`;
        else AppUtils.showToast('미리보기할 정보가 없습니다.');
    }

    function handleEdit() {
        if (currentObituaryId) {
            EditModeManager.setEditMode(currentObituaryId);
            window.location.href = 'write.html';
        } else {
            AppUtils.showToast('수정할 부고 정보가 없습니다.');
        }
    }

    function handleFindAddress() {
        const address = document.getElementById('address-value')?.textContent;
        if (address && address !== '-') {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(address)}`, '_blank');
        } else {
            AppUtils.showToast('검색할 주소 정보가 없습니다.');
        }
    }

    function handleShare() {
        if (!currentObituaryId) {
            AppUtils.showToast('공유할 부고 정보가 없습니다.');
            return;
        }
        const shareUrl = window.location.origin + `/preview.html?id=${currentObituaryId}`;
        const deceasedName = _currentObituaryEntity?.deceasedInfo?.name || '';
        const shareText = `故 ${deceasedName}님 부고`;

        if (navigator.share) {
            navigator.share({ title: shareText, url: shareUrl }).catch(() => {});
        } else {
            AppUtils.copyToClipboard(shareUrl);
            AppUtils.showToast('부고장 링크가 복사되었습니다.');
        }
    }

    function handleCreateNew() {
        EditModeManager.clearEditMode();
        window.location.href = 'write.html';
    }

    function handleEditThanks() {
        if (!currentObituaryId) {
            AppUtils.showToast('감사장을 수정할 부고가 없습니다.');
            return;
        }
        window.location.href = `thanks.html?id=${currentObituaryId}`;
    }

    // === 날짜 모달 핸들러 ===

    function openDatesModal() {
        if (!currentObituaryId || !_currentObituaryEntity) {
            AppUtils.showToast('수정할 부고 정보가 없습니다.');
            return;
        }
        const di = _currentObituaryEntity.deceasedInfo;
        const fi = _currentObituaryEntity.funeralInfo;

        const deathDateEl = document.getElementById('deathDate');
        const deathTimeEl = document.getElementById('deathTime');
        const coffinDateEl = document.getElementById('coffinDate');
        const coffinTimeEl = document.getElementById('coffinTime');
        const departureDateEl = document.getElementById('departureDate');
        const departureTimeEl = document.getElementById('departureTime');

        if (deathDateEl) deathDateEl.value = di.deathDate || '';
        if (deathTimeEl) deathTimeEl.value = di.deathTime || '';
        if (coffinDateEl) coffinDateEl.value = fi.coffinDate || '';
        if (coffinTimeEl) coffinTimeEl.value = fi.coffinTime || '';
        if (departureDateEl) departureDateEl.value = fi.departureDate || '';
        if (departureTimeEl) departureTimeEl.value = fi.departureTime || '';

        const modal = document.getElementById('datesEditModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeDatesModal() {
        const modal = document.getElementById('datesEditModal');
        if (modal) modal.style.display = 'none';
    }

    async function saveDatesChanges() {
        if (!currentObituaryId || !_currentObituaryEntity || !obituaryServiceInstance) {
            AppUtils.showToast('저장할 수 없습니다.');
            return;
        }

        const updatedData = {
            deceasedInfo: {
                deathDate: document.getElementById('deathDate')?.value || '',
                deathTime: document.getElementById('deathTime')?.value || ''
            },
            funeralInfo: {
                coffinDate: document.getElementById('coffinDate')?.value || '',
                coffinTime: document.getElementById('coffinTime')?.value || '',
                departureDate: document.getElementById('departureDate')?.value || '',
                departureTime: document.getElementById('departureTime')?.value || ''
            }
        };

        AppUtils.showLoading();
        try {
            await obituaryServiceInstance.updateObituary(currentObituaryId, updatedData);
            AppUtils.showToast('날짜 정보가 저장되었습니다.', 'success');
            closeDatesModal();
            await loadObituaryDetails(currentObituaryId);
        } catch (error) {
            console.error('날짜 저장 오류:', error);
            AppUtils.showToast('날짜 정보 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            AppUtils.hideLoading();
        }
    }

    // === 계좌 모달 핸들러 ===

    function openAccountModal() {
        if (!currentObituaryId || !_currentObituaryEntity) {
            AppUtils.showToast('수정할 부고 정보가 없습니다.');
            return;
        }

        const relationSelect = document.getElementById('relationship-select');
        const nameSelect = document.getElementById('name-select');
        if (relationSelect && _currentObituaryEntity.bereaved) {
            relationSelect.innerHTML = '<option value="" disabled selected>관계</option>';
            const relationships = new Set();
            _currentObituaryEntity.bereaved.forEach(p => {
                if (!relationships.has(p.relationship)) {
                    relationships.add(p.relationship);
                    const opt = document.createElement('option');
                    opt.value = p.relationship;
                    opt.textContent = p.relationship;
                    relationSelect.appendChild(opt);
                }
            });

            relationSelect.onchange = () => {
                const selected = relationSelect.value;
                nameSelect.innerHTML = '<option value="" disabled selected>이름</option>';
                nameSelect.disabled = false;
                _currentObituaryEntity.bereaved
                    .filter(p => p.relationship === selected)
                    .forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.name;
                        opt.textContent = p.name;
                        nameSelect.appendChild(opt);
                    });
            };
        }

        const modal = document.getElementById('accountEditModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeAccountModal() {
        const modal = document.getElementById('accountEditModal');
        if (modal) modal.style.display = 'none';
    }

    function addAccountEntry() {
        const relationship = document.getElementById('relationship-select')?.value;
        const name = document.getElementById('name-select')?.value;
        const bank = document.getElementById('bank-select')?.value;
        const accountNumber = document.getElementById('account-number-input')?.value?.trim();

        if (!relationship || !name || !bank || !accountNumber) {
            AppUtils.showToast('모든 항목을 입력해주세요.');
            return;
        }

        const listContainer = document.getElementById('account-list');
        if (!listContainer) return;

        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
            <div class="account-item-header">
                <span class="account-item-name">${AppUtils.escapeHTML(relationship)} - ${AppUtils.escapeHTML(name)}</span>
                <div class="account-buttons"><button class="account-delete-btn" title="삭제">&times;</button></div>
            </div>
            <div class="account-detail">
                <span class="account-bank">${AppUtils.escapeHTML(bank)}</span>
                <span class="account-number">${AppUtils.escapeHTML(accountNumber)}</span>
            </div>`;

        item.querySelector('.account-delete-btn').addEventListener('click', () => {
            item.remove();
            updateAccountCount();
        });
        listContainer.appendChild(item);
        updateAccountCount();

        document.getElementById('account-number-input').value = '';
        document.getElementById('bank-select').selectedIndex = 0;
    }

    function updateAccountCount() {
        const count = document.querySelectorAll('#account-list .account-item').length;
        const info = document.getElementById('account-count-info');
        if (info) info.textContent = `등록된 계좌: ${count}/10개`;
    }

    async function saveAccountChanges() {
        AppUtils.showToast('계좌 정보 저장 기능은 준비 중입니다.');
        closeAccountModal();
    }

    // === 삭제 핸들러 ===

    function openDeleteConfirmModal() {
        if (!currentObituaryId) {
            AppUtils.showToast('삭제할 부고 정보가 없습니다.');
            return;
        }
        const passwordInput = document.getElementById('delete-password-input');
        if (passwordInput) passwordInput.value = '';
        AppUtils.openModal('password-confirm-modal');
    }

    async function handleDeleteObituaryWithPassword() {
        if (!currentObituaryId) {
            AppUtils.showToast('삭제할 부고 ID가 없습니다.');
            return;
        }
        const passwordInput = document.getElementById('delete-password-input');
        const password = passwordInput ? passwordInput.value : null;

        if (!password || password.trim() === '') {
            AppUtils.showToast('삭제를 위해 비밀번호를 입력해주세요.', 'warning');
            passwordInput?.focus();
            return;
        }
        AppUtils.showLoading();
        try {
            const success = await obituaryServiceInstance.deleteObituary(currentObituaryId, password);
            if (success) {
                AppUtils.showToast('부고가 성공적으로 삭제되었습니다.', 'success');
                AppUtils.closeModal('password-confirm-modal');
                document.querySelector('.manage-container').innerHTML = '<p style="text-align:center; padding:20px;">부고가 삭제되었습니다.</p>';
                document.querySelectorAll('.manage-button:not(#create-new-obituary-btn)').forEach(button => {
                    button.disabled = true;
                });
                currentObituaryId = null;
                _currentObituaryEntity = null;
            } else {
                AppUtils.showToast('부고 삭제에 실패했습니다. 비밀번호를 확인해주세요.', 'error');
            }
        } catch (error) {
            console.error('부고 삭제 처리 중 오류:', error);
            AppUtils.showToast(error.message || '부고 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            AppUtils.hideLoading();
        }
    }

})();

