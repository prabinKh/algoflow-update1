from account.models import User, Company
from efrontend.models import Product, Category, Brand
from django.utils.text import slugify
import random

def seed_platform():
    # 1. Create Super Admin
    super_admin_email = "superadmin@algoflow.com"
    if not User.objects.filter(email=super_admin_email).exists():
        User.objects.create_superuser(
            email=super_admin_email,
            username="superadmin",
            password="password123",
            role='SUPER_ADMIN'
        )
        print(f"Created Super Admin: {super_admin_email}")
    else:
        print(f"Super Admin {super_admin_email} already exists.")

    # 2. Create 5 Companies
    companies_data = [
        {"name": "Apple Store", "slug": "apple", "theme_color": "#000000", "ip": "127.0.0.1", "phone": "+1-800-MY-APPLE", "address": "One Apple Park Way, Cupertino, CA"},
        {"name": "Samsung Plaza", "slug": "samsung", "theme_color": "#034ea2", "ip": "127.0.0.2", "phone": "+82-2-2255-0114", "address": "Samsung-ro, Yeongtong-gu, Suwon, South Korea"},
        {"name": "Sony Center", "slug": "sony", "theme_color": "#000000", "ip": "127.0.0.3", "phone": "+81-3-6748-2111", "address": "Konan, Minato-ku, Tokyo, Japan"},
        {"name": "Dell Technologies", "slug": "dell", "theme_color": "#007db8", "ip": "127.0.0.4", "phone": "+1-800-433-2392", "address": "Dell Way, Round Rock, TX"},
        {"name": "Logitech Hub", "slug": "logitech", "theme_color": "#00b2ef", "ip": "127.0.0.5", "phone": "+41-21-863-51-11", "address": "EPFL Innovation Park, Lausanne, Switzerland"},
    ]

    for c_data in companies_data:
        company, created = Company.objects.get_or_create(
            slug=c_data['slug'],
            defaults={
                'name': c_data['name'],
                'username': c_data['ip'],
                'email': f"admin@{c_data['slug']}.com",
                'theme_color': c_data['theme_color'],
                'phone': c_data['phone'],
                'address': c_data['address'],
                'is_active': True
            }
        )
        if not created:
            # Update data if already exists
            company.username = c_data['ip']
            company.phone = c_data['phone']
            company.address = c_data['address']
            company.save()
        
        print(f"Processing Company: {company.name} (ID: {company.username})")
        
        # Create a Company Admin for this company
        User.objects.get_or_create(
            email=f"admin@{c_data['slug']}.com",
            defaults={
                'username': f"{c_data['slug']}_admin",
                'password': 'password123',
                'role': 'COMPANY_ADMIN',
                'company': company
            }
        )

        # 3. Create a Category for this company
        category, _ = Category.objects.get_or_create(
            slug=f"electronics-{c_data['slug']}",
            company=company,
            defaults={'name': 'Electronics', 'icon': '💻'}
        )

        # 4. Create a Brand for this company
        brand, _ = Brand.objects.get_or_create(
            slug=c_data['slug'],
            company=company,
            defaults={'name': c_data['name']}
        )

        # 5. Add 5 Products to every company
        existing_products_count = Product.objects.filter(company=company).count()
        if existing_products_count < 5:
            for i in range(1, 6):
                name = f"{c_data['name']} Product {i}"
                Product.objects.create(
                    company=company,
                    category=category,
                    brand=brand,
                    name=name,
                    slug=slugify(f"{c_data['slug']}-{i}-{random.randint(100, 999)}"),
                    price=random.randint(500, 5000),
                    description=f"High quality product from {c_data['name']}",
                    image=f"https://picsum.photos/seed/{c_data['slug']}{i}/400/300",
                    stock=random.randint(10, 100),
                    in_stock=True
                )
            print(f"Added 5 products to {company.name}")
        else:
            print(f"Company {company.name} already has {existing_products_count} products.")

if __name__ == "__main__":
    seed_platform()
