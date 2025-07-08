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
      queryOptions.dateCreatedAfter = new Date(startDate + 'T00:00:00Z');
    }
    if (endDate) {
      queryOptions.dateCreatedBefore = new Date(endDate + 'T23:59:59Z');
    }
    
    const bins = await client.api.accounts(projectId).lamlBins.list(queryOptions);
    
    const data = bins.map((record) => ({
      binSid: record.sid || '',
      name: record.name || '',
      dateCreated: record.dateCreated ? record.dateCreated.toString() : '',
      dateUpdated: record.dateUpdated ? record.dateUpdated.toString() : '',
      dateLastAccessed: record.dateLastAccessed ? record.dateLastAccessed.toString() : '',
      accountSid: record.accountSid || '',
      contents: record.contents || '',
      requestUrl: record.requestUrl || '',
      apiVersion: record.apiVersion || '',
      uri: record.uri || ''
    }));

    // Create CSV content
    const headers = ['Bin SID', 'Name', 'Date Created', 'Date Updated', 'Date Last Accessed', 'Account SID', 'Contents', 'Request URL', 'API Version', 'URI'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.binSid}"`,
        `"${row.name}"`,
        `"${row.dateCreated}"`,
        `"${row.dateUpdated}"`,
        `"${row.dateLastAccessed}"`,
        `"${row.accountSid}"`,
        `"${row.contents.replace(/"/g, '""')}"`, // Escape quotes in XML content
        `"${row.requestUrl}"`,
        `"${row.apiVersion}"`,
        `"${row.uri}"`
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Bins-${cleanProjectName}.csv`;

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