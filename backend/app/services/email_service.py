import os
import smtplib
from email.message import EmailMessage
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Configured via environment variables
        self.smtp_enabled = os.getenv("SMTP_ENABLED", "false").lower() == "true"
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.sendgrid.net")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "apikey")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", "no-reply@fibercore.com")

    def send_email(self, to_emails: List[str], subject: str, html_content: str):
        if self.smtp_enabled:
            self._send_smtp_email(to_emails, subject, html_content)
        else:
            self._send_mock_email(to_emails, subject, html_content)

    def _send_mock_email(self, to_emails: List[str], subject: str, html_content: str):
        # MOCK IMPLEMENTATION
        # Instead of sending, we just log the email contents to the console.
        logger.info("="*50)
        logger.info(f"[MOCK EMAIL SENT]")
        logger.info(f"To: {', '.join(to_emails)}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content: {html_content[:100]}...") # truncate for logging
        logger.info("="*50)

    def _send_smtp_email(self, to_emails: List[str], subject: str, html_content: str):
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = self.sender_email
            msg["To"] = ", ".join(to_emails)
            msg.set_content("Please enable HTML to view this message.")
            msg.add_alternative(html_content, subtype="html")

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            logger.info(f"Real SMTP email sent successfully to {to_emails}")
        except Exception as e:
            logger.error(f"Failed to send real SMTP email: {e}")
            raise e

email_service = EmailService()
