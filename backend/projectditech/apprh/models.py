from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('RH', 'Ressources Humaines'),
        ('MANAGER', 'Manager'),
        ('EMPLOYE', 'Employé'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYE')
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'core_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        if full_name:
            return full_name
        return self.username
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_services')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Employee(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('', 'Non renseigné'),
    ]
    MARITAL_STATUS_CHOICES = [
        ('', 'Non renseigné'),
        ('SINGLE', 'Célibataire'),
        ('MARRIED', 'Marié(e)'),
        ('DIVORCED', 'Divorcé(e)'),
        ('WIDOWED', 'Veuf(ve)'),
        ('PACS', 'PACS'),
    ]
    ID_DOCUMENT_CHOICES = [
        ('', 'Non renseigné'),
        ('CNI', 'Carte nationale d\'identité'),
        ('PASSPORT', 'Passeport'),
        ('OTHER', 'Autre'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    badge_id = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text='ID du badge pour pointage automatique')
    social_security_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Numéro de sécurité sociale')
    cnps_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Numéro CNPS')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=200, blank=True, verbose_name='Lieu de naissance')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, verbose_name='Sexe')
    nationality = models.CharField(max_length=100, blank=True, verbose_name='Nationalité')
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, verbose_name='Situation familiale')
    number_of_children = models.PositiveIntegerField(default=0, verbose_name='Nombre d\'enfants')
    id_document_type = models.CharField(max_length=20, choices=ID_DOCUMENT_CHOICES, blank=True, verbose_name='Type de pièce d\'identité')
    id_document_number = models.CharField(max_length=100, blank=True, verbose_name='Numéro de pièce d\'identité')
    id_document_issue_date = models.DateField(null=True, blank=True, verbose_name='Date de délivrance de la pièce')
    date_of_hire = models.DateField(verbose_name='Date d\'entrée')
    date_of_exit = models.DateField(null=True, blank=True, verbose_name='Date de sortie')
    position = models.CharField(max_length=100, verbose_name='Emploi')
    qualification = models.CharField(max_length=200, blank=True, verbose_name='Qualification')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, related_name='employees')
    # Travailleurs étrangers - titre autorisant l'exercice d'une activité salariée
    work_permit_title = models.CharField(max_length=200, blank=True, verbose_name='Titre (travailleurs étrangers)')
    work_permit_order_number = models.CharField(max_length=100, blank=True, verbose_name='N° d\'ordre (titre)')
    # Jeunes travailleurs
    is_apprentice = models.BooleanField(default=False, verbose_name='Apprentissage')
    is_professionalization_contract = models.BooleanField(default=False, verbose_name='Professionnalisation')
    # Contrat spécifique
    is_cdd = models.BooleanField(default=False, verbose_name='CDD')
    is_part_time = models.BooleanField(default=False, verbose_name='Temps partiel')
    contract_specific_other = models.CharField(max_length=200, blank=True, verbose_name='Autre (contrat spécifique)')
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    photo = models.ImageField(upload_to='employees/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Toujours forcer l'ID au format DITECH
        # Si l'ID n'existe pas ou ne commence pas par DITECH, le régénérer
        if not self.employee_id or not self.employee_id.startswith('DITECH'):
            # Trouver le dernier ID DITECH pour générer le suivant
            last_employee = Employee.objects.filter(employee_id__startswith='DITECH').order_by('employee_id').last()
            if last_employee and last_employee.employee_id.startswith('DITECH'):
                try:
                    # Extraire le numéro de l'ID (après "DITECH")
                    last_id_num = int(last_employee.employee_id[6:])  # "DITECH" = 6 caractères
                    new_id_num = last_id_num + 1
                except (ValueError, IndexError):
                    # Si erreur de parsing, chercher le maximum
                    try:
                        all_ditech_ids = Employee.objects.filter(employee_id__startswith='DITECH').values_list('employee_id', flat=True)
                        if all_ditech_ids:
                            max_id_num = max([int(id[6:]) for id in all_ditech_ids if len(id) > 6 and id[6:].isdigit()])
                            new_id_num = max_id_num + 1
                        else:
                            new_id_num = 1
                    except (ValueError, IndexError):
                        new_id_num = Employee.objects.count() + 1
            else:
                # Aucun employé DITECH trouvé, commencer à 1
                new_id_num = 1
            
            self.employee_id = f"DITECH{new_id_num:04d}"
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"


class EmployeeHistory(models.Model):
    CHANGE_TYPE_CHOICES = [
        ('POSITION', 'Changement de poste'),
        ('SALARY', 'Changement de salaire'),
        ('SERVICE', 'Changement de service'),
        ('CONTRACT', 'Changement de contrat'),
        ('STATUS', 'Changement de statut'),
        ('INFO', 'Modification d\'information'),
        ('OTHER', 'Autre'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='history')
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES, default='INFO')
    field_name = models.CharField(max_length=50)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    description = models.TextField(blank=True, help_text='Description détaillée du changement')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='employee_changes')
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Historique des changements'
        verbose_name_plural = 'Historiques des changements'
    
    def __str__(self):
        return f"{self.employee} - {self.get_change_type_display()} - {self.changed_at.strftime('%Y-%m-%d %H:%M')}"


class JobOffer(models.Model):
    """Modèle pour les offres d'emploi"""
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('PUBLISHED', 'Publiée'),
        ('CLOSED', 'Fermée'),
        ('CANCELLED', 'Annulée'),
    ]
    
    TYPE_CHOICES = [
        ('CDI', 'CDI'),
        ('CDD', 'CDD'),
        ('STAGE', 'Stage'),
        ('INTERIM', 'Intérim'),
        ('FREELANCE', 'Freelance'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='Titre du poste')
    description = models.TextField(verbose_name='Description')
    requirements = models.TextField(verbose_name='Exigences')
    position = models.CharField(max_length=100, verbose_name='Poste')
    contract_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type de contrat')
    location = models.CharField(max_length=200, blank=True, verbose_name='Lieu')
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Salaire minimum')
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Salaire maximum')
    department = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_offers', verbose_name='Service')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', verbose_name='Statut')
    published_date = models.DateTimeField(null=True, blank=True, verbose_name='Date de publication')
    closing_date = models.DateField(null=True, blank=True, verbose_name='Date de clôture')
    max_applications = models.IntegerField(null=True, blank=True, verbose_name='Nombre maximum de candidatures')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_job_offers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Offre d\'emploi'
        verbose_name_plural = 'Offres d\'emploi'
    
    @property
    def application_count(self):
        """Nombre de candidatures pour cette offre"""
        return self.applications.count()
    
    @property
    def is_open(self):
        """Vérifie si l'offre est ouverte aux candidatures"""
        from django.utils import timezone
        if self.status != 'PUBLISHED':
            return False
        if self.closing_date and self.closing_date < timezone.now().date():
            return False
        if self.max_applications and self.application_count >= self.max_applications:
            return False
        return True
    
    def __str__(self):
        return f"{self.title} - {self.position}"


class Candidate(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'Nouveau'),
        ('SCREENING', 'Présélection'),
        ('INTERVIEW', 'Entretien'),
        ('SECOND_INTERVIEW', 'Second entretien'),
        ('FINAL_REVIEW', 'Évaluation finale'),
        ('OFFER_SENT', 'Offre envoyée'),
        ('OFFER_ACCEPTED', 'Offre acceptée'),
        ('OFFER_REJECTED', 'Offre refusée'),
        ('HIRED', 'Embauché'),
        ('REJECTED', 'Rejeté'),
        ('WITHDRAWN', 'Retiré'),
    ]
    
    job_offer = models.ForeignKey(JobOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications', verbose_name='Offre d\'emploi')
    first_name = models.CharField(max_length=100, verbose_name='Prénom')
    last_name = models.CharField(max_length=100, verbose_name='Nom')
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, verbose_name='Téléphone')
    position = models.CharField(max_length=100, verbose_name='Poste recherché')
    cv = models.FileField(upload_to='candidates/cv/', blank=True, null=True, verbose_name='CV')
    cover_letter = models.FileField(upload_to='candidates/cover_letters/', blank=True, null=True, verbose_name='Lettre de motivation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW', verbose_name='Statut')
    application_date = models.DateTimeField(default=timezone.now, verbose_name='Date de candidature')
    source = models.CharField(max_length=100, blank=True, verbose_name='Source (LinkedIn, site web, etc.)')
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Salaire attendu')
    availability_date = models.DateField(null=True, blank=True, verbose_name='Date de disponibilité')
    notes = models.TextField(blank=True, verbose_name='Notes')
    rating = models.IntegerField(default=0, help_text="Note globale sur 10", verbose_name='Note')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_candidates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Candidat'
        verbose_name_plural = 'Candidats'
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def interview_count(self):
        """Nombre d'entretiens pour ce candidat"""
        return self.interviews.count()
    
    @property
    def last_interview(self):
        """Dernier entretien"""
        return self.interviews.order_by('-scheduled_date').first()
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.position}"


class Interview(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Planifié'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminé'),
        ('CANCELLED', 'Annulé'),
        ('RESCHEDULED', 'Reprogrammé'),
    ]
    
    TYPE_CHOICES = [
        ('PHONE', 'Téléphonique'),
        ('VIDEO', 'Vidéoconférence'),
        ('ONSITE', 'Sur site'),
        ('TECHNICAL', 'Technique'),
        ('HR', 'RH'),
        ('MANAGER', 'Manager'),
        ('FINAL', 'Final'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interviews')
    interviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='conducted_interviews', verbose_name='Intervieweur')
    scheduled_date = models.DateTimeField(verbose_name='Date prévue')
    actual_date = models.DateTimeField(null=True, blank=True, verbose_name='Date réelle')
    interview_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='ONSITE', verbose_name='Type d\'entretien')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED', verbose_name='Statut')
    location = models.CharField(max_length=200, blank=True, verbose_name='Lieu')
    meeting_link = models.URLField(blank=True, verbose_name='Lien de réunion (vidéo)')
    duration_minutes = models.IntegerField(null=True, blank=True, verbose_name='Durée (minutes)')
    notes = models.TextField(blank=True, verbose_name='Notes')
    feedback = models.TextField(blank=True, verbose_name='Feedback')
    rating = models.IntegerField(default=0, help_text="Note sur 10", verbose_name='Note')
    strengths = models.TextField(blank=True, verbose_name='Points forts')
    weaknesses = models.TextField(blank=True, verbose_name='Points à améliorer')
    recommendation = models.CharField(
        max_length=20,
        choices=[
            ('STRONG_YES', 'Fortement recommandé'),
            ('YES', 'Recommandé'),
            ('MAYBE', 'Peut-être'),
            ('NO', 'Non recommandé'),
        ],
        blank=True,
        verbose_name='Recommandation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_date']
        verbose_name = 'Entretien'
        verbose_name_plural = 'Entretiens'
    
    def __str__(self):
        return f"Entretien {self.candidate} - {self.scheduled_date.strftime('%Y-%m-%d %H:%M')}"
    


class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('MANAGER_APPROVED', 'Approuvé par le manager'),
        ('RH_APPROVED', 'Approuvé par RH'),
        ('REJECTED', 'Rejeté'),
        ('CANCELLED', 'Annulé'),
    ]
    
    TYPE_CHOICES = [
        ('ANNUAL', 'Congé annuel'),
        ('SICK', 'Congé maladie'),
        ('PERSONAL', 'Congé personnel'),
        ('MATERNITY', 'Congé maternité'),
        ('PATERNITY', 'Congé paternité'),
        ('UNPAID', 'Congé sans solde'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.IntegerField(help_text='Nombre de jours de congé')
    reason = models.TextField(verbose_name='Raison du congé')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    manager_approval = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='approved_leave_requests',
        verbose_name='Approuvé par (Manager)'
    )
    manager_approval_date = models.DateTimeField(null=True, blank=True)
    manager_rejection_reason = models.TextField(blank=True, verbose_name='Raison du rejet (Manager)')
    rh_approval = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='rh_approved_leave_requests',
        verbose_name='Approuvé par (RH)'
    )
    rh_approval_date = models.DateTimeField(null=True, blank=True)
    rh_rejection_reason = models.TextField(blank=True, verbose_name='Raison du rejet (RH)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de congé'
        verbose_name_plural = 'Demandes de congé'
    
    def save(self, *args, **kwargs):
        """Calcule automatiquement le nombre de jours si non fourni"""
        if not self.days and self.start_date and self.end_date:
            from datetime import timedelta
            # Calculer les jours ouvrés (exclure les weekends)
            current_date = self.start_date
            days_count = 0
            while current_date <= self.end_date:
                # 0 = lundi, 6 = dimanche
                if current_date.weekday() < 5:  # Du lundi au vendredi
                    days_count += 1
                current_date += timedelta(days=1)
            self.days = days_count
        
        super().save(*args, **kwargs)
    
    @property
    def is_current(self):
        """Vérifie si le congé est en cours"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date and self.status == 'RH_APPROVED'
    
    @property
    def is_upcoming(self):
        """Vérifie si le congé est à venir"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.start_date > today and self.status == 'RH_APPROVED'
    
    @property
    def is_past(self):
        """Vérifie si le congé est passé"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.end_date < today
    
    def __str__(self):
        return f"{self.employee} - {self.get_leave_type_display()} ({self.start_date} to {self.end_date})"


class LeaveBalance(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='leave_balance')
    annual_leave = models.IntegerField(default=25, verbose_name='Congés annuels alloués')
    sick_leave = models.IntegerField(default=10, verbose_name='Congés maladie alloués')
    used_annual = models.IntegerField(default=0, verbose_name='Congés annuels utilisés')
    used_sick = models.IntegerField(default=0, verbose_name='Congés maladie utilisés')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Solde de congés'
        verbose_name_plural = 'Soldes de congés'
    
    @property
    def remaining_annual(self):
        """Calcule le solde restant de congés annuels"""
        return max(0, self.annual_leave - self.used_annual)
    
    @property
    def remaining_sick(self):
        """Calcule le solde restant de congés maladie"""
        return max(0, self.sick_leave - self.used_sick)
    
    @property
    def total_remaining(self):
        """Calcule le total des congés restants"""
        return self.remaining_annual + self.remaining_sick
    
    def recalculate_used_days(self):
        """Recalcule automatiquement les jours utilisés à partir des demandes approuvées"""
        from django.utils import timezone
        current_year = timezone.now().year
        
        # Recalculer les congés annuels utilisés
        annual_requests = LeaveRequest.objects.filter(
            employee=self.employee,
            leave_type='ANNUAL',
            status='RH_APPROVED',
            start_date__year=current_year
        )
        self.used_annual = sum(request.days for request in annual_requests)
        
        # Recalculer les congés maladie utilisés
        sick_requests = LeaveRequest.objects.filter(
            employee=self.employee,
            leave_type='SICK',
            status='RH_APPROVED',
            start_date__year=current_year
        )
        self.used_sick = sum(request.days for request in sick_requests)
        
        self.save()
    
    def __str__(self):
        return f"{self.employee} - Annuel: {self.remaining_annual}/{self.annual_leave}, Maladie: {self.remaining_sick}/{self.sick_leave}"


class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    is_present = models.BooleanField(default=False)
    is_late = models.BooleanField(default=False)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.employee} - {self.date}"
    

class Contract(models.Model):
    TYPE_CHOICES = [
        ('CDI', 'Contrat à Durée Indéterminée'),
        ('CDD', 'Contrat à Durée Déterminée'),
        ('STAGE', 'Stage'),
        ('INTERIM', 'Intérim'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('PENDING', 'En attente de signature'),
        ('SIGNED', 'Signé'),
        ('EXPIRED', 'Expiré'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='contracts')
    contract_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    position = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    needs_renewal = models.BooleanField(default=False, verbose_name='À renouveler')
    auto_renewal = models.BooleanField(default=False, verbose_name='Renouvellement automatique')
    renewal_notice_days = models.IntegerField(default=30, help_text='Nombre de jours avant expiration pour alerter')
    parent_contract = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='renewals', verbose_name='Contrat d\'origine')
    document = models.FileField(upload_to='contracts/', blank=True, null=True)
    signed_date = models.DateField(null=True, blank=True)
    signed_by_employee = models.BooleanField(default=False)
    signed_by_company = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contrat'
        verbose_name_plural = 'Contrats'
    
    def __str__(self):
        return f"{self.employee} - {self.contract_type} ({self.start_date})"
    
    def save(self, *args, **kwargs):
        """Override save pour mettre à jour automatiquement le statut et les alertes"""
        from django.utils import timezone
        today = timezone.now().date()
        
        # Vérifier si le contrat est expiré
        if self.end_date and self.end_date < today and self.status == 'SIGNED':
            self.status = 'EXPIRED'
        
        # Vérifier si le contrat doit être renouvelé
        if self.end_date and self.status == 'SIGNED':
            days_until_expiry = (self.end_date - today).days
            if 0 <= days_until_expiry <= self.renewal_notice_days:
                self.needs_renewal = True
            elif days_until_expiry < 0:
                self.needs_renewal = True
                if self.status != 'EXPIRED':
                    self.status = 'EXPIRED'
            else:
                self.needs_renewal = False
        
        # Les CDI n'ont pas de date de fin
        if self.contract_type == 'CDI':
            self.end_date = None
            self.needs_renewal = False
        
        super().save(*args, **kwargs)
    
    @property
    def is_expiring_soon(self):
        """Vérifie si le contrat expire dans les prochains jours (selon renewal_notice_days)"""
        if self.end_date and self.status == 'SIGNED':
            from django.utils import timezone
            today = timezone.now().date()
            days_until_expiry = (self.end_date - today).days
            return 0 <= days_until_expiry <= self.renewal_notice_days
        return False
    
    @property
    def is_expired(self):
        """Vérifie si le contrat est expiré"""
        if self.end_date and self.status == 'SIGNED':
            from django.utils import timezone
            return self.end_date < timezone.now().date()
        return False
    
    @property
    def days_until_expiry(self):
        """Retourne le nombre de jours jusqu'à l'expiration"""
        if self.end_date:
            from django.utils import timezone
            today = timezone.now().date()
            return (self.end_date - today).days
        return None
    
    @property
    def alert_level(self):
        """Retourne le niveau d'alerte : 'critical', 'warning', 'info', ou None"""
        if not self.end_date or self.status != 'SIGNED':
            return None
        
        days = self.days_until_expiry
        if days is None:
            return None
        
        if days < 0:
            return 'critical'  # Expiré
        elif days <= 7:
            return 'critical'  # Expire dans moins de 7 jours
        elif days <= 30:
            return 'warning'  # Expire dans moins de 30 jours
        elif days <= 60:
            return 'info'  # Expire dans moins de 60 jours
        return None
    
    def create_renewal(self, new_start_date=None, new_end_date=None, new_salary=None, created_by=None):
        """Crée un nouveau contrat en renouvellement de celui-ci"""
        from django.utils import timezone
        
        # Calculer les dates par défaut
        if not new_start_date:
            new_start_date = self.end_date + timedelta(days=1) if self.end_date else timezone.now().date()
        if not new_end_date and self.contract_type != 'CDI':
            # Pour les CDD, stage, intérim, calculer la durée basée sur l'ancien contrat
            if self.end_date and self.start_date:
                duration = (self.end_date - self.start_date).days
                new_end_date = new_start_date + timedelta(days=duration)
        
        # Utiliser le même salaire si non spécifié
        if new_salary is None:
            new_salary = self.salary
        
        # Créer le nouveau contrat
        renewal_contract = Contract.objects.create(
            employee=self.employee,
            contract_type=self.contract_type,
            start_date=new_start_date,
            end_date=new_end_date,
            salary=new_salary,
            position=self.position,
            status='DRAFT',
            parent_contract=self,
            auto_renewal=self.auto_renewal,
            renewal_notice_days=self.renewal_notice_days,
            created_by=created_by,
            notes=f'Renouvellement automatique du contrat {self.id}'
        )
        
        # Marquer l'ancien contrat comme renouvelé
        self.needs_renewal = False
        self.save()
        
        return renewal_contract



class Payslip(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('GENERATED', 'Généré'),
        ('SENT', 'Envoyé'),
        ('PAID', 'Payé'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    month = models.IntegerField()
    year = models.IntegerField()
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire de base')
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Total primes')
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Total déductions')
    overtime_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Heures supplémentaires')
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Salaire brut')
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire net')
    payment_date = models.DateField(null=True, blank=True, verbose_name='Date de paiement')
    payment_method = models.CharField(max_length=50, blank=True, verbose_name='Méthode de paiement')
    pdf_file = models.FileField(upload_to='payslips/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True, verbose_name='Notes')
    generated_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']
        verbose_name = 'Fiche de paie'
        verbose_name_plural = 'Fiches de paie'
    
    def save(self, *args, **kwargs):
        """Calcule automatiquement le salaire brut et net"""
        # Salaire brut = base + primes + heures supplémentaires
        self.gross_salary = self.base_salary + self.bonuses + self.overtime_pay
        
        # Salaire net = brut - déductions
        self.net_salary = self.gross_salary - self.deductions
        
        super().save(*args, **kwargs)
    
    @property
    def total_earnings(self):
        """Total des gains (base + primes + heures supp.)"""
        return self.base_salary + self.bonuses + self.overtime_pay
    
    @property
    def total_deductions(self):
        """Total des déductions"""
        return self.deductions
    
    def __str__(self):
        return f"{self.employee} - {self.month:02d}/{self.year}"


class PayslipBonus(models.Model):
    """Primes et bonus détaillés pour une fiche de paie"""
    TYPE_CHOICES = [
        ('PERFORMANCE', 'Prime de performance'),
        ('PROJECT', 'Prime de projet'),
        ('OVERTIME', 'Heures supplémentaires'),
        ('BONUS', 'Bonus'),
        ('COMMISSION', 'Commission'),
        ('ALLOWANCE', 'Indemnité'),
        ('OTHER', 'Autre'),
    ]
    
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='bonus_items')
    bonus_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type de prime')
    description = models.CharField(max_length=200, verbose_name='Description')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Prime'
        verbose_name_plural = 'Primes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payslip} - {self.get_bonus_type_display()}: {self.amount}"


class PayslipDeduction(models.Model):
    """Déductions et retenues détaillées pour une fiche de paie"""
    TYPE_CHOICES = [
        ('TAX', 'Impôt'),
        ('SOCIAL_SECURITY', 'Sécurité sociale'),
        ('INSURANCE', 'Assurance'),
        ('RETIREMENT', 'Retraite'),
        ('LOAN', 'Prêt'),
        ('ADVANCE', 'Avance'),
        ('ABSENCE', 'Absence'),
        ('LATE', 'Retard'),
        ('OTHER', 'Autre'),
    ]
    
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='deduction_items')
    deduction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type de déduction')
    description = models.CharField(max_length=200, verbose_name='Description')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Déduction'
        verbose_name_plural = 'Déductions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payslip} - {self.get_deduction_type_display()}: {self.amount}"


class PaymentHistory(models.Model):
    """Historique des paiements"""
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='payment_history')
    payment_date = models.DateField(verbose_name='Date de paiement')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant payé')
    payment_method = models.CharField(max_length=50, verbose_name='Méthode de paiement')
    reference = models.CharField(max_length=100, blank=True, verbose_name='Référence')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Historique de paiement'
        verbose_name_plural = 'Historiques de paiement'
        ordering = ['-payment_date', '-created_at']
    
    def __str__(self):
        return f"{self.payslip} - {self.payment_date}: {self.amount}"


class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('PAYSLIP_SCAN', 'Scan de fiche de paie'),
        ('CONTRACT', 'Contrat'),
        ('ID_CARD', 'Carte d\'identité'),
        ('DIPLOMA', 'Diplôme'),
        ('OTHER', 'Autre'),
    ]
    
    document = models.FileField(upload_to='documents/%Y/%m/%d/')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, default='OTHER')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.created_at.strftime('%Y-%m-%d')}"


class PresenceTracking(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Présent'),
        ('ABSENT', 'Absent'),
        ('LATE', 'En retard'),
        ('EARLY_LEAVE', 'Départ anticipé'),
        ('ON_LEAVE', 'En congé'),
    ]
    
    CHECK_IN_METHOD_CHOICES = [
        ('MANUAL', 'Manuel'),
        ('BADGE', 'Badge'),
        ('MOBILE', 'Application mobile'),
        ('WEB', 'Interface web'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='presence_trackings')
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name="Heure d'arrivée")
    check_out_time = models.DateTimeField(null=True, blank=True, verbose_name='Heure de départ')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    check_in_method = models.CharField(max_length=20, choices=CHECK_IN_METHOD_CHOICES, default='MANUAL', verbose_name='Méthode de pointage')
    badge_id = models.CharField(max_length=50, blank=True, null=True, help_text='ID du badge pour pointage automatique')
    is_late = models.BooleanField(default=False)
    late_minutes = models.IntegerField(default=0, help_text='Minutes de retard')
    expected_check_in = models.TimeField(null=True, blank=True, default='09:00', help_text='Heure d\'arrivée attendue')
    expected_check_out = models.TimeField(null=True, blank=True, default='18:00', help_text='Heure de départ attendue')
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Heures supplémentaires')
    worked_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Heures travaillées')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_presence_trackings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Pointage'
        verbose_name_plural = 'Pointages'
        ordering = ['-date', '-check_in_time']
        unique_together = ['employee', 'date']
        indexes = [
            models.Index(fields=['date', 'employee']),
            models.Index(fields=['badge_id']),
        ]
    
    def save(self, *args, **kwargs):
        """Calcule automatiquement les retards et heures supplémentaires"""
        from datetime import datetime, time
        
        # Calculer le retard si check_in_time est fourni
        if self.check_in_time and self.expected_check_in:
            check_in_time_only = self.check_in_time.time()
            expected_time = self.expected_check_in
            
            if isinstance(expected_time, str):
                expected_time = datetime.strptime(expected_time, '%H:%M').time()
            
            if check_in_time_only > expected_time:
                self.is_late = True
                # Calculer les minutes de retard
                check_in_dt = datetime.combine(self.date, check_in_time_only)
                expected_dt = datetime.combine(self.date, expected_time)
                delay = (check_in_dt - expected_dt).total_seconds() / 60
                self.late_minutes = int(delay)
                if self.status == 'PRESENT':
                    self.status = 'LATE'
            else:
                self.is_late = False
                self.late_minutes = 0
        
        # Calculer les heures travaillées
        if self.check_in_time and self.check_out_time:
            duration = (self.check_out_time - self.check_in_time).total_seconds() / 3600
            self.worked_hours = round(duration, 2)
            
            # Calculer les heures supplémentaires (au-delà de 8 heures)
            if duration > 8:
                self.overtime_hours = round(duration - 8, 2)
            else:
                self.overtime_hours = 0
        elif self.check_in_time:
            # Si seulement check_in, on ne peut pas calculer
            self.worked_hours = 0
            self.overtime_hours = 0
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"


class TrainingPlan(models.Model):
    """Plan de formation pour un employé"""
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('ACTIVE', 'Actif'),
        ('COMPLETED', 'Terminé'),
        ('CANCELLED', 'Annulé'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='training_plans')
    title = models.CharField(max_length=200, verbose_name='Titre du plan')
    description = models.TextField(blank=True, verbose_name='Description')
    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(null=True, blank=True, verbose_name='Date de fin prévue')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', verbose_name='Statut')
    objectives = models.TextField(verbose_name='Objectifs')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Budget')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_training_plans')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Plan de formation'
        verbose_name_plural = 'Plans de formation'
    
    @property
    def completion_rate(self):
        """Taux de complétion du plan"""
        total_trainings = self.trainings.count()
        if total_trainings == 0:
            return 0
        completed = self.trainings.filter(status='COMPLETED').count()
        return (completed / total_trainings) * 100
    
    def __str__(self):
        return f"{self.employee} - {self.title}"


class Training(models.Model):
    """Formation individuelle"""
    STATUS_CHOICES = [
        ('PLANNED', 'Planifiée'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminée'),
        ('CANCELLED', 'Annulée'),
    ]
    
    TYPE_CHOICES = [
        ('INTERNAL', 'Interne'),
        ('EXTERNAL', 'Externe'),
        ('ONLINE', 'En ligne'),
        ('WORKSHOP', 'Atelier'),
        ('CONFERENCE', 'Conférence'),
        ('CERTIFICATION', 'Certification'),
    ]
    
    training_plan = models.ForeignKey(TrainingPlan, on_delete=models.CASCADE, related_name='trainings', null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='trainings')
    title = models.CharField(max_length=200, verbose_name='Titre de la formation')
    description = models.TextField(blank=True, verbose_name='Description')
    training_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INTERNAL', verbose_name='Type')
    provider = models.CharField(max_length=200, blank=True, verbose_name='Organisme de formation')
    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(null=True, blank=True, verbose_name='Date de fin')
    duration_hours = models.IntegerField(null=True, blank=True, verbose_name='Durée (heures)')
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Coût')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED', verbose_name='Statut')
    certificate = models.FileField(upload_to='training/certificates/', blank=True, null=True, verbose_name='Certificat')
    notes = models.TextField(blank=True, verbose_name='Notes')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_trainings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Formation'
        verbose_name_plural = 'Formations'
    
    def __str__(self):
        return f"{self.employee} - {self.title}"


class TrainingSession(models.Model):
    """Session de formation (pour formations avec plusieurs sessions)"""
    STATUS_CHOICES = [
        ('SCHEDULED', 'Planifiée'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminée'),
        ('CANCELLED', 'Annulée'),
    ]
    
    training = models.ForeignKey(Training, on_delete=models.CASCADE, related_name='sessions')
    session_date = models.DateField(verbose_name='Date de la session')
    start_time = models.TimeField(null=True, blank=True, verbose_name='Heure de début')
    end_time = models.TimeField(null=True, blank=True, verbose_name='Heure de fin')
    location = models.CharField(max_length=200, blank=True, verbose_name='Lieu')
    instructor = models.CharField(max_length=200, blank=True, verbose_name='Formateur')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED', verbose_name='Statut')
    notes = models.TextField(blank=True, verbose_name='Notes')
    attendance = models.BooleanField(default=False, verbose_name='Présence')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['session_date', 'start_time']
        verbose_name = 'Session de formation'
        verbose_name_plural = 'Sessions de formation'
    
    def __str__(self):
        return f"{self.training.title} - {self.session_date}"


class Evaluation(models.Model):
    """Évaluation de performance"""
    TYPE_CHOICES = [
        ('ANNUAL', 'Annuelle'),
        ('SEMESTRIAL', 'Semestrielle'),
        ('QUARTERLY', 'Trimestrielle'),
        ('MONTHLY', 'Mensuelle'),
        ('PROJECT', 'Projet'),
        ('PROMOTION', 'Promotion'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminée'),
        ('APPROVED', 'Approuvée'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='evaluations')
    evaluation_date = models.DateField(verbose_name="Date d'évaluation")
    evaluation_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='ANNUAL', verbose_name='Type')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', verbose_name='Statut')
    
    # Notes globales
    performance_score = models.DecimalField(max_digits=3, decimal_places=2, help_text='Note globale sur 5', verbose_name='Note globale')
    
    # Critères d'évaluation
    quality_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, verbose_name='Qualité du travail')
    productivity_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, verbose_name='Productivité')
    teamwork_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, verbose_name='Travail d\'équipe')
    communication_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, verbose_name='Communication')
    initiative_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, verbose_name='Initiative')
    
    # Commentaires
    comments = models.TextField(blank=True, verbose_name='Commentaires généraux')
    strengths = models.TextField(blank=True, verbose_name='Points forts')
    areas_for_improvement = models.TextField(blank=True, verbose_name='Axes d\'amélioration')
    goals = models.TextField(blank=True, verbose_name='Objectifs pour la prochaine période')
    
    # Feedback manager
    manager_feedback = models.TextField(blank=True, verbose_name='Feedback du manager')
    manager_recommendations = models.TextField(blank=True, verbose_name='Recommandations du manager')
    
    # Approbation
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='evaluations_given', verbose_name='Évalué par')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_evaluations', verbose_name='Approuvé par')
    approval_date = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'approbation')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Évaluation'
        verbose_name_plural = 'Évaluations'
        ordering = ['-evaluation_date', '-created_at']
    
    @property
    def average_score(self):
        """Calcule la moyenne des scores"""
        scores = [
            self.quality_score,
            self.productivity_score,
            self.teamwork_score,
            self.communication_score,
            self.initiative_score
        ]
        valid_scores = [s for s in scores if s is not None]
        if valid_scores:
            return sum(valid_scores) / len(valid_scores)
        return None
    
    def save(self, *args, **kwargs):
        """Calcule automatiquement la note globale si non fournie"""
        if not self.performance_score:
            avg = self.average_score
            if avg:
                self.performance_score = round(avg, 2)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee} - {self.evaluation_date} ({self.performance_score}/5)"