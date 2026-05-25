from django.contrib import admin
from .models import (
    UserActivity, POSSale, ServiceTicket,
    ChatSession, ChatMessage, ContactMessage, CategoryFeature,
    StaffRole, StaffMember,
)
from fixitall_backend.admin_site import fixitall_admin


class VendorRestrictedAdmin(admin.ModelAdmin):
    """Admin base that restricts queryset and FK choices to companies owned by the user."""
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # If model has a direct 'company' field
        if 'company' in [f.name for f in self.model._meta.get_fields()]:
            return qs.filter(company__owner=request.user)
        # Fallback: return full queryset
        return qs

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'company' and not request.user.is_superuser:
            from company.models import Company
            kwargs['queryset'] = Company.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class UserActivityAdmin(VendorRestrictedAdmin):
    list_display = ('user', 'company', 'action', 'ip_address', 'timestamp')
    list_filter = ('company', 'action', 'timestamp')
    search_fields = ('user__email', 'ip_address', 'action')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'


class POSSaleAdmin(VendorRestrictedAdmin):
    list_display = ('invoice_number_display', 'order', 'company_display', 'cashier_display', 'payment_method_display', 'created_at')
    list_filter = ('order__payment_method', 'created_at', 'order__company')
    search_fields = ('transaction_id', 'staff__email')
    readonly_fields = ('created_at',)

    def invoice_number_display(self, obj):
        return obj.transaction_id
    invoice_number_display.short_description = 'Invoice Number'

    def cashier_display(self, obj):
        return obj.staff.email if obj.staff else "N/A"
    cashier_display.short_description = 'Cashier'

    def payment_method_display(self, obj):
        return obj.order.payment_method if obj.order else "N/A"
    payment_method_display.short_description = 'Payment Method'

    def company_display(self, obj):
        return obj.order.company.name if obj.order and obj.order.company else 'N/A'
    company_display.short_description = 'Company'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # restrict by order__company.owner for non-superusers
        if request.user.is_superuser:
            return qs
        return qs.filter(order__company__owner=request.user)


class ServiceTicketAdmin(VendorRestrictedAdmin):
    list_display = ('ticket_id', 'company', 'user', 'title', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('company', 'status', 'priority', 'created_at')
    search_fields = ('ticket_id', 'user__email', 'title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status', 'priority')
    date_hierarchy = 'created_at'


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('timestamp', 'sender', 'text')
    can_delete = False


class ChatSessionAdmin(VendorRestrictedAdmin):
    list_display = ('id', 'company', 'user_name_display', 'user_email_display', 'status', 'unread_admin_count', 'unread_user_count', 'updated_at')
    list_filter = ('company', 'status', 'created_at', 'updated_at')
    search_fields = ('email', 'user__email', 'user_id_str')
    inlines = [ChatMessageInline]
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)

    def user_name_display(self, obj):
        return obj.user.username if obj.user else "Guest"
    user_name_display.short_description = 'User Name'

    def user_email_display(self, obj):
        return obj.user.email if obj.user else obj.email
    user_email_display.short_description = 'User Email'


class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'text_preview', 'timestamp')
    list_filter = ('sender', 'timestamp')
    search_fields = ('text', 'session__email', 'session__user__email')
    readonly_fields = ('timestamp',)

    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Message'


class ContactMessageAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'email', 'subject', 'is_read', 'created_at')
    list_filter = ('company', 'is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_read',)


class CategoryFeatureAdmin(admin.ModelAdmin):
    list_display = ('category', 'feature_name', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('feature_name', 'category__name')
    list_editable = ('is_active',)


class StaffRoleAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'description', 'created_at')
    list_filter = ('company',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)


class StaffMemberAdmin(VendorRestrictedAdmin):
    list_display = ('user', 'company', 'role', 'is_active', 'joined_at')
    list_filter = ('company', 'is_active', 'role')
    search_fields = ('user__email',)
    readonly_fields = ('joined_at',)


# Register all with custom admin site
fixitall_admin.register(UserActivity, UserActivityAdmin)
fixitall_admin.register(POSSale, POSSaleAdmin)
fixitall_admin.register(ServiceTicket, ServiceTicketAdmin)
fixitall_admin.register(ChatSession, ChatSessionAdmin)
fixitall_admin.register(ChatMessage, ChatMessageAdmin)
fixitall_admin.register(ContactMessage, ContactMessageAdmin)
fixitall_admin.register(CategoryFeature, CategoryFeatureAdmin)
fixitall_admin.register(StaffRole, StaffRoleAdmin)
fixitall_admin.register(StaffMember, StaffMemberAdmin)
