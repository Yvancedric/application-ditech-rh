from django.contrib import admin
from django.utils.html import format_html
from .models import (
    User, Employee, Service, EmployeeHistory, JobOffer, Candidate, Interview,
    LeaveRequest, LeaveBalance, Attendance, Contract, Payslip, PayslipBonus,
    PayslipDeduction, PaymentHistory, Document, PresenceTracking,
    TrainingPlan, Training, TrainingSession, Evaluation
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'employee_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    
    def employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    employee_count.short_description = 'Nombre d\'employés'


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'employee_id', 'full_name', 'social_security_number', 'cnps_number',
        'position', 'qualification', 'service', 'salary', 'date_of_hire', 'date_of_exit', 'is_active'
    ]
    list_filter = ['service', 'is_active', 'gender', 'position', 'date_of_hire', 'is_cdd', 'is_part_time']
    search_fields = [
        'employee_id', 'first_name', 'last_name', 'email', 'phone',
        'social_security_number', 'cnps_number', 'nationality', 'position', 'qualification', 'address'
    ]
    readonly_fields = ['employee_id', 'created_at', 'updated_at']
    fieldsets = (
        ('Identité / Compte', {
            'fields': ('user', 'employee_id', 'first_name', 'last_name', 'date_of_birth', 'place_of_birth', 'gender', 'nationality')
        }),
        ('Numéros et pièce d\'identité', {
            'fields': ('social_security_number', 'cnps_number', 'badge_id', 'id_document_type', 'id_document_number', 'id_document_issue_date')
        }),
        ('Situation familiale', {
            'fields': ('marital_status', 'number_of_children')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Emploi et qualification', {
            'fields': ('position', 'qualification', 'service', 'salary')
        }),
        ('Dates', {
            'fields': ('date_of_hire', 'date_of_exit', 'created_at', 'updated_at')
        }),
        ('Travailleurs étrangers', {
            'fields': ('work_permit_title', 'work_permit_order_number'),
            'classes': ('collapse',)
        }),
        ('Jeunes travailleurs', {
            'fields': ('is_apprentice', 'is_professionalization_contract'),
            'classes': ('collapse',)
        }),
        ('Contrat spécifique', {
            'fields': ('is_cdd', 'is_part_time', 'contract_specific_other'),
            'classes': ('collapse',)
        }),
        ('Autres', {
            'fields': ('photo', 'is_active')
        }),
    )
    
    def full_name(self, obj):
        return obj.get_full_name()
    full_name.short_description = 'Nom complet'


@admin.register(EmployeeHistory)
class EmployeeHistoryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'change_type', 'field_name', 'changed_by', 'changed_at']
    list_filter = ['change_type', 'changed_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'field_name']
    readonly_fields = ['changed_at']
    ordering = ['-changed_at']


@admin.register(JobOffer)
class JobOfferAdmin(admin.ModelAdmin):
    list_display = ['title', 'position', 'contract_type', 'status', 'application_count', 'published_date']
    list_filter = ['status', 'contract_type', 'department', 'published_date']
    search_fields = ['title', 'position', 'description']
    readonly_fields = ['application_count', 'published_date', 'created_at', 'updated_at']
    
    def application_count(self, obj):
        return obj.applications.count()
    application_count.short_description = 'Candidatures'


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'position', 'job_offer', 'status', 'rating', 'application_date']
    list_filter = ['status', 'position', 'application_date', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'position']
    readonly_fields = ['application_date', 'created_at', 'updated_at']
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Candidature', {
            'fields': ('job_offer', 'position', 'application_date', 'source', 'cv', 'cover_letter')
        }),
        ('Détails', {
            'fields': ('status', 'expected_salary', 'availability_date', 'rating', 'notes')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'created_by')
        }),
    )
    
    def full_name(self, obj):
        return obj.get_full_name()
    full_name.short_description = 'Nom complet'


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'interviewer_name', 'scheduled_date', 'interview_type', 'status', 'rating']
    list_filter = ['status', 'interview_type', 'scheduled_date']
    search_fields = ['candidate__first_name', 'candidate__last_name', 'interviewer__username', 'interviewer__first_name', 'interviewer__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def interviewer_name(self, obj):
        """Afficher le nom complet de l'intervieweur"""
        if obj.interviewer:
            # Essayer first_name et last_name
            first_name = getattr(obj.interviewer, 'first_name', '') or ''
            last_name = getattr(obj.interviewer, 'last_name', '') or ''
            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
                if full_name:
                    return full_name
            # Sinon utiliser get_full_name()
            if hasattr(obj.interviewer, 'get_full_name'):
                full_name = obj.interviewer.get_full_name()
                if full_name and full_name.strip():
                    return full_name.strip()
            # En dernier recours, username
            return obj.interviewer.username or '-'
        return '-'
    interviewer_name.short_description = 'Intervieweur'


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days', 'status', 'created_at']
    list_filter = ['status', 'leave_type', 'start_date', 'created_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'reason']
    readonly_fields = ['created_at', 'updated_at', 'manager_approval_date', 'rh_approval_date']


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'annual_leave', 'used_annual', 'remaining_annual', 'sick_leave', 'used_sick', 'remaining_sick']
    search_fields = ['employee__first_name', 'employee__last_name']
    readonly_fields = ['remaining_annual', 'remaining_sick', 'updated_at']
    
    def remaining_annual(self, obj):
        return obj.remaining_annual
    remaining_annual.short_description = 'Congés annuels restants'
    
    def remaining_sick(self, obj):
        return obj.remaining_sick
    remaining_sick.short_description = 'Congés maladie restants'


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in', 'check_out', 'is_present', 'is_late', 'overtime_hours']
    list_filter = ['date', 'is_present', 'is_late']
    search_fields = ['employee__first_name', 'employee__last_name']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['employee', 'contract_type', 'start_date', 'end_date', 'status', 'needs_renewal', 'is_expiring_soon']
    list_filter = ['contract_type', 'status', 'needs_renewal', 'start_date']
    search_fields = ['employee__first_name', 'employee__last_name', 'position']
    readonly_fields = ['is_expiring_soon', 'is_expired', 'days_until_expiry', 'alert_level', 'created_at', 'updated_at']
    
    def is_expiring_soon(self, obj):
        return obj.is_expiring_soon
    is_expiring_soon.boolean = True
    is_expiring_soon.short_description = 'Expire bientôt'


class PayslipBonusInline(admin.TabularInline):
    model = PayslipBonus
    extra = 0
    fields = ['bonus_type', 'description', 'amount']


class PayslipDeductionInline(admin.TabularInline):
    model = PayslipDeduction
    extra = 0
    fields = ['deduction_type', 'description', 'amount']


class PaymentHistoryInline(admin.TabularInline):
    model = PaymentHistory
    extra = 0
    readonly_fields = ['created_at']
    fields = ['payment_date', 'amount', 'payment_method', 'reference', 'created_at']


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'year', 'base_salary', 'bonuses', 'deductions', 'net_salary', 'status']
    list_filter = ['status', 'year', 'month']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']
    readonly_fields = ['gross_salary', 'net_salary', 'total_earnings', 'total_deductions', 'created_at', 'updated_at', 'generated_at', 'sent_at', 'paid_at']
    inlines = [PayslipBonusInline, PayslipDeductionInline, PaymentHistoryInline]
    fieldsets = (
        ('Informations', {
            'fields': ('employee', 'month', 'year', 'status')
        }),
        ('Salaire', {
            'fields': ('base_salary', 'bonuses', 'overtime_pay', 'deductions', 'gross_salary', 'net_salary')
        }),
        ('Paiement', {
            'fields': ('payment_date', 'payment_method', 'pdf_file')
        }),
        ('Calculs automatiques', {
            'fields': ('total_earnings', 'total_deductions'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'generated_at', 'sent_at', 'paid_at', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(PayslipBonus)
class PayslipBonusAdmin(admin.ModelAdmin):
    list_display = ['payslip', 'bonus_type', 'description', 'amount', 'created_at']
    list_filter = ['bonus_type', 'created_at']
    search_fields = ['payslip__employee__first_name', 'payslip__employee__last_name', 'description']


@admin.register(PayslipDeduction)
class PayslipDeductionAdmin(admin.ModelAdmin):
    list_display = ['payslip', 'deduction_type', 'description', 'amount', 'created_at']
    list_filter = ['deduction_type', 'created_at']
    search_fields = ['payslip__employee__first_name', 'payslip__employee__last_name', 'description']


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['payslip', 'payment_date', 'amount', 'payment_method', 'reference', 'created_by', 'created_at']
    list_filter = ['payment_date', 'payment_method', 'created_at']
    search_fields = ['payslip__employee__first_name', 'payslip__employee__last_name', 'reference']
    readonly_fields = ['created_at']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['document_type', 'employee', 'uploaded_by', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PresenceTracking)
class PresenceTrackingAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in_time', 'check_out_time', 'status', 'is_late', 'overtime_hours', 'worked_hours']
    list_filter = ['date', 'status', 'is_late', 'check_in_method']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id', 'badge_id']
    readonly_fields = ['worked_hours', 'overtime_hours', 'late_minutes', 'is_late', 'created_at', 'updated_at']
    date_hierarchy = 'date'


class TrainingInline(admin.TabularInline):
    model = Training
    extra = 0
    fields = ['title', 'training_type', 'start_date', 'end_date', 'status']


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'start_date', 'end_date', 'status', 'completion_rate', 'created_at']
    list_filter = ['status', 'start_date', 'created_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'title']
    readonly_fields = ['completion_rate', 'created_at', 'updated_at']
    inlines = [TrainingInline]
    
    def completion_rate(self, obj):
        return f"{obj.completion_rate:.1f}%"
    completion_rate.short_description = 'Taux de complétion'


class TrainingSessionInline(admin.TabularInline):
    model = TrainingSession
    extra = 0
    fields = ['session_date', 'start_time', 'end_time', 'location', 'status', 'attendance']


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'training_type', 'start_date', 'end_date', 'status', 'cost']
    list_filter = ['training_type', 'status', 'start_date']
    search_fields = ['employee__first_name', 'employee__last_name', 'title', 'provider']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TrainingSessionInline]


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ['training', 'session_date', 'start_time', 'end_time', 'location', 'status', 'attendance']
    list_filter = ['status', 'session_date', 'attendance']
    search_fields = ['training__title', 'training__employee__first_name', 'instructor']
    date_hierarchy = 'session_date'


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'evaluation_date', 'evaluation_type', 'status', 'performance_score', 'average_score', 'evaluated_by']
    list_filter = ['evaluation_type', 'status', 'evaluation_date']
    search_fields = ['employee__first_name', 'employee__last_name']
    readonly_fields = ['average_score', 'performance_score', 'created_at', 'updated_at', 'approval_date']
    fieldsets = (
        ('Informations', {
            'fields': ('employee', 'evaluation_date', 'evaluation_type', 'status')
        }),
        ('Notes globales', {
            'fields': ('performance_score', 'average_score', 'comments')
        }),
        ('Critères d\'évaluation', {
            'fields': ('quality_score', 'productivity_score', 'teamwork_score', 'communication_score', 'initiative_score')
        }),
        ('Commentaires', {
            'fields': ('strengths', 'areas_for_improvement', 'goals')
        }),
        ('Feedback manager', {
            'fields': ('manager_feedback', 'manager_recommendations')
        }),
        ('Approbation', {
            'fields': ('evaluated_by', 'approved_by', 'approval_date')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def average_score(self, obj):
        avg = obj.average_score
        return f"{avg:.2f}" if avg else "-"
    average_score.short_description = 'Moyenne'
