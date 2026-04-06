from app.celeryconfig import celery_app
import time

@celery_app.task
def poll_urlhaus():
    # Mock polling URLHaus (abuse.ch)
    print("Polling URLhaus payload feed...")
    return True

@celery_app.task
def poll_openphish():
    # Mock polling openphish
    print("Polling OpenPhish feed...")
    return True

@celery_app.task
def poll_alienvault():
    print("Polling AlienVault OTX pulses...")
    return True

@celery_app.task
def refresh_stats():
    print("Refreshing stats...")
    return True
