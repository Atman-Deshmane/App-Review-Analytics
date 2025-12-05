import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def main():
    # Load email data
    try:
        with open("email_payload.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Skipping email: email_payload.json not found.")
        return

    recipient = data.get("recipient")
    subject = data.get("subject")
    body_html = data.get("body_html")

    if not recipient or not os.getenv("EMAIL_SENDER"):
        print("Skipping email: Missing credentials or recipient.")
        return

    # Create Message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = os.getenv("EMAIL_SENDER")
    msg['To'] = recipient

    # Attach HTML
    msg.attach(MIMEText(body_html, 'html'))

    # Send
    try:
        # Try SSL first
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
            server.send_message(msg)
        print(f"✅ Email sent successfully to {recipient}")
    except Exception as e:
        print(f"⚠️ SSL failed, trying TLS: {e}")
        try:
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
                server.send_message(msg)
            print(f"✅ Email sent successfully to {recipient} (via TLS)")
        except Exception as e2:
            print(f"❌ Failed to send email: {e2}")
            # Don't crash the pipeline, just log it

if __name__ == "__main__":
    main()
