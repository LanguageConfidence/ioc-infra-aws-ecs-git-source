import boto3
import logging

s3_client = boto3.client("s3")

def handler(event, context):
    bucket_name = event["Records"][0]["s3"]["bucket"]["name"]
    file_name = event["Records"][0]["s3"]["object"]["key"]
    resp = s3_client.get_object(Bucket=bucket_name,Key=file_name)
    logging.info((resp))
    data = resp['Body'].read()
    logging.info((data))
    return data