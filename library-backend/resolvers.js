const { GraphQLError } = require('graphql');
const Book = require('./models/book');
const Author = require('./models/author');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

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
            });
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
    me: (root, args, context) => context.currentUser,
  },
  Author: {
    bookCount: async (root) => Book.countDocuments({ author: root._id }),
  },
  Mutation: {
    
    addBook: async (root, args, context) => {
      const foundBook = await Book.findOne({ title: args.title })
      const foundAuthor = await Author.findOne({ name: args.author})
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('user not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED'
          }
        })
      }

      if (foundBook) {
        throw new GraphQLError('Book already exists', {
          extensions: {
              code: "BAD_REQUEST",
              invalidArgs: args.title,
          }
        }
       ) 
      }

      if (!foundAuthor) {
        const author = new Author(({name: args.author}))
        try {
          await author.save()
        } catch (error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
                code: "BAD_REQUEST_INPUT",
                invalidArgs: args.author,
                error
            }
          }
         ) 
        }
      }
      
      const newAutor = await Author.findOne({ name: args.author})

      const book = new Book({ ...args, author: newAutor })

      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
              code: "BAD_REQUEST",
              invalidArgs: args,
              error
          }
        }
       ) 
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book }) 
      return book
    },
    editAuthor: async (root, args, context) => {
      try {
        const currentUser = context.currentUser;

        if (!currentUser) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
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

      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre });

      try {
        return await user.save();
      } catch (error) {
        throw new GraphQLError('Creating the user failed', {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args.username, error }
        });
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secret') {
        throw new GraphQLError('Wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
        subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    }
  }
};

module.exports = resolvers