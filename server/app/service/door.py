def set_door_status(db, door_name, status):
    try:
        db.child("status").child(door_name).set({"isOpen": status})
        return True
    except Exception as e:
        print(f"Door status retrieval error: {e}")
        return False
def get_door_status(db, door_name):
    try:
        return db.child("status").child(door_name).get()
    except Exception as e:
        print(f"Door status retrieval error: {e}")
        return None