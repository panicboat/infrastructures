import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';

export class DataLakeStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config();
    this.createDataLake(`raw`);
    this.createDataLake(`intermediate`);
    this.createDataLake(`structuralization`);
  }

  private createDataLake(layer: string) {
    const bucket = new s3.Bucket(this, `DataLake${layer}Bucket`, {
      bucketName: `${this.account}-data-lake-${layer}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new glue.Database(this, `DataLake${layer}Database`, {
      databaseName: `data-lake-${layer}`,
      locationUri: `s3://${bucket.bucketName}`
    });
  }
}
