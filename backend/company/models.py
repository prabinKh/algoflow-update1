from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Company(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    BUSINESS_TYPE_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Clothing & Fashion', 'Clothing & Fashion'),
        ('Beauty & Personal Care', 'Beauty & Personal Care'),
        ('Grocery & Daily Essentials', 'Grocery & Daily Essentials'),
        ('Glass & Lens (Optical/Eyewear)', 'Glass & Lens (Optical/Eyewear)'),
        ('Cafe (Coffee Shop / F&B E-commerce)', 'Cafe (Coffee Shop / F&B E-commerce)'),
        ('Hotels (Hospitality / Booking Platform)', 'Hotels (Hospitality / Booking Platform)'),
        ('Liquor Shop (Alcoholic Beverages)', 'Liquor Shop (Alcoholic Beverages)'),
    ]

    name = models.CharField(max_length=200)
    business_type = models.CharField(
        max_length=100,
        choices=BUSINESS_TYPE_CHOICES,
        default='Electronics'
    )
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo = models.URLField(blank=True, null=True)
    banner = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True, null=True)
    business_registration = models.CharField(max_length=200, blank=True)
    ip_address = models.CharField(max_length=50, blank=True, null=True, unique=True)
    domain_name = models.CharField(max_length=255, blank=True, null=True, unique=True)

    # Branding
    theme_color = models.CharField(max_length=20, default='#6366f1')
    theme_color_secondary = models.CharField(max_length=20, default='#4f46e5')

    # Admin credentials (for seeding / display)
    admin_name = models.CharField(max_length=200, blank=True)
    admin_email = models.EmailField(blank=True)
    admin_password = models.CharField(max_length=128, blank=True)

    # Linked Django user (company admin)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='owned_companies',
        null=True,
        blank=True,
    )

    # Platform metadata
    is_active = models.BooleanField(default=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'company'
            candidate = base_slug
            counter = 1
            while Company.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f'{base_slug}-{counter}'
                counter += 1
            self.slug = candidate
        if self.slug:
            self.domain_name = f'{self.slug}.localhost'
        super().save(*args, **kwargs)

    @staticmethod
    def subdomain_from_host(host: str) -> str | None:
        """Extract tenant slug from hosts like daraz.localhost."""
        if not host:
            return None
        host = host.split(':')[0].strip().lower()
        if host.endswith('.localhost'):
            sub = host[: -len('.localhost')]
            if sub and sub not in ('www', 'localhost'):
                return sub
        return None

    @property
    def product_count(self):
        return self.products.count()

    @property
    def order_count(self):
        return self.orders.count()

    @property
    def total_revenue(self):
        from django.db.models import Sum
        result = self.orders.filter(status='delivered').aggregate(
            total=Sum('total_amount'))['total']
        return float(result or 0)

    @classmethod
    def resolve_from_request(cls, request, fallback=True):
        # 1. Try company slug or ID from query parameter
        company_param = None
        if hasattr(request, 'query_params'):
            company_param = request.query_params.get('company')
        if not company_param and hasattr(request, 'GET'):
            company_param = request.GET.get('company')
            
        if company_param:
            if str(company_param).isdigit():
                comp = cls.objects.filter(models.Q(slug=company_param) | models.Q(id=int(company_param)) | models.Q(ip_address=company_param) | models.Q(domain_name=company_param)).first()
            else:
                comp = cls.objects.filter(models.Q(slug=company_param) | models.Q(ip_address=company_param) | models.Q(domain_name=company_param)).first()
            if comp:
                return comp

        # 1.5 Try X-Company-Slug header
        company_slug_header = None
        if hasattr(request, 'headers') and request.headers.get('X-Company-Slug'):
            company_slug_header = request.headers.get('X-Company-Slug')
        elif hasattr(request, 'META') and request.META.get('HTTP_X_COMPANY_SLUG'):
            company_slug_header = request.META.get('HTTP_X_COMPANY_SLUG')
            
        if company_slug_header:
            comp = cls.objects.filter(slug=company_slug_header).first()
            if comp:
                return comp

        # 2. Try to resolve by host/IP from headers (X-Forwarded-Host or Host)
        host = None
        if hasattr(request, 'META'):
            host = request.META.get('HTTP_X_FORWARDED_HOST') or request.META.get('HTTP_HOST')
        if not host:
            host = request.get_host() if hasattr(request, 'get_host') else ''

        ip_or_domain = host.split(':')[0].strip() if host else ''
        if ip_or_domain:
            subdomain = cls.subdomain_from_host(ip_or_domain)
            if subdomain:
                comp = cls.objects.filter(slug=subdomain).first()
                if not comp:
                    comp = cls.objects.filter(slug__startswith=f'{subdomain}-').first()
                if comp:
                    return comp

            comp = cls.objects.filter(
                models.Q(ip_address=ip_or_domain)
                | models.Q(slug=ip_or_domain)
                | models.Q(domain_name=ip_or_domain)
            ).first()
            if comp:
                return comp

        # 3. Fallback to owner's company if authenticated
        if hasattr(request, 'user') and request.user and request.user.is_authenticated and getattr(request.user, 'company', None):
            return request.user.company

        # 4. Global default fallback
        if not fallback:
            return None
        return cls.objects.first()


class CompanyGalleryImage(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Image for {self.company.name}'
