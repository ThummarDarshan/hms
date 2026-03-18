from django.core.management.base import BaseCommand
from laboratory.models import LabReport, LabRequest

class Command(BaseCommand):
    help = 'Fix lab report charges by auto-populating from test prices'

    def handle(self, *args, **options):
        # Find all reports with charge = 0 or NULL
        reports_to_fix = LabReport.objects.filter(charge__lte=0)
        
        fixed_count = 0
        for report in reports_to_fix:
            if report.lab_request.test and report.lab_request.test.price:
                report.charge = report.lab_request.test.price
                report.save()
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Fixed Report #{report.id}: {report.lab_request.test.test_name} = ₹{report.charge}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal reports fixed: {fixed_count}')
        )
