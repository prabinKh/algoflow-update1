from rest_framework import generics, permissions, filters, views, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Brand, Product, Order, OrderItem, HeroSetting, Wishlist, Review, StoreLocation, AIRecommendation
from .serializers import (
    CategorySerializer, BrandSerializer, ProductSerializer, OrderSerializer,
    HeroSettingSerializer, WishlistSerializer, ReviewSerializer,
    StoreLocationSerializer, AIRecommendationSerializer
)


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        qs = Category.objects.filter(is_active=True)
        company_obj = Company.resolve_from_request(self.request, fallback=False)

        # Allow admin/staff users to see all categories (so admins can assign newly
        # created categories when adding products). For storefront/guest requests
        # when a company is resolved, only show categories that have products for
        # that company.
        user = getattr(self.request, 'user', None)
        is_admin_user = bool(
            user and getattr(user, 'is_authenticated', False) and (
                getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'role', None) in ('superadmin', 'company_admin', 'staff')
            )
        )

        if company_obj and not is_admin_user:
            qs = qs.filter(products__company=company_obj, products__is_active=True).distinct()

        return qs.order_by('order', 'name')


class CategoryDetailView(generics.RetrieveAPIView):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

    def get_queryset(self):
        from company.models import Company
        qs = Category.objects.filter(is_active=True)
        company_obj = Company.resolve_from_request(self.request, fallback=False)

        user = getattr(self.request, 'user', None)
        is_admin_user = bool(
            user and getattr(user, 'is_authenticated', False) and (
                getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'role', None) in ('superadmin', 'company_admin', 'staff')
            )
        )

        if company_obj and not is_admin_user:
            qs = qs.filter(products__company=company_obj, products__is_active=True).distinct()
        return qs


class BrandListView(generics.ListCreateAPIView):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)
        return queryset.distinct()


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'brand', 'is_new', 'is_best_seller', 'in_stock']
    search_fields = ['name', 'brand', 'description']
    ordering_fields = ['price', 'created_at', 'rating']

    def get_queryset(self):
        from company.models import Company
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
            
        company_obj = Company.resolve_from_request(self.request, fallback=False)
        if company_obj:
            queryset = queryset.filter(company=company_obj)
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'


class HeroSettingView(generics.ListAPIView):
    serializer_class = HeroSettingSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        qs = HeroSetting.objects.filter(is_active=True).order_by('order')
        company_obj = Company.resolve_from_request(self.request)
        if company_obj:
            qs = qs.filter(company=company_obj)
        return qs


class OrderCreateView(views.APIView):
    """
    Accept frontend order format:
    {
      uid, items: [{productId, name, price, quantity, image, features}],
      totalAmount, subtotal, tax, discount,
      shippingAddress: {address, city, phone, country},
      customerName, customerEmail, status, paymentStatus, paymentMethod,
      source, orderId, customerType
    }
    """
    permission_classes = (permissions.AllowAny,)

    PAYMENT_STATUS_ALIASES = {
        'unpaid': 'pending',
        'paid': 'completed',
        'complete': 'completed',
        'completed': 'completed',
    }

    PAYMENT_METHOD_ALIASES = {
        'cash': 'cod',
        'cash on delivery': 'cod',
        'cod': 'cod',
    }

    def _normalize_payment_status(self, value):
        valid = {c[0] for c in Order.PAYMENT_CHOICES}
        raw = str(value or 'pending').lower().strip()
        mapped = self.PAYMENT_STATUS_ALIASES.get(raw, raw)
        return mapped if mapped in valid else 'pending'

    def _normalize_payment_method(self, value):
        valid = {c[0] for c in Order.PAYMENT_METHOD_CHOICES}
        raw = str(value or 'cod').lower().strip()
        mapped = self.PAYMENT_METHOD_ALIASES.get(raw, raw)
        return mapped if mapped in valid else 'cod'

    def _normalize_features(self, value):
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, list):
            return {'items': value}
        return {}

    def _resolve_user(self, request, data):
        if request.user.is_authenticated:
            return request.user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        uid_param = data.get('uid')
        if uid_param:
            user = User.objects.filter(id=uid_param).first()
            if user:
                return user
        email = (data.get('customerEmail') or '').strip().lower()
        if email:
            return User.objects.filter(email=email).first()
        return None

    def _find_product(self, product_id, company=None):
        from django.db.models import Q
        if not product_id:
            return None
        qs = Product.objects.filter(Q(id=product_id) | Q(slug=product_id))
        if company:
            qs = qs.filter(company=company)
        return qs.select_related('company').first()

    def post(self, request):
        from django.db import transaction
        from company.models import Company
        import uuid

        try:
            data = request.data
            shipping = data.get('shippingAddress') or data.get('shipping') or {}
            items = data.get('items') or []
            if not items:
                return Response({'error': 'Order items are required'}, status=status.HTTP_400_BAD_REQUEST)

            user = self._resolve_user(request, data)
            tenant_company = Company.resolve_from_request(request, fallback=False)

            if user and tenant_company and user.company_id:
                if user.company_id != tenant_company.id and user.role not in ('superadmin',) and not user.is_superuser:
                    return Response(
                        {
                            'error': (
                                f'Your account is registered with {user.company.name}. '
                                f'Please shop and checkout at {user.company.slug}.localhost:3000'
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            payment_status = self._normalize_payment_status(data.get('paymentStatus'))
            payment_method = self._normalize_payment_method(data.get('paymentMethod'))
            order_status = data.get('status', 'pending')
            if order_status not in {c[0] for c in Order.STATUS_CHOICES}:
                order_status = 'pending'

            uid = uuid.uuid4().hex[:30]
            company_items_map = {}

            for item in items:
                product_id = item.get('productId') or item.get('product_id')
                product = self._find_product(product_id)
                company = product.company if product and product.company else None

                if not company and tenant_company:
                    product = self._find_product(product_id, company=tenant_company) or product
                    company = tenant_company

                if not company and user and getattr(user, 'company', None):
                    company = user.company
                    if product_id and not product:
                        product = self._find_product(product_id, company=company)

                if not company:
                    return Response(
                        {
                            'error': (
                                f'Could not determine store for product "{product_id}". '
                                'Please add items from a valid store listing.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                item['_product'] = product
                company_id = company.id
                if company_id not in company_items_map:
                    company_items_map[company_id] = {
                        'company': company,
                        'items': [],
                        'subtotal': 0,
                    }

                company_items_map[company_id]['items'].append(item)
                company_items_map[company_id]['subtotal'] += float(item.get('price', 0)) * int(item.get('quantity', 1))

            created_orders = []
            base_order_id = (data.get('orderId') or '').strip() or None

            with transaction.atomic():
                for idx, group in enumerate(company_items_map.values()):
                    subtotal = group['subtotal']
                    order_id = (
                        f'{base_order_id}-{idx + 1}'
                        if base_order_id and len(company_items_map) > 1
                        else base_order_id
                    )
                    order_uid = f'{uid}-{idx + 1}' if len(company_items_map) > 1 else uid

                    order = Order.objects.create(
                        user=user,
                        company=group['company'],
                        uid=order_uid,
                        order_id=order_id or '',
                        email=(data.get('customerEmail') or (user.email if user else '')).strip(),
                        full_name=data.get('customerName') or (user.name if user else 'Customer'),
                        address=shipping.get('address', ''),
                        city=shipping.get('city', ''),
                        country=shipping.get('country', 'Nepal'),
                        phone=shipping.get('phone', ''),
                        subtotal=subtotal,
                        tax=float(data.get('tax') or 0),
                        discount=float(data.get('discount') or 0),
                        total_amount=subtotal,
                        status=order_status,
                        payment_status=payment_status,
                        payment_method=payment_method,
                        source=data.get('source', 'store'),
                        customer_type=data.get('customerType', 'registered'),
                    )
                    created_orders.append(order)

                    for line in group['items']:
                        product = line.get('_product')
                        line_image = line.get('image') or (product.image if product else '') or ''
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            product_id_str=str(product.id) if product else str(line.get('productId', '')),
                            name=line.get('name') or (product.name if product else 'Product'),
                            image=line_image,
                            features=self._normalize_features(line.get('features')),
                            quantity=int(line.get('quantity', 1)),
                            price=line.get('price', 0),
                        )

            return Response(OrderSerializer(created_orders[0]).data, status=status.HTTP_201_CREATED)

        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception('Order creation failed')
            return Response(
                {'error': 'Failed to create order.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderTrackView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        pk = self.kwargs.get('id')
        try:
            return Order.objects.get(id=pk)
        except Order.DoesNotExist:
            return Order.objects.get(order_id=pk)


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


class WishlistViewSet(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        wishlist = Wishlist.objects.filter(user=request.user)
        serializer = WishlistSerializer(wishlist, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            wishlist_item.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'})


class ReviewViewSet(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data.copy()
        data['product'] = product_id
        data['user'] = request.user.id
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreLocationView(generics.ListAPIView):
    serializer_class = StoreLocationSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        qs = StoreLocation.objects.all()
        company_obj = Company.resolve_from_request(self.request)
        if company_obj:
            qs = qs.filter(company=company_obj)
        return qs


class AIRecommendationView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        query = request.data.get('query', '')
        products = Product.objects.all()[:20]
        product_list = [{'name': p.name, 'brand': p.brand, 'price': float(p.price), 'category': p.category.name} for p in products]
        rec = AIRecommendation.objects.create(
            user=request.user if request.user.is_authenticated else None,
            query=query,
            recommendations=product_list[:5],
            reasoning='Based on available products'
        )
        from .serializers import AIRecommendationSerializer
        return Response(AIRecommendationSerializer(rec).data)


class CurrentCompanyView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        from company.models import Company
        from company.serializers import CompanyPublicSerializer
        company = Company.resolve_from_request(request)
        if company:
            return Response(CompanyPublicSerializer(company).data)
        return Response({'detail': 'No company active'}, status=status.HTTP_404_NOT_FOUND)
