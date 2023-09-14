use shopify;
db.createUser(
    {
        user: "openresourcing",
        pwd: "D0z1n2ss",
        roles: [
            {
                role: "readWrite",
                db: "shopify"
            }
        ]
    }
);
db.createCollection("test"); //MongoDB creates the database when you first store data in that database