import * as aws from 'aws-sdk';
import { S3 } from 'aws-sdk';

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadToS3(profilePic) {
  const s3 = new S3();
  console.log(`S3 Credentials: ${JSON.stringify(s3.config)}`);
  const filePath = `foresight_test/${Date.now()}_${profilePic.originalname}`;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filePath,
    Body: profilePic.buffer,
    ACL: 'public-read',
  };
  try {
    const s3Data = await s3.upload(uploadParams).promise();
    return s3Data;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to upload file to S3: ' + error.message);
  }
}

export default uploadToS3;
