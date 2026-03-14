/**
 * 메시지 템플릿 모듈
 * 상주 말씀 템플릿과 관련 기능을 관리합니다.
 */

// 메시지 템플릿 데이터
const messageTemplates = {
    '일반': [
        "부고 소식을 전하게 되어 마음이 무겁습니다.\n개별적으로 연락드리지 못한 점 너그러이 양해 부탁드리며,\n아래와 같이 장례 일정을 안내드립니다.",
        
        "고인의 마지막 길을 함께해주시길 바라는 마음으로\n조심스럽게 부고를 전합니다.\n마음으로 함께해주시면 큰 위로가 되겠습니다.",
        
        "갑작스럽게 전하는 소식에 송구한 마음입니다.\n부디 너그러이 헤아려주시고,\n고인을 기억해주시면 감사하겠습니다.",
        
        "안타까운 소식을 전하게 되어 마음이 아픕니다.\n장례 절차를 아래와 같이 안내드리오니,\n함께 추모해주시길 부탁드립니다.",
        
        "바쁘신 중에 죄송한 말씀을 전합니다.\n고인의 명복을 빌어주시고 따뜻한 마음으로 함께해주시면\n큰 힘이 되겠습니다."
    ],
    '격식': [
        "삼가 부고를 올립니다.\n깊은 슬픔 속에 장례를 준비하고 있으며,\n아래와 같이 일정을 정중히 알려드립니다.",
        
        "고인을 애도해주시기를 부탁드리며,\n아래와 같이 장례 일정을 알려드리오니\n너른 마음으로 함께해주시길 바랍니다.",
        
        "유가족을 대신하여 조심스럽게 부고를 전합니다.\n바쁘시겠지만 함께 자리해주시면 감사하겠습니다.",
        
        "고인의 마지막 길을 정중히 모시고자 하오니,\n일정 확인하시어 마음을 나눠주시길 청합니다.",
        
        "부족한 저희를 대신해 고인의 명복을 빌어주시고\n함께해주신다면 큰 위로가 되겠습니다."
    ],
    '기독교': [
        "주님의 부르심을 받아 고인이 소천하셨기에\n믿음 안에서 장례를 치르고자 합니다.\n함께 기도해주시고 마음을 모아주시면 감사하겠습니다.",
        
        "하나님의 은혜 안에서 평안히 떠나신 고인의\n마지막 길에 함께해주시길 부탁드립니다.",
        
        "믿음으로 살아오신 고인의 삶을 기억하며\n주 안에서 장례를 준비하고자 합니다.\n기도로 함께해주시길 바랍니다.",
        
        "주님의 품에 안기신 고인의 장례 일정을\n아래와 같이 안내드리오니,\n함께 기도해주시길 청합니다.",
        
        "하나님 안에서 안식하신 고인을 위해\n기도로 함께해주신다면 큰 힘이 되겠습니다."
    ],
    '천주교': [
        "하느님의 품에 안기신 고인을 위하여\n장례 미사와 절차를 아래와 같이 준비하고 있습니다.\n기도와 애도의 마음으로 함께해주시길 바랍니다.",
        
        "고인이 하느님의 부르심을 받으셨기에\n정중히 장례를 모시고자 합니다.\n너그러이 마음을 모아주시길 부탁드립니다.",
        
        "조심스럽게 부고를 전합니다.\n주님의 자비와 은총 안에서 장례를 진행할 예정입니다.",
        
        "미사와 기도로 고인을 함께 보내주시면\n큰 위로가 되겠습니다.\n아래 일정 참고 부탁드립니다.",
        
        "하느님의 은총 아래 고인을 위한 장례를 준비 중입니다.\n마음으로 함께해주시면 감사하겠습니다."
    ],
    '불교': [
        "고인이 열반의 길로 나아가고자 하오니\n극락왕생을 함께 기도해주시면 감사하겠습니다.\n장례 일정은 아래와 같습니다.",
        
        "인연 따라 이승의 삶을 마무리하신 고인을 위해\n정중히 장례를 준비하고 있습니다.\n마음으로 함께해주시길 바랍니다.",
        
        "고인을 위한 장례를 조용히 준비하고 있습니다.\n함께 명복을 빌어주시고 마음을 나눠주시면 감사하겠습니다.",
        
        "삼가 부고를 전합니다.\n장례 일정을 아래와 같이 알려드리오니\n함께 기도해주시길 부탁드립니다.",
        
        "불교의식에 따라 장례를 준비하고 있습니다.\n고인의 극락왕생을 기원해주시길 바랍니다."
    ],
    '가족장': [
        "고인의 뜻에 따라 가족끼리 조용히 장례를 모시고자 합니다.\n개별 연락을 드리지 못한 점 널리 양해 부탁드립니다.",
        
        "소박한 가족장으로 고인을 보내드릴 예정입니다.\n마음으로 함께해주시면 더없는 위로가 될 것입니다.",
        
        "가족 중심으로 장례를 준비하고 있어\n조심스럽게 부고를 전합니다.\n따뜻한 마음으로 기억해주시길 바랍니다.",
        
        "고인의 생전 뜻을 따라 조용히 장례를 진행하고자 하오니\n정중히 양해 부탁드립니다.",
        
        "조용히 이별을 준비하고 있습니다.\n함께하지는 못하시더라도\n마음으로 애도해주시면 감사하겠습니다."
    ],
    '무빈소': [
        "고인의 뜻에 따라 빈소는 따로 마련하지 않습니다.\n조문은 정중히 사양드리며, 마음으로 함께해주시면 감사하겠습니다.",
        
        "장례는 무빈소로 진행될 예정입니다.\n너그러이 이해해주시고, 고인을 기억해주시면 감사하겠습니다.",
        
        "조용한 이별을 원하셨기에\n빈소 없이 장례를 준비하고 있습니다.\n마음으로 애도해주시길 부탁드립니다.",
        
        "부득이하게 무빈소 장례를 준비하고 있어\n안내로 대신 인사드리오니 양해 부탁드립니다.",
        
        "조문은 어렵지만, 마음으로 함께해주신다면\n큰 위로가 될 것입니다.\n부고 소식을 전해드립니다."
    ],
    '해외': [
        "고인은 해외에서 별세하셨으며,\n현지에서 장례를 진행할 예정입니다.\n조심스럽게 부고를 전합니다.",
        
        "머나먼 곳에서 고인의 이별을 준비하고 있습니다.\n함께하지는 못하시더라도 따뜻한 마음 부탁드립니다.",
        
        "해외 체류 중 별세하셨기에\n현지 장례를 진행할 예정입니다.\n너른 양해를 부탁드립니다.",
        
        "멀리서 전하는 안타까운 소식입니다.\n고인을 위한 마음만으로도 큰 위로가 됩니다.\n감사한 마음으로 안내드립니다.",
        
        "장례는 해외에서 조용히 진행될 예정입니다.\n함께하시진 못하지만, 고인의 평안을 빌어주시면 감사하겠습니다."
    ],
    '간소장': [
        "고인의 바람에 따라 간소하게 장례를 준비하고 있습니다.\n마음으로 함께해주시길 부탁드립니다.",
        
        "절차를 간소화하였지만, 정성은 다하고자 합니다.\n부고를 전하오니 따뜻한 애도를 부탁드립니다.",
        
        "조용한 이별을 준비하며\n간소하게 장례를 모시려 합니다.\n넓은 마음으로 이해해주시길 바랍니다.",
        
        "간소장으로 진행되는 점 양해 부탁드리며\n마음으로 함께해주시면 감사하겠습니다.",
        
        "간결한 절차 속에서도 고인의 삶을 기억하고자 합니다.\n조용히 애도해주시면 큰 힘이 되겠습니다."
    ]
};

// 모듈 초기화 여부 및 이벤트 리스너 등록 여부 추적
let isModuleInitialized = false;
let areMessageEventsBound = false; // window.messageEventsInitialized 대체

// 메시지 템플릿 초기화 함수
export function initMessageTemplates() { // export 추가
    if (isModuleInitialized) {
        console.log("메시지 템플릿 모듈이 이미 초기화되어 있습니다");
        return;
    }
    try {
        console.log("메시지 템플릿 초기화 중...");
        activateDirectInput(); // 초기 모드 설정
        
        if (!areMessageEventsBound) { // 이벤트 중복 방지
            document.querySelectorAll('.msg-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const type = this.getAttribute('data-type');
                    handleMessageTypeSelection(type, this);
                });
            });
            
            const customMessageEl = document.getElementById('custom-message');
            if (customMessageEl) {
                customMessageEl.addEventListener('input', handleCustomMessageInput);
            }
            
            const closeBtn = document.querySelector('#message-modal .modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeMessageModal);
            }
            
            const messageModal = document.getElementById('message-modal');
            if (messageModal) {
                messageModal.addEventListener('click', function(e) {
                    if (e.target === this) closeMessageModal();
                });
            }
            areMessageEventsBound = true; // 이벤트 등록됨 표시
        }
        addMessageStyles(); // 스타일 동적 추가
        isModuleInitialized = true;
        console.log("메시지 템플릿 초기화 완료");
    } catch (error) {
        console.error("메시지 템플릿 초기화 중 오류 발생:", error);
    }
}

// 메시지 유형 버튼 클릭 처리
function handleMessageTypeSelection(type, clickedButton) {
    document.querySelectorAll('.msg-btn').forEach(b => b.classList.remove('active'));
    if(clickedButton) clickedButton.classList.add('active');
    
    const selectedMessageEl = document.getElementById('selected-message');
    const customMessageEl = document.getElementById('custom-message');

    if (type === '직접') {
        if (selectedMessageEl && customMessageEl) {
            customMessageEl.value = selectedMessageEl.textContent || '';
            customMessageEl.classList.remove('hidden');
            selectedMessageEl.classList.add('hidden'); // 직접 입력 시에는 미리보기 숨김
            customMessageEl.focus();
            updateHiddenFields('직접', customMessageEl.value);
        }
    } else if (messageTemplates[type]) {
        if (customMessageEl) customMessageEl.classList.add('hidden');
        if (selectedMessageEl) selectedMessageEl.classList.remove('hidden');
        showMessageModal(type);
    } else {
        // 타입이 '직접'도 아니고 템플릿도 없는 경우 (예: 초기화 시 타입만 넘어온 경우)
        if (customMessageEl) customMessageEl.classList.add('hidden');
        if (selectedMessageEl) selectedMessageEl.classList.remove('hidden');
        // 기본 메시지나 빈 값으로 selectedMessageEl 업데이트
        // selectedMessageEl.textContent = "메시지를 선택하거나 직접 입력해주세요."; 
    }
}

// 직접 입력 텍스트 영역 input 이벤트 처리
function handleCustomMessageInput() {
    const selectedMessageEl = document.getElementById('selected-message');
    if (selectedMessageEl) {
        // 직접 입력 중일 때는 selected-message를 업데이트하지 않거나, 
        // 아니면 custom-message와 동일하게 업데이트 후 숨김 처리 유지.
        // 여기서는 업데이트 후 숨김 처리 유지 (handleMessageTypeSelection과 일관성)
        selectedMessageEl.textContent = this.value;
        updateHiddenFields('직접', this.value);
    }
}

// 외부에서 메시지 설정하는 함수
export function setMessageData(type, content) { // export 추가
    console.log(`[MessageTemplates] setMessageData 호출됨: type=${type}, content=${content}`);
    const customMessageEl = document.getElementById('custom-message');
    const selectedMessageEl = document.getElementById('selected-message');

    // 모든 버튼 비활성화 후 해당 타입 버튼만 활성화
    document.querySelectorAll('.msg-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.type === type) {
            b.classList.add('active');
        }
    });

    if (type === '직접') {
        if (customMessageEl) {
            customMessageEl.value = content || '';
            customMessageEl.classList.remove('hidden');
        }
        if (selectedMessageEl) {
            selectedMessageEl.textContent = content || '';
            selectedMessageEl.classList.add('hidden'); // 직접 입력 타입이면 숨김
        }
    } else { // 직접 입력이 아닌 다른 템플릿 타입
        if (customMessageEl) {
            customMessageEl.classList.add('hidden');
            customMessageEl.value = ''; // 다른 타입 선택 시 직접 입력 내용은 초기화
        }
        if (selectedMessageEl) {
            selectedMessageEl.textContent = content || '';
            selectedMessageEl.classList.remove('hidden'); // 템플릿 선택 시에는 미리보기 보임
        }
    }
    updateHiddenFields(type, content || '');
}

// 직접 입력 모드 활성화 (초기 호출용)
function activateDirectInput() {
    try {
        console.log("직접 입력 모드 활성화 중...");
        
        // 모든 버튼 비활성화
        document.querySelectorAll('.msg-btn').forEach(b => b.classList.remove('active'));
        
        // 직접 버튼 활성화 - 강제로 active 클래스 적용
        const directButton = document.querySelector('.msg-btn[data-type="직접"]');
        if (directButton) {
            directButton.classList.add('active');
            console.log("직접 버튼 활성화됨");
        } else {
            console.warn("직접 버튼을 찾을 수 없음");
        }
        
        // 직접 입력 영역 표시
        const customMessage = document.getElementById('custom-message');
        const selectedMessage = document.getElementById('selected-message');
        
        if (customMessage && selectedMessage) {
            // 기본 메시지 설정
            const defaultMessage = "부고 소식을 전하게 되어 마음이 무겁습니다.\n개별적으로 연락드리지 못한 점 너그러이 양해 부탁드리며,\n아래와 같이 장례 일정을 안내드립니다.";
            
            // 기본 메시지를 표시하고 직접 입력 영역 활성화
            selectedMessage.textContent = defaultMessage;
            selectedMessage.classList.remove('hidden');
            
            customMessage.value = defaultMessage;
            customMessage.classList.remove('hidden');
            
            // 폼 제출 시 사용할 히든 필드에도 값 저장
            updateHiddenFields('직접', defaultMessage);
            console.log("직접 입력 필드 초기화 완료");
        } else {
            console.warn("메시지 필드를 찾을 수 없음");
        }
    } catch (error) {
        console.error("직접 입력 모드 활성화 중 오류:", error);
    }
}

// (displayRandomMessage는 현재 사용되지 않는 것으로 보이므로 그대로 두거나 필요시 수정/삭제)
function displayRandomMessage() {
    try {
        // 모든 메시지 유형 중 '직접' 제외
        const messageTypes = Object.keys(messageTemplates).filter(type => type !== '직접');
        
        // 랜덤하게 메시지 유형 선택
        const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        
        // 선택된 유형에서 랜덤 메시지 선택
        const messagesForType = messageTemplates[randomType];
        const randomMessage = messagesForType[Math.floor(Math.random() * messagesForType.length)];
        
        // 메시지 표시
        const selectedMessage = document.getElementById('selected-message');
        if (selectedMessage) {
            selectedMessage.textContent = randomMessage;
            selectedMessage.classList.remove('hidden');
        }
        
        // 해당 버튼 활성화
        const button = document.querySelector(`.msg-btn[data-type="${randomType}"]`);
        if (button) {
            button.classList.add('active');
        }
        
        // 폼 제출 시 사용할 히든 필드에 값 저장
        updateHiddenFields(randomType, randomMessage);
    } catch (error) {
        console.error("랜덤 메시지 표시 중 오류 발생:", error);
    }
}

// 선택된 메시지 타입과 내용을 숨겨진 필드에 저장
function updateHiddenFields(type, message) {
    const messageTypeField = document.getElementById('message-type');
    const messageContentField = document.getElementById('message-content');
    
    if (messageTypeField && messageContentField) {
        messageTypeField.value = type;
        messageContentField.value = message;
    }
}

// 메시지 선택 모달 표시
function showMessageModal(type) {
    const modal = document.getElementById('message-modal');
    const messageList = modal.querySelector('.message-list');
    messageList.innerHTML = '';
    
    messageTemplates[type].forEach(message => {
        const div = document.createElement('div');
        div.className = 'message-option';
        div.textContent = message;
        div.addEventListener('click', () => {
            selectMessage(message, type);
            closeMessageModal();
        });
        messageList.appendChild(div);
    });
    
    modal.classList.add('active');
    modal.style.display = 'block';
}

// 메시지 선택 함수 - 타입 파라미터 추가
function selectMessage(message, type) {
    const selectedMessage = document.getElementById('selected-message');
    if (selectedMessage) {
        selectedMessage.textContent = message;
        selectedMessage.classList.remove('hidden');
        
        // 히든 필드 업데이트
        updateHiddenFields(type, message);
    }
}

// 모달 닫기 함수
function closeMessageModal() {
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// 메시지 관련 스타일 동적 추가
function addMessageStyles() {
    const additionalStyles = `
    /* 기존 스타일 유지 ... */

    /* 모달 스타일 개선 */
    .message-modal-content {
        max-width: 90%;
        width: 600px;
        max-height: 80vh;
        padding: 25px;
        background: #fff;
        border-radius: 15px;
        position: relative;
        margin: 20px auto;
    }

    .message-list {
        max-height: calc(80vh - 100px);
        overflow-y: auto;
        padding: 15px 5px;
    }

    .message-option {
        padding: 20px;
        background: #f8f8f8;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 10px;
        white-space: pre-line;
        line-height: 1.6;
        font-size: 15px;
    }

    /* 반응형 모달 스타일 */
    @media (max-width: 768px) {
        .message-modal-content {
            width: 95%;
            padding: 20px;
            margin: 10px auto;
        }

        .message-list {
            padding: 10px 0;
        }

        .message-option {
            padding: 15px;
            font-size: 14px;
            margin-bottom: 8px;
        }
    }

    @media (max-width: 480px) {
        .message-modal-content {
            width: 98%;
            padding: 15px;
            margin: 5px auto;
        }

        .message-list {
            max-height: 70vh;
        }

        .message-option {
            padding: 12px;
            font-size: 13px;
            margin-bottom: 6px;
            line-height: 1.5;
        }
    }

    /* 모달 닫기 버튼 스타일 */
    .modal-close {
        position: absolute;
        right: 15px;
        top: 15px;
        width: 30px;
        height: 30px;
        background: #f0f0f0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        border: none;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: #e0e0e0;
        transform: scale(1.1);
    }

    @media (max-width: 480px) {
        .modal-close {
            width: 25px;
            height: 25px;
            font-size: 16px;
            right: 10px;
            top: 10px;
        }
    }
    `;

    // 중복 방지를 위해 기존 스타일 태그 확인
    const existingStyle = document.getElementById('message-template-styles');
    if (existingStyle) {
        existingStyle.textContent = additionalStyles; // 기존 태그가 있으면 내용 교체
        return;
    }

    const styleTag = document.createElement('style');
    styleTag.id = 'message-template-styles';
    styleTag.textContent = additionalStyles;
    document.head.appendChild(styleTag);
}

// 전역 노출 코드 및 자동 초기화 제거 (파일 끝의 IIFE 닫는 괄호와 전역 노출 객체 삭제)
// (No more code after addMessageStyles function, ensure IIFE closing and global exposures are removed) 