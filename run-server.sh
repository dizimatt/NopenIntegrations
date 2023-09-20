#!/bin/sh

nginx
cd /code/shopify-dashboard
rm /code/install-complete
touch /code/install-wip
npm install
npm run prod


cd /code/shopify-backend
npm install
rm /code/install-wip
touch /code/install-complete
npm run prod
tail -f /dev/null