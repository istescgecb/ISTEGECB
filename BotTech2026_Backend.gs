// I (Trinita) am keeping this here temporarily until bottech is completed

const EVENT_SHEET = "BOTTECH2026";
const ERROR_SHEET = "Errors";
const ISTE_VERIFICATION_SHEET = "ISTE_Members";
const DRIVE_FOLDER = "BOTTECH_Payments_2026";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({
          result: "error",
          message: "Invalid request"
        }))
        .setMimeType(ContentService.MimeType.TEXT);
    }

    const data = JSON.parse(e.postData.contents);

    // Handle ISTE verification request
    if (data.action === "verifyISTE") {
      return verifyISTEID(data.isteId, data.email);
    }

    // Handle normal registration
    const clean = validateData(data);

    let fileUrl = "-";
    if (clean.base64 && clean.filename && clean.type) {
      fileUrl = saveFile(clean);
    }

    const sheet = selectOrCreateSheet(EVENT_SHEET);
    appendRegistration(sheet, clean, fileUrl);

    SpreadsheetApp.flush();
    return successResponse();

  } catch (err) {
    Logger.log(err);
    logError(err);
    return errorResponse(err);
  }
}

/**
 * Verify ISTE ID against email
 * Returns JSON with verified: true/false
 */
function verifyISTEID(isteId, email) {
  try {
    if (!isteId || !email) {
      throw new Error("ISTE ID and email are required");
    }

    const ss = SpreadsheetApp.openById("1vqnLMk3Vqhwyp20ok6YHjiBScQrIMyNkICHNLhjh_eg");
    
    // Try to find any sheet with "ISTE" in the name (flexible sheet naming)
    let verifySheet = ss.getSheetByName(ISTE_VERIFICATION_SHEET);
    
    // If not found, search for sheet with "ISTE" in name
    if (!verifySheet) {
      const sheets = ss.getSheets();
      for (let sheet of sheets) {
        if (sheet.getName().toLowerCase().includes("iste")) {
          verifySheet = sheet;
          break;
        }
      }
    }

    if (!verifySheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          verified: false,
          message: "ISTE verification sheet not found. Available sheets: " + ss.getSheets().map(s => s.getName()).join(", ")
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get all data from verification sheet
    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];
    
    Logger.log("Sheet name: " + verifySheet.getName());
    Logger.log("Headers: " + headers);
    Logger.log("Total rows: " + data.length);
    
    // Find column indices (case-insensitive)
    let isteIdColIndex = -1;
    let emailColIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toString().toLowerCase().trim();
      if (header.includes("iste") && header.includes("id")) {
        isteIdColIndex = i;
      }
      if (header.includes("email")) {
        emailColIndex = i;
      }
    }

    if (isteIdColIndex === -1 || emailColIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          verified: false,
          message: "Columns not found. Need 'ISTE ID' and 'Email' columns. Found: " + headers.join(", ")
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const searchIsteId = isteId.toString().trim();
    const searchEmail = email.toString().trim().toLowerCase();
    
    Logger.log("Searching for ISTE ID: " + searchIsteId);
    Logger.log("Searching for Email: " + searchEmail);

    // Search for matching ISTE ID AND Email pair
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[isteIdColIndex] && row[emailColIndex]) {
        const rowIsteId = row[isteIdColIndex].toString().trim();
        const rowEmail = row[emailColIndex].toString().trim().toLowerCase();
        
        Logger.log("Row " + i + " - ISTE ID: " + rowIsteId + ", Email: " + rowEmail);
        
        if (rowIsteId === searchIsteId && rowEmail === searchEmail) {
          Logger.log("Match found!");
          return ContentService
            .createTextOutput(JSON.stringify({
              verified: true,
              message: "ISTE ID and email verified successfully"
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // No match found
    Logger.log("No matching ISTE ID and email pair found");
    return ContentService
      .createTextOutput(JSON.stringify({
        verified: false,
        message: "ISTE ID and email do not match. Please verify your information."
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Error: " + err);
    return ContentService
      .createTextOutput(JSON.stringify({
        verified: false,
        message: "Error: " + err.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function validateData(obj) {
  const required = ["Name", "Email", "College", "Year", "Branch", "PhoneNumber", "IsISTE", "HasLaptop", "PaymentRequired"];

  required.forEach(f => {
    if (!obj[f] || obj[f].toString().trim() === "") {
      throw new Error(`Missing field: ${f}`);
    }
  });

  obj.Name = obj.Name.trim();
  obj.Email = obj.Email.trim().toLowerCase();
  obj.College = obj.College.trim();
  obj.Year = obj.Year.trim();
  obj.Branch = obj.Branch.trim();
  obj.PhoneNumber = obj.PhoneNumber.trim();
  obj.IsISTE = obj.IsISTE === "Yes" ? "Yes" : "No";
  obj.HasLaptop = obj.HasLaptop === "Yes" ? "Yes" : "No";
  obj.PaymentRequired = obj.PaymentRequired === "No" ? "No" : "Yes";

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.Email)) {
    throw new Error("Invalid email address");
  }

  // Phone number validation
  if (!/^\d{10}$/.test(obj.PhoneNumber)) {
    throw new Error("Invalid phone number (expect 10 digits)");
  }

  // If user is an ISTE member, require ISTE ID and verification
  if (obj.IsISTE === "Yes") {
    if (!obj.ISTEId || obj.ISTEId.trim() === "") {
      throw new Error("ISTE ID required for ISTE members");
    }
    obj.ISTEId = obj.ISTEId.trim();

    // Verify that ISTE ID was verified with email
    if (obj.ISTEVerified !== "true") {
      throw new Error("ISTE ID must be verified with email before registration");
    }

    // ISTE members are NOT exempt - payment required for everyone
    obj.PaymentRequired = "Yes";
  } else {
    obj.ISTEId = "-";
  }

  // Payment proof is mandatory for everyone
  if (obj.PaymentRequired === "Yes") {
    if (!obj.base64 || !obj.filename || !obj.type) {
      throw new Error("Payment proof (file) is required for registration.");
    }
    // basic sanity check for base64 string
    if (typeof obj.base64 !== 'string' || obj.base64.indexOf(' ') >= 0) {
      throw new Error("Invalid payment proof format.");
    }
  }

  return obj;
}

function saveFile(obj) {
  const folder = getOrCreateFolder(DRIVE_FOLDER);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(obj.base64),
    obj.type,
    obj.filename
  );

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function appendRegistration(sheet, obj, fileUrl) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Payment Proof",
      "Name",
      "Email",
      "College",
      "Year",
      "Branch",
      "Phone Number",
      "ISTE Member",
      "ISTE ID",
      "Has Laptop",
      "Payment Required"
    ]);
  }

  sheet.appendRow([
    new Date().toLocaleString(),
    fileUrl,
    obj.Name,
    obj.Email,
    obj.College,
    obj.Year,
    obj.Branch,
    obj.PhoneNumber,
    obj.IsISTE,
    obj.ISTEId,
    obj.HasLaptop,
    obj.PaymentRequired
  ]);
}

function selectOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById("1vqnLMk3Vqhwyp20ok6YHjiBScQrIMyNkICHNLhjh_eg");
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function successResponse() {
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.TEXT);
}

function errorResponse(err) {
  return ContentService
    .createTextOutput(JSON.stringify({
      result: "error",
      message: err.message
    }))
    .setMimeType(ContentService.MimeType.TEXT);
}

function logError(err) {
  const sheet = selectOrCreateSheet(ERROR_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Error"]);
  }
  const message = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? "\n" + err.stack : "";
  sheet.appendRow([new Date().toLocaleString(), message + stack]);
}
