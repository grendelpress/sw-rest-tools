const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
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
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { projectId, authToken, spaceUrl, startDate, endDate, pageSize = 1000 } = body;

    if (!projectId || !authToken || !spaceUrl || !startDate || !endDate) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required parameters: projectId, authToken, spaceUrl, startDate, endDate' })
      };
    }

    const baseUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
    const queryParams = new URLSearchParams();
    queryParams.append('PageSize', pageSize.toString());

    const dateParams = [];
    dateParams.push(`DateSent>=${encodeURIComponent(startDate)}`);
    dateParams.push(`DateSent<=${encodeURIComponent(endDate)}`);

    const allParams = [queryParams.toString(), ...dateParams].filter(p => p).join('&');
    const url = `${baseUrl}?${allParams}`;

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
        count: data.length,
        dateRange: {
          start: startDate,
          end: endDate
        },
        hasMore: result.next_page_uri ? true : false,
        nextPageUri: result.next_page_uri || null
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
