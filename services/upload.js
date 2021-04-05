const aws = require('aws-sdk');

aws.config.update({
  secretAccessKey: process.env.AWS_SECRETKEY,
  accessKeyId: process.env.AWS_ACCESSKEY,
  region: process.env.AWS_REGION_NAME
});

const s3 = new aws.S3();

module.exports = {
  uploadFile: async function(bufferData, asinId) {
    const params = {
      ACL: 'public-read',
      Body: Buffer.from(bufferData),
      Bucket: process.env.AWS_BUCKET_NAME,
      ContentType: "application/pdf",
      ContentDisposition: 'inline',
      Key: `${process.env.AWS_DIRECTORY_PATH}/${asinId}.pdf`,
    }

    let data = await s3.upload(params).promise();
    return data;
  }
}