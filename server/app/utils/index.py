import os
from flask import current_app
import random
import string
def generate_random_number(length=6):
    return ''.join(random.choices('0123456789', k=length))
def store_image(file,license_plate):
    file_name = file.filename
    random_number = generate_random_number()
    new_file_name = random_number + file_name
    save_path = os.path.join("app/static/images/",new_file_name)
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    file.save(save_path)
    return "/images/"+new_file_name