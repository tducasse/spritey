import { S3, DynamoDB } from "aws-sdk";
import { nanoid } from "nanoid";

const headers = {
  "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
};

const getCurrentUser = (event) => {
  return (
    ((event.requestContext || {}).identity || {}).cognitoIdentityId || false
  );
};

export const requestUploadURL = async (event) => {
  const s3 = new S3();
  const docClient = new DynamoDB.DocumentClient();

  const params = JSON.parse(event.body);

  const s3Params = {
    Bucket: "spritey-upload",
    Key: `${params.tag}_${nanoid()}`,
    ContentType: params.type,
    ACL: "public-read",
  };

  const uploadURL = s3.getSignedUrl("putObject", s3Params);

  const item = {
    s3_path: uploadURL.split("?")[0],
    tag: params.tag,
    height: 32,
    width: 32,
    fps: 12,
    frames: 2,
    scale: 6,
  };

  await docClient
    .put({
      TableName: "sprites",
      Item: item,
    })
    .promise();

  await docClient
    .put({
      TableName: "tags",
      Item: {
        tag: params.tag,
      },
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ uploadURL }),
  };
};

export const getTags = async (event) => {
  const docClient = new DynamoDB.DocumentClient();

  const queryParams = {
    TableName: "tags",
  };

  const data = await docClient.scan(queryParams).promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ data }),
  };
};

export const getChallenges = async (event) => {
  const docClient = new DynamoDB.DocumentClient();

  const queryParams = {
    TableName: "challenges",
  };

  const data = await docClient.scan(queryParams).promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ data }),
  };
};

export const getSprites = async (event) => {
  const docClient = new DynamoDB.DocumentClient();

  const params = event.pathParameters;

  const queryParams = {
    TableName: "sprites",
    ExpressionAttributeNames: { "#tag": "tag" },
    KeyConditionExpression: "#tag = :tag",
    ExpressionAttributeValues: { ":tag": params.tag },
  };

  const data = await docClient.query(queryParams).promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ data }),
  };
};

export const updateSettings = async (event) => {
  const docClient = new DynamoDB.DocumentClient();

  const params = JSON.parse(event.body);

  console.log(params);

  const queryParams = {
    TableName: "sprites",
    Key: { tag: params.tag, s3_path: params.src },
    UpdateExpression: `set fps = :newfps, width = :newwidth, height = :newheight, frames = :newframes,  scale = :newscale`,
    ExpressionAttributeValues: {
      ":newfps": params.fps,
      ":newwidth": params.width,
      ":newheight": params.height,
      ":newframes": params.frames,
      ":newscale": params.scale,
    },
  };

  await docClient.update(queryParams).promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ updated: true }),
  };
};

export const testAuth = async () => {
  return {
    statusCode: 200,
    body: "OK",
  };
};
