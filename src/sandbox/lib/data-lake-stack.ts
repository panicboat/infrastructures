import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';

export class DataLakeStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config();
    this.createDataLake(`source`, false);
    this.createDataLake(`raw`, true);
    this.createDataLake(`intermediate`, true);
    this.createDataLake(`structuralization`, true);
    this.createDataLake(`finalize`, true);
    this.createDataLake(`outputs`, false);
  }

  private createDataLake(layer: string, isDatabase: boolean) {
    const bucket = new s3.Bucket(this, `DataLake${layer}Bucket`, {
      bucketName: `${this.account}-data-lake-${layer}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    if (isDatabase) {
      new glue.Database(this, `DataLake${layer}Database`, {
        databaseName: `data_lake_${layer}`,
        locationUri: `s3://${bucket.bucketName}`
      });
    }
  }
}
