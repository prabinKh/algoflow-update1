import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from account.models import MyUser

def create_users():
    users_to_create = [
        {"email": "staff1@gmail.com", "password": "password123", "first_name": "Staff", "last_name": "One", "is_staff": True},
        {"email": "staff2@gmail.com", "password": "password123", "first_name": "Staff", "last_name": "Two", "is_staff": True},
        {"email": "customer1@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "One", "is_staff": False},
        {"email": "customer2@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "Two", "is_staff": False},
        {"email": "customer3@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "Three", "is_staff": False},
    ]

    for user_data in users_to_create:
        email = user_data["email"]
        if not MyUser.objects.filter(email=email).exists():
            user = MyUser.objects.create_user(
                email=email,
                password=user_data["password"],
                name=f"{user_data['first_name']} {user_data['last_name']}"
            )
            user.is_staff = user_data["is_staff"]
            user.save()
            print(f"Created user: {email} (Staff: {user.is_staff})")
        else:
            print(f"User already exists: {email}")

if __name__ == "__main__":
    create_users()
