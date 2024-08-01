import { useEffect, useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Notify from "./components/Notify";
import LoginForm from "./components/LoginForm";
import { useApolloClient } from "@apollo/client";

const App = () => {
  const [page, setPage] = useState("authors");
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  useEffect(() => {
    const storedToken = localStorage.getItem('user-token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const notify = (message) => {
    console.log('Notifying:', message); 
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 10000);
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {!token ? (
          <button onClick={() => setPage("login")}>log in</button>
        ) : (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={logout}>logout</button>
          </>
        )}
      </div>

     
      <Authors show={page === "authors"} />
      <Books show={page === "books"} />
      {!token ? (
        <LoginForm show={page === "login"} setToken={setToken} setError={notify} />
      ) : (
        <NewBook show={page === "add"} setError={notify} />
      )}
    </div>
  );
};

export default App;