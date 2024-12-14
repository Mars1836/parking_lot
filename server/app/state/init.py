state = {
    'door1': {
        'isOpen': False,
    },
    'door2': {
        'isOpen': False,
    }
}
def init_db(db):
    db.child("status").child("door1").set({"isOpen": False})
    db.child("status").child("door2").set({"isOpen": False})
    db.child("lastScan").set({"imageSrc": ""})
    db.child("vehicles").set({})
    db.child("vehicle_last_action").set({})


