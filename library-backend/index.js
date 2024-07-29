const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { default: gql } = require('graphql-tag')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')


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

  type User {
  username: String!
  favoriteGenre: String!
  id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
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
    ): Author,
      createUser(
      username: String!
      favoriteGenre: String!
    ): User
      login(
      username: String!
      password: String!
    ): Token
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
    allAuthors: async () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Author: {
    bookCount: async (root) => Book.countDocuments({ author: root._id }),
  },
  Mutation: {
    addBook: async (root, args, context) => {
      try {
        
        const currentUser = context.currentUser

        if (!currentUser) {
          throw new GraphQLError('not authenticated', {
            extensions: {
              code: 'BAD_USER_INPUT',
            }
          })
        }
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
    editAuthor: async (root, args, context) => {
      try {
        
        const currentUser = context.currentUser

        if (!currentUser) {
          throw new GraphQLError('not authenticated', {
            extensions: {
              code: 'BAD_USER_INPUT',
            }
          })
        }
        
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
    },
    createUser: async (root, args) => {
      
      if (!args.favoriteGenre.trim()) {
        throw new GraphQLError('Favorite genre cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
      
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },   
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },   
  context: async ({ req, res }) => {    
    const auth = req ? req.headers.authorization : null    
    if (auth && auth.startsWith('Bearer ')) {      
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)      
      const currentUser = await User.findById(decodedToken.id)    
      return { currentUser } 
    }  
  },
  }).then(({ url }) => {
    console.log(`Server ready at ${url}`)
  })