const currentYear = getMembershipYear(4); // switches to new yr at april
const sheetName = "ISTE" + currentYear.slice(-2);
const gdriveFolderName = `Membership${currentYear}-${(Number(currentYear) + 1).toString().slice(-2)} Payment`;

const ambassador_appscript_url = getColumn("IDControl", "ambassador_deployement_url")["ambassador_deployement_url"][0]
const idSheet = selectOrCreateSheet("IDControl");
const powerful_emailsheet = selectOrCreateSheet("PowerFul_Emails");

const headers = {
    tracking: ["ID", "Amt Exptd", "Paid Amt","Comments","Link", "Name", "Year", "Gender", "Branch", "Email", "MobileNo", "MembershipType", "Referral", "Status"],
    emailSheet: ["Email", "ID"],
    error: ["Date", "Error Message"]
};




function test() {
    let trackingSheet = selectOrCreateSheet(currentYear);
    console.log(powerful_emailsheet.getLastRow());


    let emailSheet = selectOrCreateSheet("Emails");



    email_quota();




    // console.log(trackingSheet.getLastRow())
    // console.log(headers.tracking)


    console.log(getDriveFolderByName(gdriveFolderName).getUrl());

    const obj = {
        EmailId: "nithinasokancoc@gmail.com",
        Name: "Test User",
        Year: "2nd",
        Branch: "CSE",
        PhoneNumber: "9876543210",
        membershipOption: "FULL",
        Referral: "MDW51V"
    };



    console.log("Current Year", currentYear);
    console.log(sheetName)

    const id = "MEM1235467";

    // Call your function
    // trackEmailStatus(trackingSheet, obj, id, "Pending");


    // sendConfirmationEmail(obj, id, trackingSheet, emailSheet);
}


function doPost(e) {
    try {
        let obj = validateInput(e);
        let mainSheet = selectOrCreateSheet(sheetName);
        let emailSheet = selectOrCreateSheet("Emails");
        let trackingSheet = selectOrCreateSheet(currentYear);

        let id = generateUniqueId(obj.EmailId, obj.membershipOption);
        let newFile = saveFileToDrive(obj);
        let fileInfo = prepareFileInfo(newFile, obj);
        // to make id come at the end.
        fileInfo.ID = id;

        appendFileInfoToSheet(fileInfo, mainSheet);
        if (!isEmailExists(emailSheet, obj.EmailId)) {
            // if email dont exist

            trackEmailStatus(trackingSheet, fileInfo, id, 'Pending');
            sendConfirmationEmail(fileInfo, id, trackingSheet, emailSheet);
        }
        // calls ambassdor ur in ID control. 
        // update after redeployment of ambassador script
        refreshAmbassadorLeaderboard();  

        return createSuccessResponse();

    } catch (err) {
        Logger.log(err);
        return createErrorResponse(err);
    }
}


// Helper function to get academic/membership year
function getMembershipYear(switchMonth = 4) {
    let now = new Date();
    let currentYear = now.getFullYear();

    // If we haven't reached the switch month yet, use previous year
    if (switchMonth > now.getMonth()) {
        return (currentYear - 1).toString();
    } else {
        return currentYear.toString();
    }
}

//to validate the usesr input
function validateInput(e) {
    if (!e.postData.contents) throw new Error("No data provided");
    let obj = JSON.parse(e.postData.contents);
    if (!obj.base64 || !obj.type || !obj.filename) throw new Error("Missing required fields");

    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        }
    }

    // Update Variables
    obj.EmailId = obj.EmailId.toLowerCase();
    obj.Name = capitalizeName(obj.Name);
    obj.Referral = (obj.Referral ? obj.Referral.toUpperCase() : '-');
    obj.filename = formatFileName(obj.Name, obj.filename);

    return obj;
}



function generateUniqueId(email, membershipOption) {
    let sheet = selectOrCreateSheet("Emails");
    let data = sheet.getDataRange().getValues();

    // Check if email already exists and return existing ID
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email) {
            return data[i][1];
        }
    }

    // Email doesn't exist, generate new ID
    let currentId = idSheet.getRange("A1").getValue() || 0;

    // Get current year
    let prefix = sheetName; // "ISTE25"

    let result = "";
    let isUnique = false;

    while (!isUnique) {
        currentId++;

        // Generate ID based on membership option
        switch (membershipOption) {
            case "FULL":
                result = prefix + currentId.toString().padStart(3, '0');
                break;
            case "BR":
                result = prefix + "BR" + currentId.toString().padStart(3, '0');
                break;
            case "BZ":
                result = prefix + "BZ" + currentId.toString().padStart(3, '0');
                break;
            default:
                throw new Error("Invalid membership option: " + membershipOption);
        }

        // Check if this ID already exists
        isUnique = true;
        for (let i = 1; i < data.length; i++) {
            if (data[i][1] === result) {
                isUnique = false;
                console.log("id exists", result)
                break;
            }
        }
    }

    // Update the ID counter 
    idSheet.getRange("A1").setValue(currentId);

    return result;
}

// Helper function to select or create a sheet
function selectOrCreateSheet(sheetName, url = null) {
    let app;
    if (url) {
        app = SpreadsheetApp.openByUrl(url);
    } else {
        app = SpreadsheetApp.getActiveSpreadsheet();
    }
    let sheet = app.getSheetByName(sheetName.trim());
    return sheet ? sheet : app.insertSheet(sheetName.trim());
}

// made for repetitive sheet append code but only used for error response and email
function appendToSheet(sheet, values, header) {
    if (sheet.getLastRow() === 0) sheet.appendRow(header);
    sheet.appendRow(values);
}


// NOTE: The user running this script needs access to the PAYMENT folder.
// Also, if transferring ownership to istegecbh@gmail.com fails, it's usually
// because Google blocks it between different organizational(student) accounts.
// Func: If the folder doesn't exist, create it inside the payment folder
function getDriveFolderByName(folderName) {
    const paymentFolderID = '1xKkTPIQbNw-1rwgSgRuTbZUJYXFJaDTt';
    const paymentFolder = DriveApp.getFolderById(paymentFolderID);
    const folderIterator = paymentFolder.getFoldersByName(folderName);

    if (!folderIterator.hasNext()) {
        const newFolder = paymentFolder.createFolder(folderName);
        // may cause error due to some reason dk
        try{
          newFolder.setOwner('istegecbh@gmail.com');
        }catch(err){
          Logger.log(err);
        }
        return newFolder;
    }
    const existingFolder = folderIterator.next();

    return existingFolder;
}



// create formatted filename: DATE NAME TIME
function formatFileName(name, filename) {
    let dateTime = new Date();
    let timeZone = Session.getScriptTimeZone();

    // 1. Get the Date and Time as separate strings
    let dateStr = Utilities.formatDate(dateTime, timeZone, "d-MMM-yy");
    let timeStr = Utilities.formatDate(dateTime, timeZone, "h-mma");

    // 2. Extract the first name properly and clean it
    let firstName = name.split(" ")[0];
    let cleanName = firstName.replace(/[^a-zA-Z0-9]/g, "_").trim();

    // 3. Get the file extension
    let ext = filename.split('.').pop();

    // 4. Assemble in order: DATE NAME TIME
    let newFilename = `${dateStr} ${timeStr} ${cleanName}.${ext}`;

    return newFilename;
}



//save to drive 
function saveFileToDrive(obj) {
    let decodedData = Utilities.base64Decode(obj.base64);
    let folder = getDriveFolderByName(gdriveFolderName);
    let blob = Utilities.newBlob(decodedData, obj.type, obj.filename);
    return folder.createFile(blob);
}

//returns object containing drive link, time and date and rest of the object
function prepareFileInfo(newFile, obj) {
    let dateTime = new Date();
    // setowner to istesc

      try{
    newFile.setOwner("istescgecb@gmail.com") // REMOVE IF NEEDED __ CULD CAUSE MANY EMAILS I BELIEVE
        }catch(err){
          Logger.log(err);
          appendToErrorSheet("payment file: owner -> istesc failed.");
        }
    
    // deleting file data (base64 and all too big can cause form to lag)
    delete obj.base64;
    delete obj.type;
    return {
        Time: dateTime.toLocaleTimeString(),
        Date: dateTime.toLocaleDateString(),
        ...obj,
        Link: newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW).getUrl(),
        ID: ""
    };
}




function isEmailExists(sheet, email) {
    if (sheet.getLastRow() < 2) return false;
    let data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    return data.some(row => row[0] === email);
}


function appendFileInfoToSheet(fileInfo, sheet) {
    if (sheet.getLastRow() === 0) sheet.appendRow(Object.keys(fileInfo));
    sheet.appendRow(Object.values(fileInfo));
}


function trackEmailStatus(sheet, obj, id, status) {
    if (sheet.getLastRow() === 0) sheet.appendRow(headers.tracking);

    sheet.appendRow([
        id,
        obj.Amount || "N/A",
        "", 
        "",
        obj.Link,
        obj.Name,
        obj.Year,
        obj.Gender,
        obj.Branch,

        obj.EmailId,
        obj.PhoneNumber,

        obj.membershipOption,
        obj.Referral,
        status
    ]);
}

function sendConfirmationEmail(obj, id, trackingSheet, emailSheet) {
    let membershipText = "ISTE ";
    switch (obj.membershipOption) {
        case "BR":
            membershipText = "ISTE + BARTONAIR";
            break;
        case "BZ":
            membershipText = "ISTE + BARTONOIDZ";
            break;
        case "FULL":
            membershipText = "ISTE + BARTONAIR + BARTONOIDZ";
            break;
    }
    let subject = "Successfully registered to ISTE SC GECB";
    let name = obj.Name;
    name = name.replace(/\b(\w)/g, s => s.toUpperCase());
    name = name.split(" ")[0];
    let body = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - ISTE</title>
</head>

<body>
    <!-- <div style="height:0px;max-height:0;width:0px;overflow:hidden;opacity:0">This is a copy of the message you sent to ISTE. Please don't reply...</div> -->
    <div style="height:0px;max-height:0;width:0px;overflow:hidden;opacity:0">
        Congratulations <strong>${(name || "Member").split(" ")[0]}</strong> on your ISTE membership !!
        &nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;
        ͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp;͏&nbsp; </div>
    <div
        style="margin:0px;width:100%;background-color:#f3f2f0;padding:0px;padding-top:8px;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Fira Sans',Ubuntu,Oxygen,'Oxygen Sans',Cantarell,'Droid Sans','Apple Color Emoji','Segoe UI Emoji','Segoe UI Emoji','Segoe UI Symbol','Lucida Grande',Helvetica,Arial,sans-serif">
        <table role="presentation" valign="top" border="0" cellspacing="0" cellpadding="0" width="512" align="center"
            style="margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px;width:512px;max-width:512px;padding:0px">
            <tbody>
                <tr>
                    <td>
                        <table role="presentation" valign="top" border="0" cellspacing="0" cellpadding="0" width="100%"
                            style="background-color:#ffffff">
                            <tbody>
                                <tr>
                                    <td style="padding:24px;text-align:center">
                                        <table role="presentation" valign="top" border="0" cellspacing="0"
                                            cellpadding="0" width="100%" style="min-width:100%">
                                            <tbody>
                                                <tr>
                                                    <td align="left" valign="middle">
                                                        <a href="https://istegecb.in/"
                                                            style="color:#0a66c2;display:inline-block;text-decoration:none;width:120px"
                                                            target="_blank">
                                                            <img src="https://raw.githubusercontent.com/Gopiverse/iste-logo/main/ISTE_green_logo.png"
                                                                alt="ISTE Logo" style="height: 60px;">
                                                        </a>
                                                    </td>
                                                    <td valign="middle" align="right">
                                                        <a href="https://istegecb.in/"
                                                            style="color:#666;font-size:14px;font-weight:500; text-decoration: none;"
                                                            target="_blank">istegecb.in</a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-left:24px;padding-right:24px;padding-bottom:24px">
                                        <div>
                                            <table role="presentation" valign="top" border="0" cellspacing="0"
                                                cellpadding="0" width="100%">
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                            <table role="presentation" valign="top" border="0"
                                                                cellspacing="0" cellpadding="0" width="100%">
                                                                <tbody>
                                                                    <tr>
                                                                        <td>
                                                                            <p
                                                                                style="margin:0;font-weight:500;font-size:21px;line-height:1.5;text-align:center;">
                                                                                Congratulations <strong>${(name ||
            "Member").split(" ")[0]}</strong> on
                                                                                your ISTE membership !!
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="padding-top:24px">
                                                                            <p
                                                                                style="margin:0;font-weight:400;font-size:16px;line-height:1.5">
                                                                                You are officially an ISTE
                                                                                member.<br>We’re delighted to welcome
                                                                                you to our vibrant family of innovators,
                                                                                creators, and changemakers.
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="padding-top:24px">
                                                                            <p
                                                                                style="margin:0;font-weight:600;font-size:16px;line-height:1.5">
                                                                                Your registration details:
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                    <!-- <tr>
                                                                        <td style="padding-top:16px">
                                                                            <div style="background-color:#f8f9fa; padding:20px; border-radius:8px; border-left:4px solid #0a66c2;">
                                                                                <p
                                                                                    style="margin:0; font-family: Arial, Helvetica, sans-serif; font-weight:400; font-size:15px; line-height:1.6; color:#333; -webkit-text-size-adjust:100%;">
                                                                                    <strong>Membership ID:</strong> ${id}<br>
                                                                                    <strong>Membership Type:</strong> ${membershipText}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                    </tr> -->
                                                                    <tr>
                                                                        <td style="padding-top:16px">
                                                                            <div style="background-color:#f8f9fa; padding:20px; border-radius:8px; border-left:4px solid #0a66c2;">
                                                                    
                                                                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                                                                    style="font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#333; -webkit-text-size-adjust:100%;">
                                                                                    <tr>
                                                                                        <td width="150" valign="top" style="padding-bottom: 4px;">
                                                                                            <strong>Membership ID:</strong>
                                                                                        </td>
                                                                                        <td valign="top" style="padding-bottom: 4px;">
                                                                                            ${id}
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td width="150" valign="top">
                                                                                            <strong>Membership Type:</strong>
                                                                                        </td>
                                                                                        <td valign="top">
                                                                                            ${membershipText}
                                                                                        </td>
                                                                                    </tr>
                                                                                </table>
                                                                    
                                                                            </div>
                                                                        </td>
                                                                    </tr>

                                                                    <tr>
                                                                        <td style="padding-top:20px">
                                                                            <p
                                                                                style="margin:0;font-weight:400;font-size:16px;line-height:1.5">
                                                                                <!-- We are thrilled to have you with us and
                                                                                look forward to your
                                                                                participation.<br> -->
                                                                                If you have any
                                                                                questions or need further assistance,
                                                                                please don't hesitate to reach out to
                                                                                us.
                                                                            </p>
                                                                        </td>
                                                                    </tr>


                                                                    <!-- Social Media Section -->
                                                                    <tr>
                                                                        <td
                                                                            style="padding-top:20px; padding-bottom:10px;">
                                                                            <table role="presentation" border="0"
                                                                                cellspacing="0" cellpadding="0"
                                                                                width="100%"
                                                                                style="background-color:#ffffff; border: 1px solid #e1e1e1; border-radius:8px;">
                                                                                <tr>
                                                                                    <td style="padding: 16px;">
                                                                                        <p
                                                                                            style="margin:0 0 12px 0; font-size:15px; font-weight:600; color:#333; text-align:left;">
                                                                                            Join our community to stay updated on events & workshops!
                                                                                        </p>
                                                                                        <table role="presentation"
                                                                                            border="0" cellspacing="10"
                                                                                            cellpadding="0" align="center"
                                                                                            style="margin: 0 auto;">
                                                                                            <tr>
                                                                                                <td
                                                                                                    style="padding: 0 10px;">
                                                                                                    <a href="https://www.instagram.com/istegecb"
                                                                                                        target="_blank"
                                                                                                        style="text-decoration: none;">
                                                                                                        <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
                                                                                                            alt="Instagram"
                                                                                                            width="35"
                                                                                                            height="35"
                                                                                                            style="display:block; border:none;">
                                                                                                    </a>
                                                                                                </td>
                                                                                                <td
                                                                                                    style="padding: 0 10px;">
                                                                                                    <a href="https://in.linkedin.com/company/iste-student-chapter-gecb"
                                                                                                        target="_blank"
                                                                                                        style="text-decoration: none;">
                                                                                                        <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                                                                                                            alt="LinkedIn"
                                                                                                            width="35"
                                                                                                            height="35"
                                                                                                            style="display:block; border:none;">
                                                                                                    </a>
                                                                                                </td>
                                                                                                <td
                                                                                                    style="padding: 0 10px;">
                                                                                                    <a href="https://whatsapp.com/channel/0029VamIrg5HrDZXomfgoe3Q"
                                                                                                        target="_blank"
                                                                                                        style="text-decoration: none;">
                                                                                                        <img src="https://cdn-icons-png.flaticon.com/512/5968/5968841.png"
                                                                                                            alt="WhatsApp"
                                                                                                            width="35"
                                                                                                            height="35"
                                                                                                            style="display:block; border:none;">
                                                                                                    </a>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                    <!-- End Social Media Section -->

                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color:#f3f2f0;padding:24px">
                                        <table role="presentation" valign="top" border="0" cellspacing="0"
                                            cellpadding="0" width="100%" style="font-size:12px">
                                            <tbody>
                                                <tr>
                                                    <td style="margin:0px;padding-bottom:8px;color:#666;">
                                                        <p style="margin:0; line-height: 1.5;">Best Regards,<br>ISTE SC
                                                            GECB Team</p>
                                                    </td>
                                                </tr>
                                                <!-- <tr>
                                                    <td style="padding-bottom:8px">
                                                        <a href="https://istegecb.in/"
                                                            style="color:#0a66c2;display:inline-block;text-decoration:none"
                                                            target="_blank">
                                                            <span
                                                                style="font-weight:bold;font-size:14px;color:#0a66c2;">ISTEGECB</span>
                                                        </a>
                                                    </td>
                                                </tr> -->
                                                <tr>
                                                    <td style="color:#666;">
                                                        © 2025 ISTE SC GECB, GEC Barton Hill, Thiruvananthapuram, Kerala,
                                                        India.
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>

</html>

`;

    try {
        if(email_quota() > 0) {
            MailApp.sendEmail(obj.EmailId, subject, "", { htmlBody: body });
            storeEmailInSheet(emailSheet, obj.EmailId, id);
            updateEmailStatus(trackingSheet, id, 'Sent');
        } else {
          appendToErrorSheet(`Email not send to ${obj.EmailId} - ${obj.ID} - ${obj.Name}`);
          updateEmailStatus(trackingSheet, id, 'Failed: Email Quota Reached');
        }
    } catch (err) {
        appendToErrorSheet(err.message);
        updateEmailStatus(trackingSheet, id, 'Failed:' + err.message);
    }
}

function storeEmailInSheet(sheet, email, id) {
    if (sheet.getLastRow() === 0) sheet.appendRow(headers.emailSheet);
    sheet.appendRow([email, id]);
    powerful_emailsheet.appendRow([email, id]);

}


function updateEmailStatus(sheet, id, status) {
    let data = sheet.getDataRange().getValues();
    let headers = data[0]; // The first row containing column names

    // Find the column index for "Status" 
    let statusColIndex = headers.findIndex(header => String(header).toLowerCase() === 'status');

    // Abort if the column isn't found to prevent errors
    if (statusColIndex === -1) {
        createErrorResponse("Error: 'Status' column not found.")
        Logger.log("Error: 'Status' column not found.");
    }

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            // Apps Script ranges are 1-indexed, but JavaScript arrays are 0-indexed.
            // Row is (i + 1), Column is (statusColIndex + 1)
            sheet.getRange(i + 1, statusColIndex + 1).setValue(status);
            break;
        }
    }
}



function createSuccessResponse() {
    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

//  error response.  returns the error we throw or put as text..
function createErrorResponse(err) {

    // handle both Error objects and plain strings
    const message = err?.message || err || "Unknown error";

    appendToErrorSheet(message);
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: message })).setMimeType(ContentService.MimeType.JSON);
}




function getSheetInfo() {
    let filledSeats = idSheet.getRange("A1").getValue();
    let mainSheet = selectOrCreateSheet(sheetName);
    var TOTAL_SEATS = 30; // for early bird membership
    var remainingSeats = TOTAL_SEATS - filledSeats;
    console.log(remainingSeats);

}


function doGet(e) { 
    var action = e.parameter.action; 
 
    if (action === "seats") { 
        let filledSeats = idSheet.getRange("A1").getValue(); 
        let mainSheet = selectOrCreateSheet(sheetName); 
        const TOTAL_SEATS = 30; // for early bird membership 
        let remainingSeats = TOTAL_SEATS - filledSeats; 

        console.log(remainingSeats);

        // Send ONE email when remaining seats reaches 2, 1, or 0
        if (remainingSeats >= 0 && remainingSeats <= 2) {

            const props = PropertiesService.getScriptProperties();
            const alertKey = "EARLY_BIRD_ALERT_" + remainingSeats;

            // Only send if this threshold has not been alerted yet
            if (props.getProperty(alertKey) !== "sent") {

                const recipients = [
                    "trinitatd@gmail.com"
                ];

                const subject = `Early Bird Membership - ${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining`;

                const body =
                    "Early Bird Membership Alert\n\n" +
                    "Total seats: " + TOTAL_SEATS + "\n" +
                    "Filled seats: " + filledSeats + "\n" +
                    "Remaining seats: " + remainingSeats;

                recipients.forEach(function(email) {
                    MailApp.sendEmail(email, subject, body);
                });

                // Remember that this alert was already sent
                props.setProperty(alertKey, "sent");
            }
        }

        // Don't allow negative seat count
        if (remainingSeats < 0) remainingSeats = 0;

        return ContentService 
            .createTextOutput(JSON.stringify({ seats: remainingSeats })) 
            .setMimeType(ContentService.MimeType.JSON); 
    } 
 
    try { 
        let referral = e.parameter.referral; 
        if (!referral) { 
            throw new Error("Referral parameter is missing"); 
        } 

        let count = getReferralCount(referral); 

        return ContentService
            .createTextOutput(JSON.stringify({ 
                referral: referral, 
                count: count 
            })) 
            .setMimeType(ContentService.MimeType.JSON); 

    } catch (err) { 
        Logger.log(err); 

        return ContentService
            .createTextOutput(JSON.stringify({ 
                "result": "error", 
                "error": err.message 
            })) 
            .setMimeType(ContentService.MimeType.JSON); 
    } 
}




// # good fucntion gets header...
function getColumn(sheetName = currentYear, column = "Referral") {
    let sheet = selectOrCreateSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const columnIndex = headers.indexOf(column);

    if (columnIndex === -1) {
        throw new Error(`Header "${column}" not found in sheet "${sheetName}"`);
    }

    const columnValues = sheet.getRange(2, columnIndex + 1, sheet.getLastRow() - 1, 1).getValues();
    const flattenedValues = columnValues.map(row => row[0]).filter(a => String(a).replace(/\s/g, "") !== "");
    console.log({
        [column]: flattenedValues
    })
    return {
        [column]: flattenedValues
    };
}


function getCount(column = "Referral") {
    const { [column]: values } = getColumn("2024", column);

    const counts = values.reduce((acc, value) => {
        if (value && value !== '-') {
            acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
    }, {});

    console.log(JSON.stringify(counts, null, 2));
    return counts;
}


//  ultimate name formating function
function capitalizeName(name) {
    let formatted = name.replace(/\./g, ' ');
    formatted = formatted.replace(/\s+/g, ' ').trim();
    formatted = formatted
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return formatted;
}



function refreshAmbassadorLeaderboard(){
  try{
    UrlFetchApp.fetch(ambassador_appscript_url);
  }catch (err) {
            //  APPSCRIPT ACCESSS REVOKED or LINK OUTDATED
        appendToErrorSheet("AMBASSADOR APPSCRIPT ACCESSS REVOKED or something happened there check...");

  }
}

//  for silent errors or for appending to error sheet.
const appendToErrorSheet = (msg) => {
      Logger.log(msg);
      let errorSheet = selectOrCreateSheet("Errors");
      let dateTime = new Date();
      let errorInfo = [dateTime.toLocaleString(), msg];
      appendToSheet(errorSheet, errorInfo, headers.error);
}



// checks email quota and logs it into error sheet if less than 10.
function email_quota(){
  let e_quota = MailApp.getRemainingDailyQuota();
  let msg = "Remaining Email Quota: " + e_quota
  Logger.log(msg);
  if(e_quota < 10) appendToErrorSheet(msg);
  return e_quota;
}


// setowner code is causing issues lotta emails
function cleanUpOwnershipEmails() {
    // 1. Define the exact search query based on the automated email structure
    // This targets the specific subject line and body text to avoid accidentally deleting other emails
    const searchQuery = 'subject:("You\'re now the owner of") "has made you the owner of the following item"';
    // 2. Fetch all matching email threads
    const threads = GmailApp.search(searchQuery);
    // 3. Sweep them into the trash
    if (threads.length > 0) {
        GmailApp.moveThreadsToTrash(threads);
        Logger.log(`Swept ${threads.length} ownership notification threads to the trash.`);
    } else {
        Logger.log('No ownership emails found to clean up right now.');
    }
}

/*function resetEarlyBirdAlerts() {
  const props = PropertiesService.getScriptProperties();

  props.deleteProperty("EARLY_BIRD_ALERT_2");
  props.deleteProperty("EARLY_BIRD_ALERT_1");
  props.deleteProperty("EARLY_BIRD_ALERT_0");

  Logger.log("Early Bird alert flags reset.");
}*/
