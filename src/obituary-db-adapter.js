/**
 * Search.html 등 레거시 인라인 스크립트용 window.obituaryDB 어댑터.
 * window.appServices.obituaryService(ObituaryService)를 사용하며,
 * Entity 형식을 레거시 flat 형식으로 변환합니다.
 * scripts.js 로드 후 사용해야 합니다.
 */
(function() {
    'use strict';

    function getService() {
        return window.appServices && window.appServices.obituaryService;
    }

    /**
     * Obituary Entity → 레거시 flat 객체 변환 (Search.html showObituaryDetail 등 호환)
     * @param {Object} entity - Obituary 엔티티 (deceasedInfo, funeralInfo, bereaved 등)
     * @returns {Object} flat 형식 부고 객체
     */
    function entityToFlat(entity) {
        if (!entity) return null;
        const d = entity.deceasedInfo || {};
        const f = entity.funeralInfo || {};
        const bereavedArr = entity.bereaved || [];
        const bereavedList = bereavedArr.map(function(b) {
            return ((b.relationship || '') + ' ' + (b.name || '')).trim();
        }).filter(Boolean).join(', ');

        return {
            id: entity.id,
            deceasedName: d.name,
            age: d.age,
            title: d.title,
            gender: d.gender,
            deathDate: d.deathDate,
            deathTime: d.deathTime,
            funeralHallName: f.funeralHallName,
            funeralHallAddress: f.funeralHallAddress,
            funeralHallPhone: f.funeralHallPhone,
            room: f.room,
            departureDate: f.departureDate,
            departureTime: f.departureTime,
            cemetery: f.cemetery,
            coffinDate: f.coffinDate,
            coffinTime: f.coffinTime,
            bereaved: bereavedArr,
            bereavedList: bereavedList,
            additionalInfo: entity.additionalInfo,
            selectedTemplate: entity.selectedTemplate,
            photoData: entity.portraitImage,
            portraitImage: entity.portraitImage,
            viewCount: entity.viewCount != null ? entity.viewCount : 0,
            timestamp: entity.createdAt,
            updateTimestamp: entity.updatedAt,
            password: '(암호화됨)',
            applicantName: '',
            applicantPhone: '',
            applicantEmail: '',
            applicantRelationship: '',
            completedAt: entity.updatedAt,
            shortLink: '',
            accountData: '',
            accountInfo: null,
            accountHolder: '',
            bankName: '',
            accountNumber: '',
            useAccount: undefined,
            usePhoto: undefined,
            bereavedData: ''
        };
    }

    function init() {
        var service = getService();
        if (service && typeof service.getObituaryById === 'function') {
            return Promise.resolve();
        }
        return Promise.reject(new Error('ObituaryService를 찾을 수 없습니다.'));
    }

    function searchByDeceasedName(deceasedName) {
        var service = getService();
        if (!service) return Promise.resolve([]);
        return service.searchObituariesByDeceasedName(deceasedName).then(function(list) {
            return (list || []).map(entityToFlat);
        });
    }

    function verifyPassword(obituaryId, password) {
        var service = getService();
        if (!service) return Promise.resolve(false);
        return service.verifyObituaryPassword(obituaryId, password);
    }

    function getObituaryById(id) {
        var service = getService();
        if (!service) return Promise.resolve(null);
        return service.getObituaryById(id).then(function(entity) {
            return entity ? entityToFlat(entity) : null;
        });
    }

    function deleteObituary(obituaryId, password) {
        var service = getService();
        if (!service) return Promise.resolve({ success: false, message: '서비스를 사용할 수 없습니다.' });

        if (password !== undefined && password !== null && password !== '') {
            return service.deleteObituary(obituaryId, password)
                .then(function(success) {
                    return { success: !!success, message: success ? '' : '삭제에 실패했습니다.' };
                })
                .catch(function(err) {
                    return { success: false, message: err && err.message ? err.message : '삭제 중 오류가 발생했습니다.' };
                });
        }
        if (typeof sessionStorage !== 'undefined' && (function() {
            var token = sessionStorage.getItem('adminAuthToken');
            if (!token) return false;
            try {
                var parts = token.split('.');
                if (parts.length !== 2) return false;
                var ts = parseInt(parts[1], 10);
                return !isNaN(ts) && (Date.now() - ts) < 30 * 60 * 1000;
            } catch (e) { return false; }
        })()) {
            return service.deleteObituaryAsAdmin(obituaryId)
                .then(function(success) {
                    return { success: !!success, message: success ? '' : '삭제에 실패했습니다.' };
                })
                .catch(function(err) {
                    return { success: false, message: err && err.message ? err.message : '삭제 중 오류가 발생했습니다.' };
                });
        }
        return Promise.resolve({ success: false, message: '비밀번호가 필요합니다.' });
    }

    function getAllObituaries() {
        var service = getService();
        if (!service) return Promise.resolve([]);
        return service.getAllObituaries().then(function(list) {
            return (list || []).map(entityToFlat);
        });
    }

    function clearDatabase() {
        var service = getService();
        if (!service) return Promise.resolve(false);
        return service.clearAllObituaries().then(function() {
            return true;
        }).catch(function() {
            return false;
        });
    }

    function searchByFuneralHall(keyword) {
        if (!keyword || !keyword.trim()) return Promise.resolve([]);
        return getAllObituaries().then(function(all) {
            var k = keyword.toLowerCase();
            return all.filter(function(o) {
                var name = (o.funeralHallName || '').toLowerCase();
                return name.indexOf(k) !== -1;
            });
        });
    }

    window.obituaryDB = {
        init: function() {
            return init();
        },
        searchByDeceasedName: searchByDeceasedName,
        searchByFuneralHall: searchByFuneralHall,
        verifyPassword: verifyPassword,
        getObituaryById: getObituaryById,
        deleteObituary: deleteObituary,
        getAllObituaries: getAllObituaries,
        clearDatabase: clearDatabase
    };
})();
