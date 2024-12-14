import { useState } from 'react'
import { Button, Grid, Typography } from '@mui/material'

export default function DoorControls() {
  const [door1Open, setDoor1Open] = useState(false)
  const [door2Open, setDoor2Open] = useState(false)

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Door Controls
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            variant="contained"
            color={door1Open ? "secondary" : "primary"}
            fullWidth
            onClick={() => setDoor1Open(!door1Open)}
          >
            Door 1: {door1Open ? "Open" : "Closed"}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            color={door2Open ? "secondary" : "primary"}
            fullWidth
            onClick={() => setDoor2Open(!door2Open)}
          >
            Door 2: {door2Open ? "Open" : "Closed"}
          </Button>
        </Grid>
      </Grid>
    </>
  )
}

