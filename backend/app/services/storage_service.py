import os
from minio import Minio
from minio.error import S3Error
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        minio_url = os.getenv("MINIO_URL", "http://minio:9000")
        # remove http:// or https:// for Minio client
        if minio_url.startswith("http://"):
            endpoint = minio_url.replace("http://", "")
            secure = False
        elif minio_url.startswith("https://"):
            endpoint = minio_url.replace("https://", "")
            secure = True
        else:
            endpoint = minio_url
            secure = False

        access_key = os.getenv("MINIO_ACCESS_KEY", "admin")
        secret_key = os.getenv("MINIO_SECRET_KEY", "admin123")
        self.bucket_name = "eoms-media"

        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )

        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                # Set public read policy so frontend can access images directly if needed
                policy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::'+self.bucket_name+'/*"]}]}'
                self.client.set_bucket_policy(self.bucket_name, policy)
        except Exception as e:
            logger.error(f"Failed to create MinIO bucket: {e}")

    def upload_file(self, file_data: bytes, file_name: str, content_type: str = "application/octet-stream") -> str:
        try:
            from io import BytesIO
            ext = file_name.split('.')[-1] if '.' in file_name else 'bin'
            unique_name = f"{uuid4().hex}.{ext}"
            
            data_stream = BytesIO(file_data)
            self.client.put_object(
                self.bucket_name,
                unique_name,
                data_stream,
                length=len(file_data),
                content_type=content_type
            )
            
            # Since bucket is public, we can just return the URL format
            endpoint = self.client._endpoint_url
            return f"{endpoint}/{self.bucket_name}/{unique_name}"
            
        except S3Error as e:
            logger.error(f"S3 Upload Error: {e}")
            raise Exception("Failed to upload file to storage")

storage_service = StorageService()
