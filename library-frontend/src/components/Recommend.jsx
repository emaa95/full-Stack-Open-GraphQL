import { useLazyQuery, useQuery } from "@apollo/client";
import { BOOKS_WITH_GENRE, ME } from "../queries";
import { useEffect, useState } from "react";

const Recommend = ({show}) => {
    
  const user = useQuery(ME);
  const [getFavoriteBooks, result] = useLazyQuery(BOOKS_WITH_GENRE)
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  
    useEffect(() => {
      if (result.data) {
        setFavoriteBooks(result.data.allBooks)
      }
    }, [result])

    useEffect(() => {
      if (user.data && user.data.me && user.data.me.favoriteGenre) {
        getFavoriteBooks({ variables: { genre: user.data.me.favoriteGenre } })
      }
    }, [getFavoriteBooks, user.data])

    useEffect(() => {
      console.log("User data:", user.data);
    }, [user.data]);
    
    if (!show) {
        return null
    }

    if (user.loading || result.loading) {
      return <div>Loading...</div>;
    }
  
    if (user.error || result.error) {
      return <div>Error: {user.error ? user.error.message : result.error.message}</div>;
    }
  
    if (!user.data || !user.data.me) {
      return <div>No user data available</div>;
    }

    return (
        <div>
            <h2>recommendations</h2>
            <p>books in your favorite genre {user.data.me.favoriteGenre}</p>
            <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {favoriteBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
    )
}

export default Recommend