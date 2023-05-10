exports.handler = async function (event, context) {
  // current date as string

  // let url = "http://localhost:9000/.netlify/functions/send_messages-background";
  let url =
    "https://aquamarine-horse-60f550.netlify.app/.netlify/functions/test_message-background";

  console.log("Fetching background function");
  let result = await fetch(url, {
    method: "POST",
  });

  console.log(result);

  console.log("end");
  return {
    statusCode: 200,
  };
};
