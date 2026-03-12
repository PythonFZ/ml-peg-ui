"""Storage abstraction layer for ml-peg-api.

Provides a StorageBackend protocol with two implementations:
- FilesystemBackend: reads from local data/ directory (local dev)
- MinioBackend: reads from MinIO S3-compatible storage (production)

Use create_storage() factory to get the appropriate backend based on env vars.
"""

import os
from datetime import timedelta
from pathlib import Path
from typing import Protocol, runtime_checkable

import json


@runtime_checkable
class StorageBackend(Protocol):
    """Protocol defining the storage interface for benchmark data."""

    def get_json(self, path: str) -> dict:
        """Read and parse a JSON object from the given path."""
        ...

    def get_bytes(self, path: str) -> bytes:
        """Read raw bytes from the given path.

        Raises FileNotFoundError if the object does not exist.
        """
        ...

    def list_keys(self, prefix: str) -> list[str]:
        """List all keys (files/dirs) under the given prefix."""
        ...

    def presigned_url(self, path: str) -> str:
        """Return a presigned URL for the given path (production only)."""
        ...

    def get_object_size(self, path: str) -> int:
        """Return the size in bytes of the object at the given path.

        Raises FileNotFoundError if the object does not exist.
        """
        ...


class FilesystemBackend:
    """Reads benchmark data from the local data/ directory.

    Used in local development when MINIO_ENDPOINT is not set.
    """

    def __init__(self, base_path: str = "data") -> None:
        self._base = Path(base_path)

    def get_json(self, path: str) -> dict:
        """Read and parse a JSON file from base_path/path."""
        full_path = self._base / path
        if not full_path.exists():
            raise FileNotFoundError(f"No such file: {full_path}")
        return json.loads(full_path.read_bytes())

    def get_bytes(self, path: str) -> bytes:
        """Read raw bytes from base_path/path.

        Raises FileNotFoundError if the file does not exist.
        """
        full_path = self._base / path
        if not full_path.exists():
            raise FileNotFoundError(f"No such file: {full_path}")
        return full_path.read_bytes()

    def list_keys(self, prefix: str) -> list[str]:
        """List all files and directories under base_path/prefix.

        Returns paths relative to the prefix directory.
        """
        target = self._base / prefix if prefix else self._base
        if not target.exists():
            return []
        return [item.name for item in sorted(target.iterdir())]

    def presigned_url(self, path: str) -> str:
        """Not available in filesystem mode."""
        raise NotImplementedError("Presigned URLs not available in filesystem mode")

    def get_object_size(self, path: str) -> int:
        """Return the file size in bytes for the given path.

        Raises FileNotFoundError if the file does not exist.
        """
        full_path = self._base / path
        if not full_path.exists():
            raise FileNotFoundError(f"No such file: {full_path}")
        return full_path.stat().st_size


class MinioBackend:
    """Reads benchmark data from a MinIO S3-compatible bucket.

    Used in production when MINIO_ENDPOINT is set.
    Reads configuration from environment variables:
    - MINIO_ENDPOINT: MinIO server endpoint (e.g. "minio.example.com")
    - MINIO_ACCESS_KEY: Access key for authentication
    - MINIO_SECRET_KEY: Secret key for authentication
    - MINIO_BUCKET: Bucket name
    - MINIO_PREFIX: Optional key prefix (default "")
    """

    def __init__(self) -> None:
        from minio import Minio  # type: ignore[import-untyped]

        endpoint = os.environ["MINIO_ENDPOINT"]
        access_key = os.environ.get("MINIO_ACCESS_KEY", "")
        secret_key = os.environ.get("MINIO_SECRET_KEY", "")
        secure = not endpoint.startswith("localhost") and not endpoint.startswith("127.")

        self.client = Minio(
            endpoint,
            access_key=access_key or None,
            secret_key=secret_key or None,
            secure=secure,
        )
        self.bucket = os.environ["MINIO_BUCKET"]
        self.prefix = os.environ.get("MINIO_PREFIX", "")

    def _key(self, path: str) -> str:
        """Build the full object key, prepending prefix if set."""
        if self.prefix:
            return f"{self.prefix}/{path}"
        return path

    def get_json(self, path: str) -> dict:
        """Fetch an object from MinIO and parse it as JSON."""
        response = self.client.get_object(self.bucket, self._key(path))
        try:
            return json.loads(response.read())
        finally:
            response.close()
            response.release_conn()

    def get_bytes(self, path: str) -> bytes:
        """Fetch raw bytes for an object from MinIO.

        Raises FileNotFoundError if the object does not exist.
        """
        from minio.error import S3Error  # type: ignore[import-untyped]

        try:
            response = self.client.get_object(self.bucket, self._key(path))
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()
        except S3Error as exc:
            if exc.code == "NoSuchKey":
                raise FileNotFoundError(f"No such key: {path}") from exc
            raise

    def list_keys(self, prefix: str) -> list[str]:
        """List object keys in the bucket under the given prefix.

        Returns basenames (last path segment) to match FilesystemBackend contract.
        Strips trailing slashes from directory entries.
        """
        full_prefix = self._key(prefix) if prefix else self.prefix
        if full_prefix and not full_prefix.endswith("/"):
            full_prefix += "/"
        objects = self.client.list_objects(
            self.bucket,
            prefix=full_prefix,
            recursive=False,
        )
        return [obj.object_name.rstrip("/").rsplit("/", 1)[-1] for obj in objects]

    def presigned_url(self, path: str, expires_hours: int = 1) -> str:
        """Return a presigned URL for the given object key."""
        return self.client.presigned_get_object(
            self.bucket,
            self._key(path),
            expires=timedelta(hours=expires_hours),
        )

    def get_object_size(self, path: str) -> int:
        """Return the size in bytes of the object at the given path.

        Raises FileNotFoundError if the object does not exist.
        """
        stat = self.client.stat_object(self.bucket, self._key(path))
        return stat.size


def create_storage() -> StorageBackend:
    """Factory function: returns MinioBackend if MINIO_ENDPOINT is set, else FilesystemBackend."""
    if os.environ.get("MINIO_ENDPOINT"):
        return MinioBackend()
    return FilesystemBackend()
