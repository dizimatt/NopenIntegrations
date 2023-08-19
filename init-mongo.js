db.createUser(
    {
        user: "openresourcing",
        pwd: "*****",
        roles: [
            {
                role: "readWrite",
                db: "shopify"
            }
        ]
    }
);
db.createCollection("test"); //MongoDB creates the database when you first store data in that database