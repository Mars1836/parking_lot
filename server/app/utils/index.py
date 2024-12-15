import os
from flask import current_app
import random
import string
def generate_random_number(length=6):
    return ''.join(random.choices('0123456789', k=length))
def store_image(file,license_plate):
    file_name = file.filename
    save_path = ('/static/images/',generate_random_number() + file_name )
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    file.save(save_path)
    return save_path