
import {createTestingConnections} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post-Succeed";

describe("mssql -> add column to existing table", () => {
    let connection: Connection;

    beforeEach(async () => {
        connection = (await createTestingConnections({
            enabledDrivers: ["mssql"],
            entities: [__dirname + "/entity/Post{.js,.ts}"]
        }))[0];

        await connection.synchronize(true);
        await connection.getRepository("Post").insert({title: "test"});
        await connection.close();
    });

    afterEach(async () => {
        await connection.close();
    });

    it("should fail to add column", async () => {
        connection = (await createTestingConnections({
            enabledDrivers: ["mssql"],
            entities: [__dirname + "/entity/Post-Fail{.js,.ts}"]
        }))[0];

        await connection.synchronize().should.eventually.rejectedWith("Error: ALTER TABLE only allows columns to be added that can contain nulls, or have a DEFAULT definition specified, or the column being added is an identity or timestamp column, or alternatively if none of the previous conditions are satisfied the table must be empty to allow addition of this column. Column 'addedField' cannot be added to non-empty table 'post' because it does not satisfy these conditions.");
    });

    it("should succeed to add column", async () => {
        connection = (await createTestingConnections({
            enabledDrivers: ["mssql"],
            entities: [__dirname + "/entity/Post-Succeed{.js,.ts}"]
        }))[0];

        await connection.synchronize().should.eventually.eq(undefined);
        const post = await connection.getRepository<Post>("Post").findOne();
        if (!post) {
            throw "Post should exist";
        }
        post.should.exist;
        post.id.should.be.eq(1);
        post.title.should.be.eq("test");
        post.addedField.should.be.eq("default value");
    });
});