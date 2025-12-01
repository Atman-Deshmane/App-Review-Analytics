import subprocess
import smtplib
import os
import sys
import shutil
import datetime
import markdown
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_script(script_name):
    print(f"[{datetime.datetime.now()}] Running {script_name}...")
    try:
        # Run the script and check for errors
        subprocess.run([sys.executable, script_name], check=True)
        print(f"[{datetime.datetime.now()}] {script_name} completed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}: {e}")
        sys.exit(1) # Exit with error code to fail the workflow

def send_email(report_content, date_str=None):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    recipient_email = os.getenv("EMAIL_RECIPIENT")

    if not sender_email or not sender_password or not recipient_email:
        print("Email credentials not found in .env - skipping email send.")
        return

    print(f"[{datetime.datetime.now()}] Sending email to {recipient_email}...")

    try:
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = recipient_email
        
        if date_str:
            msg['Subject'] = f"Weekly App Pulse: Groww - {date_str} (Resend)"
        else:
            msg['Subject'] = f"Weekly App Pulse: Groww - {datetime.date.today()}"

        # Convert Markdown to HTML
        # extensions=['tables'] ensures tables are rendered correctly
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

    except Exception as e:
        print(f"Failed to send email: {e}")

def archive_history():
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    base_dir = os.path.join("history", today_str)
    
    # Versioning logic: Check if directory exists, if so, append _v2, _v3, etc.
    history_dir = base_dir
    version = 1
    while os.path.exists(history_dir):
        version += 1
        history_dir = f"{base_dir}_v{version}"
    
    print(f"[{datetime.datetime.now()}] Archiving artifacts to {history_dir}...")
    
    os.makedirs(history_dir, exist_ok=True)
        
    files_to_archive = [
        "weekly_pulse_report.md",
        "reviews_analyzed_v2.json",
        "groww_reviews_raw.csv"
    ]
    
    for filename in files_to_archive:
        if os.path.exists(filename):
            # Move file to history
            shutil.move(filename, os.path.join(history_dir, filename))
            print(f"Moved {filename} to {history_dir}")
            
            # If it's the report, copy it back to root for README/latest view
            if filename == "weekly_pulse_report.md":
                shutil.copy(os.path.join(history_dir, filename), filename)
                print(f"Copied {filename} back to root")
        else:
            print(f"Warning: {filename} not found, skipping archive.")
            
    # Sync to Dashboard Public Folder (for Localhost Dev)
    dashboard_history_dir = os.path.join("app-review-dashbaord", "public", "history", os.path.basename(history_dir))
    if os.path.exists("app-review-dashbaord"):
        if os.path.exists(dashboard_history_dir):
             shutil.rmtree(dashboard_history_dir)
        shutil.copytree(history_dir, dashboard_history_dir)
        print(f"Synced history to dashboard: {dashboard_history_dir}")
            
    print(f"[{datetime.datetime.now()}] === ARCHIVING COMPLETE: Moved files to history/{today_str}/ ===\n")

def main():
    print(f"[{datetime.datetime.now()}] Starting Weekly Pulse Orchestrator...")
    
    # Check for Resend Mode via Environment Variable
    resend_date = os.getenv("INPUT_REPORT_DATE")
    
    if resend_date and resend_date.strip():
        print(f"!!! RESEND MODE ACTIVATED for date: {resend_date} !!!")
        
        report_path = os.path.join("history", resend_date, "weekly_pulse_report.md")
        
        if not os.path.exists(report_path):
            print(f"Error: Archived report not found at {report_path}")
            sys.exit(1)
            
        print(f"Reading report from {report_path}...")
        with open(report_path, "r") as f:
            report_content = f.read()
            
        send_email(report_content, date_str=resend_date)
        print("Resend complete.")
        return

    # Normal Analysis Mode
    print("--- Standard Analysis Mode (V2 Architecture) ---")
    
    # Step 1: Fetch Reviews
    run_script("fetch_reviews.py")
    
    # Step 2: Core Analysis V2 (Replaces old Step 1 & 2)
    run_script("core_analysis_v2.py")
    
    # Step 3: Send Email
    if os.path.exists("weekly_pulse_report.md"):
        with open("weekly_pulse_report.md", "r") as f:
            report_content = f.read()
        send_email(report_content)
    else:
        print("Error: weekly_pulse_report.md not found after analysis.")
    
    # Step 4: Archive
    archive_history()
    
    # Step 5: Generate Manifest
    run_script("generate_manifest.py")
    
    print(f"[{datetime.datetime.now()}] Pipeline completed successfully.")

if __name__ == "__main__":
    main()
