# NopenIntegrations

  definitive steps:
   - launch docker desktop first - otherwise containers will be launched into root space! too annoying!
   - $ ngrok http 80 --host-header=rewrite - take note if https:// host address
   - top-level of project, $ docker build up --build -d
   - wait for /install-complete file to appear in the project root
   - fix up the broken dependancies (haven't yet worked out how to fix this on a perm. basis)
    - at root of project - edit : /shopify-dashboard/node_modules/react-scripts/config/webpack.config.js
    you might want to adjust the permissions to readwrite before doing this ( $ sudo chmod -R o+rwx shopify-dashboard/node_modules )
    - find "resolve: {" - go to the end of the construct...
    - add following, and save:
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify')     
      }
   - $ docker exec -it nopenintcustomproducts-nodejs-1 sh
   - $ pm2 restart start
   - new cmdline - $ docker exec -it <project>-mongo-1 bash
   - mongosh mongodb://root:n0p3n1nt@mongo:27017 - take the creds from the docker-compose.yml file 
   - do following in mongosh prompt:
      use shopify
      db.createUser(
          {
              user: "nopenintegrations",
              pwd: "n0p3n1nt",
              roles: [
                  {
                      role: "readWrite",
                      db: "shopify"
                  }
              ]
          }
      )
      exit
   - $ exit
   - $ docker exec -it nopenintcustomproducts-nodejs-1 sh
   - $ cd ../shopify-backend/
   - $ pm2 stop server
   - $ npm run dev

   - test the webserver paths at :
    https://{uuid}.ngrok-free.app/
    https://{uuid}.ngrok-free.app/api/products
    https://{uuid}/api/shopify/products


setup for shopify app:
 - create app in shopify - usual methods - and take note of "Client ID" and "Client Secret", you will use this in the next
 section
 - in shopify app settings ensure you have the app-url set to https://{uuid}.ngrok-free.app and redirection url set to https://{uuid}.ngrok-free.app/auth/callback
 - new cmdline - $ docker exec -it <project>-mongo-1 bash
 - mongosh mongodb://nopenintegrations:n0p3n1nt@mongo:27017/shopify - take the creds from the mongodb setup script you did earlier 
 - do following in mongosh prompt:
    db.shopifyApp.insertOne({
      APP_NAME: '[shopify app name]', (ensure .env file APP_NAME matches this)
      SHOPIFY_API_KEY: '[client id]',
      SHOPIFY_API_SECRET_KEY: 'client secret',
      SHOPIFY_SCOPES: 'read_products, write_products', (keep as is.. or modify accordingly)
      SHOPIFY_HOSTNAME: '[hostname of the runnign app - without https:// ]' (ensure all app urls in the admin are in sync with this)
    })
 - go back to the backend server.js deamon, and restart it (ctrl-c, repeat last command) 
 - browse to https://{uuid}.ngrok-free.app/auth?shop={yourshop}.myshopify.com
   you shoudl see directiosn to install onto your shopify site. if it doens't then you need to review the error, and above steps
 - test out the new app by browsing to :
   https://{uuid}.ngrok-free.app/api/shopify/products?shop={yourshop}.myshopify.com

all done!
