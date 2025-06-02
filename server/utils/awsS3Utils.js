require("dotenv").config();
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { default: axios } = require("axios");

// eslint-disable-next-line no-undef
const bucketRegion = process.env.AWS_REGION;
// eslint-disable-next-line no-undef
const bucketName = process.env.AWS_BUCKET_NAME;

const s3Client = new S3Client({ region: bucketRegion });

const generateSignedURL = async (orgFile) => {
    try {

        // const imageId = uuidv4();
        const imageId = "atara";

        const filename = `${orgFile?.originalname?.split(".")[0]}-${imageId}.${orgFile?.originalname?.split(".").pop()}`;

        const params = {
            Bucket: bucketName,
            Key: filename,
            ContentType: orgFile?.mimetype
        };
        const command = new PutObjectCommand(params);
        const signedURL = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
        const resObj = {
            signedURL: signedURL,
            filename: filename
        };
        return resObj;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log("Error generating signed url", err);
    }
};

const uploadFileToS3 = async (presignedUrl, file) => {
    try {
        const headers = {
            "Content-Type": "multipart/form-data"
        };
        return await axios.put(presignedUrl, file, { headers: headers });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log("Error uploading file to S3", err);
    }
};

const getFileFromS3 = async (key) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: key,
        };

        const command = new GetObjectCommand(params);
        return await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log("Error getting file from S3", err);
    }
};

const listS3Files = async () => {
    try {
        // eslint-disable-next-line no-console
        console.log(`Listing objects in bucket: ${bucketName}`, bucketRegion);

        let continuationToken;
        let allObjects = [];

        do {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            });

            const response = await s3Client.send(command);
            // eslint-disable-next-line no-console
            console.log("response", response);

            if (response.Contents && response.Contents.length > 0) {
                allObjects = [...allObjects, ...response.Contents];
                response.Contents.forEach((object) => {
                    // eslint-disable-next-line no-console
                    console.log(`- ${object.Key} (${object.Size} bytes)`);
                });
            }

            continuationToken = response.NextContinuationToken;
            // eslint-disable-next-line no-console
            console.log("continuationToken", continuationToken);
        } while (continuationToken);
        // eslint-disable-next-line no-console
        console.log(`Total objects found: ${allObjects.length}`);
        return allObjects;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error listing objects:", error);
    }
};

module.exports = {
    listS3Files,
    generateSignedURL,
    uploadFileToS3,
    getFileFromS3
};