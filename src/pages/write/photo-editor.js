/**
 * 영정 사진 편집 관련 자바스크립트
 */
import { AppUtils } from '../../common/utils.js'; // AppUtils import 추가

let cropper = null; // Cropper 인스턴스 (모듈 스코프)
let isPhotoEditorInitialized = false;

// 영정 사진 편집 기능 설정
export function initPhotoEditor() {
    if (isPhotoEditorInitialized) return;

    // 영정 사진 버튼 클릭 이벤트
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const usePhotoInput = document.getElementById('use-photo'); // hidden input
    
    if (addPhotoBtn && usePhotoInput) {
        addPhotoBtn.addEventListener('click', function() {
            const photoUpload = document.getElementById('photo-upload');
            const photoPreview = document.getElementById('photo-preview');
            const uploadedPhoto = document.getElementById('uploaded-photo');
            
            // 미리보기가 표시되어 있는지 확인
            const hasPreview = uploadedPhoto && uploadedPhoto.src && 
                               !photoPreview.classList.contains('hidden');
            
            if (hasPreview) {
                // 이미 업로드된 사진이 있는 경우: 모든 상태 초기화
                if (photoUpload) photoUpload.classList.add('hidden');
                if (photoPreview) photoPreview.classList.add('hidden');
                
                // 파일 입력과 미리보기 초기화
                const photoInput = document.getElementById('photo');
                if (photoInput) photoInput.value = '';
                if (uploadedPhoto) uploadedPhoto.src = '';
                
                // 버튼 텍스트 변경
                this.querySelector('.photo-text').textContent = '영정 사진 등록하기';
                this.querySelector('.photo-icon').textContent = '+';
                
                // 폼 데이터 상태 업데이트
                usePhotoInput.value = '';
            } else if (photoUpload && photoUpload.classList.contains('hidden')) {
                // 업로드 컨트롤이 숨겨져 있을 때: 표시
                photoUpload.classList.remove('hidden');
                
                // 버튼 텍스트 변경
                this.querySelector('.photo-text').textContent = '영정 사진 취소하기';
                this.querySelector('.photo-icon').textContent = '×';
                
                // 폼 데이터 상태 업데이트
                usePhotoInput.value = 'true';
            } else if (photoUpload) {
                // 업로드 컨트롤이 표시되어 있을 때: 숨김
                photoUpload.classList.add('hidden');
                
                // 버튼 텍스트 변경
                this.querySelector('.photo-text').textContent = '영정 사진 등록하기';
                this.querySelector('.photo-icon').textContent = '+';
                
                // 폼 데이터 상태 업데이트
                usePhotoInput.value = '';
            }
        });
    }
    
    // 업로드 트리거 버튼 이벤트
    const uploadTrigger = document.getElementById('upload-trigger');
    if (uploadTrigger) {
        uploadTrigger.addEventListener('click', function() {
            const photoInput = document.getElementById('photo');
            if (photoInput) photoInput.click();
        });
    }
    
    // 파일 선택 이벤트 강화
    const photoInput = document.getElementById('photo');
    if (photoInput) {
        photoInput.addEventListener('change', async function(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            
            // 파일 크기 검사 (2MB 제한 - localStorage 용량 보호)
            if (file.size > 2 * 1024 * 1024) {
                AppUtils.showToast("파일 크기는 2MB를 초과할 수 없습니다. 사진을 줄여주세요.", "error");
                this.value = '';
                return;
            }
            
            // 이미지 파일인지 검사
            if (!file.type.startsWith('image/')) {
                AppUtils.showToast("이미지 파일만 업로드 가능합니다.", "error");
                this.value = '';
                return;
            }
            
            // 이미지 미리보기
            const reader = new FileReader();
            reader.onload = async function(e) {
                let imageData = e.target.result;
                if (AppUtils && typeof AppUtils.compressImage === 'function') { // AppUtils 사용 복원
                    try {
                        imageData = await AppUtils.compressImage(imageData, 1200, 1200, 'image/jpeg', 0.85); // maxWidth, maxHeight, mimeType, quality 전달
                    } catch (error) {
                        console.error('이미지 압축 오류:', error);
                        AppUtils.showToast('이미지 처리 중 오류가 발생했습니다.', 'error');
                        // 오류 발생 시 추가 처리 (예: 원본 이미지 사용 또는 작업 중단)
                        return; // 압축 실패 시 미리보기 업데이트 중단
                    }
                } else {
                    console.warn('AppUtils.compressImage 함수를 찾을 수 없습니다.');
                    // AppUtils.showToast('이미지 압축 기능을 사용할 수 없습니다. 고화질 이미지가 업로드될 수 있습니다.', 'warning'); // 사용자에게 알림 (선택적)
                }
                
                const uploadedPhoto = document.getElementById('uploaded-photo');
                const photoPreview = document.getElementById('photo-preview');
                const photoUpload = document.getElementById('photo-upload');
                
                if (uploadedPhoto) uploadedPhoto.src = imageData;
                if (photoPreview) photoPreview.classList.remove('hidden');
                if (photoUpload) photoUpload.classList.add('hidden');
                
                // 편집 버튼 표시
                const editPhotoBtn = document.getElementById('edit-photo-btn');
                if (editPhotoBtn) editPhotoBtn.style.display = 'inline-block';
                
                // 버튼 텍스트 갱신
                const addPhotoBtn = document.getElementById('add-photo-btn');
                if (addPhotoBtn) {
                    addPhotoBtn.querySelector('.photo-text').textContent = '영정 사진 변경하기';
                    addPhotoBtn.querySelector('.photo-icon').textContent = '↺';
                }
                
                // 폼 데이터 상태 업데이트
                usePhotoInput.value = 'true';
                updatePhotoDataHiddenInput(imageData);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 편집 버튼 클릭 시 이미지 에디터 표시
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    if (editPhotoBtn) {
        editPhotoBtn.addEventListener('click', function() {
            const uploadedPhoto = document.getElementById('uploaded-photo');
            const imageEditor = document.getElementById('image-editor');
            const imageToCrop = document.getElementById('image-to-crop');
            
            if (uploadedPhoto && uploadedPhoto.src && imageEditor && imageToCrop) {
                imageToCrop.src = uploadedPhoto.src;
                imageEditor.style.display = 'block';
                
                // 크로퍼 초기화
                setTimeout(() => {
                    try {
                        if (cropper) {
                            cropper.destroy();
                        }
                        
                        if (typeof Cropper !== 'undefined') {
                            cropper = new Cropper(imageToCrop, {
                                aspectRatio: NaN,
                                viewMode: 1,
                                autoCropArea: 1,
                                responsive: true,
                                restore: true,
                                center: true,
                                highlight: false,
                                cropBoxMovable: true,
                                cropBoxResizable: true,
                                toggleDragModeOnDblclick: false
                            });
                        } else {
                            console.error('Cropper 라이브러리를 찾을 수 없습니다.');
                            AppUtils.showToast("이미지 편집기 로드 실패. 새로고침해주세요.", "error");
                        }
                    } catch (error) {
                        console.error('Cropper 초기화 오류:', error);
                        AppUtils.showToast("이미지 편집기 로드 오류", "error");
                    }
                }, 100);
            }
        });
    }
    
    // 회전 버튼 이벤트
    const rotateLeftBtn = document.getElementById('rotate-left');
    if (rotateLeftBtn) {
        rotateLeftBtn.addEventListener('click', function() {
            if (cropper) cropper.rotate(-90);
        });
    }
    
    const rotateRightBtn = document.getElementById('rotate-right');
    if (rotateRightBtn) {
        rotateRightBtn.addEventListener('click', function() {
            if (cropper) cropper.rotate(90);
        });
    }
    
    // 비율 버튼 이벤트
    const aspectRatioBtns = document.querySelectorAll('.aspect-ratio-btn');
    aspectRatioBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!cropper) return;
            
            const ratio = parseFloat(this.dataset.ratio);
            cropper.setAspectRatio(ratio);
            
            aspectRatioBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 적용 버튼 이벤트
    const applyCropBtn = document.getElementById('apply-crop');
    if (applyCropBtn) {
        applyCropBtn.addEventListener('click', async function() {
            if (!cropper) return;
            
            try {
                const croppedCanvas = cropper.getCroppedCanvas({
                    maxWidth: 1200,
                    maxHeight: 1200,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });
                
                const uploadedPhoto = document.getElementById('uploaded-photo');
                
                if (uploadedPhoto && croppedCanvas) {
                    let imageData = croppedCanvas.toDataURL('image/jpeg', 0.8);
                    if (AppUtils && typeof AppUtils.compressImage === 'function') { // AppUtils 사용 복원
                        try {
                            // 크롭된 이미지를 다시 한번 압축/리사이징할 필요는 일반적으로 적지만,
                            // 만약 특정 규격으로 맞추거나 추가 압축이 필요하다면 아래 로직 사용 가능
                            // 여기서는 croppedCanvas에서 이미 적절한 크기와 품질로 생성되었다고 가정하고,
                            // AppUtils.compressImage를 중복 호출하지 않거나, 필요성을 재검토합니다.
                            // 예시: imageData = await AppUtils.compressImage(imageData, 1000, 1000, 'image/jpeg', 0.8); 
                        } catch (error) {
                            console.error('크롭 후 이미지 추가 압축 오류:', error);
                            // AppUtils.showToast('이미지 저장 중 오류가 발생했습니다.', 'error');
                        }
                    } else {
                        // console.warn('AppUtils.compressImage 함수를 찾을 수 없습니다.');
                    }
                    
                    uploadedPhoto.src = imageData;
                    
                    // 폼에 photoData 필드 추가
                    const obituaryForm = document.getElementById('obituaryForm');
                    if (obituaryForm) {
                        let photoDataInput = document.getElementById('photoData');
                        if (!photoDataInput) {
                            photoDataInput = document.createElement('input');
                            photoDataInput.type = 'hidden';
                            photoDataInput.id = 'photoData';
                            photoDataInput.name = 'photoData';
                            obituaryForm.appendChild(photoDataInput);
                        }
                        photoDataInput.value = imageData;
                    }
                    
                    closeEditor();
                }
            } catch (error) {
                console.error('이미지 크롭 오류:', error);
                AppUtils.showToast("이미지 편집 중 오류가 발생했습니다.", "error");
            }
        });
    }
    
    // 에디터 닫기 함수
    function closeEditor() {
        const imageEditor = document.getElementById('image-editor');
        if (imageEditor) imageEditor.style.display = 'none';
        
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }
    
    // 닫기/취소 버튼 이벤트
    const closeEditorBtn = document.getElementById('close-editor');
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', closeEditor);
    }
    
    const cancelCropBtn = document.getElementById('cancel-crop');
    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', closeEditor);
    }
    
    // 모바일 환경 감지 및 설정
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const photoInput = document.getElementById('photo');
        if (photoInput) {
            photoInput.setAttribute('capture', 'environment');
        }
    }
    
    // 사진 삭제 버튼 이벤트 강화
    const deletePhotoBtn = document.getElementById('delete-photo-btn');
    if (deletePhotoBtn) {
        deletePhotoBtn.addEventListener('click', function() {
            const photoInput = document.getElementById('photo');
            const uploadedPhoto = document.getElementById('uploaded-photo');
            const photoPreview = document.getElementById('photo-preview');
            const photoUpload = document.getElementById('photo-upload');
            
            if (photoInput) photoInput.value = '';
            if (uploadedPhoto) uploadedPhoto.src = '';
            if (photoPreview) photoPreview.classList.add('hidden');
            if (photoUpload) photoUpload.classList.remove('hidden');
            
            // 버튼 텍스트 원상복구 코드 추가
            const addPhotoBtn = document.getElementById('add-photo-btn');
            if (addPhotoBtn) {
                addPhotoBtn.querySelector('.photo-text').textContent = '영정 사진 등록하기';
                addPhotoBtn.querySelector('.photo-icon').textContent = '+';
            }
            
            // 폼 데이터 상태 업데이트
            usePhotoInput.value = '';
            
            // photoData 필드 초기화
            const photoDataInput = document.getElementById('photoData');
            if (photoDataInput) {
                photoDataInput.value = '';
            }
        });
    }
    
    // 페이지 이탈 시 정리
    window.addEventListener('beforeunload', () => {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    });

    isPhotoEditorInitialized = true;
}

function updatePhotoDataHiddenInput(imageData) {
    const obituaryForm = document.getElementById('obituaryForm');
    if (obituaryForm) {
        let photoDataInput = document.getElementById('photoData');
        if (!photoDataInput) {
            photoDataInput = document.createElement('input');
            photoDataInput.type = 'hidden';
            photoDataInput.id = 'photoData';
            photoDataInput.name = 'photoData';
            obituaryForm.appendChild(photoDataInput);
        }
        photoDataInput.value = imageData || '';
    }
}

export function getPhotoData() {
    const photoDataInput = document.getElementById('photoData');
    return photoDataInput ? photoDataInput.value : null;
}

export function setPhotoData(imageData) {
    const uploadedPhoto = document.getElementById('uploaded-photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoUpload = document.getElementById('photo-upload');
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const usePhotoInput = document.getElementById('use-photo');

    if (imageData) {
        if (uploadedPhoto) uploadedPhoto.src = imageData;
        if (photoPreview) photoPreview.classList.remove('hidden');
        if (photoUpload) photoUpload.classList.add('hidden');
        if (addPhotoBtn) {
            addPhotoBtn.querySelector('.photo-text').textContent = '영정 사진 변경하기';
            addPhotoBtn.querySelector('.photo-icon').textContent = '↺';
        }
        if (editPhotoBtn) editPhotoBtn.style.display = 'inline-block';
        if (usePhotoInput) usePhotoInput.value = 'true';
        updatePhotoDataHiddenInput(imageData);
    } else {
        clearPhotoData(); // imageData가 없으면 초기화
    }
}

export function clearPhotoData() {
    const photoInput = document.getElementById('photo');
    const uploadedPhoto = document.getElementById('uploaded-photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoUpload = document.getElementById('photo-upload');
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const usePhotoInput = document.getElementById('use-photo');
    const imageEditor = document.getElementById('image-editor');

    if (photoInput) photoInput.value = '';
    if (uploadedPhoto) uploadedPhoto.src = '';
    if (photoPreview) photoPreview.classList.add('hidden');
    // photoUpload는 기본적으로 숨겨져 있거나, '사진 등록' 버튼 누르면 보이므로 여기선 제어 안함.
    // 필요시: if (photoUpload) photoUpload.classList.add('hidden');
    if (addPhotoBtn) {
        addPhotoBtn.querySelector('.photo-text').textContent = '영정 사진 등록하기';
        addPhotoBtn.querySelector('.photo-icon').textContent = '+';
    }
    if (editPhotoBtn) editPhotoBtn.style.display = 'none';
    if (usePhotoInput) usePhotoInput.value = '';
    if (cropper) { cropper.destroy(); }
    cropper = null;
    if (imageEditor) imageEditor.style.display = 'none';
    updatePhotoDataHiddenInput('');
}
