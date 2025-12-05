import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def main():
    try:
        if not os.path.exists("email_payload.json"):
            print("Skipping email: email_payload.json not found.")
            return

        with open("email_payload.json", "r") as f:
            data = json.load(f)

        recipient = data.get("recipient")
        subject = data.get("subject")
        body_html = data.get("body_html")

        if not recipient or not os.getenv("EMAIL_SENDER"):
            print("Skipping: Missing credentials/recipient.")
            return

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = os.getenv("EMAIL_SENDER")
        msg['To'] = recipient
        msg.attach(MIMEText(body_html, 'html'))

        # Try SSL then TLS
        try:
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
                server.send_message(msg)
        except Exception:
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
                server.send_message(msg)
        
        print(f"✅ Email successfully sent to {recipient}")

    except Exception as e:
        print(f"❌ Email failed: {e}")
        # Do not crash the build, just log it

if __name__ == "__main__":
    main()
