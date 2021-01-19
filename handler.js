const { S3, DynamoDB } = require("aws-sdk");

module.exports.requestUploadURL = (event, context, callback) => {
  const s3 = new S3();
  const docClient = new DynamoDB.DocumentClient();

  const params = JSON.parse(event.body);

  const s3Params = {
    Bucket: "spritey-upload",
    Key: params.name,
    ContentType: params.type,
    ACL: "public-read",
  };

  const uploadURL = s3.getSignedUrl("putObject", s3Params);

  const item = {
    s3Path: uploadURL,
    tag: params.tag,
  };

  docClient.put({
    TableName: "sprites",
    Item: item,
  });

  docClient.put({
    TableName: "tags",
    Item: {
      tag: params.tag,
    },
  });

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

module.exports.getSprites = async (event, context, callback) => {
  const docClient = new DynamoDB.DocumentClient();

  const params = JSON.parse(event.body);

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
