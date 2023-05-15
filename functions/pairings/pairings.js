const axios = require("axios");

exports.handler = async function (event, context) {
  console.log("Received event:", event);

  let url =
    "https://aquamarine-horse-60f550.netlify.app/.netlify/functions/create_pairs-background";

  console.log("Fetching background function");
  let result = await axios.post(url, {
    method: "POST",
  });

  console.log(result);

  return {
    statusCode: 200,
  };
};
