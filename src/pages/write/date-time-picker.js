/**
 * 날짜 및 시간 선택 모듈
 * 부고장 작성 시 날짜와 시간 입력을 위한 기능을 제공합니다.
 * 모바일 환경 최적화
 */

let isInitialized = false;

// 요일 배열
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

// 모듈 초기화 함수 - export하여 외부에서 사용
export function initDateTimePickers() { // 전역 호출되던 이름 initDateTimePickers로 변경
    if (isInitialized) {
        console.log("날짜 시간 선택 모듈이 이미 초기화되어 있습니다");
        return;
    }
    if (typeof flatpickr === 'undefined') {
        console.warn("flatpickr 라이브러리가 로드되지 않았습니다. 날짜 선택기를 초기화할 수 없습니다.");
        return;
    }
    try {
        console.log("날짜 시간 선택 모듈 초기화 중...");
        initializeDatePickers();
        initializeTimePickers();
        setInitialDateValues();
        setInitialTimeValues();
        setupValidation();
        updateSectionTitle();
        isInitialized = true;
        console.log("날짜 시간 선택 모듈 초기화 완료");
    } catch (error) {
        console.error("날짜 시간 선택 모듈 초기화 중 오류 발생:", error);
    }
}

/**
 * 섹션 제목 업데이트
 */
function updateSectionTitle() {
    // 날짜 관련 섹션 제목 찾기
    const sectionTitles = document.querySelectorAll('h2');
    
    sectionTitles.forEach(title => {
        if (title.textContent === '임종일*') {
            // 첫 번째 날짜 섹션을 찾음 (임종일 -> 임종 입관 발인)
            title.textContent = '임종 입관 발인';
            
            // 다음에 오는 날짜 섹션들 숨기기
            let nextTitle = title.nextElementSibling;
            while (nextTitle) {
                if (nextTitle.tagName === 'H2' && 
                    (nextTitle.textContent === '입관일' || 
                     nextTitle.textContent === '발인일*')) {
                    // 섹션 제목과 그 다음 요소(내용) 숨기기
                    nextTitle.style.display = 'none';
                    
                    // 내용도 숨기기
                    let content = nextTitle.nextElementSibling;
                    if (content && content.className === 'date-time-group') {
                        content.style.display = 'none';
                    }
                } else if (nextTitle.tagName === 'H2' && nextTitle.textContent !== '입관일' && nextTitle.textContent !== '발인일*') {
                    // 다른 섹션 제목이 나오면 중단
                    break;
                }
                nextTitle = nextTitle.nextElementSibling;
            }
            
            // 레이블 변경
            updateFieldLabels();
        }
    });
}

/**
 * 필드 레이블 업데이트
 */
function updateFieldLabels() {
    const deathDateGroup = document.querySelector('.date-time-group');
    if (deathDateGroup) {
        deathDateGroup.innerHTML = `
            <!-- 임종일시 행 -->
            <div class="date-time-inline-row">
                <div class="field-label">임종일시 <span class="required-mark">*</span></div>
                <div class="inline-input-container">
                    <input type="text" id="death-date" name="death-date" aria-label="임종 날짜" class="date-input date-time-input" required>
                    <input type="text" id="death-time" name="death-time" aria-label="임종 시간" class="time-input date-time-input" required>
                </div>
            </div>
            
            <!-- 입관일시 행 -->
            <div class="date-time-inline-row">
                <div class="field-label">입관일시</div>
                <div class="inline-input-container">
                    <input type="text" id="coffin-date" name="coffin-date" aria-label="입관 날짜" class="date-input date-time-input">
                    <input type="text" id="coffin-time" name="coffin-time" aria-label="입관 시간" class="time-input date-time-input">
                </div>
            </div>
            
            <!-- 발인일시 행 -->
            <div class="date-time-inline-row">
                <div class="field-label">발인일시 <span class="required-mark">*</span></div>
                <div class="inline-input-container">
                    <input type="text" id="departure-date" name="departure-date" aria-label="발인 날짜" class="date-input date-time-input" required>
                    <input type="text" id="departure-time" name="departure-time" aria-label="발인 시간" class="time-input date-time-input" required>
                </div>
            </div>
        `;
    }
}

/**
 * 모든 날짜 필드에 flatpickr 적용
 */
function initializeDatePickers() {
    const dateFields = [
        {
            id: 'death-date',
            title: '임종날짜',
            required: true,
            defaultDate: new Date()
        },
        {
            id: 'coffin-date',
            title: '입관일시',
            required: false,
            defaultDate: getTomorrow()
        },
        {
            id: 'departure-date',
            title: '발인일시',
            required: true,
            defaultDate: getNextDayAfterTomorrow()
        }
    ];
    
    // 공통 flatpickr 옵션
    const commonOptions = {
        locale: 'ko',
        dateFormat: 'Y년 m월 d일 (D)',
        disableMobile: true,
        allowInput: true,
        static: true,
        monthSelectorType: 'static',
        minDate: getOneMonthAgo(),
        maxDate: getThreeMonthsLater()
    };
    
    // 각 날짜 필드에 flatpickr 적용
    dateFields.forEach(field => {
        const dateInput = document.getElementById(field.id);
        if (!dateInput) return;
        
        const options = {
            ...commonOptions,
            defaultDate: field.defaultDate
        };
        
        // flatpickr 인스턴스 생성
        const picker = flatpickr(dateInput, options);
        
        // 날짜 변경 시 연관 업데이트
        dateInput.addEventListener('change', function() {
            // 임종일 변경 시 다른 날짜 업데이트
            if (field.id === 'death-date') {
                updateRelatedDates('death');
            }
            // 입관일 변경 시 발인일 업데이트
            else if (field.id === 'coffin-date') {
                updateRelatedDates('coffin');
            }
        });
    });
}

/**
 * 관련 날짜 필드 업데이트
 */
function updateRelatedDates(changedField) {
    const deathDate = document.getElementById('death-date');
    const coffinDate = document.getElementById('coffin-date');
    const departureDate = document.getElementById('departure-date');
    
    if (!deathDate || !coffinDate || !departureDate) return;
    
    // 임종일 변경 시
    if (changedField === 'death' && deathDate.value) {
        const deathValue = parseKoreanDateToDate(deathDate.value);
        
        // 입관일 업데이트 (임종일 이후로)
        if (coffinDate.value) {
            const coffinValue = parseKoreanDateToDate(coffinDate.value);
            if (coffinValue < deathValue) {
                // flatpickr 인스턴스 찾기
                const coffinPicker = coffinDate._flatpickr;
                if (coffinPicker) {
                    coffinPicker.setDate(deathValue);
                }
            }
        }
        
        // 발인일 업데이트 (임종일 이후로)
        if (departureDate.value) {
            const departureValue = parseKoreanDateToDate(departureDate.value);
            if (departureValue < deathValue) {
                // 임종일 다음날로 설정
                const nextDay = new Date(deathValue);
                nextDay.setDate(nextDay.getDate() + 1);
                
                // flatpickr 인스턴스 찾기
                const departurePicker = departureDate._flatpickr;
                if (departurePicker) {
                    departurePicker.setDate(nextDay);
                }
            }
        }
    }
    
    // 입관일 변경 시
    else if (changedField === 'coffin' && coffinDate.value) {
        const coffinValue = parseKoreanDateToDate(coffinDate.value);
        
        // 발인일 업데이트 (입관일 이후로)
        if (departureDate.value) {
            const departureValue = parseKoreanDateToDate(departureDate.value);
            if (departureValue < coffinValue) {
                // 입관일 다음날로 설정
                const nextDay = new Date(coffinValue);
                nextDay.setDate(nextDay.getDate() + 1);
                
                // flatpickr 인스턴스 찾기
                const departurePicker = departureDate._flatpickr;
                if (departurePicker) {
                    departurePicker.setDate(nextDay);
                }
            }
        }
    }
}

/**
 * 한국어 날짜 문자열을 Date 객체로 변환
 */
function parseKoreanDateToDate(koreanDateStr) {
    // '2025년 03월 25일 (화)' 형식에서 숫자만 추출
    const match = koreanDateStr.match(/(\d{4})년\s+(\d{2})월\s+(\d{2})일/);
    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript 월은 0-11
        const day = parseInt(match[3]);
        return new Date(year, month, day);
    }
    return new Date(); // 실패 시 현재 날짜 반환
}

/**
 * 초기 날짜 값 설정
 */
function setInitialDateValues() {
    // 날짜 필드
    const fields = [
        { dateId: 'death-date', defaultDate: new Date() },
        { dateId: 'coffin-date', defaultDate: getTomorrow() },
        { dateId: 'departure-date', defaultDate: getNextDayAfterTomorrow() }
    ];
    
    fields.forEach(field => {
        const dateInput = document.getElementById(field.dateId);
        
        if (dateInput && !dateInput.value) {
            // flatpickr가 이미 적용되었으므로 인스턴스를 통해 설정
            if (dateInput._flatpickr) {
                dateInput._flatpickr.setDate(field.defaultDate);
            } else {
                dateInput.value = formatKoreanDate(field.defaultDate);
            }
        }
    });
}

/**
 * 유효성 검증 설정
 */
function setupValidation() {
    // 폼 제출 시 날짜 유효성 검증
    const form = document.getElementById('obituaryForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        // 임종일 검증
        const deathDate = document.getElementById('death-date');
        
        if (deathDate && deathDate.required && !deathDate.value) {
            e.preventDefault();
            showError('임종일을 입력해주세요.');
            deathDate.focus();
            return false;
        }
        
        // 발인일 검증
        const departureDate = document.getElementById('departure-date');
        
        if (departureDate && departureDate.required && !departureDate.value) {
            e.preventDefault();
            showError('발인일을 입력해주세요.');
            departureDate.focus();
            return false;
        }
        
        return true;
    });
}

// ===== 유틸리티 함수 =====

/**
 * 내일 날짜 가져오기
 */
function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

/**
 * 모레 날짜 가져오기
 */
function getNextDayAfterTomorrow() {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);
    return nextDay;
}

/**
 * 1개월 전 날짜 가져오기
 */
function getOneMonthAgo() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return oneMonthAgo;
}

/**
 * 3개월 후 날짜 가져오기
 */
function getThreeMonthsLater() {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return threeMonthsLater;
}

/**
 * 날짜 객체를 한국어 형식으로 변환 (YYYY년 MM월 DD일 (요일))
 */
function formatKoreanDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

/**
 * 오류 메시지 표시
 */
function showError(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        if (window.AppUtils) AppUtils.showToast(message, "warning"); else console.warn(message);
    }
}

/**
 * 날짜와 시간 포맷팅 함수
 */
function formatDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    
    try {
        if (timeStr) {
            return `${dateStr} ${timeStr}`;
        }
        
        return dateStr;
    } catch (error) {
        console.error('날짜 시간 포맷팅 오류:', error);
        return dateStr + (timeStr ? ` ${timeStr}` : '');
    }
}

/**
 * 시간 선택기 초기화
 */
function initializeTimePickers() {
    // 기본 시간 구하기 (현재 시간)
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = Math.floor(now.getMinutes() / 10) * 10; // 10분 단위로 반올림
    const currentTime = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
    
    // 시간 필드 설정 (각 필드별 다른 범위와 간격)
    const timeFields = [
        { 
            id: 'death-time', 
            defaultTime: currentTime,
            hoursRange: { min: 0, max: 23 },
            minutesInterval: 10
        },
        { 
            id: 'coffin-time', 
            defaultTime: '09:00',
            hoursRange: { min: 9, max: 19 },
            minutesInterval: 10
        },
        { 
            id: 'departure-time', 
            defaultTime: '07:00',
            hoursRange: { min: 5, max: 17 },
            minutesInterval: 15
        }
    ];
    
    // 각 시간 필드에 선택기 적용
    timeFields.forEach(field => {
        const timeInput = document.getElementById(field.id);
        if (!timeInput) return;
        
        // 필드 설정 저장
        timeInput.dataset.hoursMin = field.hoursRange.min;
        timeInput.dataset.hoursMax = field.hoursRange.max;
        timeInput.dataset.minutesInterval = field.minutesInterval;
        
        // 시간 선택 모달 열기
        timeInput.addEventListener('click', function(e) {
            e.preventDefault();
            openTimePickerModal(field.id);
        });
    });
    
    // 시간 선택기 모달 이벤트 설정
    setupTimePickerModalEvents();
}

function openTimePickerModal(inputId) {
    const timeInput = document.getElementById(inputId);
    if (!timeInput) return;
    
    const modal = document.getElementById('timePickerModal');
    if (!modal) return;
    
    // 필드 설정 가져오기
    const hoursMin = parseInt(timeInput.dataset.hoursMin || 0);
    const hoursMax = parseInt(timeInput.dataset.hoursMax || 23);
    const minutesInterval = parseInt(timeInput.dataset.minutesInterval || 10);
    
    // 현재 선택된 시간 가져오기
    let currentTime = timeInput.value || '';
    let currentHour = '10';
    let currentMinute = '00';
    
    // 이미 선택된 시간이 있으면 분리
    if (currentTime) {
        const timeParts = currentTime.split(':');
        if (timeParts.length === 2) {
            currentHour = timeParts[0];
            currentMinute = timeParts[1];
        }
    }
    
    // 시간 옵션 생성 (필드별 범위 적용)
    const hoursColumn = modal.querySelector('#hoursScroll');
    hoursColumn.innerHTML = generateHourOptions(currentHour, hoursMin, hoursMax);
    
    // 분 옵션 생성 (필드별 간격 적용)
    const minutesColumn = modal.querySelector('#minutesScroll');
    minutesColumn.innerHTML = generateMinuteOptions(currentMinute, minutesInterval);
    
    // 현재 선택된 시간/분 강조
    highlightSelectedTime(modal, currentHour, currentMinute);
    
    // 모달에 타겟 입력 필드 ID 저장
    modal.dataset.targetInput = inputId;
    
    // 모달 표시
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // 선택된 시간으로 스크롤
    scrollToSelectedTime(modal);
    
    // 외부 클릭 이벤트 리스너 추가 (모달 외부 클릭 시 닫기)
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('touchend', handleOutsideClick);
    }, 100); // 약간의 지연을 줘서 모달 열기 클릭과 겹치지 않도록 함
}

/**
 * 모달 외부 클릭 처리
 */
function handleOutsideClick(event) {
    const modal = document.getElementById('timePickerModal');
    if (!modal || !modal.classList.contains('show')) return;
    
    const modalContent = modal.querySelector('.time-picker-content');
    const modalHeader = modal.querySelector('.time-picker-header');
    
    // 클릭된 요소가 모달 내부인지 확인
    let targetElement = event.target;
    
    // 클릭된 요소가 모달 자체이고(배경), 모달 컨텐츠는 아닌 경우 모달 닫기
    if (targetElement === modal || 
        (!modalContent.contains(targetElement) && 
         !modalHeader.contains(targetElement) && 
         modal.contains(targetElement))) {
        closeTimePickerModal();
    }
}

/**
 * 시간 선택기 모달 닫기
 */
function closeTimePickerModal() {
    const modal = document.getElementById('timePickerModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // 외부 클릭 이벤트 리스너 제거
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchend', handleOutsideClick);
    }
}

/**
 * 시간 선택기 모달 이벤트 설정
 */
function setupTimePickerModalEvents() {
    const modal = document.getElementById('timePickerModal');
    if (!modal) return;
    
    // 모달 닫기
    const cancelBtn = modal.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 이벤트 전파 중지
            closeTimePickerModal();
        });
    }
    
    // 시간 선택 확인
    const confirmBtn = modal.querySelector('.confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 이벤트 전파 중지
            applySelectedTime(modal);
        });
    }
    
    // 시간 옵션 클릭
    modal.addEventListener('click', function(e) {
        // 이벤트 전파 방지 (외부 클릭 이벤트가 발생하지 않도록)
        e.stopPropagation();
        
        if (e.target.classList.contains('time-value')) {
            // 같은 열에 있는 다른 항목들의 선택 상태 제거
            const column = e.target.closest('.time-column');
            if (column) {
                column.querySelectorAll('.time-value').forEach(item => {
                    item.classList.remove('selected');
                });
            }
            
            // 선택한 항목 강조
            e.target.classList.add('selected');
        }
    });
    
    // 모달 자체에도 클릭 이벤트 처리 (버블링 방지)
    modal.addEventListener('click', function(e) {
        // 바로 배경 부분 클릭 시에는 닫기
        if (e.target === modal) {
            closeTimePickerModal();
        }
    });
}

/**
 * 선택된 시간으로 스크롤
 */
function scrollToSelectedTime(modal) {
    const hoursColumn = modal.querySelector('#hoursScroll');
    const minutesColumn = modal.querySelector('#minutesScroll');
    
    const selectedHour = hoursColumn.querySelector('.time-value.selected');
    const selectedMinute = minutesColumn.querySelector('.time-value.selected');
    
    if (selectedHour) {
        selectedHour.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    
    if (selectedMinute) {
        selectedMinute.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}

/**
 * 선택된 시간 강조
 */
function highlightSelectedTime(modal, hour, minute) {
    // 시간 강조
    const hourOptions = modal.querySelectorAll('#hoursScroll .time-value');
    hourOptions.forEach(option => {
        if (option.dataset.value === hour) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // 분 강조
    const minuteOptions = modal.querySelectorAll('#minutesScroll .time-value');
    minuteOptions.forEach(option => {
        if (option.dataset.value === minute) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

/**
 * 선택한 시간 적용
 */
function applySelectedTime(modal) {
    const targetInputId = modal.dataset.targetInput;
    const targetInput = document.getElementById(targetInputId);
    
    if (!targetInput) {
        closeTimePickerModal();
        return;
    }
    
    const selectedHour = modal.querySelector('#hoursScroll .time-value.selected');
    const selectedMinute = modal.querySelector('#minutesScroll .time-value.selected');
    
    if (selectedHour && selectedMinute) {
        const hour = selectedHour.dataset.value;
        const minute = selectedMinute.dataset.value;
        
        // 선택한 시간 설정
        targetInput.value = `${hour}:${minute}`;
        targetInput.classList.add('filled-field');
    }
    
    closeTimePickerModal();
}

/**
 * 시간 옵션 생성 (범위 제한 적용)
 */
function generateHourOptions(selectedHour, minHour, maxHour) {
    let options = '';
    for (let i = minHour; i <= maxHour; i++) {
        const hour = i.toString().padStart(2, '0');
        const selected = hour === selectedHour ? 'selected' : '';
        options += `<div class="time-value hour-option ${selected}" data-value="${hour}">${hour}시</div>`;
    }
    return options;
}

/**
 * 분 옵션 생성 (간격 적용)
 */
function generateMinuteOptions(selectedMinute, interval) {
    let options = '';
    for (let i = 0; i < 60; i += interval) {
        const minute = i.toString().padStart(2, '0');
        const selected = minute === selectedMinute ? 'selected' : '';
        options += `<div class="time-value minute-option ${selected}" data-value="${minute}">${minute}분</div>`;
    }
    return options;
}

/**
 * 초기 시간 값 설정
 */
function setInitialTimeValues() {
    // 현재 시간 구하기
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = Math.floor(now.getMinutes() / 10) * 10; // 10분 단위로 반올림
    const currentTime = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
    
    // 시간 필드 기본값 설정
    const fields = [
        { timeId: 'death-time', defaultTime: currentTime },
        { timeId: 'coffin-time', defaultTime: '09:00' },
        { timeId: 'departure-time', defaultTime: '07:00' }
    ];
    
    fields.forEach(field => {
        const timeInput = document.getElementById(field.timeId);
        
        if (timeInput && !timeInput.value) {
            timeInput.value = field.defaultTime;
            timeInput.classList.add('filled-field');
        }
    });
}

// 날짜 관련 스타일 추가
const style = document.createElement('style');
style.textContent = `
    /* 날짜 레이아웃 스타일 */
    .date-row {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }

    .field-label {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        width: 100px;
        margin-right: 15px;
    }

    .input-container {
        flex: 1;
    }

    .date-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 15px;
    }

    /* 필수 표시 스타일 */
    .required-mark {
        color: #ff0000;
        font-weight: bold;
        font-size: 18px;
        vertical-align: middle;
        margin-left: 2px;
    }

    /* 시간 선택기 관련 스타일 */
    .time-picker-custom {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        transform: translateY(100%);
        transition: transform 0.3s ease;
    }
    
    .time-picker-custom.show {
        transform: translateY(0);
    }
    
    .time-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
    }
    
    .time-picker-header button {
        background: none;
        border: none;
        font-size: 16px;
        color: #3366cc;
        padding: 5px 10px;
    }
    
    .time-picker-content {
        display: flex;
        justify-content: center;
        height: 250px;
        padding: 0 15px;
    }
    
    .time-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 10px;
        border-right: 1px solid #eee;
    }
    
    .time-column:last-child {
        border-right: none;
    }
    
    .time-value {
        padding: 12px 15px;
        margin: 5px 0;
        width: 80%;
        text-align: center;
        border-radius: 8px;
        font-size: 18px;
        color: #333;
        cursor: pointer;
    }
    
    .time-value.selected {
        background-color: #e7f3ff;
        color: #3366cc;
        font-weight: bold;
    }

    /* 세로 배치 날짜 시간 그룹 간격 줄이기 */
    .date-time-vertical-group {
        display: flex;
        flex-direction: column;
        gap: 8px; /* 간격 줄임 (원래 16px) */
        width: 100%;
        margin-bottom: 15px;
    }

    .date-time-item {
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 5px; /* 간격 줄임 (추가) */
    }

    .date-time-label {
        font-size: 15px; /* 폰트 크기 약간 줄임 */
        font-weight: bold;
        color: #333;
        width: 80px; /* 레이블 너비 줄임 (원래 90px) */
        margin-right: 10px; /* 간격 줄임 (원래 15px) */
        white-space: nowrap;
    }

    /* 날짜/시간 입력 필드 컨테이너 */
    .date-time-fields {
        display: flex;
        gap: 6px; /* 간격 줄임 (원래 10px) */
        flex: 1;
    }

    .date-half {
        flex: 2;
    }

    .time-half {
        flex: 1;
    }
    
    /* 시간 입력 필드 스타일 - 커서 클릭 아이콘 추가 */
    .time-half .date-time-input {
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 16px;
    }

    /* 모바일 최적화 */
    @media (max-width: 480px) {
        .field-label {
            font-size: 15px;
            width: 80px;
            margin-right: 10px;
        }
        
        .date-input {
            font-size: 14px;
            padding: 10px;
        }
        
        .time-value {
            padding: 10px;
            font-size: 16px;
        }
        
        .time-picker-content {
            height: 200px;
        }
        
        .date-time-vertical-group {
            gap: 6px;
        }
        
        .date-time-label {
            font-size: 14px;
            width: 70px;
            margin-right: 8px;
        }
        
        .date-time-fields {
            gap: 4px;
        }
        
        .date-time-input {
            padding: 8px !important;
            font-size: 14px !important;
        }
    }
    `;
    document.head.appendChild(style);
