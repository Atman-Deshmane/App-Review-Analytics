import smtplib
import json
import os
import markdown
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from premailer import transform

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
        body_md = data.get("body_md")
        # Fallback to pre-generated HTML if MD is missing
        body_html = data.get("body_html") 
        app_name = data.get("app_name", "App")
        dashboard_url = data.get("dashboard_url", "https://100cr.cloud/reviews/dashboard")

        if not recipient or not os.getenv("EMAIL_SENDER"):
            print("Skipping: Missing credentials/recipient.")
            return

        # --- Generate Pro HTML ---
        if body_md:
            print("🎨 Styling email with Premailer...")
            # Convert Markdown to HTML
            content_html = markdown.markdown(body_md, extensions=['tables', 'fenced_code'])
            
            # High-Quality Template
            html_template = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    /* Typography */
                    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; line-height: 1.6; }}
                    h1, h2, h3, h4 {{ color: #111827; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }}
                    h2 {{ font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }}
                    h3 {{ font-size: 16px; color: #4b5563; margin-top: 24px; }}
                    p {{ margin-bottom: 16px; color: #374151; }}
                    ul, ol {{ margin-bottom: 16px; padding-left: 24px; color: #374151; }}
                    li {{ margin-bottom: 6px; }}
                    a {{ color: #6366f1; text-decoration: none; }}
                    
                    /* Container */
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .card {{ background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }}
                    
                    /* Header */
                    .header {{ background-color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6; }}
                    .header-title {{ font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }}
                    .app-name {{ font-size: 28px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; }}
                    
                    /* Content */
                    .content {{ padding: 32px 24px; }}
                    
                    /* Tables */
                    table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }}
                    th {{ background-color: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-weight: 600; }}
                    td {{ padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }}
                    tr:last-child td {{ border-bottom: none; }}
                    
                    /* Quotes */
                    blockquote {{ margin: 24px 0; padding: 16px 20px; background-color: #f9fafb; border-left: 4px solid #6366f1; font-style: italic; color: #4b5563; border-radius: 0 8px 8px 0; }}
                    
                    /* CTA Button */
                    .cta-container {{ text-align: center; margin-top: 40px; margin-bottom: 20px; }}
                    .cta-button {{ display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4); }}
                    
                    /* Footer */
                    .footer {{ text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; }}
                    
                    /* Dark Mode Support (Clients that support it) */
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
                        <p>&copy; {2025} NextLeap Milestone 2 • Automated Report</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Inline CSS using Premailer
            final_html = transform(html_template)
        else:
            print("⚠️ logic Warning: Using raw HTML fallback.")
            final_html = body_html

        # Create Message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = os.getenv("EMAIL_SENDER")
        msg['To'] = recipient
        msg.attach(MIMEText(final_html, 'html'))

        # Send
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

if __name__ == "__main__":
    main()
