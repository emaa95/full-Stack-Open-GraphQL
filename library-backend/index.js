const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { default: gql } = require('graphql-tag')

const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const Book = require('./models/book')
const Author = require('./models/author')
const { GraphQLError } = require('graphql')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to...')

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String]!
  }
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook (
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ) : Book,
    editAuthor (
      name: String!
      setBornTo: Int! 
    ): Author
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      try {
      let books = await Book.find({}).populate('author');

      if (args.author) {
        const author = await Author.findOne({ name: args.author });
        if (author) {
          books = books.filter(book => book.author._id.equals(author._id));
        } else {
          throw new GraphQLError('Author not found', {
            extensions: { code: 'BAD_USER_INPUT' }
          });;
        }
      }

      if (args.genre) {
        books = books.filter(book => book.genres.includes(args.genre));
      } 


      return books;
    } catch (error) {
      throw new GraphQLError('Error fetching books: ' + error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
    },
    allAuthors: async () => Author.find({})
  },
  Author: {
    bookCount: async (root) => Book.countDocuments({ author: root._id }),
  },
  Mutation: {
    addBook: async (root, args) => {
      try {

        if (args.title.length < 3) {
          throw new GraphQLError('Book title must be at least 3 characters long', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        if (args.genres.length === 0) {
          throw new GraphQLError('At least one genre must be provided', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        if (args.published < 0) {
          throw new GraphQLError('Publication year must be a positive integer', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

      let author = await Author.findOne({ name: args.author });

      if (!author) {
        author = new Author({ name: args.author });
        await author.save();
      }

      const book = new Book({ ...args, author: author._id });

      await book.save();
      return book
      } catch (error) {
        throw new GraphQLError('Error adding book: ' + error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    editAuthor: async (root, args) => {
      try {
      
        if (args.name.length < 3) {
          throw new GraphQLError('Author name must be at least 3 characters long', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

      const author = await Author.findOne({ name: args.name });
      if (!author) {
        throw new GraphQLError('Author not found', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      author.born = args.setBornTo;
      await author.save();
      return author;
      } catch (error) {
        throw new GraphQLError('Error editing author: ' + error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }   
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})