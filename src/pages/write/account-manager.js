import { AppUtils } from '../../common/utils.js';

/**
 * 계좌 관리 모듈
 * 부의금 계좌 관련 기능을 처리합니다.
 * 독립적으로 실행 가능한 버전
 */
// (function() { // IIFE 시작 부분 제거

// 계좌 정보 저장 배열
let accountList = [];

// 모듈 초기화 여부 추적
let isInitialized = false;

// 최대 계좌 개수 제한
const MAX_ACCOUNTS = 10;

// 은행 목록 정의
const bankList = [
    'KB국민은행',
    '신한은행',
    '우리은행',
    '하나은행',
    'NH농협은행',
    'IBK기업은행',
    'SC제일은행',
    '시티은행',
    '카카오뱅크',
    '토스뱅크',
    '케이뱅크',
    '우체국',
    '새마을금고',
    '신협'
];

// 모듈 초기화 함수
export function initAccountManager() { // export 추가
    // 이미 초기화된 경우 중복 실행 방지
    if (isInitialized) {
        console.log("계좌 관리 모듈이 이미 초기화되어 있습니다");
        return;
    }
    
    try {
        console.log("계좌 관리 모듈 초기화 중...");
        
        // DOM 요소 레퍼런스 가져오기
        const modal = document.getElementById('account-modal');
        const addBtn = document.querySelector('.add-account-btn');
        const closeBtn = modal?.querySelector('.modal-close');
        const saveBtn = modal?.querySelector('.save-account-btn');
        const bankSelect = document.getElementById('bank-select');
        const relationshipSelect = document.getElementById('relationship-select');
        const nameSelect = document.getElementById('name-select');
        const accountListContainer = document.getElementById('account-list');

        // DOM 요소 확인 및 로그 출력
        if (!modal || !addBtn || !bankSelect) {
            let missingElements = [];
            if (!modal) missingElements.push('계좌 모달');
            if (!addBtn) missingElements.push('계좌 추가 버튼');
            if (!bankSelect) missingElements.push('은행 선택 드롭다운');
            
            console.warn(`[계좌 관리] 필수 요소를 찾을 수 없습니다: ${missingElements.join(', ')}`);
            return; // 필수 요소가 없으면 초기화하지 않음
        }

        // 은행 목록 추가 (한 번만 수행)
        if (bankSelect.children.length <= 1) {
            initializeBankList(bankSelect, bankList);
        }

        // 관계 선택 시 이름 목록 업데이트 이벤트 (한 번만 등록)
        if (relationshipSelect) {
            relationshipSelect.addEventListener('change', function() {
                updateNameSelect(this.value);
            });
        }

        // 모달 열기 이벤트 설정 - 클릭 이벤트 재등록
        addBtn.onclick = function() {
            try {
                // 계좌 개수 제한 확인
                if (accountList.length >= MAX_ACCOUNTS) {
                    showToast(`최대 ${MAX_ACCOUNTS}개까지만 계좌를 등록할 수 있습니다.`);
                    return;
                }
                
                // 상주 정보 확인
                const relationshipGroups = getMournerOptions();
                if (Object.keys(relationshipGroups).length === 0) {
                    showToast('상주 정보가 없습니다. 먼저 상주 정보를 입력해주세요.');
                    return;
                }
                
                openAccountModal(relationshipSelect, nameSelect);
            } catch (error) {
                console.error('모달 열기 오류:', error);
                showToast(error.message || '계좌 정보 추가 중 오류가 발생했습니다.');
            }
        };

        // 모달 닫기 이벤트
        if (closeBtn) {
            closeBtn.onclick = closeAccountModal;
        }

        // 저장 버튼 클릭 시 계좌 정보 추가 이벤트
        if (saveBtn) {
            saveBtn.onclick = addAccountInfo;
        }

        // 폼 제출 이벤트 (폼이 있는 경우에만)
        const form = document.getElementById('obituaryForm');
        if (form) {
            // 폼 제출 시 계좌 정보 업데이트 (기존 이벤트 리스너 보존)
            const originalSubmit = form.onsubmit;
            form.onsubmit = function(event) {
                // 계좌 정보 폼 필드 업데이트
                updateAccountFormFields();
                
                // 기존 이벤트 핸들러 호출 (있는 경우)
                if (typeof originalSubmit === 'function') {
                    return originalSubmit.call(this, event);
                }
            };
        }
        
        // 기존 계좌 목록 렌더링 (있는 경우)
        renderAccountList();
        
        // 초기화 완료 표시
        isInitialized = true;
        console.log("계좌 관리 모듈 초기화 완료");
    } catch (error) {
        console.error('계좌 관리 모듈 초기화 오류:', error);
    }
}

// 모달 열기 호출 처리
function openAccountModal(relationshipSelect, nameSelect) {
    // 상주 정보 가져오기
    const relationshipGroups = getMournerOptions();
    
    if (Object.keys(relationshipGroups).length === 0) {
        throw new Error('상주 정보가 없습니다.');
    }
    
    // 관계 선택 옵션 초기화 및 추가
    if (relationshipSelect) {
        relationshipSelect.innerHTML = '<option value="" disabled selected>상주</option>';
        Object.keys(relationshipGroups).forEach(rel => {
            const option = document.createElement('option');
            option.value = rel;
            option.textContent = rel;
            relationshipSelect.appendChild(option);
        });
    }
    
    // 기본 이름 선택 옵션 초기화
    resetNameSelect(nameSelect);
    
    // 모달 표시
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 상주 정보 가져오기 
function getMournerOptions() {
    const mourners = document.querySelectorAll('.bereaved-entry');
    const relationshipGroups = {};
    
    mourners.forEach(mourner => {
        const relationshipSelect = mourner.querySelector('select[name="relationship[]"]');
        const customRelationInput = mourner.querySelector('.custom-relationship-input');
        const nameInput = mourner.querySelector('input[name="bereavedName[]"]');
        
        if (!relationshipSelect || !nameInput) return;
        
        let relationship = relationshipSelect.value;
        
        // 직접 기재인 경우 커스텀 값 사용
        if (relationship === '직접기재' && customRelationInput && customRelationInput.value) {
            relationship = customRelationInput.value;
        }
        
        const nameText = nameInput.value;
        
        if (!relationship || !nameText.trim()) return;
        
        // 관계 그룹이 없으면 생성
        if (!relationshipGroups[relationship]) {
            relationshipGroups[relationship] = [];
        }
        
        // 이름이 여러 명인 경우 (공백으로 구분된 경우) 처리
        const names = nameText.split(/\s+/).filter(name => name.trim());
        
        // 각 이름을 해당 관계 그룹에 추가
        names.forEach((name, index) => {
            relationshipGroups[relationship].push({
                name,
                index: names.length > 1 ? index + 1 : null,
                total: names.length > 1 ? names.length : null
            });
        });
    });
    
    // 옵션이 없는 경우 기본 옵션 추가 (페이지에 상주가 없는 경우)
    if (Object.keys(relationshipGroups).length === 0) {
        // 페이지 내에 상주 입력란이 없으면, 빈 객체 반환
        if (document.querySelectorAll('.bereaved-entry').length === 0) {
            return {};
        }
        
        relationshipGroups['상주'] = [{ name: '대표', index: null, total: null }];
    }
    
    return relationshipGroups;
}

// 은행 목록 초기화
function initializeBankList(bankSelect, bankList) {
    if (!bankSelect) return;
    
    bankSelect.innerHTML = '<option value="" disabled selected>은행 선택</option>';
    bankList.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank;
        option.textContent = bank;
        bankSelect.appendChild(option);
    });
}

// 계좌 모달 닫기
function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // 입력 필드 초기화
        const bankSelect = document.getElementById('bank-select');
        const relationshipSelect = document.getElementById('relationship-select');
        const nameSelect = document.getElementById('name-select');
        const accountNumber = document.getElementById('account-number');
        
        if (bankSelect) bankSelect.selectedIndex = 0;
        if (relationshipSelect) relationshipSelect.selectedIndex = 0;
        resetNameSelect(nameSelect);
        if (accountNumber) accountNumber.value = '';
    }
}

// 이름 선택 초기화
function resetNameSelect(nameSelect) {
    if (!nameSelect) return;
    
    nameSelect.innerHTML = '<option value="" disabled selected>이름 선택</option>';
    nameSelect.disabled = true;
}

// 관계 선택에 따른 이름 선택 업데이트
function updateNameSelect(relationship) {
    const nameSelect = document.getElementById('name-select');
    if (!nameSelect) return;
    
    // 이름 선택 초기화
    resetNameSelect(nameSelect);
    
    if (!relationship) return;
    
    try {
        // 상주 정보 가져오기
        const relationshipGroups = getMournerOptions();
        const names = relationshipGroups[relationship] || [];
        
        // 이름이 없는 경우
        if (names.length === 0) return;
        
        // 이름 옵션 추가
        nameSelect.disabled = false;
        
        names.forEach(nameObj => {
            if (!nameObj || !nameObj.name) return; // 빈 이름 건너뛰기
            
            const option = document.createElement('option');
            option.value = nameObj.name;
            
            // 여러 명인 경우 인덱스 표시
            if (nameObj.index !== null && nameObj.total !== null) {
                option.textContent = `${nameObj.name} (${nameObj.index}/${nameObj.total})`;
            } else {
                option.textContent = nameObj.name;
            }
            
            nameSelect.appendChild(option);
        });
        
        // 첫 번째 이름 자동 선택
        if (nameSelect.options.length > 1) {
            nameSelect.selectedIndex = 1;
        }
    } catch (error) {
        console.error('이름 선택 옵션 업데이트 오류:', error);
    }
}

// 계좌 정보 추가
function addAccountInfo() {
    try {
        // 계좌 개수 제한 확인
        if (accountList.length >= MAX_ACCOUNTS) {
            showToast(`최대 ${MAX_ACCOUNTS}개까지만 계좌를 등록할 수 있습니다.`);
            return;
        }

        const relationshipSelect = document.getElementById('relationship-select');
        const nameSelect = document.getElementById('name-select');
        const bankSelect = document.getElementById('bank-select');
        const accountNumber = document.getElementById('account-number');
        
        if (!relationshipSelect || !nameSelect || !bankSelect || !accountNumber) {
            showToast('계좌 정보 입력 필드를 찾을 수 없습니다.');
            return;
        }
        
        const relationship = relationshipSelect.value;
        const name = nameSelect.value;
        const bank = bankSelect.value;
        const accountNumberValue = accountNumber.value;

        if (!relationship || !name) {
            showToast('상주 관계와 이름을 선택해주세요.');
            return;
        }
        
        if (!bank || !accountNumberValue) {
            showToast('은행과 계좌번호를 모두 입력해주세요.');
            return;
        }

        // 계좌번호 형식 검사 (숫자와 하이픈만 허용)
        if (!/^[\d-]+$/.test(accountNumberValue)) {
            showToast('계좌번호는 숫자와 하이픈(-)만 입력 가능합니다.');
            return;
        }

        const mournerData = {
            relationship,
            name
        };

        const accountInfo = {
            mourner: mournerData,
            bank,
            accountNumber: accountNumberValue
        };

        // 중복 계좌 검사
        const isDuplicate = accountList.some(account => 
            account.bank === bank && 
            account.accountNumber === accountNumberValue
        );

        if (isDuplicate) {
            showToast('이미 등록된 계좌번호입니다.');
            return;
        }

        accountList.push(accountInfo);
        renderAccountList();
        closeAccountModal();
        
        // 계좌정보 폼 필드 값 설정 (폼 제출 시 사용)
        updateAccountFormFields();
        
        // 성공 메시지
        showToast('계좌 정보가 추가되었습니다.');
    } catch (error) {
        console.error('계좌 정보 저장 중 오류:', error);
        showToast('계좌 정보를 저장하는 도중 오류가 발생했습니다.');
    }
}

// 계좌 목록 렌더링
function renderAccountList() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // 계좌 개수 표시 추가
    const accountCountInfo = document.createElement('div');
    accountCountInfo.className = 'account-count-info';
    accountCountInfo.textContent = `등록된 계좌: ${accountList.length}/${MAX_ACCOUNTS}개`;
    listContainer.appendChild(accountCountInfo);
    
    if (accountList.length > 0) {
        accountList.forEach((account, index) => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-item';
            // 직접 인라인 스타일 적용
            accountItem.style.borderColor = '#4a90e2';
            accountItem.style.backgroundColor = '#f5f9ff';
            accountItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            
            const formattedNumber = formatAccountNumber(account.accountNumber);
            const esc = (AppUtils && AppUtils.escapeHTML) ? AppUtils.escapeHTML.bind(AppUtils) : (s => String(s));
            
            accountItem.innerHTML = `
                <button class="account-delete-btn" data-index="${index}">×</button>
                <div class="account-item-content">
                    <div class="account-item-name">
                        ${esc(account.mourner.name)} ${esc(account.mourner.relationship)}
                    </div>
                    <div class="account-detail">
                        <div class="account-info-wrapper">
                            <span class="account-bank">${esc(account.bank)}</span>
                            <span class="account-number" data-value="${esc(account.accountNumber)}">
                                ${esc(formattedNumber)}
                            </span>
                        </div>
                    </div>
                </div>
            `;

            // 삭제 버튼에 이벤트 리스너 직접 추가
            const deleteBtn = accountItem.querySelector('.account-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(deleteBtn.getAttribute('data-index'));
                removeAccountItem(idx);
            });
            
            listContainer.appendChild(accountItem);
        });
    }
    
    // 계좌 추가 버튼 활성화/비활성화
    const addBtn = document.querySelector('.add-account-btn');
    if (addBtn) {
        if (accountList.length >= MAX_ACCOUNTS) {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.6';
            addBtn.style.cursor = 'not-allowed';
            addBtn.title = `최대 ${MAX_ACCOUNTS}개까지만 계좌를 등록할 수 있습니다.`;
        } else {
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
            addBtn.title = '';
        }
    }
}

// 계좌 항목 제거
function removeAccountItem(index) {
    if (index < 0 || index >= accountList.length) return;
    
    try {
        // 확인 메시지
        if (confirm('이 계좌 정보를 삭제하시겠습니까?')) {
            accountList.splice(index, 1);
            renderAccountList();
            updateAccountFormFields();
            showToast('계좌 정보가 삭제되었습니다.');
            
            // 계좌 추가 버튼 활성화
            const addBtn = document.querySelector('.add-account-btn');
            if (addBtn && accountList.length < MAX_ACCOUNTS) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
                addBtn.style.cursor = 'pointer';
            }
        }
    } catch (error) {
        console.error('계좌 정보 삭제 중 오류:', error);
        showToast('계좌 정보를 삭제하는 도중 오류가 발생했습니다.');
    }
}

// 계좌번호 포맷팅
function formatAccountNumber(accountNumber) {
    if (!accountNumber) return '';
    
    // 하이픈이 포함된 경우 그대로 반환
    if (accountNumber.includes('-')) return accountNumber;
    
    // 숫자만 추출
    const numbers = accountNumber.replace(/\D/g, '');
    
    // 기본 포맷: 4자리마다 하이픈 추가
    const chunks = [];
    for (let i = 0; i < numbers.length; i += 4) {
        chunks.push(numbers.substr(i, 4));
    }
    
    return chunks.join('-');
}

// 계좌 정보 폼 필드 업데이트
function updateAccountFormFields() {
    try {
        // 계좌 정보 JSON 변환
        const accountDataJSON = JSON.stringify(accountList);
        
        // hidden 필드에 저장
        let accountDataField = document.getElementById('accountData');
        
        if (!accountDataField) {
            accountDataField = document.createElement('input');
            accountDataField.type = 'hidden';
            accountDataField.id = 'accountData';
            accountDataField.name = 'accountData';
            
            const form = document.getElementById('obituaryForm');
            if (form) {
                form.appendChild(accountDataField);
            }
        }
        
        if (accountDataField) {
            accountDataField.value = accountDataJSON;
        }
        
        // 계좌 개별 필드 (하위 호환성)
        const accountHolder = document.getElementById('account-holder');
        const bankName = document.getElementById('bank-name');
        const accountNumberField = document.getElementById('account-number-field');
        
        if (accountList.length > 0 && accountHolder && bankName && accountNumberField) {
            // 첫 번째 계좌 정보 사용
            const firstAccount = accountList[0];
            accountHolder.value = firstAccount.mourner.name || '';
            bankName.value = firstAccount.bank || '';
            accountNumberField.value = firstAccount.accountNumber || '';
        }
    } catch (error) {
        console.error('계좌 정보 폼 필드 설정 중 오류:', error);
    }
}

// 계좌 데이터 가져오기 (write-module.js에서 사용)
export function getAccountData() {
    return accountList.length > 0 ? [...accountList] : null;
}

// 계좌 데이터 채우기 (수정 모드에서 사용)
export function fillAccountData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    accountList = [...data];
    renderAccountList();
    updateAccountFormFields();
}

// 토스트 메시지 표시 (AppUtils 통일 사용)
function showToast(message, duration = 3000) {
    if (AppUtils && typeof AppUtils.showToast === 'function') {
        AppUtils.showToast(message, 'info', duration);
    } else {
        console.warn('[' + '계좌관리' + ']', message);
    }
}

// 클립보드에 복사 (폴백 함수)
function copyToClipboard(text) {
    try {
        // 최신 API 사용
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('계좌번호가 복사되었습니다.'))
                .catch(err => {
                    console.error('클립보드 복사 오류:', err);
                    fallbackCopyToClipboard(text);
                });
        } else {
            fallbackCopyToClipboard(text);
        }
    } catch (e) {
        console.error('클립보드 복사 오류:', e);
        if (window.AppUtils) AppUtils.showToast("클립보드 복사에 실패했습니다.", "error"); else console.error("클립보드 복사 실패");
    }
}

// 클립보드 복사 대체 방법
function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
            showToast('계좌번호가 복사되었습니다.');
        } else {
            throw new Error('복사 실패');
        }
    } catch (e) {
        document.body.removeChild(textarea);
        console.error('클립보드 대체 복사 오류:', e);
        if (window.AppUtils) AppUtils.showToast("클립보드 복사에 실패했습니다.", "error"); else console.error("클립보드 복사 실패");
    }
}

// 자동 초기화 제거 - write-module.js에서 initAccountManager() 호출로 초기화
