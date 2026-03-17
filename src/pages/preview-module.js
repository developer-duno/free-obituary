// src/preview-module.js
// import { ObituaryService } from './application/ObituaryService.js'; // 전역 서비스 사용
// import { ObituaryRepository } from './infrastructure/ObituaryRepository.js'; // 전역 서비스 사용
import { AppUtils, EditModeManager } from '../common/utils.js';
import { appConfig } from '../config/app.config.js';

(function() {
    "use strict";




    /** S6: 안전한 JSON 파싱 (스키마 검증 포함) */
    function safeParseJSON(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') return null;
        try {
            const parsed = JSON.parse(jsonString);
            if (typeof parsed !== 'object' || parsed === null) return null;
            return parsed;
        } catch (e) {
            console.warn('JSON 파싱 오류:', e);
            return null;
        }
    }


    /** A4: 모달 포커스 트랩 */
    function trapFocusInModal(modalElement) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = modalElement.querySelectorAll(focusableSelectors);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        first.focus();
        
        function handler(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
            if (e.key === 'Escape') {
                const modalId = modalElement.id || modalElement.closest('[id]')?.id;
                if (modalId) closeModalById(modalId);
            }
        }
        modalElement._focusTrapHandler = handler;
        modalElement.addEventListener('keydown', handler);
    }

    function releaseFocusTrap(modalElement) {
        if (modalElement._focusTrapHandler) {
            modalElement.removeEventListener('keydown', modalElement._focusTrapHandler);
            delete modalElement._focusTrapHandler;
        }
    }

    let obituaryServiceInstance; // 전역 서비스 인스턴스
    let currentObituaryId = null;
    // let currentObituaryData = null; // Entity 직접 사용

    document.addEventListener('DOMContentLoaded', async function() {

        // 서비스 인스턴스 가져오기
        if (window.appServices && window.appServices.obituaryService) {
            obituaryServiceInstance = window.appServices.obituaryService;
        } else {
            console.error("ObituaryService를 window.appServices에서 찾을 수 없습니다.");
            AppUtils.showToast("페이지 로딩 심각한 오류 [P00_Srv]"); return;
        }

        if (!AppUtils) {
            console.error("AppUtils 모듈을 찾을 수 없습니다. (preview-module)");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const rawId = urlParams.get('id');
        currentObituaryId = AppUtils.isValidObituaryId(rawId) ? rawId : null;

        if (currentObituaryId) {
            AppUtils.showLoading();
            try {
                const obituaryEntity = await obituaryServiceInstance.getObituaryById(currentObituaryId);
                if (obituaryEntity) {
                    // Phase 2: 자동 만료 체크
                    if (obituaryEntity.isExpired && obituaryEntity.isExpired(appConfig.OBITUARY_EXPIRY_DAYS || 7)) {
                        AppUtils.setText('obituary-content', '이 부고는 발인일로부터 일정 기간이 경과하여 비공개 처리되었습니다.', true);
                        AppUtils.showToast('만료된 부고입니다.', 'info');
                        return;
                    }
                    displayObituaryData(obituaryEntity); // Entity 인스턴스 전달
                    await updateViewCount(currentObituaryId); // 조회수는 별도로 ID로 업데이트
                    setupEventListeners(obituaryEntity); // Entity 데이터 기반으로 이벤트 설정 가능
                } else {
                    AppUtils.setText('obituary-content', '부고 정보를 찾을 수 없습니다.', true);
                    AppUtils.showToast("부고 정보를 찾을 수 없습니다. [P02]");
                }
            } catch (error) {
                console.error("부고 정보 로드 오류 (preview-module):", error);
                AppUtils.setText('obituary-content', '부고 정보를 불러오는 중 오류가 발생했습니다.', true);
                AppUtils.showToast(`부고 정보 로드 오류: ${error.message} [P03]`, 5000);
            } finally {
                AppUtils.hideLoading();
            }
        } else {
            AppUtils.setText('obituary-content', '잘못된 접근입니다. 부고 ID가 없습니다.', true);
            AppUtils.showToast("잘못된 접근입니다. [P04]");
        }
    });

    async function updateViewCount(obituaryId) {
        if (!obituaryServiceInstance) return;
        try {
            await obituaryServiceInstance.incrementViewCount(obituaryId);
        } catch (error) {
            console.error('조회수 업데이트 오류 (preview-module):', error);
        }
    }
    
    function displayObituaryData(obituaryEntity) { // Obituary Entity를 인자로 받음
        if (!obituaryEntity || !AppUtils) return;

        const deceasedInfo = obituaryEntity.deceasedInfo;
        const funeralInfo = obituaryEntity.funeralInfo;

        document.title = `부고장: ${deceasedInfo.name || '고인'}님`;
        
        // K3: 동적 OG 태그 업데이트
        updateMetaTags(obituaryEntity);
        // K7: JSON-LD 구조화 데이터 주입
        injectJsonLd(obituaryEntity);
        
        if (obituaryEntity.selectedTemplate && AppUtils.applyTemplateFromSessionOrParam) {
            AppUtils.applyTemplateFromSessionOrParam(obituaryEntity.selectedTemplate);
        }

        const portraitImg = document.getElementById('portrait-image');
        const portraitContainer = document.getElementById('portrait-container');
        if (obituaryEntity.portraitImage && portraitImg && portraitContainer) {
            portraitImg.src = obituaryEntity.portraitImage;
            portraitContainer.style.display = 'block';
        } else if (portraitContainer) {
            portraitContainer.style.display = 'none';
        }
        
        // 부고 메시지 처리 (additionalInfo에서 파싱 또는 Entity에 message 필드 가정)
        let messageToDisplay = `삼가 고인의 명복을 빕니다.\n\n${deceasedInfo.name}님께서 별세하셨기에\n아래와 같이 부고를 전해드립니다.`;
        try {
            if (typeof obituaryEntity.additionalInfo === 'string' && obituaryEntity.additionalInfo.startsWith('{')){
                 const parsedAdditional = safeParseJSON(obituaryEntity.additionalInfo);
                 if(parsedAdditional && parsedAdditional.messageTemplate) messageToDisplay = parsedAdditional.messageTemplate;
            } else if (obituaryEntity.messageContent) { // 만약 Entity에 직접 messageContent가 있다면
                messageToDisplay = obituaryEntity.messageContent;
            }
        } catch(e) { console.warn("메시지 내용 파싱 오류", e);}
        AppUtils.setText('obituary-text-content', messageToDisplay);

        let deceasedTitleText = deceasedInfo.title || '';
        if (deceasedTitleText && !deceasedTitleText.endsWith('님')) deceasedTitleText += ' ';
        const hanjaText = deceasedInfo.nameHanja ? '(' + AppUtils.escapeHTML(deceasedInfo.nameHanja) + ')' : '';
        AppUtils.setText('deceased-name', `故 ${deceasedTitleText}${deceasedInfo.name || ''}${hanjaText}`);
        
        let deceasedAgeText = deceasedInfo.age ? `향년 ${deceasedInfo.age}세` : '';
        if (deceasedInfo.gender) {
            const genderText = deceasedInfo.gender === 'male' ? '남' : deceasedInfo.gender === 'female' ? '여' : deceasedInfo.gender;
            deceasedAgeText += deceasedAgeText ? ` (${genderText})` : `(${genderText})`;
        }
        AppUtils.setText('deceased-age', deceasedAgeText);

        const bereavedContainer = document.getElementById('bereaved-list');
        if (bereavedContainer) {
            bereavedContainer.innerHTML = '';
            if (obituaryEntity.bereaved && obituaryEntity.bereaved.length > 0) {
                obituaryEntity.bereaved.forEach(personVO => { // BereavedPerson VO 사용
                    const item = document.createElement('div');
                    item.className = 'bereaved-item';
                    item.innerHTML = `<span class="bereaved-relationship">${AppUtils.escapeHTML(personVO.relationship || '')}:</span> <span class="bereaved-name">${AppUtils.escapeHTML(personVO.name || '')}</span>`;
                    bereavedContainer.appendChild(item);
                });
            } else {
                bereavedContainer.innerHTML = '<p>유가족 정보가 없습니다.</p>';
            }
        }
        
        let funeralHallText = funeralInfo.funeralHallName || '';
        if (funeralInfo.room) {
            funeralHallText += funeralHallText ? ` ${funeralInfo.room}` : funeralInfo.room;
        }
        AppUtils.setText('funeral-hall-name', funeralHallText || '-');
        AppUtils.setText('funeral-hall-phone', funeralInfo.funeralHallPhone || '-');
        AppUtils.setText('funeral-hall-address', funeralInfo.funeralHallAddress || '-');
        
        const mapButton = document.getElementById('view-map-button');
        if(mapButton && funeralInfo.funeralHallAddress) {
            mapButton.style.display = 'inline-block';
            mapButton.onclick = () => findAddressOnMap(funeralInfo.funeralHallAddress);
        } else if (mapButton) {
            mapButton.style.display = 'none';
        }
        const copyAddressButton = document.getElementById('copy-address-button');
        if (copyAddressButton && funeralInfo.funeralHallAddress) {
            copyAddressButton.style.display = 'inline-block';
            copyAddressButton.onclick = () => AppUtils.copyToClipboard(funeralInfo.funeralHallAddress, '주소가 복사되었습니다.');
        } else if (copyAddressButton) {
            copyAddressButton.style.display = 'none';
        }

        AppUtils.setText('death-date-time', AppUtils.formatDateTimeDetailed(deceasedInfo.deathDate, deceasedInfo.deathTime, true, !!deceasedInfo.deathTime) || '-');
        
        const coffinDateTimeEl = document.getElementById('coffin-date-time');
        const coffinRow = coffinDateTimeEl ? coffinDateTimeEl.closest('.info-row-preview') : null;
        if (funeralInfo.coffinDate) {
            if(coffinDateTimeEl) AppUtils.setText('coffin-date-time', AppUtils.formatDateTimeDetailed(funeralInfo.coffinDate, funeralInfo.coffinTime, true, !!funeralInfo.coffinTime) || '-');
            if(coffinRow) coffinRow.style.display = 'flex';
        } else {
            if(coffinRow) coffinRow.style.display = 'none';
        }
        AppUtils.setText('departure-date-time', AppUtils.formatDateTimeDetailed(funeralInfo.departureDate, funeralInfo.departureTime, true, !!funeralInfo.departureTime) || '-');

        // Phase 1: 발인일시 강조 표시
        const highlightEl = document.getElementById('departure-highlight');
        if (highlightEl && funeralInfo.departureDate) {
            const dtText = AppUtils.formatDateTimeDetailed(
                funeralInfo.departureDate, funeralInfo.departureTime, true, !!funeralInfo.departureTime
            );
            AppUtils.setText('departure-highlight-datetime', dtText);
            const placeText = funeralInfo.funeralHallName
                ? funeralInfo.funeralHallName + (funeralInfo.room ? ' ' + funeralInfo.room : '')
                : '';
            if (placeText) AppUtils.setText('departure-highlight-place', placeText);
            highlightEl.style.display = 'block';
        }
        AppUtils.setText('cemetery-info', funeralInfo.cemetery || '-');
        AppUtils.setText('additional-guidance', obituaryEntity.messageContent || '-');

        // 계좌 정보 표시 (단일 객체 + 배열 모두 지원)
        const accountInfoContainer = document.getElementById('account-info-display');
        const accountListDiv = document.getElementById('account-list-display');
        if (accountInfoContainer && accountListDiv) {
            accountListDiv.innerHTML = '';
            let accountList = [];
            try {
                const rawAccount = obituaryEntity.accountInfo;
                if (Array.isArray(rawAccount)) {
                    accountList = rawAccount;
                } else if (rawAccount && typeof rawAccount === 'object' && rawAccount.bankName) {
                    accountList = [rawAccount];
                } else if (typeof obituaryEntity.additionalInfo === 'string' && obituaryEntity.additionalInfo.trim().startsWith('{')) {
                    const parsedAdditional = safeParseJSON(obituaryEntity.additionalInfo);
                    if (parsedAdditional && parsedAdditional.accountInfo) {
                        accountList = Array.isArray(parsedAdditional.accountInfo)
                            ? parsedAdditional.accountInfo
                            : [parsedAdditional.accountInfo];
                    }
                }
            } catch (e) { console.warn('계좌 정보 파싱 오류 (preview)', e); }

            const validAccounts = accountList.filter(a => a && a.bankName && a.accountNumber && a.holder);
            if (validAccounts.length > 0) {
                validAccounts.forEach(acc => {
                    const accDiv = document.createElement('div');
                    accDiv.className = 'account-item-preview';
                    const labelHtml = acc.label ? `<span class="account-label-preview">${AppUtils.escapeHTML(acc.label)}</span> ` : '';
                    accDiv.innerHTML = `
                        ${labelHtml}<span class="account-bank-preview">${AppUtils.escapeHTML(acc.bankName)}</span>
                        <span class="account-number-preview">${AppUtils.escapeHTML(acc.accountNumber)}</span>
                        <span class="account-holder-preview">(${AppUtils.escapeHTML(acc.holder)})</span>
                        <button class="account-copy-btn" type="button" aria-label="계좌번호 복사">복사</button>`;
                    const copyBtn = accDiv.querySelector('.account-copy-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            AppUtils.copyToClipboard(`${acc.bankName} ${acc.accountNumber} (${acc.holder})`);
                        });
                    }
                    accountListDiv.appendChild(accDiv);
                });
                accountInfoContainer.style.display = 'block';
            } else {
                accountInfoContainer.style.display = 'none';
            }
        }
        
        // 연락처 정보 (대표 상주 위주)
        const contactInfoSection = document.getElementById('contact-info-section');
        const contactInfoDiv = document.getElementById('contact-info-display');
        const contactDivider = document.getElementById('contactDivider');
        if (contactInfoDiv && obituaryEntity.bereaved && obituaryEntity.bereaved.length > 0) {
            contactInfoDiv.innerHTML = ''; 
            let representativeContactRendered = false;
            // BereavedPerson VO의 isRepresentative, phone 속성 사용
            const representative = obituaryEntity.bereaved.find(b => b.isRepresentative && b.phone) || 
                                 obituaryEntity.bereaved.find(b => b.phone);
            
            if(representative) {
                 const contactP = document.createElement('p');
                 contactP.innerHTML = `연락처: ${AppUtils.escapeHTML(representative.relationship)} ${AppUtils.escapeHTML(representative.name)} <a href="tel:${AppUtils.escapeHTML(representative.phone)}">${AppUtils.escapeHTML(representative.phone)}</a>`;
                 contactInfoDiv.appendChild(contactP);
                 representativeContactRendered = true;
            }
            if (representativeContactRendered) {
                if(contactInfoSection) contactInfoSection.style.display = 'block';
                if(contactDivider) contactDivider.style.display = 'block';
            } else {
                if(contactInfoSection) contactInfoSection.style.display = 'none';
                if(contactDivider) contactDivider.style.display = 'none';
            }
        } else {
            if(contactInfoSection) contactInfoSection.style.display = 'none';
            if(contactDivider) contactDivider.style.display = 'none';
        }

        // 근조화환 표시
        renderWreathOrders(obituaryEntity);

        // 조회수 표시
        renderViewCount(obituaryEntity.viewCount || 0);

        // Phase 1: 감사장 보내기 버튼 (발인일 경과 시 표시)
        const thanksBtn = document.getElementById('send-thanks-button');
        if (thanksBtn && funeralInfo.departureDate) {
            try {
                const depDateStr = typeof funeralInfo.departureDate === 'string'
                    ? funeralInfo.departureDate.replace(/[-.]/g, '/')
                    : funeralInfo.departureDate;
                const depDate = new Date(depDateStr);
                if (!isNaN(depDate.getTime()) && new Date() > depDate) {
                    thanksBtn.style.display = 'block';
                }
            } catch (e) { /* 날짜 파싱 실패 시 버튼 숨김 유지 */ }
        }

        // 방명록 표시
        renderGuestbookEntries(obituaryEntity);
    }

    function renderViewCount(count) {
        const viewCountDisplay = document.getElementById('view-count-display');
        const viewCountNumber = document.getElementById('view-count-number');
        if (viewCountDisplay && viewCountNumber) {
            viewCountNumber.textContent = (count + 1).toString();
            viewCountDisplay.style.display = 'block';
        }
    }

    function renderWreathOrders(obituaryEntity) {
        const wreathSection = document.getElementById('wreath-display-section');
        const wreathListDiv = document.getElementById('wreath-list-display');
        const wreathDivider = document.getElementById('wreathDivider');

        if (!wreathSection || !wreathListDiv) return;

        wreathListDiv.innerHTML = '';
        const wreathOrders = obituaryEntity.wreathOrders || [];
        const maxDisplay = appConfig.MAX_WREATH_DISPLAY || 50;
        const displayOrders = wreathOrders
            .filter(o => o.status !== 'cancelled')
            .slice(0, maxDisplay);

        if (displayOrders.length > 0) {
            const sectionTitle = wreathSection.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '보내주신 근조화환 <span class="wreath-count-badge">' + displayOrders.length + '</span>';
            }

            displayOrders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'wreath-item';

                let messageHtml = '';
                if (order.senderMessage) {
                    messageHtml = '<div class="wreath-item-message">' + AppUtils.escapeHTML(order.senderMessage) + '</div>';
                }

                item.innerHTML =
                    '<span class="wreath-item-icon">&#127800;</span>' +
                    '<div class="wreath-item-info">' +
                        '<div class="wreath-item-type">' + AppUtils.escapeHTML(order.wreathType) + '</div>' +
                        '<div class="wreath-item-sender">' + AppUtils.escapeHTML(order.senderName) + '</div>' +
                        messageHtml +
                    '</div>';

                wreathListDiv.appendChild(item);
            });

            wreathSection.style.display = 'block';
            if (wreathDivider) wreathDivider.style.display = 'block';
        } else {
            wreathSection.style.display = 'none';
            if (wreathDivider) wreathDivider.style.display = 'none';
        }
    }

    function setupEventListeners(obituaryEntity) { // Entity 데이터를 받아 활용 가능
        if (!AppUtils || !obituaryEntity) return;

        document.getElementById('edit-obituary-button')?.addEventListener('click', openEditModal);
        document.getElementById('share-obituary-button')?.addEventListener('click', openShareModal);
        document.getElementById('verify-password-button')?.addEventListener('click', () => handleVerifyPassword(obituaryEntity.id));
        
        document.getElementById('share-kakao-button')?.addEventListener('click', () => handleShareKakao(obituaryEntity));
        document.getElementById('share-sms-button')?.addEventListener('click', () => handleShareSms(obituaryEntity));
        document.getElementById('copy-link-button')?.addEventListener('click', handleCopyLink);
        document.getElementById('share-band-button')?.addEventListener('click', () => handleShareBand(obituaryEntity));
        document.getElementById('share-qr-button')?.addEventListener('click', () => handleShowQR());
        document.getElementById('qr-download-btn')?.addEventListener('click', handleDownloadQR);
        document.getElementById('qr-modal-overlay')?.addEventListener('click', () => closeModalById('qr-code-modal'));
        document.getElementById('send-thanks-button')?.addEventListener('click', () => {
            window.location.href = `thanks.html?id=${encodeURIComponent(obituaryEntity.id)}`;
        });
        
        document.getElementById('toggle-account-button')?.addEventListener('click', toggleAccountDisplay);
        document.getElementById('order-wreath-button')?.addEventListener('click', () => handleOrderWreath(obituaryEntity));
        document.getElementById('guestbook-submit-btn')?.addEventListener('click', () => handleAddGuestbookEntry(obituaryEntity));
        
        // 키보드 접근성: role="button" 요소에 Enter/Space 활성화
        function addKeyboardActivation(el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        }

        // 공유 버튼 키보드 지원
        document.querySelectorAll('.share-button[role="button"]').forEach(addKeyboardActivation);

        const closeButtons = document.querySelectorAll('.close-modal-button');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modalToClose = btn.closest('.modal-preview');
                if (modalToClose && modalToClose.id) closeModalById(modalToClose.id);
            });
            addKeyboardActivation(btn);
        });
        
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', function(event) {
                const targetModalId = this.dataset.modalId || this.nextElementSibling?.id;
                if (targetModalId && document.getElementById(targetModalId)?.classList.contains('modal-preview')){
                     closeModalById(targetModalId);
                } else if (this.id === 'share-modal-overlay') {
                    closeModalById('share-options-modal');
                }
            });
        });
    }

    function findAddressOnMap(address) { if (address && address !== '-') window.open(`https://map.naver.com/v5/search/${encodeURIComponent(address)}`, '_blank'); }
    function toggleAccountDisplay() { const accInfo = document.getElementById('account-info-display'); if(accInfo) accInfo.style.display = accInfo.style.display === 'none' ? 'block' : 'none'; }
    function openModalById(modalId) { const modal = document.getElementById(modalId); if(modal) { modal.style.display='flex'; trapFocusInModal(modal); } }
    function closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if(modal) { modal.style.display='none'; releaseFocusTrap(modal); }
        if (modalId === 'qr-code-modal') {
            const overlay = document.getElementById('qr-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    function openEditModal() { const modal = document.getElementById('edit-password-modal'); if(modal) { document.getElementById('edit-password-input').value = ''; openModalById('edit-password-modal'); } }
    function openShareModal() { openModalById('share-options-modal'); }
    async function handleVerifyPassword(obituaryId) { /* ObituaryService.verifyAndGetObituary 사용 */ 
        const password = document.getElementById('edit-password-input').value;
        if (!password) { AppUtils.showToast('비밀번호를 입력하세요.', 'warning'); return; }
        AppUtils.showLoading();
        try {
            const verifiedObituary = await obituaryServiceInstance.verifyAndGetObituary(obituaryId, password);
            if (verifiedObituary) {
                AppUtils.showToast('비밀번호 확인 완료. 수정 페이지로 이동합니다.', 'success');
                EditModeManager.setEditMode(obituaryId);
                window.location.href = 'write.html';
            } else {
                AppUtils.showToast('비밀번호가 일치하지 않습니다.', 'error');
            }
        } catch (e) { AppUtils.showToast(`확인 오류: ${e.message}`, 'error'); } finally { AppUtils.hideLoading(); closeModalById('edit-password-modal'); }
    }
    function handleOrderWreath(obituaryEntity) {
        const vendorUrl = appConfig.WREATH_VENDOR_URL;
        if (!vendorUrl) {
            AppUtils.showToast('근조화환 주문 서비스를 준비 중입니다.', 'info');
            return;
        }

        try {
            const url = new URL(vendorUrl);
            const paramKey = appConfig.WREATH_VENDOR_PARAM_KEY || 'obituaryId';
            url.searchParams.set(paramKey, obituaryEntity.id);
            if (obituaryEntity.deceasedInfo && obituaryEntity.deceasedInfo.name) {
                url.searchParams.set('deceasedName', obituaryEntity.deceasedInfo.name);
            }
            if (obituaryEntity.funeralInfo && obituaryEntity.funeralInfo.funeralHallName) {
                url.searchParams.set('funeralHall', obituaryEntity.funeralInfo.funeralHallName);
            }
            window.open(url.toString(), '_blank');
        } catch (e) {
            window.open(vendorUrl, '_blank');
        }
    }

    /** K7: JSON-LD 구조화 데이터 주입 */
    function injectJsonLd(obituaryEntity) {
        const deceasedName = obituaryEntity.deceasedInfo?.name || '';
        const funeralHall = obituaryEntity.funeralInfo?.funeralHallName || '';
        const funeralAddress = obituaryEntity.funeralInfo?.funeralHallAddress || '';
        const shareUrl = window.location.href;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: '故 ' + deceasedName + '님 장례',
            description: '삼가 고인의 명복을 빕니다.',
            url: shareUrl,
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
        };

        if (funeralHall || funeralAddress) {
            jsonLd.location = {
                '@type': 'Place',
                name: funeralHall,
                address: funeralAddress
            };
        }

        // 기존 JSON-LD 제거 후 새로 삽입
        const existing = document.querySelector('script[type="application/ld+json"]');
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
    }

    /** K3: 동적 OG 태그 주입 */
    function updateMetaTags(obituaryEntity) {
        const deceasedName = obituaryEntity.deceasedInfo?.name || '고인';
        const funeralHall = obituaryEntity.funeralInfo?.funeralHallName || '';
        const shareUrl = window.location.href;
        
        const title = '부고 - 故 ' + deceasedName + '님';
        const description = funeralHall 
            ? '장례식장: ' + funeralHall + ' | 삼가 고인의 명복을 빕니다.'
            : '삼가 고인의 명복을 빕니다.';
        const imageUrl = obituaryEntity.portraitImage || 'thumbnail.jpg';

        // OG 태그 업데이트
        setMetaContent('og:title', title);
        setMetaContent('og:description', description);
        setMetaContent('og:image', imageUrl);
        setMetaContent('og:url', shareUrl);
        
        // Twitter Card 태그 추가
        setMetaContent('twitter:card', 'summary');
        setMetaContent('twitter:title', title);
        setMetaContent('twitter:description', description);
        setMetaContent('twitter:image', imageUrl);
        
        // 일반 메타 태그
        setMetaContent('description', description, 'name');
    }

    function setMetaContent(key, value, attrName) {
        attrName = attrName || 'property';
        let el = document.querySelector('meta[' + attrName + '="' + key + '"]');
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attrName, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    }

    function getShareLink() { return window.location.href; }
    function handleShareKakao(obituaryEntity) {
        const shareUrl = getShareLink();
        const deceasedName = obituaryEntity.deceasedInfo?.name || '고인';
        const funeralHall = obituaryEntity.funeralInfo?.funeralHallName || '';

        // Kakao SDK 초기화 (한 번만)
        if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
            // 카카오 앱 키는 window.__APP_CONFIG__에서 주입하거나 기본값 사용
            const kakaoAppKey = (window.__APP_CONFIG__ && window.__APP_CONFIG__.KAKAO_APP_KEY) || '';
            if (kakaoAppKey) {
                Kakao.init(kakaoAppKey);
            }
        }

        if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
            try {
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: '부고 - 故 ' + deceasedName + '님',
                        description: funeralHall ? '장례식장: ' + funeralHall : '삼가 고인의 명복을 빕니다.',
                        imageUrl: obituaryEntity.portraitImage || '',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl
                        }
                    },
                    buttons: [{
                        title: '부고장 보기',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl
                        }
                    }]
                });
            } catch (e) {
                console.error('카카오 공유 오류:', e);
                // 폴백: 카카오톡 스킴으로 공유
                fallbackKakaoShare(shareUrl, deceasedName);
            }
        } else {
            // SDK 미로드 또는 앱키 미설정 시 폴백
            fallbackKakaoShare(shareUrl, deceasedName);
        }
    }

    function fallbackKakaoShare(shareUrl, deceasedName) {
        const text = encodeURIComponent('부고 - 故 ' + deceasedName + '님\n' + shareUrl);
        // 모바일이면 카카오톡 스킴, 아니면 클립보드 복사
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            window.location.href = 'kakaotalk://msg?text=' + text;
            setTimeout(function() {
                // 카카오톡 앱이 없으면 클립보드 복사로 폴백
                AppUtils.copyToClipboard(shareUrl);
                AppUtils.showToast('카카오톡 앱이 설치되지 않았습니다. 링크가 복사되었습니다.');
            }, 1500);
        } else {
            AppUtils.copyToClipboard(shareUrl);
            AppUtils.showToast('링크가 클립보드에 복사되었습니다. 카카오톡에 붙여넣어 공유하세요.');
        }
    }
    function handleShareSms(obituaryEntity) {
        const shareUrl = getShareLink();
        const deceasedName = obituaryEntity.deceasedInfo?.name || '고인';
        const funeralHall = obituaryEntity.funeralInfo?.funeralHallName || '';
        
        let body = '부고 - 故 ' + deceasedName + '님';
        if (funeralHall) body += '\n장례식장: ' + funeralHall;
        body += '\n\n' + shareUrl;

        // SMS URI 스킴 (iOS: sms:&body=, Android: sms:?body=)
        const separator = /iPhone|iPad/i.test(navigator.userAgent) ? '&' : '?';
        const smsUrl = 'sms:' + separator + 'body=' + encodeURIComponent(body);
        
        window.location.href = smsUrl;
    }
    function handleCopyLink() { AppUtils.copyToClipboard(getShareLink()); }
    function handleShareBand(obituaryEntity) {
        const shareUrl = getShareLink();
        const deceasedName = obituaryEntity.deceasedInfo?.name || '고인';
        const body = '부고 - 故 ' + deceasedName + '님';
        const bandUrl = 'https://band.us/plugin/share?body='
            + encodeURIComponent(body + '
' + shareUrl)
            + '&route=' + encodeURIComponent(shareUrl);
        window.open(bandUrl, '_blank');
    }
    function handleShowQR() {
        const shareUrl = getShareLink();
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(canvas, shareUrl, {
                width: 240,
                margin: 2,
                color: { dark: '#333333', light: '#ffffff' }
            }, function(error) {
                if (error) {
                    console.error('QR코드 생성 오류:', error);
                    AppUtils.showToast('QR코드 생성에 실패했습니다.', 'error');
                    return;
                }
                closeModalById('share-options-modal');
                openModalById('qr-code-modal');
                const overlay = document.getElementById('qr-modal-overlay');
                if (overlay) overlay.style.display = 'block';
            });
        } else {
            AppUtils.showToast('QR코드 라이브러리를 로드할 수 없습니다.', 'error');
        }
    }
    function handleDownloadQR() {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'obituary-qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        AppUtils.showToast('QR코드 이미지가 저장되었습니다.', 'success');
    }
    function renderGuestbookEntries(obituaryEntity) {
        const guestbookList = document.getElementById('guestbook-list');
        const guestbookEmpty = document.getElementById('guestbook-empty');
        const guestbookDivider = document.getElementById('guestbookDivider');
        const guestbookSection = document.getElementById('guestbook-section');

        if (!guestbookList || !guestbookSection) return;

        const entries = obituaryEntity.guestbookEntries || [];
        
        // Update section title with count
        const sectionTitle = guestbookSection.querySelector('.section-title');
        if (sectionTitle && entries.length > 0) {
            sectionTitle.innerHTML = '조문 메시지 <span class="guestbook-entry-count">' + entries.length + '개</span>';
        }

        // Clear existing entries (keep empty state element)
        const existingEntries = guestbookList.querySelectorAll('.guestbook-entry');
        existingEntries.forEach(el => el.remove());

        if (entries.length > 0) {
            if (guestbookEmpty) guestbookEmpty.style.display = 'none';
            if (guestbookDivider) guestbookDivider.style.display = 'block';
            
            // Show newest first
            const sortedEntries = [...entries].reverse();
            sortedEntries.forEach(entry => {
                const el = document.createElement('div');
                el.className = 'guestbook-entry';
                
                const relText = entry.relationship ? ' <span class="guestbook-relationship">' + AppUtils.escapeHTML(entry.relationship) + '</span>' : '';
                const timeText = formatGuestbookTime(entry.createdAt);
                
                el.innerHTML = 
                    '<div class="guestbook-entry-header">' +
                        '<span class="guestbook-author">' + AppUtils.escapeHTML(entry.authorName) + '</span>' +
                        relText +
                        '<span class="guestbook-time">' + timeText + '</span>' +
                    '</div>' +
                    '<div class="guestbook-message">' + AppUtils.escapeHTML(entry.message) + '</div>';
                
                guestbookList.appendChild(el);
            });
        } else {
            if (guestbookEmpty) guestbookEmpty.style.display = 'block';
            if (guestbookDivider) guestbookDivider.style.display = 'none';
        }
    }

    function formatGuestbookTime(dateInput) {
        if (!dateInput) return '';
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const h = date.getHours();
        const min = String(date.getMinutes()).padStart(2, '0');
        return m + '/' + d + ' ' + h + ':' + min;
    }

    async function handleAddGuestbookEntry(obituaryEntity) {
        const authorInput = document.getElementById('guestbook-author');
        const relInput = document.getElementById('guestbook-relationship');
        const msgInput = document.getElementById('guestbook-message');
        
        if (!authorInput || !msgInput) return;
        
        const authorName = authorInput.value.trim();
        const relationship = relInput ? relInput.value.trim() : '';
        const message = msgInput.value.trim();

        if (!authorName) {
            AppUtils.showToast('이름을 입력해주세요.', 'warning');
            authorInput.focus();
            return;
        }
        if (!message) {
            AppUtils.showToast('메시지를 입력해주세요.', 'warning');
            msgInput.focus();
            return;
        }

        const guestbookService = window.appServices && window.appServices.guestbookService;
        if (!guestbookService) {
            AppUtils.showToast('서비스 오류가 발생했습니다.', 'error');
            return;
        }

        try {
            const updatedObituary = await guestbookService.addGuestbookEntry(currentObituaryId, {
                authorName: authorName,
                relationship: relationship,
                message: message
            });

            // Clear form
            authorInput.value = '';
            if (relInput) relInput.value = '';
            msgInput.value = '';

            // Re-render
            renderGuestbookEntries(updatedObituary);
            AppUtils.showToast('조문 메시지가 등록되었습니다.', 'success');
        } catch (e) {
            AppUtils.showToast(e.message || '메시지 등록 중 오류가 발생했습니다.', 'error');
        }
    }

})(); 