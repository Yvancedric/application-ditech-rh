from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import User, Employee, Service, EmployeeHistory, Candidate, Interview, LeaveRequest, LeaveBalance, Attendance, Contract, Payslip
from .serializers import (
    UserSerializer, EmployeeSerializer, ServiceSerializer,
    EmployeeHistorySerializer, LoginSerializer, CandidateSerializer, InterviewSerializer,
    LeaveRequestSerializer, LeaveBalanceSerializer, AttendanceSerializer, ContractSerializer, PayslipSerializer
)
from apprh.models import Employee, User, Service
from datetime import date, timedelta
from django.utils import timezone
from io import BytesIO
import os
from django.http import FileResponse
from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


# Vue personnalisée pour retourner les tokens avec les informations utilisateur
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Récupérer l'utilisateur depuis le token
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(response.data['access'])
            user_id = access_token['user_id']
            
            try:
                user = User.objects.get(id=user_id)
                response.data['user'] = UserSerializer(user).data
            except User.DoesNotExist:
                pass
        
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
