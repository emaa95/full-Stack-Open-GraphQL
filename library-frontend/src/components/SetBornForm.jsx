import { useMutation, useQuery } from "@apollo/client"
import { useState } from "react"
import { ALL_AUTHORS, EDIT_BORN } from "../queries"
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { TextField } from "@mui/material";

const SetBornForm = () => {
    const [name, setName] = useState("")
    const [setBornTo, setBorn] = useState("")

    const [editBornYear] = useMutation(EDIT_BORN, {
        refetchQueries: [ { query: ALL_AUTHORS } ]
    })

    const result = useQuery(ALL_AUTHORS)

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
            <FormControl sx={{ m: 1, minWidth: 200 }}>
                <InputLabel id="demo-simple-select-autowidth-label">Name</InputLabel>
                <Select
                    labelId="demo-simple-select-autowidth-label"
                    id="demo-simple-select-autowidth"
                    value={name}
                    onChange={({ target }) => setName(target.value)}
                    autoWidth
                    label="Name"
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {result.data.allAuthors.map((a) => (
                        <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>
                    ))}
                </Select>
      
            
            <TextField id="outlined-basic" label="Born Year" variant="outlined" type="number"
                value={setBornTo}
                onChange={({ target }) => setBorn(target.value)}
            />
            <button type='submit'>update author</button>
            </FormControl>
            
        </form>
    </div>
      )
}

export default SetBornForm