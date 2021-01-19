"use strict";

var S3 = require("aws-sdk");

module.exports.requestUploadURL = (event, context, callback) => {
  var s3 = new S3();
  var params = JSON.parse(event.body);

  var s3Params = {
    Bucket: "slsupload",
    Key: params.name,
    ContentType: params.type,
    ACL: "public-read",
  };

  var uploadURL = s3.getSignedUrl("putObject", s3Params);

  callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://spritey.tducasse.com",
    },
    body: JSON.stringify({ uploadURL: uploadURL }),
  });
};
