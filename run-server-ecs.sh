#!/bin/sh
nginx
cd /code/shopify-dashboard
npm run prod
cd /code/shopify-backend
npm run dev
