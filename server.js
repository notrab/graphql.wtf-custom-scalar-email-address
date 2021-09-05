const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { Kind, GraphQLError, GraphQLScalarType } = require("graphql");

const EMAIL_ADDRESS_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const validate = (value) => {
  if (typeof value !== "string") {
    throw new GraphQLError(`Value is not string: ${value}`);
  }

  if (!EMAIL_ADDRESS_REGEX.test(value)) {
    throw new GraphQLError(`Value is not a valid email address: ${value}`);
  }

  return value;
};

const parseLiteral = (ast) => {
  if (ast.kind !== Kind.STRING) {
    throw new GraphQLError(
      `Query error: Can only parse strings as email addresses but got a: ${ast.kind}`
    );
  }

  return validate(ast.value);
};

const GraphQLEmailAddressConfig = {
  name: "EmailAddress",
  description:
    "A field whose value conforms to the standard internet email address format",
  serialize: validate,
  parseValue: validate,
  parseLiteral: parseLiteral,
};

const GraphQLEmailAddress = new GraphQLScalarType(GraphQLEmailAddressConfig);

const typeDefs = `
  scalar EmailAddress

  type Query {
    users: [User]
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
  }

  type User {
    name: String
    email: String
  }

  input CreateUserInput {
    name: String!
    email: EmailAddress!
  }
`;

const resolvers = {
  Query: {
    users: () => [{ name: "John Doe" }],
  },
  Mutation: {
    createUser: (_, { input }) => input,
  },
  EmailAddress: GraphQLEmailAddress,
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(4000, () => {
  console.log(`Server listening on http://localhost:4000`);
});
