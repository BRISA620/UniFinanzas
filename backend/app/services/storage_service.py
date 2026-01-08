import os
import uuid
from datetime import datetime
from flask import current_app
from werkzeug.utils import secure_filename

from app.models import Attachment


class StorageService:
    """Service for handling file storage (local or S3)"""

    def __init__(self):
        self.use_s3 = False  # Set to True for S3 in production

    def upload_attachment(self, file, expense):
        """Upload attachment for an expense"""
        if not file or not file.filename:
            raise ValueError("No file provided")

        # Secure the filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else ''

        # Check allowed extensions
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'pdf'})
        if file_extension not in allowed_extensions:
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")

        # Determine file type
        if file_extension in ['png', 'jpg', 'jpeg', 'gif']:
            file_type = 'image'
        elif file_extension == 'pdf':
            file_type = 'pdf'
        else:
            file_type = 'other'

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        # Get file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        # Check max file size (16MB default)
        max_size = current_app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)
        if file_size > max_size:
            raise ValueError(f"File too large. Maximum size is {max_size / (1024 * 1024):.1f}MB")

        # Upload to storage
        if self.use_s3:
            storage_path = self._upload_to_s3(file, unique_filename, expense.user_id)
            storage_url = self._get_s3_url(storage_path)
        else:
            storage_path = self._upload_local(file, unique_filename, expense.user_id)
            storage_url = f"/uploads/{expense.user_id}/{unique_filename}"

        # Create attachment record
        attachment = Attachment(
            expense_id=expense.id,
            file_name=original_filename,
            file_type=file_type,
            mime_type=file.content_type or 'application/octet-stream',
            file_size=file_size,
            storage_path=storage_path,
            storage_url=storage_url
        )

        return attachment

    def _upload_local(self, file, filename, user_id):
        """Upload file to local storage"""
        upload_folder = current_app.config.get('UPLOAD_FOLDER', '/tmp/unifinanzas/uploads')
        user_folder = os.path.join(upload_folder, str(user_id))

        # Create directory if it doesn't exist
        os.makedirs(user_folder, exist_ok=True)

        file_path = os.path.join(user_folder, filename)
        file.save(file_path)

        return file_path

    def _upload_to_s3(self, file, filename, user_id):
        """Upload file to S3-compatible storage"""
        try:
            import boto3
            from botocore.client import Config

            s3_client = boto3.client(
                's3',
                endpoint_url=current_app.config.get('S3_ENDPOINT'),
                aws_access_key_id=current_app.config.get('S3_ACCESS_KEY'),
                aws_secret_access_key=current_app.config.get('S3_SECRET_KEY'),
                region_name=current_app.config.get('S3_REGION'),
                config=Config(signature_version='s3v4')
            )

            bucket = current_app.config.get('S3_BUCKET')
            key = f"attachments/{user_id}/{filename}"

            s3_client.upload_fileobj(file, bucket, key)

            return key

        except Exception as e:
            current_app.logger.error(f"S3 upload error: {e}")
            raise

    def _get_s3_url(self, key):
        """Get presigned URL for S3 object"""
        try:
            import boto3
            from botocore.client import Config

            s3_client = boto3.client(
                's3',
                endpoint_url=current_app.config.get('S3_ENDPOINT'),
                aws_access_key_id=current_app.config.get('S3_ACCESS_KEY'),
                aws_secret_access_key=current_app.config.get('S3_SECRET_KEY'),
                region_name=current_app.config.get('S3_REGION'),
                config=Config(signature_version='s3v4')
            )

            bucket = current_app.config.get('S3_BUCKET')

            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=3600  # 1 hour
            )

            return url

        except Exception as e:
            current_app.logger.error(f"S3 URL generation error: {e}")
            return None

    def delete_attachment(self, attachment):
        """Delete attachment from storage"""
        if self.use_s3:
            self._delete_from_s3(attachment.storage_path)
        else:
            self._delete_local(attachment.storage_path)

    def _delete_local(self, file_path):
        """Delete file from local storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            current_app.logger.error(f"Local file deletion error: {e}")

    def _delete_from_s3(self, key):
        """Delete file from S3"""
        try:
            import boto3
            from botocore.client import Config

            s3_client = boto3.client(
                's3',
                endpoint_url=current_app.config.get('S3_ENDPOINT'),
                aws_access_key_id=current_app.config.get('S3_ACCESS_KEY'),
                aws_secret_access_key=current_app.config.get('S3_SECRET_KEY'),
                region_name=current_app.config.get('S3_REGION'),
                config=Config(signature_version='s3v4')
            )

            bucket = current_app.config.get('S3_BUCKET')
            s3_client.delete_object(Bucket=bucket, Key=key)

        except Exception as e:
            current_app.logger.error(f"S3 deletion error: {e}")
