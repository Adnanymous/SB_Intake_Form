const SHEET_NAME = "Sandbox Requests";
const HEADERS = [
  "id",
  "createdAt",
  "employeeName",
  "employeeEmail",
  "employeeTeam",
  "priority",
  "additionalFields",
  "merchantRequests",
  "desiredTimeline",
  "moreInfo",
];

function doGet() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return json_({ entries: [] });
  }

  const headers = values[0];
  const entries = [];

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const row = values[rowIndex];
    const entry = {};
    for (let colIndex = 0; colIndex < headers.length; colIndex += 1) {
      const header = headers[colIndex];
      let value = row[colIndex];
      if (value instanceof Date) {
        value = value.toISOString();
      }
      entry[header] = value;
    }
    entries.push(entry);
  }

  return json_({ entries });
}

function doPost(e) {
  let payload = {};
  if (e && e.postData && e.postData.contents) {
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (error) {
      payload = {};
    }
  }

  const entry = payload.entry || payload;
  const sheet = getSheet_();
  const row = HEADERS.map((header) => {
    if (header === "createdAt") {
      return entry.createdAt || new Date().toISOString();
    }
    return entry[header] || "";
  });

  sheet.appendRow(row);
  return json_({ ok: true });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
