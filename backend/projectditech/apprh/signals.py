from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee, EmployeeHistory

User = get_user_model()


@receiver(pre_save, sender=Employee)
def track_employee_changes(sender, instance, **kwargs):
    """Enregistre les changements dans l'historique avant la sauvegarde"""
    if instance.pk:  # Si l'employé existe déjà (modification)
        try:
            old_instance = Employee.objects.get(pk=instance.pk)
            
            # Vérifier les changements de poste
            if old_instance.position != instance.position:
                EmployeeHistory.objects.create(
                    employee=instance,
                    change_type='POSITION',
                    field_name='position',
                    old_value=old_instance.position,
                    new_value=instance.position,
                    description=f'Changement de poste de "{old_instance.position}" à "{instance.position}"',
                    changed_by=getattr(instance, '_changed_by', None)
                )
            
            # Vérifier les changements de salaire
            if old_instance.salary != instance.salary:
                EmployeeHistory.objects.create(
                    employee=instance,
                    change_type='SALARY',
                    field_name='salary',
                    old_value=str(old_instance.salary),
                    new_value=str(instance.salary),
                    description=f'Changement de salaire de {old_instance.salary:,.0f} FCFA à {instance.salary:,.0f} FCFA',
                    changed_by=getattr(instance, '_changed_by', None)
                )
            
            # Vérifier les changements de service
            if old_instance.service != instance.service:
                old_service = old_instance.service.name if old_instance.service else 'Non assigné'
                new_service = instance.service.name if instance.service else 'Non assigné'
                EmployeeHistory.objects.create(
                    employee=instance,
                    change_type='SERVICE',
                    field_name='service',
                    old_value=old_service,
                    new_value=new_service,
                    description=f'Changement de service de "{old_service}" à "{new_service}"',
                    changed_by=getattr(instance, '_changed_by', None)
                )
            
            # Vérifier les changements de statut (actif/inactif)
            if old_instance.is_active != instance.is_active:
                status_old = 'Actif' if old_instance.is_active else 'Inactif'
                status_new = 'Actif' if instance.is_active else 'Inactif'
                EmployeeHistory.objects.create(
                    employee=instance,
                    change_type='STATUS',
                    field_name='is_active',
                    old_value=status_old,
                    new_value=status_new,
                    description=f'Changement de statut de "{status_old}" à "{status_new}"',
                    changed_by=getattr(instance, '_changed_by', None)
                )
            
            # Vérifier les autres changements d'informations personnelles
            fields_to_track = ['first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'date_of_hire']
            for field in fields_to_track:
                old_value = getattr(old_instance, field, None)
                new_value = getattr(instance, field, None)
                if old_value != new_value:
                    EmployeeHistory.objects.create(
                        employee=instance,
                        change_type='INFO',
                        field_name=field,
                        old_value=str(old_value) if old_value else '',
                        new_value=str(new_value) if new_value else '',
                        description=f'Modification de {field}: "{old_value}" → "{new_value}"',
                        changed_by=getattr(instance, '_changed_by', None)
                    )
        except Employee.DoesNotExist:
            pass  # Nouvel employé, pas d'historique à créer
