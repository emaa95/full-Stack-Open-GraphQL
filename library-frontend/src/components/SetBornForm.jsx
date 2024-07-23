import { useMutation } from "@apollo/client"
import { useState } from "react"
import { ALL_AUTHORS, EDIT_BORN } from "../queries"

const SetBornForm = () => {
    const [name, setName] = useState("")
    const [setBornTo, setBorn] = useState("")

    const [editBornYear] = useMutation(EDIT_BORN, {
        refetchQueries: [ { query: ALL_AUTHORS } ]
    })

    const submit = (event) => {
        
        event.preventDefault()

        editBornYear({ variables: { name, setBornTo: parseInt(setBornTo)} })

        console.log('edit born year...')

        setName("")
        setBorn("")

    }

    return (
        <div>
          <h2>Set birthyear</h2>
    
          <form onSubmit={submit}>
            <div>
              name <input
                value={name}
                onChange={({ target }) => setName(target.value)}
              />
            </div>
            <div>
              born <input
                value={setBornTo}
                onChange={({ target }) => setBorn(target.value)}
              />
            </div>
            <button type='submit'>update author</button>
          </form>
        </div>
      )
}

export default SetBornForm