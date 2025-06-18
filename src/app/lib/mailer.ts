import axios, { AxiosError } from "axios";

export const sendEmail = async (to: string, subject: string, htmlContent: string, plainTextContent?: string) => {
  const API_KEY = process.env.BREVO_API_KEY as string; // Brevo API Key
  const senderEmail = process.env.SENDER_EMAIL as string; // Verified Brevo sender email

  // Add a business address/footer to the HTML content
  const spamLine = "If you don't see this email in your inbox, please check your spam or junk folder.";
  const businessFooter = `<hr><p style='font-size:12px;color:#888;'>Math Point<br>${spamLine}<br>If you did not request this email, please ignore it.</p>`;
  const htmlWithFooter = htmlContent + businessFooter;

  // Add a plain text version with footer if not provided
  const plainFooter = `\n\nMath Point\n${spamLine}\nIf you did not request this email, please ignore it.`;
  const textWithFooter = (plainTextContent || htmlContent.replace(/<[^>]+>/g, '')) + plainFooter;

  const payload = {
    sender: { name: "The MathPoint", email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: htmlWithFooter,
    textContent: textWithFooter,
  };

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });
    //     console.log("Email sent successfully via Brevo");
  } catch (error) {
    if (error instanceof AxiosError) {
      // console.error("Error sending email:", error.response?.data || error);
      console.error("Error sending email:", error.response?.data || error);
    }
    throw new Error("Error sending email");
  }
};
