import { Modal, Box, Typography, Button } from '@mui/material'
import Image from 'next/image'
import { Vehicle } from '../types'

interface LicensePlateModalProps {
  open: boolean
  onClose: () => void
  vehicle: Vehicle | null
}

export default function LicensePlateModal({ open, onClose, vehicle }: LicensePlateModalProps) {
  if (!vehicle) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="license-plate-modal"
      aria-describedby="license-plate-image-and-details"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
      }}>
        <Typography id="license-plate-modal" variant="h6" component="h2" gutterBottom>
          License Plate Details
        </Typography>
        <Image
          src={vehicle.imageSrc}
          alt={`License plate ${vehicle.licensePlate}`}
          width={300}
          height={150}
          layout="responsive"
        />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Actual: {vehicle.licensePlate}
        </Typography>
        <Typography variant="subtitle1">
          AI Predicted: {vehicle.aiPredictedLicensePlate}
        </Typography>
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
  )
}

