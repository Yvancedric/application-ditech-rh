"""
Commande de management pour vérifier et gérer les contrats expirants
Usage: python manage.py check_contracts [--auto-renew]
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apprh.models import Contract


class Command(BaseCommand):
    help = 'Vérifie les contrats expirants et peut créer des renouvellements automatiques'

    def add_arguments(self, parser):
        parser.add_argument(
            '--auto-renew',
            action='store_true',
            help='Créer automatiquement des renouvellements pour les contrats avec auto_renewal=True',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Nombre de jours à l\'avance pour vérifier les contrats expirants (défaut: 30)',
        )

    def handle(self, *args, **options):
        today = timezone.now().date()
        days_ahead = options['days']
        future_date = today + timedelta(days=days_ahead)
        auto_renew = options['auto_renew']

        self.stdout.write(self.style.SUCCESS(f'Vérification des contrats expirant avant le {future_date}...'))

        # Contrats expirants
        expiring_contracts = Contract.objects.filter(
            end_date__lte=future_date,
            end_date__gte=today,
            status='SIGNED',
            contract_type__in=['CDD', 'STAGE', 'INTERIM']  # Exclure les CDI
        )

        # Contrats expirés
        expired_contracts = Contract.objects.filter(
            end_date__lt=today,
            status='SIGNED',
            contract_type__in=['CDD', 'STAGE', 'INTERIM']
        )

        # Mettre à jour le statut des contrats expirés
        expired_count = expired_contracts.update(status='EXPIRED')
        if expired_count > 0:
            self.stdout.write(self.style.WARNING(f'{expired_count} contrat(s) marqué(s) comme expiré(s)'))

        # Mettre à jour le flag needs_renewal
        for contract in expiring_contracts:
            if not contract.needs_renewal:
                contract.needs_renewal = True
                contract.save()
                self.stdout.write(
                    self.style.WARNING(
                        f'Contrat {contract.id} ({contract.employee.get_full_name()}) '
                        f'expire dans {contract.days_until_expiry} jour(s) - marqué pour renouvellement'
                    )
                )

        # Renouvellement automatique
        if auto_renew:
            auto_renewal_contracts = Contract.objects.filter(
                auto_renewal=True,
                needs_renewal=True,
                status='SIGNED',
                contract_type__in=['CDD', 'STAGE', 'INTERIM']
            )

            renewed_count = 0
            for contract in auto_renewal_contracts:
                try:
                    # Vérifier qu'il n'y a pas déjà un renouvellement
                    if contract.renewals.exists():
                        self.stdout.write(
                            self.style.WARNING(
                                f'Contrat {contract.id} a déjà un renouvellement - ignoré'
                            )
                        )
                        continue

                    # Créer le renouvellement
                    renewal = contract.create_renewal(created_by=None)
                    renewed_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Renouvellement automatique créé pour le contrat {contract.id} '
                            f'({contract.employee.get_full_name()}) - Nouveau contrat: {renewal.id}'
                        )
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Erreur lors du renouvellement du contrat {contract.id}: {str(e)}'
                        )
                    )

            if renewed_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'{renewed_count} contrat(s) renouvelé(s) automatiquement')
                )
            else:
                self.stdout.write('Aucun contrat à renouveler automatiquement')

        # Résumé
        expiring_count = expiring_contracts.count()
        expired_count = expired_contracts.count()

        self.stdout.write(self.style.SUCCESS('\n=== Résumé ==='))
        self.stdout.write(f'Contrats expirants ({days_ahead} jours): {expiring_count}')
        self.stdout.write(f'Contrats expirés: {expired_count}')
        self.stdout.write(f'Total nécessitant attention: {expiring_count + expired_count}')

        if not auto_renew:
            self.stdout.write(
                self.style.WARNING(
                    '\nPour créer des renouvellements automatiques, utilisez: python manage.py check_contracts --auto-renew'
                )
            )
