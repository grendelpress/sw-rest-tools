// Fetches phone numbers and E911 addresses from SignalWire for use in dropdown pickers.
// SignalWire Relay REST endpoints use cursor-based pagination: a page_token (from links.next)
// is required for every page after page 0, so we follow the next-link cursor instead of
// blindly incrementing page_number.

async function _fetchViaProxy(credentials, apiPath, queryParams) {
    const response = await fetch('/.netlify/functions/phone-numbers-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...credentials,
            method: 'GET',
            apiPath,
            queryParams
        })
    });

    if (!response.ok) {
        let error;
        try {
            error = await response.json();
        } catch {
            const text = await response.text().catch(() => '');
            throw new Error(text || `Request failed: ${response.status}`);
        }
        const detail = error?.apiError
            ? _formatApiError(error.apiError)
            : (error?.error || `Request failed: ${response.status}`);
        throw new Error(detail);
    }

    const result = await response.json();
    if (!result.success) {
        const detail = result?.apiError
            ? _formatApiError(result.apiError)
            : (result?.error || 'Request failed');
        throw new Error(detail);
    }
    return result.data;
}

function _formatApiError(apiError) {
    if (!apiError) return 'Request failed';
    if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
        const msgs = apiError.errors.map(e =>
            typeof e === 'string' ? e : (e.detail || e.title || JSON.stringify(e))
        );
        return msgs.join('; ');
    }
    if (apiError.message) return apiError.message;
    if (apiError.error) return apiError.error;
    return JSON.stringify(apiError);
}

function _parsePageToken(nextUrl) {
    if (!nextUrl) return null;
    try {
        const url = new URL(nextUrl);
        return url.searchParams.get('page_token');
    } catch {
        const match = String(nextUrl).match(/[?&]page_token=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}

async function _fetchAllPages(credentials, apiPath, pageSize = 1000) {
    const allItems = [];
    let pageNumber = 0;
    let pageToken = null;

    while (true) {
        const queryParams = {
            page_number: String(pageNumber),
            page_size: String(pageSize)
        };
        if (pageToken) queryParams.page_token = pageToken;

        const data = await _fetchViaProxy(credentials, apiPath, queryParams);

        const items = Array.isArray(data.data) ? data.data : [];
        allItems.push(...items);

        const nextLink = data.links?.next;
        if (!nextLink) break;

        const nextToken = _parsePageToken(nextLink);
        if (!nextToken) break;

        pageToken = nextToken;
        pageNumber++;
    }

    return allItems;
}

export async function fetchPhoneNumbers(credentials) {
    const items = await _fetchAllPages(credentials, '/api/relay/rest/phone_numbers');
    return items.map(item => ({
        id: item.id,
        label: item.name
            ? `${item.number} (${item.name})`
            : item.number || item.id
    }));
}

export async function fetchE911Addresses(credentials) {
    const items = await _fetchAllPages(credentials, '/api/relay/rest/addresses');
    return items.map(item => {
        const street = [item.street_number, item.street_name].filter(Boolean).join(' ');
        const label = item.label
            ? `${item.label} — ${street || item.id}`
            : street || item.id;
        return { id: item.id, label };
    });
}
