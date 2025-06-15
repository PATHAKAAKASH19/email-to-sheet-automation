import cron from "node-cron"
import { gmail, sheets } from "./config/google.config.js";

// below function will fetch gmail data and then add that data to spreadsheet 
async function fetchEmails() {
  try {
    
    // to get the list of mail in the form array 
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 2,
    });
   
    const messages = res.data.messages || [];
   
    // below code create new spreadsheet with title eg - "akash-pathak"
    const newSheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: "akash-pathak",
        },
      },
    });

    // now we extract created spreadsheetId
    const spreadsheetId = newSheet.data.spreadsheetId;

     // use the spreadsheetId to identify specific spreadsheet to 
    // create columns of name eg ->  subject, from, body 
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A1", // Where to append
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["subject", "from", "body"]], // Data to insert
      },
    });

    // Fetch full content of each email
    for (const [index, message] of messages.entries()) {

      try {
        
        // now we use messageId from array of messages to extract message body
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        // Extract email details
        const headers = email.data.payload.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value;
        const from = headers.find((h) => h.name === "From")?.value;
        const body = email.data.snippet; // Short preview
        

        console.log("Subject:", subject);
        console.log("From:", from);
        console.log("Body:", body);
        console.log("------------------");

        
       // now we append email data to the column create above in spreadsheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: `Sheet1!A` + (index + 2), // Where to append
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [[subject, from, body]], // Data to insert
          },
        });
      } catch (emailError) {

        // to ctach error
        console.error(
          `Error processing email ${message.id}:`,
          emailError.message
        );
      }
    }
    
    // log the spreadsheet url where email data is store
    console.log(
      "All emails processed. Spreadsheet URL:",
      newSheet.data.spreadsheetUrl
    );

  } catch (error) {
    console.error("Error fetching emails:", error);
  }
}


// in every one min interval the code run again and check 
// for new email and insert the email data to google spreadsheet
cron.schedule('*/1 * * * * ', ()=> fetchEmails())
