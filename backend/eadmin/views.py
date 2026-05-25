from rest_framework import viewsets, permissions, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import UserActivity, POSSale, ServiceTicket, ContactMessage, CategoryFeature, ChatSession, ChatMessage, StaffRole, StaffMember
from efrontend.models import Product, Order, Category, Brand
from account.models import User
from .serializers import (
    UserActivitySerializer, AdminProductSerializer, AdminOrderSerializer,
    CustomerSerializer, POSSaleSerializer, ServiceTicketSerializer,
    ContactMessageSerializer, CategoryFeatureSerializer,
    ChatSessionSerializer, ChatMessageSerializer,
    StaffRoleSerializer, StaffMemberSerializer, AdminBrandSerializer,
)
from .tasks import generate_ai_response
from efrontend.serializers import HeroSettingSerializer, CategorySerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_staff or request.user.is_superuser or
            request.user.role in ('superadmin', 'company_admin', 'staff')
        )


def get_company_filter(request):
    """Return company filter dict for querysets based on logged-in user."""
    user = request.user
    if not user or not user.is_authenticated:
        tenant = getattr(request, 'company', None)
        if tenant:
            return {'company': tenant}
        return {}
    if user.role == 'superadmin' or user.is_superuser:
        company_id = request.query_params.get('company')
        if company_id:
            return {'company_id': company_id}
        tenant = getattr(request, 'company', None)
        if tenant:
            return {'company': tenant}
        return {}
    if user.company:
        return {'company': user.company}
    tenant = getattr(request, 'company', None)
    if tenant:
        return {'company': tenant}
    return {}


def resolve_company_for_user(request):
    """Resolve a company object for the current user/request."""
    user = request.user
    if user and user.is_authenticated and user.company:
        return user.company
    # Fall back to resolving by host header
    from company.models import Company
    return Company.resolve_from_request(request)


class DashboardStatsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        cf = get_company_filter(request)

        total_sales = Order.objects.filter(status='delivered', **cf).aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        this_month_sales = Order.objects.filter(
            status='delivered', created_at__gte=month_start, **cf
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        last_month_sales = Order.objects.filter(
            status='delivered', created_at__gte=last_month_start, created_at__lt=month_start, **cf
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        total_orders = Order.objects.filter(**cf).count()
        pending_orders = Order.objects.filter(status='pending', **cf).count()
        total_products = Product.objects.filter(**cf).count()
        low_stock_products = Product.objects.filter(stock__lt=10, **cf).count()

        if cf:
            total_customers = User.objects.filter(
                role='customer', company=request.user.company
            ).count() if request.user.company else 0
        else:
            total_customers = User.objects.filter(role='customer').count()

        recent_orders = Order.objects.filter(**cf).order_by('-created_at')[:5]
        recent_orders_data = [{
            'id': o.id, 'orderId': o.order_id, 'customerName': o.full_name,
            'customerEmail': o.email, 'totalAmount': float(o.total_amount),
            'status': o.status, 'createdAt': o.created_at.isoformat(),
        } for o in recent_orders]

        monthly_revenue = []
        for i in range(6, -1, -1):
            m_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0)
            m_end = (m_start + timedelta(days=32)).replace(day=1)
            rev = Order.objects.filter(
                status='delivered', created_at__gte=m_start, created_at__lt=m_end, **cf
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            monthly_revenue.append({'month': m_start.strftime('%b %Y'), 'revenue': float(rev)})

        top_products = (
            Order.objects.filter(status='delivered', **cf)
            .values('items__product__id', 'items__product__name', 'items__name')
            .annotate(total_qty=Sum('items__quantity'), total_rev=Sum('items__price'))
            .order_by('-total_qty')[:5]
        )

        sales_growth = 0
        if last_month_sales:
            sales_growth = round(((float(this_month_sales) - float(last_month_sales)) / float(last_month_sales)) * 100, 1)

        return Response({
            'total_sales': float(total_sales),
            'this_month_sales': float(this_month_sales),
            'sales_growth': sales_growth,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_customers': total_customers,
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'recent_orders': recent_orders_data,
            'monthly_revenue': monthly_revenue,
            'top_products': list(top_products),
        })


@method_decorator(csrf_exempt, name='dispatch')
class AdminProductViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = Product.objects.filter(**cf).select_related('category', 'brand', 'company').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(brand__name__icontains=search))
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = Order.objects.filter(**cf).prefetch_related('items').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()
        if 'paymentStatus' in data:
            data['payment_status'] = data.pop('paymentStatus')
        if 'paymentMethod' in data:
            data['payment_method'] = data.pop('paymentMethod')
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if 'payment_status' in data:
            instance.payment_status = data['payment_status']
        if 'status' in data:
            instance.status = data['status']
        instance.save()
        return Response(AdminOrderSerializer(instance).data)


class CustomerListView(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.company and not (user.is_superuser or user.role == 'superadmin'):
            return User.objects.filter(
                role='customer', company=user.company
            ).annotate(order_count=Count('orders'), total_spent=Sum('orders__total_amount'))
        return User.objects.filter(role='customer').annotate(
            order_count=Count('orders'), total_spent=Sum('orders__total_amount')
        )

    def get_permissions(self):
        if self.action in ['retrieve', 'sync_cart', 'sync_wishlist']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_object(self):
        pk = self.kwargs.get('pk')
        email = self.request.query_params.get('email') or ''
        try:
            import uuid as _uuid
            uid_val = _uuid.UUID(str(pk))
            user = User.objects.get(id=uid_val)
            return user
        except (ValueError, User.DoesNotExist):
            pass
        try:
            user = User.objects.get(firebase_uid=pk)
            return user
        except User.DoesNotExist:
            pass
        if email:
            try:
                user = User.objects.get(email=email)
                return user
            except User.DoesNotExist:
                pass
        safe_email = email if email and '@' in email else f'guest_{str(pk)[:8]}@guest.local'
        safe_name = email.split('@')[0] if email and '@' in email else 'Guest'
        try:
            user, _ = User.objects.get_or_create(
                firebase_uid=str(pk),
                defaults={'email': safe_email, 'name': safe_name}
            )
        except Exception:
            from rest_framework.exceptions import NotFound
            raise NotFound(detail='Customer not found')
        return user

    @action(detail=True, methods=['post'], url_path='sync_cart', permission_classes=[permissions.AllowAny])
    def sync_cart(self, request, pk=None):
        user = self.get_object()
        user.cart_items = request.data.get('cartItems', [])
        user.save(update_fields=['cart_items', 'updated_at'])
        return Response({'success': True, 'cartItems': user.cart_items})

    @action(detail=True, methods=['post'], url_path='sync_wishlist', permission_classes=[permissions.AllowAny])
    def sync_wishlist(self, request, pk=None):
        user = self.get_object()
        user.wishlist_items = request.data.get('wishlistItems', [])
        user.save(update_fields=['wishlist_items', 'updated_at'])
        return Response({'success': True, 'wishlistItems': user.wishlist_items})


@method_decorator(csrf_exempt, name='dispatch')
class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = UserActivity.objects.all().order_by('-timestamp')
    serializer_class = UserActivitySerializer

    def get_authenticators(self):
        if getattr(self, 'action', None) == 'create':
            return []
        return super().get_authenticators()

    def get_permissions(self):
        action = getattr(self, 'action', None)
        if action == 'create':
            return [permissions.AllowAny()]
        if action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        queryset = UserActivity.objects.filter(**cf).order_by('-timestamp')
        if self.request.user.is_authenticated and not (
            self.request.user.is_admin or self.request.user.is_staff or
            self.request.user.role in ('company_admin', 'superadmin')
        ):
            return queryset.filter(user=self.request.user)
        uid = self.request.query_params.get('uid')
        if uid:
            try:
                import uuid as _uuid
                uid_as_uuid = _uuid.UUID(str(uid))
                queryset = queryset.filter(Q(user__firebase_uid=uid) | Q(user__id=uid_as_uuid))
            except ValueError:
                queryset = queryset.filter(user__firebase_uid=uid)
        return queryset


class POSSaleViewSet(viewsets.ModelViewSet):
    serializer_class = POSSaleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        order_cf = {f'order__{k}': v for k, v in cf.items()}
        return POSSale.objects.filter(**order_cf)


@method_decorator(csrf_exempt, name='dispatch')
class AdminServiceTicketViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceTicketSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        queryset = ServiceTicket.objects.filter(**cf).order_by('-created_at')
        if self.request.user.is_authenticated and not (
            self.request.user.is_admin or self.request.user.is_staff or
            self.request.user.role in ('company_admin', 'superadmin')
        ):
            return queryset.filter(user=self.request.user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(Q(user__firebase_uid=user_id) | Q(user__id=user_id))
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        uid = self.request.data.get('userId') or self.request.data.get('user_id')
        if uid and not user:
            user = User.objects.filter(Q(firebase_uid=uid) | Q(id=uid)).first()
        # Resolve company: from user or from request host
        company = resolve_company_for_user(self.request)
        serializer.save(user=user, company=company)


@method_decorator(csrf_exempt, name='dispatch')
class AdminContactMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return ContactMessage.objects.filter(**cf).order_by('-created_at')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCategoryFeatureViewSet(viewsets.ModelViewSet):
    queryset = CategoryFeature.objects.all().select_related('category')
    serializer_class = CategoryFeatureSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def list(self, request, *args, **kwargs):
        features = CategoryFeature.objects.filter(is_active=True).select_related('category')
        grouped = {}
        for f in features:
            slug = f.category.slug
            if slug not in grouped:
                grouped[slug] = {'id': slug, 'categorySlug': slug, 'categoryName': f.category.name, 'features': []}
            grouped[slug]['features'].append(f.feature_name)
        return Response(list(grouped.values()))

    def create(self, request, *args, **kwargs):
        data = request.data
        category_slug = data.get('categorySlug') or data.get('category_slug') or data.get('categoryName', '').lower().replace(' ', '-')
        features_list = data.get('features', [])
        category_name = data.get('categoryName') or category_slug
        cat = Category.objects.filter(slug=category_slug).first()
        if not cat:
            cat = Category.objects.create(name=category_name, slug=category_slug)
        if 'features' in data:
            features_list = data.get('features', [])
            existing = list(CategoryFeature.objects.filter(category=cat).values_list('feature_name', flat=True))
            for feature_name in features_list:
                if feature_name not in existing:
                    CategoryFeature.objects.create(category=cat, feature_name=feature_name)
            CategoryFeature.objects.filter(category=cat).exclude(feature_name__in=features_list).delete()
            return Response({'id': category_slug, 'categorySlug': category_slug, 'categoryName': category_name, 'features': features_list}, status=status.HTTP_201_CREATED)
        else:
            feature_name = data.get('feature_name') or data.get('featureName', '')
            if not feature_name:
                return Response({'error': 'feature_name required'}, status=400)
            obj, created = CategoryFeature.objects.get_or_create(category=cat, feature_name=feature_name)
            return Response(CategoryFeatureSerializer(obj).data, status=status.HTTP_201_CREATED if created else 200)

    @action(detail=False, methods=['post', 'put'], url_path='update-features')
    def update_features(self, request):
        return self.create(request)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]


@method_decorator(csrf_exempt, name='dispatch')
class AdminBrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('name')
    serializer_class = AdminBrandSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]


class UploadView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        folder = request.data.get('path', 'uploads')
        save_path = default_storage.save(f'{folder}/{f.name}', ContentFile(f.read()))
        url = request.build_absolute_uri(f'/media/{save_path}')
        return Response({'url': url})


class UploadModelView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        save_path = default_storage.save(f'models/{f.name}', ContentFile(f.read()))
        url = request.build_absolute_uri(f'/media/{save_path}')
        return Response({'url': url})


@method_decorator(csrf_exempt, name='dispatch')
class AdminHeroSettingViewSet(viewsets.ModelViewSet):
    serializer_class = HeroSettingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return __import__('efrontend.models', fromlist=['HeroSetting']).HeroSetting.objects.filter(**cf).order_by('order')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)

    def create(self, request, *args, **kwargs):
        HeroSetting = __import__('efrontend.models', fromlist=['HeroSetting']).HeroSetting
        cf = get_company_filter(request)
        existing = HeroSetting.objects.filter(**cf).first()
        data = request.data.copy()
        if 'description' in data and 'subtitle' not in data:
            data['subtitle'] = data['description']
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all().order_by('-last_message_time')
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated and (
            self.request.user.is_admin or self.request.user.is_staff or
            self.request.user.role in ('company_admin', 'superadmin')
        ):
            cf = get_company_filter(self.request)
            return ChatSession.objects.filter(**cf).order_by('-last_message_time')
        if self.request.user.is_authenticated:
            return ChatSession.objects.filter(user=self.request.user).order_by('-last_message_time')
        guest_id = self.request.query_params.get('guest_id')
        if guest_id:
            return ChatSession.objects.filter(user_id_str=guest_id).order_by('-last_message_time')
        return ChatSession.objects.none()

    def perform_create(self, serializer):
        from company.models import Company
        company = None
        company_id = self.request.data.get('company')
        if company_id:
            company = Company.objects.filter(id=company_id).first() or Company.objects.filter(slug=company_id).first()
        if not company and self.request.user and self.request.user.is_authenticated:
            company = self.request.user.company
        if not company:
            company = Company.resolve_from_request(self.request)
        if not company:
            company = Company.objects.first()
        serializer.save(company=company)

    def perform_update(self, serializer):
        instance = serializer.save()
        if self.request.data.get('unreadAdminCount') == 0 or self.request.data.get('unread_admin_count') == 0:
            instance.unread_admin_count = 0
            instance.save(update_fields=['unread_admin_count', 'updated_at'])
        if self.request.data.get('unreadUserCount') == 0 or self.request.data.get('unread_user_count') == 0:
            instance.unread_user_count = 0
            instance.save(update_fields=['unread_user_count', 'updated_at'])


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        session_id = self.request.query_params.get('session_id')
        if session_id:
            return ChatMessage.objects.filter(session_id=session_id).order_by('timestamp')
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        message = serializer.save()
        session = message.session
        session.last_message = message.text
        if message.sender == 'user':
            session.unread_admin_count = (session.unread_admin_count or 0) + 1
        else:
            session.unread_user_count = (session.unread_user_count or 0) + 1
        session.save(update_fields=['last_message', 'unread_admin_count', 'unread_user_count', 'last_message_time', 'updated_at'])
        if message.sender == 'user':
            try:
                generate_ai_response.delay(message.session.id, message.text)
            except Exception as e:
                print(f'AI task failed: {e}')


class ReportsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cf = get_company_filter(request)
        report_type = request.query_params.get('type', 'sales')
        if report_type == 'sales_by_category':
            data = list(Order.objects.filter(status='delivered', **cf).values(
                'items__product__category__name'
            ).annotate(total_sales=Sum('items__price'), total_orders=Count('id', distinct=True)))
        elif report_type == 'sales_by_brand':
            data = list(Order.objects.filter(status='delivered', **cf).values(
                'items__product__brand'
            ).annotate(total_sales=Sum('items__price'), total_orders=Count('id', distinct=True)))
        elif report_type == 'sales_by_product':
            data = list(Order.objects.filter(status='delivered', **cf).values(
                'items__product__name', 'items__name'
            ).annotate(
                total_sales=Sum('items__price'), total_quantity=Sum('items__quantity'),
                total_orders=Count('id', distinct=True)
            ).order_by('-total_sales')[:20])
        elif report_type == 'sales_by_status':
            data = list(Order.objects.filter(**cf).values('status').annotate(count=Count('id')))
        elif report_type == 'stock_report':
            data = list(Product.objects.filter(**cf).values('name', 'brand', 'stock', 'category__name').order_by('stock'))
        else:
            data = {'error': 'Invalid report type'}
        return Response(data)


class StaffRoleViewSet(viewsets.ModelViewSet):
    serializer_class = StaffRoleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return StaffRole.objects.filter(**cf).order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


class StaffMemberViewSet(viewsets.ModelViewSet):
    serializer_class = StaffMemberSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = StaffMember.objects.filter(**cf)
        role_id = self.request.query_params.get('role')
        if role_id:
            qs = qs.filter(role_id=role_id)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)
