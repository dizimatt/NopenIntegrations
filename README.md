# NopenIntegrations
useful to remember: ngrok http 80 --host-header=rewrite

when registering an app - ensure you have the mongodb shopifyApp collection: (take creds from the app admin)
{
    _id: ObjectId("650c54329513927242f3c9e8"),
    APP_NAME: '[shopify app name]', (ensure .env file APP_NAME matches this)
    SHOPIFY_API_KEY: '[client id]',
    SHOPIFY_API_SECRET_KEY: 'client secret',
    SHOPIFY_SCOPES: 'read_products, write_products', (keep as is.. or modify accordingly)
    SHOPIFY_HOSTNAME: '[hostname of the runnign app ]' (ensure all app urls in the admin are in sync with this)
  }