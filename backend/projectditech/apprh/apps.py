from django.apps import AppConfig


class ApprhConfig(AppConfig):
    name = 'apprh'
    
    def ready(self):
        import apprh.signals  # Enregistrer les signaux