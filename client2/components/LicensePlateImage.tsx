import { Typography, Box } from '@mui/material'

interface LicensePlateImageProps {
  licensePlate: string | null
}

export default function LicensePlateImage({ licensePlate }: LicensePlateImageProps) {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Latest License Plate
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: 150,
          backgroundColor: 'grey.300',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '1rem',
          fontWeight: 'bold',
        }}
      >
        {licensePlate ? `Latest: ${licensePlate}` : 'No vehicle'}
      </Box>
    </>
  )
}

