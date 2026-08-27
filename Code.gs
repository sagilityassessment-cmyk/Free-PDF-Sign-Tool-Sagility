function doGet() {
  return jsonResponse({ success: true, message: 'Sagility email service is running.' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No request body received.');
    }

    var data;
    var contentType = String(e.postData.type || '').toLowerCase();
    if (contentType.indexOf('application/json') === 0 || contentType.indexOf('text/plain') === 0) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }
    var email = String(data.email || '').trim();
    var name = String(data.name || '').trim();
    var pdfBase64 = String(data.pdfBase64 || '').trim();
    var filename = String(data.filename || 'Sagility-eSign-Forms.pdf').trim();
    var requestId = String(data.requestId || '');

    if (!email || !name || !pdfBase64) {
      throw new Error('Missing email, name, or PDF data.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('Invalid email address.');
    }

    var attachment = Utilities.newBlob(
      Utilities.base64Decode(pdfBase64),
      'application/pdf',
      filename
    );
    var body = 'Hi ' + name + ',\n\n' +
      'Kindly review the attached PDF file containing your eSign forms. Once completed, please return the signed PDF to the Sagility email thread where you received these eSign forms.\n\n' +
      'Please note that this is an automated email. Do not reply directly to this message.\n\n' +
      'Thank you for your cooperation.\n\n' +
      'Sagility Recruitment Team';

    MailApp.sendEmail({
      to: email,
      subject: 'Sagility eSign Forms',
      body: body,
      attachments: [attachment]
    });

    return htmlResponse('Email sent successfully.', true, requestId);
  } catch (error) {
    console.error(error.stack || error.message || error);
    return htmlResponse('Email could not be sent: ' + (error.message || String(error)), false, requestId);
  }
}

function htmlResponse(message, success, requestId) {
  var result = JSON.stringify({
    type: 'sagility-email-result',
    success: Boolean(success),
    message: message,
    requestId: requestId || ''
  }).replace(/</g, '\\u003c');
  return HtmlService
    .createHtmlOutput('<!doctype html><title>Sagility email service</title><p>' + escapeHtml(message) + '</p><script>parent.postMessage(' + result + ', "*");</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
