
import cron from "node-cron"
import { gmail, sheets } from "./config/google.config.js";





async function fetchEmails() {
  try {
    // Get list of emails (latest 10)
   
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 2,
    });

   
    const messages = res.data.messages || [];



    const newSheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: "akash-pathak",
        },
      },
    });
    const spreadsheetId = newSheet.data.spreadsheetId;

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

        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: `Sheet1!A` + (index + 2), // Where to append
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [[subject, from, body]], // Data to insert
          },
        });
      } catch (emailError) {
        console.error(
          `Error processing email ${message.id}:`,
          emailError.message
        );
      }
    
     
    }


   

    console.log(
      "All emails processed. Spreadsheet URL:",
      newSheet.data.spreadsheetUrl
    );

  } catch (error) {
    console.error("Error fetching emails:", error);
  }
}



// in every one min interval the code run again and check for new email and insert the email data to google spreadsheet

cron.schedule('*/1 * * * * ', ()=> fetchEmails())
