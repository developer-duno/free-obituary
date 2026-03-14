import { Obituary } from '../domain/obituary/Obituary.js';
import { DeceasedInfo } from '../domain/obituary/vo/DeceasedInfo.js';
import { FuneralInfo } from '../domain/obituary/vo/FuneralInfo.js';
import { BereavedPerson } from '../domain/obituary/vo/BereavedPerson.js';
import { hashPassword } from '../common/password-utils.js';
// ObituaryRepositoryInterface는 생성자에서 주입받으므로 직접 import 불필요

/**
 * 부고 관련 비즈니스 로직을 처리하는 서비스입니다.
 */
export class ObituaryService {
    /**
     * @param {ObituaryRepositoryInterface} obituaryRepository
     */
    constructor(obituaryRepository) {
        if (!obituaryRepository) {
            throw new Error('ObituaryRepository는 필수입니다.');
        }
        this.obituaryRepository = obituaryRepository;
    }

    /**
     * 새로운 부고를 생성합니다.
     * @param {object} obituaryData - 부고 생성에 필요한 데이터.
     * 예: { deceasedInfoData, funeralInfoData, bereavedDataArray, additionalInfo, password, selectedTemplate, portraitImage }
     * 여기서 *_Data는 각 VO 생성에 필요한 raw 데이터 객체입니다.
     * @returns {Promise<Obituary>} 생성된 Obituary 엔티티.
     */
    async createObituary(obituaryData) {
        // 1. 입력 데이터 유효성 검사 (Application 계층의 책임)
        if (!obituaryData || !obituaryData.deceasedInfoData || !obituaryData.funeralInfoData || !obituaryData.password) {
            throw new Error('부고 생성에 필요한 정보가 부족합니다: 고인정보, 장례정보, 비밀번호는 필수입니다.');
        }

        // 2. Value Objects 생성
        const deceasedInfo = new DeceasedInfo(obituaryData.deceasedInfoData);
        const funeralInfo = new FuneralInfo(obituaryData.funeralInfoData);
        const bereaved = (obituaryData.bereavedDataArray || []).map(b => new BereavedPerson(b));

        // 3. 비밀번호 해싱 (bcrypt)
        const hashedPassword = await hashPassword(obituaryData.password);

        // 4. 새 ID 생성 (Repository를 통해)
        const newId = await this.obituaryRepository.nextId();

        // 5. Obituary Entity 생성
        const newObituary = new Obituary({
            id: newId,
            deceasedInfo: deceasedInfo,
            funeralInfo: funeralInfo,
            bereaved: bereaved,
            additionalInfo: obituaryData.additionalInfo || '',
            password: hashedPassword,
            selectedTemplate: obituaryData.selectedTemplate,
            portraitImage: obituaryData.portraitImage || null,
            messageContent: obituaryData.messageContent || '',
            messageType: obituaryData.messageType || '',
            accountInfo: obituaryData.accountInfo || null,
            isPublished: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 6. Repository를 통해 저장
        await this.obituaryRepository.save(newObituary);
        return newObituary;
    }

    /**
     * ID로 부고 정보를 조회합니다.
     * @param {string} obituaryId
     * @returns {Promise<Obituary|null>} 
     */
    async getObituaryById(obituaryId) {
        if (!obituaryId) throw new Error('부고 ID가 제공되지 않았습니다.');
        return this.obituaryRepository.findById(obituaryId);
    }

    /**
     * 부고 정보를 업데이트합니다.
     * @param {string} obituaryId - 업데이트할 부고의 ID.
     * @param {object} updateData - 업데이트할 데이터.
     * 예: { deceasedInfoData, funeralInfoData, ... } 또는 특정 필드만.
     * @param {string} password - 관리자 비밀번호.
     * @returns {Promise<Obituary>} 업데이트된 Obituary 엔티티.
     */
    async updateObituary(obituaryId, updateData, password) {
        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) {
            throw new Error('업데이트할 부고를 찾을 수 없습니다.');
        }
        if (!obituary.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않아 부고를 수정할 수 없습니다.');
        }

        let updatedObituary = obituary;

        // 각 부분별 업데이트 (Entity의 불변성 유지하며 업데이트 메소드 호출)
        if (updateData.deceasedInfoData) {
            updatedObituary = updatedObituary.updateDeceasedInfo(updateData.deceasedInfoData);
        }
        if (updateData.funeralInfoData) {
            updatedObituary = updatedObituary.updateFuneralInfo(updateData.funeralInfoData);
        }
        if (updateData.bereavedDataArray) {
            updatedObituary = updatedObituary.updateBereaved(updateData.bereavedDataArray);
        }
        if (typeof updateData.additionalInfo === 'string') {
            updatedObituary = updatedObituary.updateAdditionalInfo(updateData.additionalInfo);
        }
        if (updateData.portraitImage !== undefined) { // null로 변경 가능하도록
            updatedObituary = updatedObituary.updatePortraitImage(updateData.portraitImage);
        }
        if (updateData.selectedTemplate) {
            updatedObituary = updatedObituary.updateTemplate(updateData.selectedTemplate);
        }
        if (typeof updateData.messageContent === 'string') {
            updatedObituary = updatedObituary.updateMessageContent(updateData.messageContent, updateData.messageType);
        }
        if (updateData.accountInfo !== undefined) {
            updatedObituary = updatedObituary.updateAccountInfo(updateData.accountInfo);
        }
        if (typeof updateData.isPublished === 'boolean') {
            updatedObituary = updateData.isPublished ? updatedObituary.publish() : updatedObituary.unpublish();
        }
        
        // 비밀번호 변경
        const newPw = updateData.newPassword || updateData.password;
        if (newPw) {
            const hashedNewPassword = await hashPassword(newPw);
            updatedObituary = updatedObituary.changePassword(hashedNewPassword);
        }

        // updatedAt은 각 Entity 업데이트 메소드에서 처리되거나, 여기서 명시적으로 설정
        // updatedObituary = new Obituary({ ...updatedObituary._toDataObject(), updatedAt: new Date() });

        await this.obituaryRepository.save(updatedObituary);
        return updatedObituary;
    }

    /**
     * 부고를 삭제합니다.
     * @param {string} obituaryId - 삭제할 부고 ID.
     * @param {string} password - 관리자 비밀번호.
     * @returns {Promise<boolean>} 삭제 성공 시 true.
     */
    async deleteObituary(obituaryId, password) {
        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) {
            // 이미 삭제되었거나 없는 경우, 성공으로 처리할 수도 있음 (멱등성)
            // 여기서는 찾을 수 없으면 실패로 간주하지 않고, false 반환하여 Repository에 위임
            // return false; 
            throw new Error('삭제할 부고를 찾을 수 없습니다.');
        }

        if (!obituary.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않아 부고를 삭제할 수 없습니다.');
        }
        return this.obituaryRepository.deleteById(obituaryId);
    }

    /**
     * 고인명으로 부고를 검색합니다.
     * @param {string} deceasedName
     * @returns {Promise<Obituary[]>}
     */
    async searchObituariesByDeceasedName(deceasedName) {
        if (!deceasedName || deceasedName.trim() === '') {
            return [];
        }
        return this.obituaryRepository.findByDeceasedName(deceasedName);
    }

    /**
     * 부고 조회수를 증가시킵니다.
     * @param {string} obituaryId
     * @returns {Promise<void>}
     */
    async incrementViewCount(obituaryId) {
        const success = await this.obituaryRepository.incrementViewCount(obituaryId);
        if (!success) {
            console.warn(`부고 ID [${obituaryId}]의 조회수 증가에 실패했거나 부고를 찾을 수 없습니다.`);
        }
    }
    
    /**
     * 부고 관리 비밀번호를 확인합니다.
     * @param {string} obituaryId
     * @param {string} passwordToVerify
     * @returns {Promise<boolean>} 비밀번호 일치 시 true
     */
    async verifyObituaryPassword(obituaryId, passwordToVerify) {
        const obituary = await this.obituaryRepository.verifyPassword(obituaryId, passwordToVerify);
        return !!obituary; // obituary 객체가 반환되면 true, null이면 false
    }
    
    /**
     * 부고 관리 비밀번호를 확인하고, 일치하면 부고 엔티티를 반환합니다.
     * UI에서 수정 전 데이터 확인 등에 사용될 수 있습니다.
     * @param {string} obituaryId
     * @param {string} passwordToVerify
     * @returns {Promise<Obituary|null>} 비밀번호 일치 시 Obituary 엔티티, 아니면 null
     */
    async verifyAndGetObituary(obituaryId, passwordToVerify) {
        return this.obituaryRepository.verifyPassword(obituaryId, passwordToVerify);
    }

    /**
     * 모든 부고 목록을 조회합니다.
     * @returns {Promise<Obituary[]>}
     */
    async getAllObituaries() {
        return this.obituaryRepository.findAll();
    }

    /**
     * 관리자 권한으로 비밀번호 없이 부고를 삭제합니다.
     * @param {string} obituaryId
     * @returns {Promise<boolean>}
     */
    async deleteObituaryAsAdmin(obituaryId) {
        return this.obituaryRepository.deleteById(obituaryId);
    }

    /**
     * 저장소의 모든 부고 데이터를 삭제합니다.
     * @returns {Promise<void>}
     */
    async clearAllObituaries() {
        await this.obituaryRepository.clearAll();
    }

    // (Private) 비밀번호 해싱 함수 (실제 구현 필요)
    // async _hashPassword(password) {
    //     // 예: const salt = await bcrypt.genSalt(10);
    //     // return bcrypt.hash(password, salt);
    //     return password; // 임시
    // }
} 