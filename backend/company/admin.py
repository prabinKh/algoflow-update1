from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import Company, CompanyGalleryImage
from fixitall_backend.admin_site import fixitall_admin

User = get_user_model()


class CompanyGalleryImageInline(admin.TabularInline):
    model = CompanyGalleryImage
    extra = 1


class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'slug', 'storefront_url', 'owner', 'business_type', 'plan', 'is_active', 'product_count_display', 'order_count_display', 'total_revenue_display', 'created_at'
    )
    list_filter = ('business_type', 'plan', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'admin_email', 'owner__email', 'owner__name')
    readonly_fields = ('created_at', 'updated_at', 'owner', 'domain_name', 'product_count_display', 'order_count_display', 'total_revenue_display')
    inlines = [CompanyGalleryImageInline]
    date_hierarchy = 'created_at'
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-created_at',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'logo', 'banner', 'domain_name')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'address', 'website')
        }),
        ('Vendor Admin Credentials', {
            'description': 'Creates a company admin who can sign in at /signin and access /admin.',
            'fields': ('admin_name', 'admin_email', 'admin_password', 'owner')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def storefront_url(self, obj):
        if not obj.slug:
            return '-'
        url = f'http://{obj.slug}.localhost:3000'
        return format_html('<a href="{}" target="_blank">{}</a>', url, url)

    storefront_url.short_description = 'Store URL'

    def save_model(self, request, obj, form, change):
        admin_name = (obj.admin_name or '').strip()
        admin_email = (obj.admin_email or '').strip().lower()
        admin_password = (obj.admin_password or '').strip()

        super().save_model(request, obj, form, change)

        if admin_email and admin_password:
            self._sync_company_admin(obj, admin_name, admin_email, admin_password)

    def _sync_company_admin(self, company, admin_name, admin_email, admin_password):
        user = company.owner

        if user is None:
            existing = User.objects.filter(email=admin_email).first()
            if existing:
                user = existing
            else:
                user = User.objects.create_user(
                    email=admin_email,
                    name=admin_name or admin_email.split('@')[0],
                    password=admin_password,
                    role='company_admin',
                    is_staff=True,
                    is_admin=True,
                    is_active=True,
                    email_verified=True,
                )
        else:
            if admin_name:
                user.name = admin_name
            user.role = 'company_admin'
            user.is_staff = True
            user.is_admin = True
            user.is_active = True
            user.email_verified = True

        if admin_password:
            user.set_password(admin_password)

        user.company = company
        user.save()

        company.owner = user
        company.admin_name = admin_name or user.name
        company.admin_email = admin_email
        company.admin_password = ''
        company.save(update_fields=['owner', 'admin_name', 'admin_email', 'admin_password'])

    def product_count_display(self, obj):
        try:
            return obj.product_count
        except Exception:
            return 0

    product_count_display.short_description = 'Products'
    product_count_display.admin_order_field = 'product_count'

    def order_count_display(self, obj):
        try:
            return obj.order_count
        except Exception:
            return 0

    order_count_display.short_description = 'Orders'
    order_count_display.admin_order_field = 'order_count'

    def total_revenue_display(self, obj):
        try:
            return f"{obj.total_revenue:.2f}"
        except Exception:
            return '0.00'

    total_revenue_display.short_description = 'Revenue'
    total_revenue_display.admin_order_field = 'total_revenue'


fixitall_admin.register(Company, CompanyAdmin)
fixitall_admin.register(CompanyGalleryImage)
