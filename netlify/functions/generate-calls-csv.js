const { RestClient } = require('@signalwire/compatibility-api');

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
    const { projectId, authToken, spaceUrl, startDate, endDate } = JSON.parse(event.body);
    
    const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });
    
    // Fetch project details to get the friendly name
    const project = await client.api.accounts(projectId).fetch();
    const projectName = project.friendlyName || 'UnnamedProject';
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Build query options for date filtering
    const queryOptions = {};
    if (startDate) {
      queryOptions.startTimeAfter = new Date(startDate + 'T00:00:00Z');
    }
    if (endDate) {
      queryOptions.startTimeBefore = new Date(endDate + 'T23:59:59Z');
    }
    
    const calls = await client.calls.list(queryOptions);
    
    const data = calls.map((record) => ({
      callSid: record.sid || '',
      parentCallSid: record.parentCallSid || '',
      from: record.from || '',
      to: record.to || '',
      startTime: record.startTime ? record.startTime.toString() : '',
      endTime: record.endTime ? record.endTime.toString() : '',
      duration: record.duration || '',
      status: record.status || '',
      direction: record.direction || '',
      answeredBy: record.answeredBy || '',
      forwardedFrom: record.forwardedFrom || '',
      callerName: record.callerName || '',
      price: record.price || '',
      priceUnit: record.priceUnit || ''
    }));

    // Create CSV content
    const headers = ['Call SID', 'Parent Call SID', 'From', 'To', 'Start Time', 'End Time', 'Duration (seconds)', 'Status', 'Direction', 'Answered By', 'Forwarded From', 'Caller Name', 'Price', 'Price Unit'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.callSid}"`,
        `"${row.parentCallSid}"`,
        `"${row.from}"`,
        `"${row.to}"`,
        `"${row.startTime}"`,
        `"${row.endTime}"`,
        `"${row.duration}"`,
        `"${row.status}"`,
        `"${row.direction}"`,
        `"${row.answeredBy}"`,
        `"${row.forwardedFrom}"`,
        `"${row.callerName}"`,
        `"${row.price}"`,
        `"${row.priceUnit}"`
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Calls_${cleanProjectName}.csv`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`
      },
      body: csvContent
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