import { AppUtils } from '../../common/utils.js';

let stylesInjected = false;

export const writePageRequiredFields = [
    { id: 'selected-template-hidden', message: '부고장 디자인을 선택해 주세요.', 
      check: () => {
          const hiddenInput = document.getElementById('selected-template-hidden');
          return hiddenInput && hiddenInput.value.trim() !== '';
      }
    },
    { id: 'deceased-name', message: '고인 성함을 입력해 주세요.' },
    { id: 'deceased-age', message: '고인 연세를 입력해 주세요.' },
    { id: 'gender', message: '성별을 선택해 주세요.' },
    { id: 'bereaveds-list', message: '최소 한 명의 상주 정보가 필요합니다.', custom: true,
      check: () => {
        const relationships = document.querySelectorAll('.relationship-select');
        const names = document.querySelectorAll('input[name="bereavedName[]"]');
        if (relationships.length === 0 || names.length === 0) return false;
        let valid = false;
        for(let i=0; i<relationships.length; i++) {
            if(relationships[i].value && names[i].value.trim()) {
                valid = true;
                break;
            }
        }
        return valid;
      }
    },
    { id: 'funeral-hall-name', message: '장례식장 이름을 입력해 주세요.' },
    { id: 'funeral-hall-address', message: '장례식장 주소를 입력해 주세요.' },
    { id: 'funeral-hall-room', message: '빈소 정보를 입력해 주세요.' },
    { id: 'death-date', message: '임종날짜를 선택해 주세요.' },
    { id: 'death-time', message: '임종시간을 선택해 주세요.' },
    { id: 'departure-date', message: '발인날짜를 선택해 주세요.' },
    { id: 'departure-time', message: '발인시간을 선택해 주세요.' },
    { id: 'password', message: '비밀번호 4자리를 입력해 주세요.', 
      check: (form) => {
          const isEditMode = document.getElementById('submit-button')?.getAttribute('data-edit-mode') === 'true';
          const passwordInput = form.elements['password'];
          if (isEditMode && !passwordInput.value) return true;
          return passwordInput.value && passwordInput.value.length >= 4;
      }
    },
    { id: 'agree-terms', message: '서비스 이용약관에 동의해 주세요.', custom: true,
      check: () => document.getElementById('agree-terms').checked }
];

function showFormNotificationAndScroll(message, targetElementId) {
    const targetElement = document.getElementById(targetElementId) || 
                          document.querySelector('[name="' + targetElementId + '"]') || 
                          document.querySelector(targetElementId);
    
    if (AppUtils && AppUtils.showToast) {
        AppUtils.showToast(message, 'error', 3000); 
    } else {
        console.warn("Validation:", message);
    }
    if (targetElement) {
        const headerHeight = document.querySelector('.main-header') ? document.querySelector('.main-header').offsetHeight : 80;
        const elementPos = targetElement.getBoundingClientRect().top;
        const offsetPos = elementPos + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: offsetPos, behavior: 'smooth' });
        
        if (typeof targetElement.focus === 'function') {
            targetElement.focus();
        }

        targetElement.style.transition = 'box-shadow 0.3s ease-in-out';
        targetElement.style.boxShadow = '0 0 0 3px rgba(255, 0, 0, 0.5)';
        setTimeout(() => { targetElement.style.boxShadow = ''; }, 3000);
    }
}

function injectValidationStyles() {
    if (stylesInjected) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'form-validation-styles';
    styleSheet.textContent = `
        .error-field {
            border-color: #ff5555 !important;
            background-color: rgba(255, 85, 85, 0.05) !important;
        }
    `;
    document.head.appendChild(styleSheet);
    stylesInjected = true;
}

export function validateObituaryFormLogic(formElement, requiredFieldsConfig) {
    injectValidationStyles();

    for (const field of requiredFieldsConfig) {
        const element = document.getElementById(field.id) || 
                        document.querySelector('[name="' + field.id + '"]') || 
                        document.querySelector(field.id);
        let isValid = true;

        if (field.check) {
            isValid = field.check(formElement);
        } else if (element) {
            if (element.type === 'checkbox') {
                isValid = element.checked;
            } else {
                isValid = element.value && element.value.trim() !== '';
            }
        }

        if (!isValid) {
            showFormNotificationAndScroll(field.message, field.id);
            return false;
        }
    }
    return true;
}
