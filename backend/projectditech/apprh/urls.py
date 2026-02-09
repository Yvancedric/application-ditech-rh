from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  ( login, dashboard_stats, dashboard_hr_analytics, dashboard_service_stats, dashboard_alerts, ServiceViewSet, 
                     EmployeeViewSet, EmployeeHistoryViewSet, JobOfferViewSet, CandidateViewSet, InterviewViewSet, 
                     LeaveRequestViewSet, LeaveBalanceViewSet, AttendanceViewSet, 
                     ContractViewSet, PayslipViewSet, PayslipBonusViewSet, PayslipDeductionViewSet, PaymentHistoryViewSet,
                     DocumentViewSet, upload_document, scan_document,
                     PresenceTrackingViewSet, TrainingPlanViewSet, TrainingViewSet, TrainingSessionViewSet, EvaluationViewSet
)


router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'employee-history', EmployeeHistoryViewSet, basename='employee-history')
router.register(r'job-offers', JobOfferViewSet, basename='job-offer')
router.register(r'candidates', CandidateViewSet)
router.register(r'interviews', InterviewViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'leave-balances', LeaveBalanceViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'payslips', PayslipViewSet)
router.register(r'payslip-bonuses', PayslipBonusViewSet, basename='payslip-bonus')
router.register(r'payslip-deductions', PayslipDeductionViewSet, basename='payslip-deduction')
router.register(r'payment-history', PaymentHistoryViewSet, basename='payment-history')
router.register(r'documents', DocumentViewSet)
router.register(r'presence-tracking', PresenceTrackingViewSet, basename='presence-tracking')
router.register(r'training-plans', TrainingPlanViewSet, basename='training-plan')
router.register(r'trainings', TrainingViewSet, basename='training')
router.register(r'training-sessions', TrainingSessionViewSet, basename='training-session')
router.register(r'evaluations', EvaluationViewSet)

urlpatterns = [
    path('login/', login, name='login'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/analytics/', dashboard_hr_analytics, name='dashboard-analytics'),
    path('dashboard/service-stats/', dashboard_service_stats, name='dashboard-service-stats'),
    path('dashboard/service-stats/<int:service_id>/', dashboard_service_stats, name='dashboard-service-stats-detail'),
    path('dashboard/alerts/', dashboard_alerts, name='dashboard-alerts'),
    path('documents/upload/', upload_document, name='upload-document'),
    path('documents/scan/', scan_document, name='scan-document'),
    path('', include(router.urls)),
]