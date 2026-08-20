import boto3
from botocore.exceptions import ClientError
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def ensure_bucket_exists(self) -> None:
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code == '404':
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            else:
                logger.error(f"Error checking bucket: {e}")
                raise

    def upload_file(self, file_data: bytes, key: str, content_type: str) -> str:
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=file_data,
            ContentType=content_type
        )
        return key

    def get_file_url(self, key: str, expires: int = 3600) -> str:
        return self.s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket_name, 'Key': key},
            ExpiresIn=expires
        )

    def download_file(self, key: str) -> bytes:
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
        return response['Body'].read()

    def delete_file(self, key: str) -> None:
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)

storage_service = StorageService()
