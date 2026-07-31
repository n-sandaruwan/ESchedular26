// Google Sheets & Drive Integration Module for eSchedular26

const SHEET_CSV_URL_KEY = 'eschedular26_google_sheet_csv_url';
const SHEET_WEBHOOK_URL_KEY = 'eschedular26_google_sheet_webhook_url';

export const getStoredSheetCsvUrl = () => {
  return localStorage.getItem(SHEET_CSV_URL_KEY) || '';
};

export const saveStoredSheetCsvUrl = (url) => {
  localStorage.setItem(SHEET_CSV_URL_KEY, url.trim());
};

export const getStoredSheetWebhookUrl = () => {
  return localStorage.getItem(SHEET_WEBHOOK_URL_KEY) || '';
};

export const saveStoredSheetWebhookUrl = (url) => {
  localStorage.setItem(SHEET_WEBHOOK_URL_KEY, url.trim());
};

// Copy-Paste ready Google Apps Script Template for Google Sheets
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
// =================================================================
// PASTE THIS IN YOUR GOOGLE SHEET (Extensions -> Apps Script)
// =================================================================
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Append row: Timestamp, Type, Title/Module, Date/Time, Status, Details
    sheet.appendRow([
      new Date(),
      data.type || 'Schedule Update',
      data.title || data.module || 'N/A',
      data.date || new Date().toISOString().split('T')[0],
      data.status || 'Active',
      data.details || data.content || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();

// Helper to parse CSV text from Published Google Sheet
export const parseGoogleSheetCSV = (csvText) => {
  const lines = csvText.split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple Regex CSV parser handling quoted strings
    const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const cleanRow = row.map((cell) => cell.replace(/^"|"$/g, '').trim());

    if (cleanRow.length > 0) {
      records.push({
        date: cleanRow[0] || '',
        module: cleanRow[1] || '',
        status: cleanRow[2] || 'Scheduled',
        time: cleanRow[3] || '',
        venue: cleanRow[4] || '',
        reason: cleanRow[5] || '',
      });
    }
  }

  return records;
};

// Fetch live schedule data from published Google Sheet CSV URL
export const fetchScheduleFromGoogleSheet = async (csvUrlOverride) => {
  const url = csvUrlOverride || getStoredSheetCsvUrl();
  if (!url) {
    throw new Error('Google Sheet CSV URL is not configured.');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} when fetching Google Sheet`);
    }
    const csvText = await response.text();
    const records = parseGoogleSheetCSV(csvText);

    if (records.length > 0) {
      localStorage.setItem('mis_schedule_overrides_drive', JSON.stringify(records));
      return { success: true, count: records.length, records };
    }
    return { success: true, count: 0, records: [] };
  } catch (err) {
    console.error('Failed to fetch Google Sheet from Drive:', err);
    throw err;
  }
};

// Push live changes (cancellation, notice, lab attendance) to Google Apps Script Webhook
export const pushRecordToGoogleSheetWebhook = async (payload) => {
  const webhookUrl = getStoredSheetWebhookUrl();
  if (!webhookUrl) return;

  try {
    // Mode no-cors for Google Apps Script Webhook
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('✅ Synced update to Google Sheet Webhook:', payload);
  } catch (err) {
    console.error('Failed to push update to Google Sheet Webhook:', err);
  }
};
