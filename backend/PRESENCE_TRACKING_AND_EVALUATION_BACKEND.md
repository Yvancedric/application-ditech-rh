# Backend - Présences & Pointage et Évaluation

## Modèles à ajouter dans `models.py`

### 1. Modèle PresenceTracking

```python
from django.db import models
from django.contrib.auth.models import User

class PresenceTracking(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Présent'),
        ('ABSENT', 'Absent'),
        ('LATE', 'En retard'),
    ]
    
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='presence_records')
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'presence_tracking'
        unique_together = ['employee', 'date']
        ordering = ['-date', '-check_in_time']
    
    def __str__(self):
        return f"{self.employee} - {self.date} - {self.status}"
```

### 2. Modèle Evaluation

```python
class Evaluation(models.Model):
    EVALUATION_TYPE_CHOICES = [
        ('ANNUAL', 'Annuelle'),
        ('SEMESTRIAL', 'Semestrielle'),
        ('QUARTERLY', 'Trimestrielle'),
        ('MONTHLY', 'Mensuelle'),
    ]
    
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='evaluations')
    evaluation_date = models.DateField()
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPE_CHOICES, default='ANNUAL')
    performance_score = models.DecimalField(max_digits=3, decimal_places=2)
    comments = models.TextField(blank=True, null=True)
    evaluated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='evaluations_made')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'evaluations'
        ordering = ['-evaluation_date']
    
    def __str__(self):
        return f"{self.employee} - {self.evaluation_date} - {self.performance_score}/5"
```

## Vues à ajouter dans `views.py`

### 1. Vues pour PresenceTracking

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import date
from .models import PresenceTracking, Employee
from .serializers import PresenceTrackingSerializer

class PresenceTrackingViewSet(viewsets.ModelViewSet):
    queryset = PresenceTracking.objects.all()
    serializer_class = PresenceTrackingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PresenceTracking.objects.select_related('employee').all()
        employee_id = self.request.query_params.get('employee', None)
        date_filter = self.request.query_params.get('date', None)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def present_today(self, request):
        """Retourne la liste des employés présents aujourd'hui"""
        today = date.today()
        present_records = PresenceTracking.objects.filter(
            date=today,
            status='PRESENT'
        ).select_related('employee')
        
        present_employees = []
        for record in present_records:
            employee_data = {
                'id': record.employee.id,
                'first_name': record.employee.first_name,
                'last_name': record.employee.last_name,
                'service_name': record.employee.service.name if hasattr(record.employee, 'service') else None,
                'department': record.employee.department if hasattr(record.employee, 'department') else None,
                'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None
            }
            present_employees.append(employee_data)
        
        return Response(present_employees)
```

### 2. Vues pour Evaluation

```python
from .models import Evaluation
from .serializers import EvaluationSerializer

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Evaluation.objects.select_related('employee', 'evaluated_by').all()
        employee_id = self.request.query_params.get('employee', None)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)
```

## Serializers à ajouter dans `serializers.py`

```python
from rest_framework import serializers
from .models import PresenceTracking, Evaluation

class PresenceTrackingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    
    class Meta:
        model = PresenceTracking
        fields = '__all__'

class EvaluationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    
    class Meta:
        model = Evaluation
        fields = '__all__'
```

## URLs à ajouter dans `urls.py`

```python
from rest_framework.routers import DefaultRouter
from .views import PresenceTrackingViewSet, EvaluationViewSet

router = DefaultRouter()
router.register(r'presence-tracking', PresenceTrackingViewSet, basename='presence-tracking')
router.register(r'evaluations', EvaluationViewSet, basename='evaluations')

urlpatterns = [
    # ... autres URLs
] + router.urls
```

## Migrations

Après avoir ajouté les modèles, exécutez :

```bash
python manage.py makemigrations
python manage.py migrate
```

## Notes importantes

1. Assurez-vous que le modèle `Employee` existe et a les champs `first_name`, `last_name`, et éventuellement `service` ou `department`
2. Les permissions peuvent être ajustées selon vos besoins
3. La méthode `get_full_name()` doit être définie dans le modèle Employee ou utiliser `first_name` et `last_name` directement

