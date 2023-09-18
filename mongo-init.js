use shopify;
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
);
db.createCollection("test"); //MongoDB creates the database when you first store data in that database