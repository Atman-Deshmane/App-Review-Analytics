"""
send_notification.py - Email Notification with Firebase Completion Trigger

Sends the weekly pulse email and triggers the "COMPLETED" status in Firebase
AFTER deployment is finished, solving the race condition.
"""

import smtplib
import json
import os
import markdown
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from premailer import transform

load_dotenv()

# ============== FIREBASE INITIALIZATION ==============
FIREBASE_AVAILABLE = False
db = None

try:
    import firebase_admin
    from firebase_admin import credentials, db as firebase_db
    
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    firebase_db_url = os.getenv("FIREBASE_DB_URL")
    
    if service_account_json and firebase_db_url:
        # Parse JSON from env var
        cred_dict = json.loads(service_account_json)
        cred = credentials.Certificate(cred_dict)
        
        # Only initialize if not already done
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {'databaseURL': firebase_db_url})
        
        db = firebase_db
        FIREBASE_AVAILABLE = True
        print("[NOTIFICATION] Firebase initialized successfully.")
    else:
        print("[NOTIFICATION] Firebase credentials not found. Skipping Firebase updates.")
        
except Exception as e:
    print(f"[NOTIFICATION] Firebase initialization failed: {e}")


def trigger_firebase_completed(job_id: str, version_id: str):
    """
    Triggers the COMPLETED status in Firebase with the result_version.
    This is called AFTER email is successfully sent (post-deployment).
    """
    if not FIREBASE_AVAILABLE or not job_id:
        print("[NOTIFICATION] Skipping Firebase update (not available or no job_id).")
        return False
    
    try:
        ref = db.reference(f'jobs/{job_id}')
        ref.update({
            'status': 'COMPLETED',
            'progress': 100,
            'result_version': version_id,
            'last_update': datetime.datetime.now().isoformat()
        })
        print(f"[NOTIFICATION] ✅ Firebase updated: COMPLETED (100%) - Version: {version_id}")
        return True
    except Exception as e:
        print(f"[NOTIFICATION] ❌ Firebase update failed: {e}")
        return False


def main():
    try:
        if not os.path.exists("email_payload.json"):
            print("Skipping email: email_payload.json not found.")
            return

        with open("email_payload.json", "r") as f:
            data = json.load(f)

        recipient = data.get("recipient")
        subject = data.get("subject")
        body_md = data.get("body_md")
        body_html = data.get("body_html") 
        app_name = data.get("app_name", "App")
        dashboard_url = data.get("dashboard_url", "https://100cr.cloud/reviews/dashboard")

        if not recipient or not os.getenv("EMAIL_SENDER"):
            print("Skipping: Missing credentials/recipient.")
            return

        if body_md:
            print("🎨 Styling email with Premailer...")
            content_html = markdown.markdown(body_md, extensions=['tables', 'fenced_code'])
            
            html_template = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; line-height: 1.6; }}
                    h1, h2, h3, h4 {{ color: #111827; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }}
                    h2 {{ font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }}
                    h3 {{ font-size: 16px; color: #4b5563; margin-top: 24px; }}
                    p {{ margin-bottom: 16px; color: #374151; }}
                    ul, ol {{ margin-bottom: 16px; padding-left: 24px; color: #374151; }}
                    li {{ margin-bottom: 6px; }}
                    a {{ color: #6366f1; text-decoration: none; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .card {{ background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }}
                    .header {{ background-color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6; }}
                    .header-title {{ font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }}
                    .app-name {{ font-size: 28px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; }}
                    .content {{ padding: 32px 24px; }}
                    table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }}
                    th {{ background-color: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-weight: 600; }}
                    td {{ padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }}
                    tr:last-child td {{ border-bottom: none; }}
                    blockquote {{ margin: 24px 0; padding: 16px 20px; background-color: #f9fafb; border-left: 4px solid #6366f1; font-style: italic; color: #4b5563; border-radius: 0 8px 8px 0; }}
                    .cta-container {{ text-align: center; margin-top: 40px; margin-bottom: 20px; }}
                    .cta-button {{ display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4); }}
                    .footer {{ text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; }}
                    @media (prefers-color-scheme: dark) {{
                        body {{ background-color: #111827 !important; color: #e5e7eb !important; }}
                        .card {{ background-color: #1f2937 !important; box-shadow: none !important; }}
                        h1, h2, h3, h4, .app-name {{ color: #ffffff !important; }}
                        p, ul, ol, td {{ color: #d1d5db !important; }}
                        .header {{ background-color: #1f2937 !important; border-bottom-color: #374151 !important; }}
                        th {{ background-color: #374151 !important; color: #e5e7eb !important; border-bottom-color: #4b5563 !important; }}
                        blockquote {{ background-color: #374151 !important; color: #d1d5db !important; }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="header">
                            <span class="header-title">App Review Analytics</span>
                            <h1 class="app-name">{app_name}</h1>
                        </div>
                        <div class="content">
                            {content_html}
                            <div class="cta-container">
                                <a href="{dashboard_url}" class="cta-button">Open Interactive Dashboard</a>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 NextLeap Milestone 2 • Automated Report</p>
                    </div>
                </div>
            </body>
            </html>
            """
            final_html = transform(html_template)
        else:
            final_html = body_html

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = os.getenv("EMAIL_SENDER")
        msg['To'] = recipient
        msg.attach(MIMEText(final_html, 'html'))

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
        
        # ========== FIREBASE COMPLETED TRIGGER ==========
        # This runs AFTER deployment is complete (email is sent post-FTP)
        # Read version info persisted by orchestrator
        version_id = ""
        job_id = ""
        
        if os.path.exists("version_info.txt"):
            with open("version_info.txt", "r") as f:
                lines = f.read().strip().split("\n")
                if len(lines) >= 1:
                    version_id = lines[0].strip()
                if len(lines) >= 2:
                    job_id = lines[1].strip()
            print(f"[NOTIFICATION] Read version_info: version={version_id}, job_id={job_id}")
        
        if job_id and version_id:
            trigger_firebase_completed(job_id, version_id)
        else:
            print("[NOTIFICATION] Skipping Firebase trigger: missing version_info.txt data.")
        # ================================================

    except Exception as e:
        print(f"❌ Email failed: {e}")


if __name__ == "__main__":
    main()
