import smtplib
from email.mime.text import MIMEText
from socket import gaierror

from pnp_zone import settings


def sendmail(receiver_list, message, subject):
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=2) as server:
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            for receiver in receiver_list:
                msg = MIMEText(message)
                msg["Subject"] = subject
                msg["From"] = settings.SMTP_USER
                msg["To"] = receiver
                server.sendmail(settings.SMTP_USER, receiver, msg.as_string())
        print('Sent')
    except (gaierror, ConnectionRefusedError):
        print('Failed to connect to the server. Bad connection settings?')
    except smtplib.SMTPServerDisconnected:
        print('Failed to connect to the server. Wrong user/password?')
    except smtplib.SMTPException as e:
        print('SMTP error occurred: ' + str(e))
