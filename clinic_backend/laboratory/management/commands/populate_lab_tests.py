from django.core.management.base import BaseCommand
from laboratory.models import LabTestCatalog, LabEquipment
from decimal import Decimal


class Command(BaseCommand):
    help = 'Populate database with sample lab tests and equipment'

    def handle(self, *args, **options):
        # Sample lab tests data
        lab_tests = [
            # Blood Tests
            {
                'test_name': 'Complete Blood Count (CBC)',
                'test_code': 'BLO-CBC001',
                'category': 'BLOOD',
                'description': 'Measures different components of blood including red blood cells, white blood cells, hemoglobin, and platelets.',
                'normal_range_text': 'See individual parameters',
                'unit': '-',
                'price': Decimal('350.00'),
                'sample_type': 'Blood (EDTA)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '4-6 hours',
            },
            {
                'test_name': 'Fasting Blood Sugar (FBS)',
                'test_code': 'BLO-FBS002',
                'category': 'BLOOD',
                'description': 'Measures blood glucose levels after 8-12 hours of fasting.',
                'normal_range_min': Decimal('70.00'),
                'normal_range_max': Decimal('100.00'),
                'unit': 'mg/dL',
                'price': Decimal('120.00'),
                'sample_type': 'Blood (Fluoride)',
                'preparation_instructions': 'Fasting for 8-12 hours required',
                'turnaround_time': '2-4 hours',
            },
            {
                'test_name': 'HbA1c (Glycated Hemoglobin)',
                'test_code': 'BLO-HBA003',
                'category': 'BLOOD',
                'description': 'Measures average blood sugar levels over the past 2-3 months.',
                'normal_range_min': Decimal('4.00'),
                'normal_range_max': Decimal('5.60'),
                'unit': '%',
                'price': Decimal('550.00'),
                'sample_type': 'Blood (EDTA)',
                'preparation_instructions': 'No fasting required',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'Lipid Profile',
                'test_code': 'BIO-LIP004',
                'category': 'BIOCHEMISTRY',
                'description': 'Measures cholesterol levels including total cholesterol, HDL, LDL, and triglycerides.',
                'normal_range_text': 'Total: <200, LDL: <100, HDL: >40, TG: <150 mg/dL',
                'unit': 'mg/dL',
                'price': Decimal('450.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'Fasting for 10-12 hours required',
                'turnaround_time': '4-6 hours',
            },
            {
                'test_name': 'Liver Function Test (LFT)',
                'test_code': 'BIO-LFT005',
                'category': 'BIOCHEMISTRY',
                'description': 'Evaluates liver health by measuring enzymes, proteins, and bilirubin.',
                'normal_range_text': 'SGPT: 7-56 U/L, SGOT: 10-40 U/L, Bilirubin: 0.1-1.2 mg/dL',
                'unit': 'U/L',
                'price': Decimal('650.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'Fasting for 10-12 hours preferred',
                'turnaround_time': '6-8 hours',
            },
            {
                'test_name': 'Kidney Function Test (KFT/RFT)',
                'test_code': 'BIO-KFT006',
                'category': 'BIOCHEMISTRY',
                'description': 'Evaluates kidney function by measuring creatinine, urea, and uric acid.',
                'normal_range_text': 'Creatinine: 0.7-1.3, Urea: 7-20 mg/dL',
                'unit': 'mg/dL',
                'price': Decimal('550.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '4-6 hours',
            },
            {
                'test_name': 'Thyroid Profile (T3, T4, TSH)',
                'test_code': 'HOR-THY007',
                'category': 'HORMONE',
                'description': 'Measures thyroid hormones T3, T4 and TSH to evaluate thyroid function.',
                'normal_range_text': 'TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 5.0-12.0 μg/dL',
                'unit': 'mIU/L',
                'price': Decimal('750.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No fasting required. Best done in morning.',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'Blood Group & Rh Factor',
                'test_code': 'BLO-BGP008',
                'category': 'BLOOD',
                'description': 'Determines blood type (A, B, AB, O) and Rh factor (+/-).',
                'normal_range_text': 'A+, A-, B+, B-, AB+, AB-, O+, O-',
                'unit': '-',
                'price': Decimal('150.00'),
                'sample_type': 'Blood (EDTA)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '2-4 hours',
            },
            {
                'test_name': 'Hemoglobin (Hb)',
                'test_code': 'BLO-HGB009',
                'category': 'BLOOD',
                'description': 'Measures the amount of hemoglobin in blood.',
                'normal_range_min': Decimal('12.00'),
                'normal_range_max': Decimal('17.50'),
                'unit': 'g/dL',
                'price': Decimal('100.00'),
                'sample_type': 'Blood (EDTA)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '1-2 hours',
            },
            
            # Urine Tests
            {
                'test_name': 'Urine Routine & Microscopy',
                'test_code': 'URI-RME010',
                'category': 'URINE',
                'description': 'Complete urine analysis including physical, chemical and microscopic examination.',
                'normal_range_text': 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
                'unit': '-',
                'price': Decimal('150.00'),
                'sample_type': 'Urine (Midstream)',
                'preparation_instructions': 'Collect midstream urine sample in sterile container',
                'turnaround_time': '2-4 hours',
            },
            {
                'test_name': 'Urine Culture & Sensitivity',
                'test_code': 'MIC-UCS011',
                'category': 'MICROBIOLOGY',
                'description': 'Detects bacterial infections in urine and determines antibiotic sensitivity.',
                'normal_range_text': 'No growth / No significant growth',
                'unit': 'CFU/mL',
                'price': Decimal('450.00'),
                'sample_type': 'Urine (Midstream, Sterile)',
                'preparation_instructions': 'Collect sample before starting antibiotics',
                'turnaround_time': '48-72 hours',
            },
            
            # Imaging Tests
            {
                'test_name': 'X-Ray Chest PA View',
                'test_code': 'IMG-XRC012',
                'category': 'IMAGING',
                'description': 'Radiographic imaging of chest to evaluate lungs, heart and surrounding structures.',
                'normal_range_text': 'Normal chest findings',
                'unit': '-',
                'price': Decimal('350.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'Remove metal objects, jewelry before test',
                'turnaround_time': '1-2 hours',
            },
            {
                'test_name': 'CT Scan - Brain',
                'test_code': 'IMG-CTB013',
                'category': 'IMAGING',
                'description': 'Computed tomography scan of the brain for detailed cross-sectional images.',
                'normal_range_text': 'No abnormalities detected',
                'unit': '-',
                'price': Decimal('3500.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'Inform about allergies, may require contrast',
                'turnaround_time': '24-48 hours',
            },
            {
                'test_name': 'MRI - Spine',
                'test_code': 'IMG-MRS014',
                'category': 'IMAGING',
                'description': 'Magnetic resonance imaging of spine for detailed soft tissue analysis.',
                'normal_range_text': 'No abnormalities detected',
                'unit': '-',
                'price': Decimal('6000.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'Remove all metal objects, inform about implants',
                'turnaround_time': '24-48 hours',
            },
            {
                'test_name': 'Ultrasound - Abdomen',
                'test_code': 'IMG-USA015',
                'category': 'IMAGING',
                'description': 'Sonographic examination of abdominal organs.',
                'normal_range_text': 'Normal organ appearances',
                'unit': '-',
                'price': Decimal('800.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'Fasting for 6-8 hours, full bladder for pelvic view',
                'turnaround_time': '1-2 hours',
            },
            
            # Cardiology Tests
            {
                'test_name': 'ECG (Electrocardiogram)',
                'test_code': 'CAR-ECG016',
                'category': 'CARDIO',
                'description': 'Records electrical activity of the heart.',
                'normal_range_text': 'Normal sinus rhythm',
                'unit': '-',
                'price': Decimal('250.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '30 minutes',
            },
            {
                'test_name': 'Echocardiogram (2D Echo)',
                'test_code': 'CAR-ECH017',
                'category': 'CARDIO',
                'description': 'Ultrasound imaging of the heart to evaluate structure and function.',
                'normal_range_text': 'EF: 55-70%, Normal valve function',
                'unit': '%',
                'price': Decimal('1500.00'),
                'sample_type': 'N/A',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '1-2 hours',
            },
            
            # Serology Tests
            {
                'test_name': 'HIV 1 & 2 Antibody Test',
                'test_code': 'SER-HIV018',
                'category': 'SEROLOGY',
                'description': 'Screening test for HIV infection.',
                'normal_range_text': 'Non-Reactive',
                'unit': '-',
                'price': Decimal('350.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'Hepatitis B Surface Antigen (HBsAg)',
                'test_code': 'SER-HBS019',
                'category': 'SEROLOGY',
                'description': 'Screening test for Hepatitis B infection.',
                'normal_range_text': 'Negative',
                'unit': '-',
                'price': Decimal('300.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'COVID-19 RT-PCR',
                'test_code': 'MIC-COV020',
                'category': 'MICROBIOLOGY',
                'description': 'Molecular test for SARS-CoV-2 virus detection.',
                'normal_range_text': 'Negative',
                'unit': '-',
                'price': Decimal('500.00'),
                'sample_type': 'Nasopharyngeal Swab',
                'preparation_instructions': 'No eating, drinking, or brushing teeth 30 min before',
                'turnaround_time': '24-48 hours',
            },
            
            # Additional common tests
            {
                'test_name': 'Vitamin D (25-OH)',
                'test_code': 'BIO-VTD021',
                'category': 'BIOCHEMISTRY',
                'description': 'Measures vitamin D levels in blood.',
                'normal_range_min': Decimal('30.00'),
                'normal_range_max': Decimal('100.00'),
                'unit': 'ng/mL',
                'price': Decimal('1200.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '24-48 hours',
            },
            {
                'test_name': 'Vitamin B12',
                'test_code': 'BIO-VTB022',
                'category': 'BIOCHEMISTRY',
                'description': 'Measures vitamin B12 levels in blood.',
                'normal_range_min': Decimal('200.00'),
                'normal_range_max': Decimal('900.00'),
                'unit': 'pg/mL',
                'price': Decimal('800.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'Fasting for 6-8 hours preferred',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'Iron Studies (Serum Iron, TIBC, Ferritin)',
                'test_code': 'BIO-IRN023',
                'category': 'BIOCHEMISTRY',
                'description': 'Comprehensive iron status evaluation.',
                'normal_range_text': 'Iron: 60-170 μg/dL, Ferritin: 12-300 ng/mL',
                'unit': 'μg/dL',
                'price': Decimal('850.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'Fasting for 8-12 hours required',
                'turnaround_time': '24 hours',
            },
            {
                'test_name': 'ESR (Erythrocyte Sedimentation Rate)',
                'test_code': 'BLO-ESR024',
                'category': 'BLOOD',
                'description': 'Non-specific marker of inflammation.',
                'normal_range_min': Decimal('0.00'),
                'normal_range_max': Decimal('20.00'),
                'unit': 'mm/hr',
                'price': Decimal('100.00'),
                'sample_type': 'Blood (EDTA)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '1-2 hours',
            },
            {
                'test_name': 'CRP (C-Reactive Protein)',
                'test_code': 'BIO-CRP025',
                'category': 'BIOCHEMISTRY',
                'description': 'Marker of inflammation and infection.',
                'normal_range_min': Decimal('0.00'),
                'normal_range_max': Decimal('6.00'),
                'unit': 'mg/L',
                'price': Decimal('400.00'),
                'sample_type': 'Blood (Plain)',
                'preparation_instructions': 'No special preparation required',
                'turnaround_time': '4-6 hours',
            },
        ]

        # Sample equipment data
        equipment_list = [
            {
                'equipment_name': 'Hematology Analyzer',
                'model': 'Sysmex XN-1000',
                'serial_number': 'SYS-HEM-001',
                'manufacturer': 'Sysmex Corporation',
                'status': 'WORKING',
                'location': 'Hematology Section',
            },
            {
                'equipment_name': 'Chemistry Analyzer',
                'model': 'Roche Cobas c311',
                'serial_number': 'ROC-CHM-002',
                'manufacturer': 'Roche Diagnostics',
                'status': 'WORKING',
                'location': 'Biochemistry Section',
            },
            {
                'equipment_name': 'Immunoassay Analyzer',
                'model': 'Abbott Architect i1000',
                'serial_number': 'ABT-IMM-003',
                'manufacturer': 'Abbott Diagnostics',
                'status': 'WORKING',
                'location': 'Immunology Section',
            },
            {
                'equipment_name': 'Microscope',
                'model': 'Olympus CX23',
                'serial_number': 'OLY-MIC-004',
                'manufacturer': 'Olympus Corporation',
                'status': 'WORKING',
                'location': 'Pathology Section',
            },
            {
                'equipment_name': 'Centrifuge',
                'model': 'Eppendorf 5804R',
                'serial_number': 'EPP-CEN-005',
                'manufacturer': 'Eppendorf',
                'status': 'WORKING',
                'location': 'Sample Processing',
            },
            {
                'equipment_name': 'ECG Machine',
                'model': 'GE MAC 2000',
                'serial_number': 'GE-ECG-006',
                'manufacturer': 'GE Healthcare',
                'status': 'WORKING',
                'location': 'Cardiology Section',
            },
            {
                'equipment_name': 'Digital X-Ray System',
                'model': 'Carestream DRX-Evolution',
                'serial_number': 'CRS-XRY-007',
                'manufacturer': 'Carestream Health',
                'status': 'WORKING',
                'location': 'Radiology Section',
            },
            {
                'equipment_name': 'Ultrasound Machine',
                'model': 'Philips Affiniti 50',
                'serial_number': 'PHL-USG-008',
                'manufacturer': 'Philips Healthcare',
                'status': 'WORKING',
                'location': 'Radiology Section',
            },
        ]

        # Create lab tests
        tests_created = 0
        tests_existing = 0
        for test_data in lab_tests:
            test, created = LabTestCatalog.objects.get_or_create(
                test_code=test_data['test_code'],
                defaults=test_data
            )
            if created:
                tests_created += 1
                self.stdout.write(f"Created test: {test.test_name}")
            else:
                tests_existing += 1
                self.stdout.write(f"Test already exists: {test.test_name}")

        # Create equipment
        equip_created = 0
        equip_existing = 0
        for equip_data in equipment_list:
            equip, created = LabEquipment.objects.get_or_create(
                serial_number=equip_data['serial_number'],
                defaults=equip_data
            )
            if created:
                equip_created += 1
                self.stdout.write(f"Created equipment: {equip.equipment_name}")
            else:
                equip_existing += 1
                self.stdout.write(f"Equipment already exists: {equip.equipment_name}")

        self.stdout.write(self.style.SUCCESS(
            f'\nSummary:\n'
            f'Tests: {tests_created} created, {tests_existing} already existed\n'
            f'Equipment: {equip_created} created, {equip_existing} already existed'
        ))
