from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Employee, Service, EmployeeHistory, JobOffer, Candidate, Interview, LeaveRequest, LeaveBalance, Attendance, Contract, Payslip, PayslipBonus, PayslipDeduction, PaymentHistory, Document, PresenceTracking, TrainingPlan, Training, TrainingSession, Evaluation


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'first_name', 'last_name']
        read_only_fields = ['id']


class ServiceSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'manager', 'manager_name', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'name': {'required': True},
            'description': {'required': False, 'allow_blank': True},
            'manager': {'allow_null': True, 'required': False}
        }
    
    def get_manager_name(self, obj):
        """Obtenir le nom complet du manager"""
        if not obj.manager:
            return None
        
        # Essayer d'abord first_name et last_name (plus fiable)
        first_name = getattr(obj.manager, 'first_name', '') or ''
        last_name = getattr(obj.manager, 'last_name', '') or ''
        
        if first_name or last_name:
            full_name = f"{first_name} {last_name}".strip()
            if full_name:
                return full_name
        
        # Ensuite essayer get_full_name() (peut retourner une chaîne vide)
        if hasattr(obj.manager, 'get_full_name'):
            try:
                full_name = obj.manager.get_full_name()
                if full_name and full_name.strip():
                    return full_name.strip()
            except Exception:
                pass
        
        # En dernier recours, utiliser le username
        username = getattr(obj.manager, 'username', None)
        if username:
            return username
        
        return None
    
    def get_employee_count(self, obj):
        """Obtenir le nombre d'employés du service"""
        if hasattr(obj, 'employee_count'):
            return obj.employee_count
        return obj.employees.count()
    
    def validate(self, attrs):
        """Valider et normaliser les données du service"""
        # Convertir manager vide ou chaîne vide en None
        if 'manager' in attrs:
            manager_value = attrs.get('manager')
            if manager_value == '' or manager_value is None:
                attrs['manager'] = None
            elif isinstance(manager_value, str):
                try:
                    manager_id = int(manager_value)
                    # Vérifier que l'utilisateur existe
                    from .models import User
                    try:
                        User.objects.get(id=manager_id)
                        attrs['manager'] = manager_id
                    except User.DoesNotExist:
                        raise serializers.ValidationError({"manager": "L'utilisateur sélectionné comme manager n'existe pas."})
                except (ValueError, TypeError):
                    attrs['manager'] = None
        
        # Valider que le nom n'est pas vide
        if 'name' in attrs and (not attrs.get('name') or attrs.get('name').strip() == ''):
            raise serializers.ValidationError({"name": "Le nom du service est requis."})
        
        return attrs


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    employee_id = serializers.CharField(read_only=True)  # L'ID est toujours généré automatiquement
    
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'employee_id']


class EmployeeHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    
    class Meta:
        model = EmployeeHistory
        fields = '__all__'
        read_only_fields = ['changed_at']



class JobOfferSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    application_count = serializers.IntegerField(read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = JobOffer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'published_date']


# Serializer simplifié pour Candidate (évite la récursion avec InterviewSerializer)
class CandidateSimpleSerializer(serializers.ModelSerializer):
    job_offer_detail = JobOfferSerializer(source='job_offer', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Candidate
        fields = ['id', 'job_offer', 'job_offer_detail', 'first_name', 'last_name', 'full_name', 'email', 
                  'phone', 'position', 'cv', 'cover_letter', 'status', 'status_display', 'application_date',
                  'source', 'expected_salary', 'availability_date', 'notes', 'rating', 'created_by',
                  'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'application_date']


# Serializer simplifié pour Interview (évite la récursion avec CandidateSerializer)
class InterviewSimpleSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    interview_type_display = serializers.CharField(source='get_interview_type_display', read_only=True)
    recommendation_display = serializers.CharField(source='get_recommendation_display', read_only=True)
    
    class Meta:
        model = Interview
        fields = ['id', 'candidate', 'candidate_name', 'interviewer', 'interviewer_name', 'scheduled_date', 
                  'actual_date', 'interview_type', 'interview_type_display', 'status', 'status_display',
                  'location', 'meeting_link', 'duration_minutes', 'notes', 'feedback', 'rating',
                  'strengths', 'weaknesses', 'recommendation', 'recommendation_display', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CandidateSerializer(serializers.ModelSerializer):
    job_offer_detail = JobOfferSerializer(source='job_offer', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    interview_count = serializers.IntegerField(read_only=True)
    last_interview = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'application_date']
    
    def get_last_interview(self, obj):
        last_interview = obj.last_interview
        if last_interview:
            # Utiliser le serializer simplifié pour éviter la récursion infinie
            return InterviewSimpleSerializer(last_interview, context={'avoid_recursion': True}).data
        return None


class InterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    candidate_detail = serializers.SerializerMethodField()
    interviewer_name = serializers.SerializerMethodField()
    interviewer_detail = UserSerializer(source='interviewer', read_only=True)
    candidate_position = serializers.CharField(source='candidate.position', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    interview_type_display = serializers.CharField(source='get_interview_type_display', read_only=True)
    recommendation_display = serializers.CharField(source='get_recommendation_display', read_only=True)
    
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_candidate_detail(self, obj):
        # Utiliser le serializer simplifié pour éviter la récursion infinie
        # Le serializer simplifié ne contient pas last_interview qui causerait une récursion
        return CandidateSimpleSerializer(obj.candidate, context={'avoid_recursion': True}).data
    
    def get_interviewer_name(self, obj):
        """Obtenir le nom complet de l'intervieweur"""
        # Vérifier d'abord si interviewer_id existe
        if not hasattr(obj, 'interviewer_id') or obj.interviewer_id is None:
            return None
        
        try:
            # Utiliser select_related pour charger l'interviewer (déjà fait dans get_queryset)
            interviewer = obj.interviewer
            if not interviewer:
                return None
            
            # Essayer d'abord first_name et last_name (plus fiable)
            first_name = getattr(interviewer, 'first_name', None) or ''
            last_name = getattr(interviewer, 'last_name', None) or ''
            
            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
                if full_name:
                    return full_name
            
            # Ensuite essayer get_full_name()
            if hasattr(interviewer, 'get_full_name'):
                try:
                    full_name = interviewer.get_full_name()
                    if full_name and full_name.strip():
                        return full_name.strip()
                except Exception:
                    pass
            
            # En dernier recours, utiliser le username
            username = getattr(interviewer, 'username', None)
            if username:
                return username
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting interviewer name for interview {getattr(obj, 'id', 'unknown')}: {str(e)}")
            return None
        
        return None
    
    def to_representation(self, instance):
        """Surcharger to_representation pour déboguer"""
        representation = super().to_representation(instance)
        # Debug: imprimer interviewer_name dans les logs
        if instance.interviewer:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Interview {instance.id} - interviewer_name: {representation.get('interviewer_name')}")
        return representation



class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_current = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'manager_approval_date', 'rh_approval_date']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    remaining_annual = serializers.IntegerField(read_only=True)
    remaining_sick = serializers.IntegerField(read_only=True)
    monthly_leave = serializers.SerializerMethodField()
    used_monthly = serializers.SerializerMethodField()
    remaining_monthly = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveBalance
        fields = '__all__'
        read_only_fields = ['updated_at']
    
    def get_monthly_leave(self, obj):
        """Calcule le solde mensuel (congés annuels / 12)"""
        from decimal import Decimal
        monthly = Decimal(obj.annual_leave) / Decimal(12)
        return float(monthly.quantize(Decimal('0.01')))
    
    def get_used_monthly(self, obj):
        """Calcule les congés mensuels utilisés pour le mois en cours"""
        from datetime import date
        from .models import LeaveRequest
        
        today = date.today()
        current_month = today.month
        current_year = today.year
        
        # Calculer les congés annuels utilisés ce mois (statut RH_APPROVED)
        monthly_requests = LeaveRequest.objects.filter(
            employee=obj.employee,
            leave_type='ANNUAL',
            status='RH_APPROVED',
            start_date__year=current_year,
            start_date__month=current_month
        )
        
        total_days = sum(request.days for request in monthly_requests)
        return total_days
    
    def get_remaining_monthly(self, obj):
        """Calcule le solde mensuel restant"""
        monthly_leave = self.get_monthly_leave(obj)
        used_monthly = self.get_used_monthly(obj)
        return float(monthly_leave - used_monthly)


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    alert_level = serializers.CharField(read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    parent_contract_id = serializers.IntegerField(source='parent_contract.id', read_only=True, allow_null=True)
    renewal_count = serializers.IntegerField(source='renewals.count', read_only=True)
    
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']



class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_deductions = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Payslip
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'generated_at', 'sent_at', 'paid_at', 'gross_salary', 'net_salary']


class PayslipBonusSerializer(serializers.ModelSerializer):
    payslip_detail = PayslipSerializer(source='payslip', read_only=True)
    bonus_type_display = serializers.CharField(source='get_bonus_type_display', read_only=True)
    
    class Meta:
        model = PayslipBonus
        fields = '__all__'
        read_only_fields = ['created_at']


class PayslipDeductionSerializer(serializers.ModelSerializer):
    payslip_detail = PayslipSerializer(source='payslip', read_only=True)
    deduction_type_display = serializers.CharField(source='get_deduction_type_display', read_only=True)
    
    class Meta:
        model = PayslipDeduction
        fields = '__all__'
        read_only_fields = ['created_at']


class PaymentHistorySerializer(serializers.ModelSerializer):
    payslip_detail = PayslipSerializer(source='payslip', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PaymentHistory
        fields = '__all__'
        read_only_fields = ['created_at']


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    employee_full_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
            return obj.document.url
        return None


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PresenceTrackingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    service_name = serializers.CharField(source='employee.service.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    check_in_method_display = serializers.CharField(source='get_check_in_method_display', read_only=True)
    check_in_time_formatted = serializers.SerializerMethodField()
    check_out_time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = PresenceTracking
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'worked_hours', 'overtime_hours', 'late_minutes', 'is_late']
    
    def get_check_in_time_formatted(self, obj):
        if obj.check_in_time:
            return obj.check_in_time.strftime('%H:%M:%S')
        return None
    
    def get_check_out_time_formatted(self, obj):
        if obj.check_out_time:
            return obj.check_out_time.strftime('%H:%M:%S')
        return None


class TrainingPlanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = TrainingPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class TrainingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    training_plan_detail = TrainingPlanSerializer(source='training_plan', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    training_type_display = serializers.CharField(source='get_training_type_display', read_only=True)
    
    class Meta:
        model = Training
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class TrainingSessionSerializer(serializers.ModelSerializer):
    training_detail = TrainingSerializer(source='training', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TrainingSession
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EvaluationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_detail = EmployeeSerializer(source='employee', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    evaluation_type_display = serializers.CharField(source='get_evaluation_type_display', read_only=True)
    average_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Evaluation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'approval_date', 'performance_score']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personnalisé pour inclure les informations utilisateur dans le token"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajouter des informations personnalisées au token
        token['username'] = user.username
        token['email'] = user.email or ''
        token['role'] = user.role
        token['user_id'] = str(user.id)
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Vérifier si l'utilisateur est actif
        if not self.user.is_active:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'Ce compte est désactivé. Contactez l\'administrateur.',
                code='user_inactive'
            )
        
        # Ajouter les informations utilisateur à la réponse
        data['user'] = UserSerializer(self.user).data
        return data