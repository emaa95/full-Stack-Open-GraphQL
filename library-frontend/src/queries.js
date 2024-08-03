import { gql  } from '@apollo/client'

const BOOK_DETAILS = gql `
  fragment BookDetails on Book{
    title
    published
    genres
    author {
      name 
      born
    }
  }
`

export const ALL_AUTHORS = gql `
    query {
        allAuthors {
            name
            born
            bookCount
        }
    }
`

export const ALL_BOOKS = gql `
    query {
        allBooks {
            title
            published
            author{
                name
            }
            genres
        }
    }
`

export const CREATE_BOOK = gql `
    mutation createBook($title: String!, $published: Int!, $author: String!, $genres: [String]!) {
        addBook(title: $title, published: $published, author: $author, genres: $genres) {
            title
            author{
              name
            }
            published
            genres
        }
    }

`

export const EDIT_BORN = gql `
mutation editBornYear($name: String!, $setBornTo: Int!) {
  editAuthor(name: $name, setBornTo: $setBornTo) {
    name
    born
  }
}
`

export const LOGIN = gql `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const ME = gql `
  query {
  me {
    username
    favoriteGenre
  }
}
`

export const BOOKS_WITH_GENRE = gql `
  query getAllBooks($genre: String) {
    allBooks(genre: $genre) {
    title
    author {
      name
    }
    published
  }
  }
`

export const BOOK_ADDED = gql `
  subscription {
    bookAdded {
      ...BookDetails
    }
  }

  ${BOOK_DETAILS}
`