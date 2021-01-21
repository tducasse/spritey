const { S3, DynamoDB } = require("aws-sdk");
const { nanoid } = require("nanoid");

module.exports.requestUploadURL = async (event, context, callback) => {
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

  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ uploadURL }),
  });
};

module.exports.getTags = async (event, context, callback) => {
  const docClient = new DynamoDB.DocumentClient();

  const queryParams = {
    TableName: "tags",
  };

  const data = await docClient.scan(queryParams).promise();
  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ data }),
  });
};

module.exports.getChallenges = async (event, context, callback) => {
  const docClient = new DynamoDB.DocumentClient();

  const queryParams = {
    TableName: "challenges",
  };

  const data = await docClient.scan(queryParams).promise();
  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ data }),
  });
};

module.exports.getSprites = async (event, context, callback) => {
  const docClient = new DynamoDB.DocumentClient();

  const params = event.pathParameters;

  const queryParams = {
    TableName: "sprites",
    ExpressionAttributeNames: { "#tag": "tag" },
    KeyConditionExpression: "#tag = :tag",
    ExpressionAttributeValues: { ":tag": params.tag },
  };

  const data = await docClient.query(queryParams).promise();

  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ data }),
  });
};

module.exports.updateSettings = async (event, context, callback) => {
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

  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ updated: true }),
  });
};
