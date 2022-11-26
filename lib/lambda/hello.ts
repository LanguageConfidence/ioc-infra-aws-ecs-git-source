exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return "Hi this is Bac apigw endpoint";
};
              