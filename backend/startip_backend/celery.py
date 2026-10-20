import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'startip_backend.settings')

app = Celery('startip_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'StarTip Celery Task: {self.request!r}')
