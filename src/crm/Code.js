function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = ["Timestamp", "User ID", "Email", "First Name", "Last Name", "Status", "LTV ($)", "Last Action"];
  
  // Set headers only if the first row is empty
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  if (!headerRange.getValue()) {
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, headers.length);
  }
}

function doPost(e) {
  try {
    // We expect the payload to be JSON
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data provided" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure headers exist
    setupHeaders();
    
    // Parse incoming data
    const timestamp = new Date().toISOString();
    const userId = payload.user_id || "";
    const email = payload.email || "";
    const firstName = payload.first_name || "";
    const lastName = payload.last_name || "";
    const status = payload.status || "Lead"; // Lead, Subscriber, Churned
    const ltv = payload.ltv || 0;
    const lastAction = payload.last_action || "";

    // Check if user already exists in the CRM by iterating through emails (Column 3)
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (data[i][2] === email || data[i][1] === userId) {
        rowIndex = i + 1; // Apps Script ranges are 1-indexed
        break;
      }
    }

    if (rowIndex > -1) {
      // Update existing record (only overwrite non-empty new values)
      sheet.getRange(rowIndex, 1).setValue(timestamp);
      if (firstName) sheet.getRange(rowIndex, 4).setValue(firstName);
      if (lastName) sheet.getRange(rowIndex, 5).setValue(lastName);
      if (status) sheet.getRange(rowIndex, 6).setValue(status);
      if (ltv > 0) sheet.getRange(rowIndex, 7).setValue(ltv);
      if (lastAction) sheet.getRange(rowIndex, 8).setValue(lastAction);
    } else {
      // Append new row
      sheet.appendRow([timestamp, userId, email, firstName, lastName, status, ltv, lastAction]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
