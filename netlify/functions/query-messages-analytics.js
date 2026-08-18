const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    let { projectId, authToken, spaceUrl, to, from, startDate, endDate } = body;

    // Normalize phone numbers to E.164 before sending to SignalWire.
    // Accepts common formats: (606) 759-0004, 606-759-0004, 6067590004, +16067590004
    const normalizeToE164 = (input) => {
      if (!input) return '';
      const cleaned = String(input).replace(/[\s\-\(\)\.]/g, '').trim();
      if (!cleaned) return '';
      if (cleaned.startsWith('+')) return cleaned;
      const digits = cleaned.replace(/\D/g, '');
      if (!digits) return '';
      if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
      if (digits.length === 10) return '+1' + digits;
      return '+' + digits;
    };

    to = to ? normalizeToE164(to) : to;
    from = from ? normalizeToE164(from) : from;

    console.log('Received request:', { to, from, startDate, endDate });

    // Validate E.164 format for phone numbers if provided
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (to && !e164Regex.test(to)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid "To" phone number format. Must be E.164 format (e.g., +12345678901)' })
      };
    }

    if (from && !e164Regex.test(from)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid "From" phone number format. Must be E.164 format (e.g., +12345678901)' })
      };
    }

    // Build URL with query parameters
    const baseUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
    const queryParams = new URLSearchParams();

    if (to) {
      queryParams.append('To', to);
    }
    if (from) {
      queryParams.append('From', from);
    }

    // Build the URL with standard params first
    let url = baseUrl;
    const standardParams = queryParams.toString();

    // Manually append date filters without encoding the comparison operators
    const dateParams = [];
    if (startDate) {
      dateParams.push(`DateSent>=${encodeURIComponent(startDate)}`);
    }
    if (endDate) {
      dateParams.push(`DateSent<=${encodeURIComponent(endDate)}`);
    }

    // Combine all parameters
    const allParams = [standardParams, ...dateParams].filter(p => p).join('&');
    if (allParams) {
      url = `${baseUrl}?${allParams}`;
    }

    console.log('Request URL:', url);

    // Make direct HTTP request with Basic Auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${projectId}:${authToken}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SignalWire API error:', errorText);
      throw new Error(`SignalWire API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const messages = result.messages || [];

    console.log('Messages received from API:', messages.length);

    // Format message data for analytics
    const data = messages.map((record) => ({
      sid: record.sid || '',
      from: record.from || '',
      to: record.to || '',
      dateSent: record.date_sent || record.dateSent || '',
      status: record.status || '',
      direction: record.direction || '',
      errorCode: record.error_code || record.errorCode || null,
      errorMessage: record.error_message || record.errorMessage || null,
      body: record.body || '',
      numSegments: record.num_segments || record.numSegments || 0,
      price: record.price || 0,
      priceUnit: record.price_unit || record.priceUnit || 'USD'
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: data,
        filters: {
          to: to || null,
          from: from || null,
          startDate: startDate || null,
          endDate: endDate || null
        },
        totalCount: data.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
