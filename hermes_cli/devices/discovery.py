"""Small opt-in LAN announcements. Discovery records confer no trust or permissions."""
import json
import socket
import struct
import threading
import time

from .identity import private_address

GROUP, PORT = "239.255.77.91", 52319


class Discovery:
    def __init__(self, identity, port):
        self.identity, self.port = identity, port
        self.records = {}
        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        try:
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind(("", PORT))
            self.socket.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP,
                                   socket.inet_aton(GROUP) + socket.inet_aton("0.0.0.0"))
            self.socket.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, struct.pack("b", 1))
            self.socket.settimeout(1)
        except OSError:
            self.socket.close()
            raise
        self.thread = threading.Thread(target=self.run, daemon=True, name="hebri-device-discovery")
        self.thread.start()

    def run(self):
        next_send = 0
        while not self.stop_event.is_set():
            now = time.monotonic()
            if now >= next_send:
                data = {"protocol": "hebri-devices/1", "id": self.identity.id,
                        "name": self.identity.data["name"], "port": self.port}
                try:
                    self.socket.sendto(json.dumps(data).encode(), (GROUP, PORT))
                except OSError:
                    pass  # Manual pairing remains usable on networks blocking multicast.
                next_send = now + 10
            try:
                raw, (address, _) = self.socket.recvfrom(513)
                if len(raw) > 512:
                    continue
                private_address(address)
                data = json.loads(raw)
                if (data.get("protocol") != "hebri-devices/1" or data.get("id") == self.identity.id
                        or not isinstance(data.get("id"), str) or len(data["id"]) != 64
                        or any(c not in "0123456789abcdef" for c in data["id"])
                        or not isinstance(data.get("name"), str) or not 1 <= len(data["name"]) <= 64
                        or type(data.get("port")) is not int or not 1 <= data["port"] <= 65535):
                    continue
                with self.lock:
                    self.records = {key: value for key, value in self.records.items() if value["seen"] > now - 30}
                    if len(self.records) < 64 or data["id"] in self.records:
                        self.records[data["id"]] = {"id": data["id"], "name": data["name"],
                                                   "address": address, "port": data["port"], "seen": now}
            except (OSError, ValueError, TypeError, AttributeError):
                continue

    def snapshot(self):
        with self.lock:
            return [{k: v for k, v in row.items() if k != "seen"} for row in self.records.values()
                    if row["seen"] > time.monotonic() - 30]

    def close(self):
        self.stop_event.set()
        self.socket.close()
        self.thread.join(timeout=2)
