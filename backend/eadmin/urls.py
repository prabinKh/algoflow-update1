from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView, AdminProductViewSet, AdminOrderViewSet,
    CustomerListView, ActivityLogViewSet, POSSaleViewSet,
    AdminServiceTicketViewSet, AdminContactMessageViewSet,
    AdminCategoryFeatureViewSet, AdminHeroSettingViewSet, ReportsView,
    AdminCategoryViewSet, AdminBrandViewSet, UploadView, UploadModelView,
    ChatSessionViewSet, ChatMessageViewSet,
    StaffRoleViewSet, StaffMemberViewSet,
)

router = DefaultRouter()
router.register(r'products', AdminProductViewSet, basename='admin-products')
router.register(r'brands', AdminBrandViewSet, basename='admin-brands')
router.register(r'categories', AdminCategoryViewSet, basename='admin-categories')
router.register(r'orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'customers', CustomerListView, basename='admin-customers')
router.register(r'pos', POSSaleViewSet, basename='admin-pos')
router.register(r'service-tickets', AdminServiceTicketViewSet, basename='admin-service-tickets')
router.register(r'messages', AdminContactMessageViewSet, basename='admin-messages')
router.register(r'hero-settings', AdminHeroSettingViewSet, basename='admin-hero-settings')
router.register(r'chat-sessions', ChatSessionViewSet, basename='admin-chat-sessions')
router.register(r'chat-messages', ChatMessageViewSet, basename='admin-chat-messages')
router.register(r'activity', ActivityLogViewSet, basename='admin-activity')
router.register(r'staff-roles', StaffRoleViewSet, basename='admin-staff-roles')
router.register(r'staff-members', StaffMemberViewSet, basename='admin-staff-members')


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='admin-stats'),
    path('reports/', ReportsView.as_view(), name='admin-reports'),
    path('upload/', UploadView.as_view(), name='admin-upload'),
    path('upload-model/', UploadModelView.as_view(), name='admin-upload-model'),
]
