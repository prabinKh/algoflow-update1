from rest_framework import serializers
from .models import UserActivity, POSSale, ServiceTicket, ContactMessage, CategoryFeature, ChatSession, ChatMessage, StaffRole, StaffMember
from efrontend.models import Product, Order, Category, Brand
from account.models import MyUser as User


class UserActivitySerializer(serializers.ModelSerializer):
    uid = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pageType = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    page_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    path = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    duration = serializers.IntegerField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)
    userAgent = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    screenResolution = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    displayName = serializers.SerializerMethodField()

    def get_displayName(self, obj):
        if obj.user:
            return obj.user.name or obj.user.email
        if isinstance(obj.details, dict):
            return obj.details.get('email') or 'Anonymous'
        return 'Anonymous'

    def create(self, validated_data):
        request = self.context.get('request')
        company_obj = None
        ip_address = None
        if request:
            from company.models import Company
            company_obj = Company.resolve_from_request(request)
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
            if ip_address:
                ip_address = ip_address.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

        # Pop all non-model fields
        uid = validated_data.pop('uid', None)
        email = validated_data.pop('email', None)
        page_type = validated_data.pop('page_type', None) or validated_data.pop('pageType', None)
        path = validated_data.pop('path', None)
        duration = validated_data.pop('duration', None)
        metadata = validated_data.pop('metadata', None)
        user_agent = validated_data.pop('user_agent', None) or validated_data.pop('userAgent', None) or ''
        screen_resolution = validated_data.pop('screen_resolution', None) or validated_data.pop('screenResolution', None)

        user = None
        if request and request.user and request.user.is_authenticated:
            user = request.user
        elif uid:
            try:
                import uuid as _uuid
                uid_as_uuid = _uuid.UUID(str(uid))
                user = User.objects.filter(id=uid_as_uuid).first()
            except ValueError:
                pass
            if not user:
                user = User.objects.filter(firebase_uid=uid).first()

        action = validated_data.get('action')
        if not action:
            action = 'view_product'
            if path:
                if 'cart' in path.lower():
                    action = 'add_to_cart'
                elif 'checkout' in path.lower() or 'order' in path.lower():
                    action = 'place_order'
                elif 'review' in path.lower():
                    action = 'write_review'

        details = {
            'email': email or (user.email if user else ''),
            'page_type': page_type,
            'path': path,
            'duration': duration,
            'metadata': metadata or {},
            'screen_resolution': screen_resolution,
        }

        from .models import UserActivity
        if not company_obj:
            if user and user.company:
                company_obj = user.company
            else:
                raise serializers.ValidationError(
                    {'detail': 'Could not determine company for activity log.'}
                )

        activity = UserActivity.objects.create(
            company=company_obj,
            user=user,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        return activity

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        details = instance.details or {}
        if isinstance(details, dict):
            ret['email'] = details.get('email', '')
            ret['pageType'] = details.get('page_type', '')
            ret['page_type'] = details.get('page_type', '')
            ret['path'] = details.get('path', '')
            ret['duration'] = details.get('duration', 0)
            ret['metadata'] = details.get('metadata', {})
            ret['screenResolution'] = details.get('screen_resolution', '')
        return ret

    class Meta:
        model = UserActivity
        fields = (
            'id', 'uid', 'email', 'displayName', 'pageType', 'page_type',
            'path', 'duration', 'timestamp', 'metadata', 'userAgent', 'screenResolution'
        )


class POSSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSSale
        fields = '__all__'


class AdminProductSerializer(serializers.ModelSerializer):
    categorySlug = serializers.ReadOnlyField(source='category.slug')
    category_name = serializers.ReadOnlyField(source='category.name')
    inStock = serializers.BooleanField(source='in_stock', required=False)
    isNew = serializers.BooleanField(source='is_new', required=False)
    stockCount = serializers.IntegerField(source='stock', required=False)
    originalPrice = serializers.DecimalField(source='original_price', max_digits=12, decimal_places=2, required=False, allow_null=True)
    model3D = serializers.CharField(source='model_3d', required=False, allow_blank=True, allow_null=True)
    images = serializers.JSONField(source='gallery', required=False)
    isBestSeller = serializers.BooleanField(source='is_best_seller', required=False)
    isPopular = serializers.BooleanField(source='is_popular', required=False)
    isOffer = serializers.BooleanField(source='is_offer', required=False)
    freeShipping = serializers.BooleanField(source='free_shipping', required=False)
    reviews = serializers.IntegerField(source='reviews_count', required=False)

    # Use CharFields to bypass PK validation
    brand = serializers.CharField(required=False, allow_null=True, write_only=True)
    category = serializers.CharField(required=False, allow_null=True, write_only=True)
    slug = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'category', 'categorySlug', 'category_name',
            'brand', 'brand_name', 'type', 'price', 'originalPrice', 'discount', 'image',
            'images', 'model3D', 'description', 'specs', 'features', 'colors',
            'collections', 'stockCount', 'inStock', 'isNew', 'isBestSeller',
            'isPopular', 'isOffer', 'freeShipping', 'rating', 'reviews', 'created_at'
        )
        # Mark category and brand as NOT model fields for the base validation
        # by ensuring they are overwritten by the CharFields above.
    
    def to_internal_value(self, data):
        # Create a mutable copy if needed
        if hasattr(data, 'copy'):
            data = data.copy()
            
        # Extract the string/ID values before they are deleted/validated
        brand_val = data.get('brand')
        category_val = data.get('categorySlug') or data.get('category')

        # Clean data for super() - remove fields that might cause PK errors
        temp_brand = data.pop('brand', None)
        temp_category = data.pop('category', None)
        
        # Run base validation (this handles name, slug, price, etc.)
        ret = super().to_internal_value(data)
        
        # Manually resolve Category
        if category_val:
            if str(category_val).isdigit():
                ret['category'] = Category.objects.filter(id=int(category_val)).first()
            else:
                ret['category'] = Category.objects.filter(slug=category_val).first() or Category.objects.filter(name__iexact=category_val).first()
        
        # Manually resolve Brand
        if brand_val:
            if str(brand_val).isdigit():
                brand_obj = Brand.objects.filter(id=int(brand_val)).first()
                if brand_obj:
                    ret['brand'] = brand_obj
                    ret['brand_name'] = brand_obj.name
            else:
                brand_name = str(brand_val).strip()
                brand_obj = Brand.objects.filter(name__iexact=brand_name).first()
                if brand_obj:
                    ret['brand'] = brand_obj
                    ret['brand_name'] = brand_obj.name
                else:
                    ret['brand'] = None
                    ret['brand_name'] = brand_name
        
        return ret

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure 'brand' in output is the ID for frontend compatibility
        ret['brand'] = instance.brand.id if instance.brand else None
        ret['category'] = instance.category.id if instance.category else None
        return ret


class AdminOrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source='product_id_str', read_only=True)

    class Meta:
        model = __import__('efrontend.models', fromlist=['OrderItem']).OrderItem
        fields = ('id', 'product', 'productId', 'name', 'image', 'features', 'quantity', 'price')


class AdminOrderSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    customerName = serializers.CharField(source='full_name', read_only=True)
    customerEmail = serializers.EmailField(source='email', read_only=True)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    paymentStatus = serializers.CharField(source='payment_status', read_only=True)
    paymentMethod = serializers.CharField(source='payment_method', read_only=True)
    orderId = serializers.CharField(source='order_id', read_only=True)
    shippingAddress = serializers.SerializerMethodField()

    def get_shippingAddress(self, obj):
        return {
            'address': obj.address,
            'city': obj.city,
            'phone': obj.phone
        }

    class Meta:
        model = Order
        fields = (
            'id', 'uid', 'orderId', 'customerName', 'customerEmail',
            'items', 'subtotal', 'tax', 'discount', 'totalAmount', 'total_amount',
            'status', 'paymentStatus', 'paymentMethod', 'source', 'customer_type',
            'shippingAddress', 'createdAt', 'updatedAt',
        )


class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)
    uid = serializers.CharField(source='firebase_uid', read_only=True)
    displayName = serializers.CharField(source='name', read_only=True)
    phone = serializers.CharField(source='phone_number', read_only=True)
    cartItems = serializers.ListField(source='cart_items', read_only=True)
    wishlistItems = serializers.ListField(source='wishlist_items', read_only=True)
    lastVisit = serializers.DateTimeField(source='last_login', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)
    isStaff = serializers.BooleanField(source='is_staff', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'uid', 'username', 'name', 'displayName', 'email', 'phone', 'phone_number',
            'cartItems', 'wishlistItems', 'order_count', 'total_spent',
            'lastVisit', 'createdAt', 'isAdmin', 'isStaff', 'is_superuser',
        )


class ServiceTicketSerializer(serializers.ModelSerializer):
    # Camelcase fields for frontend
    ticketId = serializers.CharField(source='ticket_id', read_only=True)
    userName = serializers.SerializerMethodField()
    userEmail = serializers.SerializerMethodField()
    userId = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    serviceType = serializers.CharField(source='service_type', required=False)
    contactChannel = serializers.CharField(source='contact_channel', required=False)
    serialNumber = serializers.CharField(source='serial_number', required=False, allow_blank=True)
    whatsappNumber = serializers.CharField(source='whatsapp_number', required=False, allow_blank=True)
    currentLocation = serializers.CharField(source='current_location', required=False, allow_blank=True)

    def get_userName(self, obj):
        return obj.user.name if obj.user else ''

    def get_userEmail(self, obj):
        return obj.user.email if obj.user else ''

    def get_userId(self, obj):
        return str(obj.user.firebase_uid or obj.user.id) if obj.user else ''

    def create(self, validated_data):
        # auto-generate ticket_id if not present
        import random, string
        if not validated_data.get('ticket_id'):
            prefix = 'TKT'
            rand = ''.join(random.choices(string.digits, k=6))
            validated_data['ticket_id'] = f"{prefix}-{rand}"
        return super().create(validated_data)

    class Meta:
        model = ServiceTicket
        fields = (
            'id', 'ticketId', 'ticket_id', 'user', 'userId', 'userName', 'userEmail',
            'category', 'brand', 'model', 'serialNumber', 'serial_number',
            'component', 'description', 'serviceType', 'service_type',
            'address', 'currentLocation', 'current_location',
            'whatsappNumber', 'whatsapp_number', 'contactChannel', 'contact_channel',
            'status', 'priority', 'createdAt', 'updatedAt',
        )


class ChatMessageSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    type = serializers.CharField(source='msg_type', read_only=True)
    msg_type = serializers.CharField(required=False, default='text')

    def validate_sender(self, value):
        if value == 'ai':
            return 'assistant'
        if value == 'human':
            return 'admin'
        return value

    class Meta:
        model = ChatMessage
        fields = ('id', 'session', 'sender', 'text', 'type', 'msg_type', 'timestamp', 'status', 'metadata', 'attachments')
        extra_kwargs = {
            'msg_type': {'write_only': True},
        }


class ChatSessionSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=__import__('company.models', fromlist=['Company']).Company.objects.all(),
        required=False,
        allow_null=True
    )
    messages = ChatMessageSerializer(many=True, read_only=True)
    unreadAdminCount = serializers.IntegerField(source='unread_admin_count', read_only=True)
    unreadUserCount = serializers.IntegerField(source='unread_user_count', read_only=True)
    userId = serializers.CharField(source='user_id_str', read_only=True)
    # Use CharField (not EmailField) so 'Guest' or any string is accepted
    userEmail = serializers.CharField(source='user_email', read_only=True, allow_null=True, default='')
    userName = serializers.CharField(source='user_name', read_only=True)
    lastMessage = serializers.CharField(source='last_message', read_only=True)
    lastMessageTime = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = ChatSession
        fields = '__all__'
        extra_kwargs = {
            'user_email': {'required': False, 'allow_null': True, 'allow_blank': True},
            'user_id_str': {'required': False, 'allow_blank': True, 'default': ''},
            'user_name': {'required': False, 'allow_blank': True, 'default': 'Guest'},
        }


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'


class CategoryFeatureSerializer(serializers.ModelSerializer):
    """
    Returns grouped format: { id, categorySlug, categoryName, features: [] }
    """
    category_name = serializers.ReadOnlyField(source='category.name')
    category_slug = serializers.ReadOnlyField(source='category.slug')
    categoryName = serializers.ReadOnlyField(source='category.name')
    categorySlug = serializers.ReadOnlyField(source='category.slug')

    class Meta:
        model = CategoryFeature
        fields = ('id', 'category', 'category_name', 'category_slug', 'categoryName', 'categorySlug', 'feature_name', 'is_active', 'created_at')

class StaffRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffRole
        fields = '__all__'

class StaffMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    user_details = serializers.SerializerMethodField()
    role_details = StaffRoleSerializer(source='role', read_only=True)

    # Writable fields for user creation inline
    email = serializers.EmailField(write_only=True, required=False)
    name = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffMember
        fields = ('id', 'company', 'user', 'role', 'user_details', 'role_details', 'email', 'name', 'password', 'is_active', 'joined_at')
        read_only_fields = ('company', 'joined_at')

    def get_user_details(self, obj):
        if not obj.user:
            return None
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'name': obj.user.name,
        }

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        name = validated_data.pop('name', None)
        password = validated_data.pop('password', None)
        user = validated_data.get('user')

        if not user:
            if not email or not name:
                raise serializers.ValidationError({"user": "This field is required or provide email and name to create a new user."})
            # Create user inline
            company = validated_data.get('company')
            # Check if user already exists
            user = User.objects.filter(email=email).first()
            if user:
                raise serializers.ValidationError({"email": "A user with this email already exists."})
            user = User.objects.create_user(
                email=email,
                name=name,
                password=password or 'tempPassWord123!',
                company=company,
                role='staff',
                is_staff=True,
                email_verified=True
            )
        
        validated_data['user'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        name = validated_data.pop('name', None)
        password = validated_data.pop('password', None)
        is_active = validated_data.get('is_active')

        user = instance.user
        if user:
            if email:
                user.email = email
            if name:
                user.name = name
            if password:
                user.set_password(password)
            if is_active is not None:
                user.is_active = is_active
            user.save()

        return super().update(instance, validated_data)

class AdminBrandSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        write_only=True,
        source='categories',
        required=False
    )
    categories = serializers.SerializerMethodField()

    def get_categories(self, obj):
        return [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in obj.categories.all()]

    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'description', 'logo', 'categories', 'category_ids', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('slug', 'created_at', 'updated_at')