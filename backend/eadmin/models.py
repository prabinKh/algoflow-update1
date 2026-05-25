from django.db import models
from django.contrib.auth import get_user_model
from company.models import Company
from efrontend.models import Product, Order
import uuid

User = get_user_model()


class UserActivity(models.Model):
    ACTIVITY_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view_product', 'View Product'),
        ('add_to_cart', 'Add to Cart'),
        ('place_order', 'Place Order'),
        ('write_review', 'Write Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='activities', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTIVITY_CHOICES)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['company', 'timestamp']),
        ]

    def __str__(self):
        return f'{self.user.email if self.user else "Guest"} - {self.action}'


class POSSale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='pos_sale')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'POS - {self.transaction_id}'


class ServiceTicket(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('in_progress', 'In Progress'), ('closed', 'Closed')]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='service_tickets', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ticket_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    attachments = models.JSONField(default=list, blank=True)

    # Extended repair ticket fields
    category = models.CharField(max_length=200, blank=True, default='')
    brand = models.CharField(max_length=200, blank=True, default='')
    model = models.CharField(max_length=200, blank=True, default='')
    component = models.CharField(max_length=200, blank=True, default='')
    serial_number = models.CharField(max_length=200, blank=True, default='')
    service_type = models.CharField(max_length=100, blank=True, default='')
    contact_channel = models.CharField(max_length=100, blank=True, default='')
    whatsapp_number = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    current_location = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f'{self.ticket_id} - {self.title or self.category}'

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            import random
            self.ticket_id = f'TKT{timestamp}{random.randint(100, 999)}'
        # Auto-generate title from category/brand/model if not set
        if not self.title:
            parts = [p for p in [self.category, self.brand, self.model] if p]
            self.title = ' - '.join(parts) if parts else 'Repair Ticket'
        super().save(*args, **kwargs)


class ContactMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='contact_messages', db_index=True, null=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} - {self.email}'


class CategoryFeature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey('efrontend.Category', on_delete=models.CASCADE, related_name='features')
    feature_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('category', 'feature_name')

    def __str__(self):
        return f'{self.category.name} - {self.feature_name}'


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='chat_sessions', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_id_str = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    user_email = models.CharField(max_length=255, blank=True, default='')
    user_name = models.CharField(max_length=255, blank=True, default='Guest')
    status = models.CharField(max_length=20, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_chats')
    last_message = models.TextField(blank=True)
    unread_admin_count = models.IntegerField(default=0)
    unread_user_count = models.IntegerField(default=0)
    last_message_time = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_time']
        indexes = [
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f'Chat {self.id} - {self.company.name}'


class ChatMessage(models.Model):
    SENDER_CHOICES = [('user', 'User'), ('admin', 'Admin'), ('assistant', 'Assistant')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    text = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    msg_type = models.CharField(max_length=50, default='text', blank=True)
    status = models.CharField(max_length=50, default='sent', blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.sender}: {self.text[:50]}'


class StaffRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='staff_roles', db_index=True, null=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'name')

    def __str__(self):
        return f'{self.name} - {self.company.name if self.company else "Platform"}'


class StaffMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='staff_members', db_index=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.ForeignKey(StaffRole, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'user')

    def __str__(self):
        return f'{self.user.email} - {self.role.name if self.role else "No Role"}'
