# Document Analysis API

This document provides example requests and responses for the Document Analysis module.

## Endpoint
**POST** `/api/document/analyze`

## 1. Example Request: Initial Upload (New Session)

When uploading a document for the first time, you must provide the file and the initial prompt.

### cURL
```bash
curl --location 'http://localhost:5000/api/document/analyze' \
--form 'file=@"/path/to/your/resume.pdf"' \
--form 'prompt="Summarize this document."'
```

### Node.js (Axios)
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const data = new FormData();
data.append('file', fs.createReadStream('/path/to/your/resume.pdf'));
data.append('prompt', 'Summarize this document.');

axios.post('http://localhost:5000/api/document/analyze', data, {
  headers: {
    ...data.getHeaders()
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## 2. Example Request: Follow-up Question (Reuse Session)

Once a session is active, you can send follow-up questions using the `sessionId` returned from the initial request. You do not need to upload the file again.

### cURL
```bash
curl --location 'http://localhost:5000/api/document/analyze' \
--header 'Content-Type: application/json' \
--data '{
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "prompt": "Generate 5 interview questions from this document."
}'
```

### Node.js (Axios)
```javascript
const axios = require('axios');

const data = {
  sessionId: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  prompt: 'Generate 5 interview questions from this document.'
};

axios.post('http://localhost:5000/api/document/analyze', data, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## 3. Example Responses

### Success Response
When the analysis is successful (either initial upload or follow-up), you will receive a response structured like this:

```json
{
    "success": true,
    "documentId": "1b2345c6-d789-01e2-f345-67890abcdef1",
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "filename": "resume.pdf",
    "mimeType": "application/pdf",
    "pageCount": 3,
    "uploadedAt": "2026-07-18T10:00:00.000Z",
    "response": "The provided document is a resume for John Doe. He has 5 years of experience as a software engineer..."
}
```

*Note: `pageCount` will be `null` if the Gemini File API processed the document natively and the fallback parser wasn't required to count the pages.*

### Error Response (Validation Error)
```json
{
    "success": false,
    "error": "A file must be uploaded for a new session."
}
```

### Error Response (Expired / Invalid Session)
```json
{
    "success": false,
    "error": "Session not found or expired. Please upload the document again."
}
```
