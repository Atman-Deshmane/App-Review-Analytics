import subprocess
import smtplib
import os
import sys
import shutil
import datetime
import markdown
import argparse
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Firebase Initialization
try:
    import firebase_admin
    from firebase_admin import credentials, db
    
    FIREBASE_AVAILABLE = False
    
    # Load credentials from Environment Variable
    cred_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    db_url = os.getenv("FIREBASE_DB_URL")
    
    if cred_json_str and db_url:
        try:
            cred_json = json.loads(cred_json_str)
            cred = credentials.Certificate(cred_json)
            
            # Check if app is already initialized to avoid error on re-run
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred, {
                    'databaseURL': db_url
                })
            FIREBASE_AVAILABLE = True
            print(f"[{datetime.datetime.now()}] Firebase initialized successfully.")
        except Exception as e:
            print(f"[{datetime.datetime.now()}] Error initializing Firebase: {e}")
    else:
        print(f"[{datetime.datetime.now()}] Firebase credentials or DB URL missing. Skipping Firebase init.")

except ImportError:
    print(f"[{datetime.datetime.now()}] firebase-admin module not found.")
    FIREBASE_AVAILABLE = False

def update_status(message, progress=None, job_id=None):
    """
    Updates status to console and Firebase Realtime DB if job_id is present.
    """
    timestamp = datetime.datetime.now().isoformat()
    print(f"[STATUS] {message} ({progress}%)" if progress is not None else f"[STATUS] {message}")
    
    if FIREBASE_AVAILABLE and job_id:
        try:
            ref = db.reference(f'jobs/{job_id}')
            update_data = {
                'status': message,
                'last_update': timestamp
            }
            if progress is not None:
                update_data['progress'] = progress
                
            ref.update(update_data)
        except Exception as e:
            print(f"Error updating Firebase: {e}")

def run_script(script_name, args=None, job_id=None):
    print(f"[{datetime.datetime.now()}] Running {script_name}...")
    cmd = [sys.executable, script_name]
    if args:
        cmd.extend(args)
    
    try:
        # Run the script and check for errors
        subprocess.run(cmd, check=True)
        print(f"[{datetime.datetime.now()}] {script_name} completed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}: {e}")
        update_status(f"Error running {script_name}", job_id=job_id)
        sys.exit(1) # Exit with error code to fail the workflow

def send_email(report_content, recipient_email, date_str=None, job_id=None):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    
    if not recipient_email:
        recipient_email = os.getenv("EMAIL_RECIPIENT")

    if not sender_email or not sender_password or not recipient_email:
        print("Email credentials not found in .env - skipping email send.")
        return

    print(f"[{datetime.datetime.now()}] Sending email to {recipient_email}...")
    update_status("Sending email report...", progress=80, job_id=job_id)

    try:
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = recipient_email
        
        if date_str:
            msg['Subject'] = f"Weekly App Pulse: {date_str} (Resend)"
        else:
            msg['Subject'] = f"Weekly App Pulse: {datetime.date.today()}"

        # Convert Markdown to HTML
        html_content = markdown.markdown(report_content, extensions=['tables'])
        
        # Add some basic styling to the HTML
        styled_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                h1, h2, h3 {{ color: #2c3e50; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
                blockquote {{ border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #666; }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """

        # Attach both plain text and HTML versions
        part1 = MIMEText(report_content, 'plain')
        part2 = MIMEText(styled_html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)

        # Connect to SMTP server (Gmail/Outlook usually use 465 for SSL)
        try:
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(sender_email, sender_password)
                server.send_message(msg)
        except Exception:
            # Fallback to TLS (port 587) if SSL fails or different provider
             with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)

        print(f"[{datetime.datetime.now()}] Email sent successfully.")
        update_status("Email sent successfully.", progress=85, job_id=job_id)

    except Exception as e:
        print(f"Failed to send email: {e}")
        update_status(f"Failed to send email: {e}", job_id=job_id)

def archive_history(app_id, count, job_id=None):
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    # New Structure: dashboard/public/history/{app_id}/{date}_{count}reviews/
    # We also keep a root history for backup if needed, but let's focus on the dashboard path as primary for now
    # or maybe we just use the dashboard path directly.
    
    dashboard_history_base = os.path.join("dashboard", "public", "history", app_id)
    
    # Construct versioned folder name
    base_folder_name = f"{today_str}_{count}reviews"
    target_dir = os.path.join(dashboard_history_base, base_folder_name)
    
    # Versioning logic (v2, v3) if same day/count exists
    version = 1
    final_target_dir = target_dir
    while os.path.exists(final_target_dir):
        version += 1
        final_target_dir = f"{target_dir}_v{version}"
    
    print(f"[{datetime.datetime.now()}] Archiving artifacts to {final_target_dir}...")
    update_status(f"Archiving data...", progress=90, job_id=job_id)
    
    os.makedirs(final_target_dir, exist_ok=True)
        
    files_to_archive = [
        ("weekly_pulse_report.md", "weekly_pulse_report.md"),
        ("temp_reviews_analyzed.json", "reviews_analyzed_v2.json"), # Rename for dashboard compatibility
        ("temp_reviews_raw.csv", "reviews_raw.csv")
    ]
    
    for src, dest in files_to_archive:
        if os.path.exists(src):
            # Move file to history
            shutil.move(src, os.path.join(final_target_dir, dest))
            print(f"Moved {src} to {final_target_dir}/{dest}")
            
            # If it's the report, copy it back to root for README/latest view (optional, maybe just keep one)
            if src == "weekly_pulse_report.md":
                shutil.copy(os.path.join(final_target_dir, dest), src)
                print(f"Copied {dest} back to root as {src}")
        else:
            print(f"Warning: {src} not found, skipping archive.")
            
    print(f"[{datetime.datetime.now()}] === ARCHIVING COMPLETE ===\n")
    return final_target_dir

def main():
    parser = argparse.ArgumentParser(description='SaaS Orchestrator')
    parser.add_argument('--app_id', type=str, default='com.nextbillion.groww', help='Application ID')
    parser.add_argument('--count', type=int, default=300, help='Number of reviews to fetch')
    parser.add_argument('--themes', type=str, default='auto', help='Comma-separated themes')
    parser.add_argument('--email', type=str, help='Recipient email')
    parser.add_argument('--date_range', type=int, default=12, help='Weeks back')
    parser.add_argument('--job_id', type=str, help='Firebase Job ID for status tracking')
    
    args = parser.parse_args()
    
    print(f"[{datetime.datetime.now()}] Starting Orchestrator for {args.app_id}...")
    update_status("Initializing...", progress=0, job_id=args.job_id)
    
    # Step 1: Fetch Reviews
    update_status("Fetching reviews...", progress=10, job_id=args.job_id)
    run_script("fetch_reviews.py", args=["--app_id", args.app_id, "--count", str(args.count)], job_id=args.job_id)
    update_status("Reviews Fetched. Analyzing Themes...", progress=30, job_id=args.job_id)
    
    # Step 2: Core Analysis
    update_status("Identifying Top Themes...", progress=50, job_id=args.job_id)
    # We can't granularly update status inside the subprocess without IPC, so we update before/after
    run_script("core_analysis_v2.py", args=["--themes", args.themes], job_id=args.job_id)
    update_status("Tagging & Sentiment Analysis Complete.", progress=70, job_id=args.job_id)
    
    # Step 3: Send Email
    if os.path.exists("weekly_pulse_report.md"):
        with open("weekly_pulse_report.md", "r") as f:
            report_content = f.read()
        send_email(report_content, args.email, job_id=args.job_id)
    else:
        print("Error: weekly_pulse_report.md not found after analysis.")
    
    # Step 4: Archive
    archive_history(args.app_id, args.count, job_id=args.job_id)
    
    # Step 5: Generate Manifest
    update_status("Updating manifest...", progress=95, job_id=args.job_id)
    run_script("generate_manifest.py", job_id=args.job_id)
    
    print(f"[{datetime.datetime.now()}] Pipeline completed successfully.")
    update_status("COMPLETED", progress=100, job_id=args.job_id)

if __name__ == "__main__":
    main()
