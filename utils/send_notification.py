import smtplib
import json
import os
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def send_email():
    """Reads email_payload.json and sends the notification."""
    config_path = 'email_payload.json'
    
    if not os.path.exists(config_path):
        print(f"[{config_path}] not found. Skipping email notification.")
        return

    try:
        with open(config_path, 'r') as f:
            payload = json.load(f)
    except Exception as e:
        print(f"Error loading {config_path}: {e}")
        return

    recipient = payload.get('recipient')
    if not recipient:
        print("No recipient specified in payload. Skipping email.")
        return

    subject = payload.get('subject', 'App Review Insights')
    body_html = payload.get('body_html', '')
    
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")

    if not sender_email or not sender_password:
        print("EMAIL_SENDER or EMAIL_PASSWORD not set. Skipping email.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, recipient, text)
        server.quit()
        print(f"✅ Notification email dispatched to {recipient}")
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")        msg.attach(MIMEText(email_body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, recipient, text)
        server.quit()
        print(f"✅ Notification email dispatched to {recipient}")
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

if __name__ == "__main__":
    send_email()
