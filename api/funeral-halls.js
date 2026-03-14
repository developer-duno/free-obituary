/**
 * Vercel Serverless Proxy for Kakao Local API
 * 카카오 로컬 API 프록시 - API 키 보호
 *
 * GET /api/funeral-halls?query=아산&page=1
 */
export default async function handler(req, res) {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, page = '1' } = req.query;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: '검색어는 2글자 이상이어야 합니다.' });
    }

    const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;
    if (!KAKAO_API_KEY) {
        console.error('KAKAO_REST_API_KEY environment variable is not set');
        return res.status(500).json({ error: '서버 설정 오류' });
    }

    try {
        const searchQuery = query.trim() + ' 장례식장';
        const params = new URLSearchParams({
            query: searchQuery,
            page: String(Math.min(Math.max(parseInt(page, 10) || 1, 1), 3)),
            size: '10',
        });

        const response = await fetch(
            'https://dapi.kakao.com/v2/local/search/keyword.json?' + params,
            {
                headers: {
                    Authorization: 'KakaoAK ' + KAKAO_API_KEY,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Kakao API error:', response.status, errorText);
            return res.status(502).json({ error: '외부 API 오류' });
        }

        const data = await response.json();

        const results = (data.documents || []).map((doc) => ({
            name: doc.place_name,
            address: doc.road_address_name || doc.address_name,
            phone: doc.phone || '',
            category: doc.category_name || '',
            x: doc.x,
            y: doc.y,
        }));

        return res.status(200).json({
            results,
            total: data.meta?.total_count || 0,
            hasMore: !(data.meta?.is_end ?? true),
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}
