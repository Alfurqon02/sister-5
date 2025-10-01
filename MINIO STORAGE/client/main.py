from minio import Minio
from minio.error import S3Error
import io
import os

client = Minio(
    os.getenv("MINIO_ENDPOINT", "localhost:9000"),
    access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
    secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin123"),
    secure=os.getenv("MINIO_USE_SSL", "false").lower() == "true"
)

bucket = "my-bucket-demo"
obj_name = "hello.txt"
content = b"Hello from MinIO on Docker (Windows)!"

try:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        print("Bucket created:", bucket)
    else:
        print("Bucket already exists:", bucket)

    client.put_object(bucket, obj_name, io.BytesIO(content), length=len(content))
    print("Uploaded object:", obj_name)

    response = client.get_object(bucket, obj_name)
    data = response.read()
    response.close()
    response.release_conn()
    print("Downloaded object content:", data.decode())

    new_content = b"Updated content!"
    client.put_object(bucket, obj_name, io.BytesIO(new_content), length=len(new_content))
    print("Overwrote object:", obj_name)

    r2 = client.get_object(bucket, obj_name)
    print("Updated content:", r2.read().decode())
    r2.close()
    r2.release_conn()

    client.remove_object(bucket, obj_name)
    print("Deleted object:", obj_name)

    client.remove_bucket(bucket)
    print("Removed bucket:", bucket)

except S3Error as err:
    print("MinIO error:", err)
