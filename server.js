const express = require('express');
const path = require('path');
const { RestClient } = require('@signalwire/compatibility-api');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/generate-csv', async (req, res) => {
  const { projectId, authToken, spaceUrl } = req.body;
  
  try {
    const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });
    
    // Fetch project details to get the friendly name
    const project = await client.api.accounts(projectId).fetch();
    const projectName = project.friendlyName || 'UnnamedProject';
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();
    
    const data = incomingPhoneNumbers.map((record) => ({
      phoneNumber: record.phoneNumber,
      friendlyName: record.friendlyName,
      phoneNumberSid: record.sid,
      projectSid: record.accountSid
    }));

    // Create CSV content
    const headers = ['Phone Number', 'Name', 'Phone Number SID', 'Project SID'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.phoneNumber,
        row.friendlyName || '',
        row.phoneNumberSid,
        row.projectSid
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `PhoneNumbers_${cleanProjectName}.csv`;

    // Send CSV directly in response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});