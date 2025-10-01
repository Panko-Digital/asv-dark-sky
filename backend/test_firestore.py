#!/usr/bin/env python3
"""
Test script to verify Firebase Firestore connection
"""
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': 'popkorn-472305',
    })

# Get Firestore client
db = firestore.client()

print("✅ Firebase Admin SDK initialized successfully!")
print(f"📊 Project ID: {firebase_admin.get_app().project_id}")
print(f"🗄️  Firestore client created: {db}")

# Try to access a collection (this will work even if the collection doesn't exist yet)
try:
    collections = list(db.collections())
    print(f"📁 Found {len(collections)} collection(s) in Firestore")
    for col in collections:
        print(f"   - {col.id}")
    
    if len(collections) == 0:
        print("   (No collections yet - this is normal for a new database)")
    
    print("\n✅ SUCCESS: Can connect to Firestore database!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nMake sure:")
    print("1. Firestore is enabled in Firebase Console")
    print("2. You're authenticated with gcloud: gcloud auth application-default login")
