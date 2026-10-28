"""One device service per profile; no state or grants cross home boundaries."""
import os
import threading

from hermes_constants import get_hermes_home, hermes_home_key

from .identity import DeviceError

_services = {}
_lock = threading.RLock()


def service():
    from .service import DeviceService
    key = os.environ.get("HEBRI_DEVICE_STORAGE_KEY", "")
    if not key:
        raise DeviceError("secure_storage_required")
    home = get_hermes_home()
    identity = hermes_home_key(home)
    with _lock:
        if identity not in _services:
            _services[identity] = DeviceService(home, key)
        return _services[identity]


def stop_all():
    with _lock:
        services = list(_services.values())
        _services.clear()
    for runtime in services:
        runtime.close()
