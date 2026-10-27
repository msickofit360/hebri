"""Device identity and encrypted trust records. The desktop owns the wrapping key."""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
import ssl
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography import x509
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID


class DeviceError(ValueError):
    """Public, credential-free error code."""


def atomic_write(path: Path, value: bytes) -> None:
    from hermes_constants import assert_named_profile_home_live
    assert_named_profile_home_live(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".device-")
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(value)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def fingerprint(cert: str) -> str:
    if not isinstance(cert, str) or len(cert) > 4096:
        raise DeviceError("invalid_identity")
    try:
        return hashlib.sha256(ssl.PEM_cert_to_DER_cert(cert)).hexdigest()
    except (ValueError, TypeError):
        raise DeviceError("invalid_identity") from None


def private_address(value: str) -> str:
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        raise DeviceError("private_ip_required") from None
    # Literal addresses only: no DNS rebinding, redirects, URLs, or cloud metadata.
    networks = ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.64.0.0/10", "127.0.0.0/8")
    if address.version != 4 or not any(address in ipaddress.ip_network(network) for network in networks):
        raise DeviceError("private_ip_required")
    if address.is_unspecified or address.is_multicast or address.is_link_local or str(address) == "255.255.255.255":
        raise DeviceError("private_ip_required")
    return str(address)


class Identity:
    def __init__(self, home: Path, key: str):
        try:
            self.box = Fernet(key.encode("ascii"))
        except (ValueError, UnicodeError):
            raise DeviceError("secure_storage_required") from None
        self.directory = home / "devices"
        self.path = self.directory / "trust.enc"
        if self.path.exists():
            try:
                self.data = json.loads(self.box.decrypt(self.path.read_bytes()))
            except Exception:
                raise DeviceError("device_identity_locked") from None
        else:
            private = ec.generate_private_key(ec.SECP256R1())
            name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Hebri device")])
            now = datetime.now(timezone.utc)
            certificate = (x509.CertificateBuilder().subject_name(name).issuer_name(name)
                           .public_key(private.public_key()).serial_number(x509.random_serial_number())
                           .not_valid_before(now - timedelta(minutes=5)).not_valid_after(now + timedelta(days=3650))
                           .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
                           .sign(private, hashes.SHA256()))
            self.data = {"version": 1, "name": "Hebri", "enabled": False, "models": [],
                         "peers": {}, "cert": certificate.public_bytes(serialization.Encoding.PEM).decode(),
                         "key": private.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                             serialization.BestAvailableEncryption(key.encode())).decode()}
            self.save()
        self.password = key
        self.cert = self.data["cert"]
        self.id = fingerprint(self.cert)

    def save(self):
        atomic_write(self.path, self.box.encrypt(json.dumps(self.data).encode()))

    def server_context(self) -> ssl.SSLContext:
        # OpenSSL needs files; only the encrypted private key is ever written.
        cert_path, key_path = self.directory / "certificate.pem", self.directory / "private-key.enc.pem"
        atomic_write(cert_path, self.cert.encode())
        atomic_write(key_path, self.data["key"].encode())
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.load_cert_chain(cert_path, key_path, self.password)
        return context
