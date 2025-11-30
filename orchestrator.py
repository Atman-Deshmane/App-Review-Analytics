import subprocess
import smtplib
import os
import sys
import shutil
import datetime
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

def send_email():
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    recipient_email = os.getenv("EMAIL_RECIPIENT")

    if not sender_email or not sender_password or not recipient_email:
        print("Email credentials not found in .env - skipping email send.")
        return

    print(f"[{datetime.datetime.now()}] Sending email to {recipient_email}...")

    try:
        # Read the report content
        with open("weekly_pulse_report.md", "r") as f:
            report_content = f.read()

        # Create email message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Weekly App Pulse: Groww - {datetime.date.today()}"

        # Convert Markdown to simple text (or just send as text)
        msg.attach(MIMEText(report_content, 'plain'))

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
    history_dir = os.path.join("history", today_str)
    
    print(f"[{datetime.datetime.now()}] Archiving artifacts to {history_dir}...")
    
    if not os.path.exists(history_dir):
        os.makedirs(history_dir)
        
    files_to_archive = [
        "weekly_pulse_report.md",
        "reviews_tagged.json",
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
            
    print(f"[{datetime.datetime.now()}] === ARCHIVING COMPLETE: Moved files to history/{today_str}/ ===\n")

def main():
    print(f"[{datetime.datetime.now()}] Starting Weekly Pulse Analysis Pipeline...")
    
    # Step 1: Fetch Reviews
    run_script("fetch_reviews.py")
    
    # Step 2: Extract Tags
    run_script("step1_extract_tags.py")
    
    # Step 3: Analyze and Report
    run_script("step2_analyze_and_report.py")
    
    # Step 4: Send Email
    send_email()
    
    # Step 5: Archive
    archive_history()
    
    print(f"[{datetime.datetime.now()}] Pipeline completed successfully.")

if __name__ == "__main__":
    main()
