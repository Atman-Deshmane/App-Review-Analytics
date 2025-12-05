import subprocess
import os
import sys
import shutil
import time
import datetime
import markdown
import argparse
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Firebase Initialization
try:
    import firebase_admin
    from firebase_admin import credentials, db
except ImportError:
    raise ImportError("firebase-admin module not found. Please install it using 'pip install firebase-admin'")

FIREBASE_AVAILABLE = False

# Load credentials from Environment Variable
cred_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")
db_url = os.getenv("FIREBASE_DB_URL")

# Strict Enforcement
if not cred_json_str:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable is missing!")
if not db_url:
    raise ValueError("FIREBASE_DB_URL environment variable is missing!")

try:
    cred_json = json.loads(cred_json_str)
    cred = credentials.Certificate(cred_json)
    
    # Check if app is already initialized to avoid error on re-run
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {
            'databaseURL': db_url
        })
    FIREBASE_AVAILABLE = True
    print(f"[{datetime.datetime.now()}] FIREBASE CONNECTED: {db_url}")
    
    # Test Connection
    print(f"[{datetime.datetime.now()}] Testing Firebase connection...")
    db.reference('test_connection').set(True)
    print(f"[{datetime.datetime.now()}] Firebase connection test PASSED.")
    
except Exception as e:
    print(f"!!! CRITICAL FIREBASE ERROR: {e}")
    raise e # Re-raise to fail the workflow

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
            print(f"!!! CRITICAL FIREBASE ERROR: {e}")

def run_script(script_name, args=None, job_id=None):
    print(f"[{datetime.datetime.now()}] Running {script_name}...")
    cmd = [sys.executable, script_name]
    if args:
        cmd.extend(args)
    
    try:
        # Use Popen to capture output in real-time
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT, # Merge stderr into stdout
            text=True, 
            bufsize=1 # Line buffered
        )

        # Read output line by line
        for line in process.stdout:
            line = line.strip()
            if line:
                print(line) # Print to local console
                
                # Filter Noise for Frontend
                noise_keywords = ["Scanning App", "File content", "uploading", "replacing"]
                if any(keyword in line for keyword in noise_keywords):
                    continue
                
                # Send to Firebase as status update
                update_status(line, job_id=job_id)

        # Wait for completion
        return_code = process.wait()
        
        if return_code != 0:
            raise subprocess.CalledProcessError(return_code, cmd)
            
        print(f"[{datetime.datetime.now()}] {script_name} completed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}: {e}")
        update_status(f"Error running {script_name}", job_id=job_id)
        sys.exit(1) # Exit with error code to fail the workflow

def send_email(report_content, recipient_email, app_name="App", dashboard_url="https://100cr.cloud/reviews/dashboard", job_id=None):
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
    parser.add_argument('--app_id', type=str, default='com.nextbillion.groww', help='Application ID (Package Name)')
    parser.add_argument('--count', type=int, default=200, help='Number of reviews to fetch')
    parser.add_argument('--themes', type=str, default='auto', help='Comma-separated themes')
    parser.add_argument('--email', type=str, help='Recipient email')
    parser.add_argument('--date_range', type=int, default=2, help='Weeks back (Deprecated if start/end date used)')
    parser.add_argument('--start_date', type=str, help='Start Date (YYYY-MM-DD)')
    parser.add_argument('--end_date', type=str, help='End Date (YYYY-MM-DD)')
    parser.add_argument('--job_id', type=str, help='Firebase Job ID for status tracking')
    
    args = parser.parse_args()
    
    # Debug Logging
    if not args.job_id:
        print("WARNING: Running in Headless Mode (No Job ID). Updates will not be visible on Frontend.")
    print(f"[DEBUG] Workflow Job ID: {args.job_id}")
    
    print(f"[{datetime.datetime.now()}] Starting Orchestrator for {args.app_id}...")
    update_status("Initializing...", progress=0, job_id=args.job_id)
    
    # Step 1: Fetch Reviews
    update_status("Fetching reviews...", progress=10, job_id=args.job_id)
    
    fetch_args = ["--app_id", args.app_id, "--count", str(args.count)]
    if args.start_date:
        fetch_args.extend(["--start_date", args.start_date])
    if args.end_date:
        fetch_args.extend(["--end_date", args.end_date])
        
    run_script("fetch_reviews.py", args=fetch_args, job_id=args.job_id)
    update_status("Reviews Fetched. Analyzing Themes...", progress=30, job_id=args.job_id)
    
    # Step 2: Run Core Analysis (AI)
    print(f"[{datetime.datetime.now()}] Running core_analysis_v2.py...")
    update_status("Identifying Top Themes...", progress=50, job_id=args.job_id)
    
    # App Name Mapping
    APP_NAMES = {
        "com.nextbillion.groww": "Groww",
        "com.zerodha.kite3": "Kite by Zerodha",
        "com.dot.app.sancharsaathi": "Sanchar Saathi",
        "in.powerup.money": "PowerUp Money",
        "com.wealthmonitor": "Wealth Monitor",
        "com.kuvera.android": "Kuvera",
        "com.whatsapp": "WhatsApp",
        "com.instagram.android": "Instagram",
        "com.formulaone.production": "F1",
        "com.meesho.supply": "Meesho",
        "com.flipkart.android": "Flipkart"
    }
    
    app_name = APP_NAMES.get(args.app_id, args.app_id)
    
    # CRITICAL: Actually run the analysis script
    run_script("core_analysis_v2.py", args=["--themes", args.themes, "--app_name", app_name], job_id=args.job_id)
    update_status("Tagging & Sentiment Analysis Complete.", progress=70, job_id=args.job_id)

    # Step 3: Archive (Moved before email to get version)
    final_archive_path = archive_history(args.app_id, args.count, job_id=args.job_id)
    version_id = os.path.basename(final_archive_path)
    
    # Construct Dynamic Dashboard URL
    # Base URL: https://100cr.cloud/reviews/dashboard
    # Query Params: ?app={app_id}&version={version_id}
    dashboard_url = f"https://100cr.cloud/reviews/dashboard?app={args.app_id}&version={version_id}"
    print(f"Generated Dashboard URL: {dashboard_url}")


    # Step 4: Generate Manifest
    update_status("Updating manifest...", progress=95, job_id=args.job_id)
    run_script("generate_manifest.py", job_id=args.job_id)
    # --- Generate Email Payload (Decoupled Notification) ---
    if args.email:
        print(f"[{datetime.datetime.now()}] Preparing email configuration for {args.email}...")
        
        # Read the generated report
        report_content = ""
        report_file = "weekly_pulse_report.md"
        try:
            with open(report_file, 'r') as f:
                report_content = f.read()
        except Exception as e:
            print(f"Warning: Could not read report file for email: {e}")
            report_content = "Report generation failed or file is missing."

        # Generate HTML Body
        html_content = markdown.markdown(report_content)
        
        email_body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                /* Reset */
                body, p, h1, h2, h3 {{ margin: 0; padding: 0; }}
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f5; }}
                
                /* Container */
                .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
                
                /* Header */
                .header {{ background-color: #4f46e5; padding: 30px 20px; text-align: center; }}
                .header h2 {{ color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }}
                
                /* Content */
                .content {{ padding: 30px 20px; color: #333333; }}
                .content h3 {{ color: #1f2937; margin-top: 20px; margin-bottom: 10px; }}
                .content p {{ margin-bottom: 15px; }}
                .content ul {{ margin-bottom: 15px; padding-left: 20px; }}
                .content li {{ margin-bottom: 5px; }}
                
                /* Button Wrapper to Force Center */
                .button-wrapper {{ text-align: center; margin-top: 30px; margin-bottom: 30px; }}
                
                /* Button */
                .button {{
                    display: inline-block;
                    background-color: #4f46e5; /* Indigo 600 */
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
                }}
                /* Dark Mode Overrides (Email Clients often invert) */
                @media (prefers-color-scheme: dark) {{
                    body {{ background-color: #18181b !important; }}
                    .container {{ background-color: #27272a !important; color: #e4e4e7 !important; }}
                    .content {{ color: #e4e4e7 !important; }}
                    .content h3 {{ color: #ffffff !important; }}
                    .header {{ background-color: #4338ca !important; }} /* Slightly darker indigo */
                }}
                
                .footer {{ text-align: center; padding: 20px; background-color: #f4f4f5; color: #71717a; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📊 App Review Insights</h2>
                </div>
                <div class="content">
                    {html_content}
                    
                    <div class="button-wrapper">
                        <a href="{dashboard_url}" class="button">Open Interactive Dashboard</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Generated by App Review Analytics AI • NextLeap Milestone 2</p>
                </div>
            </div>
        </body>
        </html>
        """

        email_payload = {
            "recipient": args.email,
            "subject": f"Weekly Pulse: {app_name} Review Insights",
            "body_html": email_body_html,
            "body_md": report_content
        }
        
        with open('email_payload.json', 'w') as f:
            json.dump(email_payload, f, indent=2)
            
        print(f"[{datetime.datetime.now()}] Email payload saved. Notification queued after deployment.")

    print(f"[{datetime.datetime.now()}] Pipeline completed successfully.")
    
    try:
        # Wait for deployment propagation
        print(f"[{datetime.datetime.now()}] Waiting for deployment propagation...")
        time.sleep(2)
        
        # Trigger Uploading State (GitHub Actions will mark as COMPLETED)
        update_status("UPLOADING", 95)
        
    except Exception as e:
        print(f"Error during final status update: {e}")

if __name__ == "__main__":
    main()

