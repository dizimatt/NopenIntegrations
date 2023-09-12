#!/bin/sh

nginx
cd /code/shopify-dashboard
rm install-complete
touch install-wip
npm install
npm run prod


cd /code/shopify-backend
npm install
rm install-wip
touch install-complete
npm run dev
