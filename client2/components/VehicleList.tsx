import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Button } from '@mui/material'
import { Vehicle } from '../types'

interface VehicleListProps {
  vehicles: Vehicle[]
  onVehicleSelect: (vehicle: Vehicle) => void
}

export default function VehicleList({ vehicles, onVehicleSelect }: VehicleListProps) {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Parked Vehicles
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>No.</TableCell>
            <TableCell>License Plate</TableCell>
            <TableCell>Entry Time</TableCell>
            <TableCell>Exit Time</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicles.map((vehicle, index) => (
            <TableRow key={vehicle.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{vehicle.licensePlate}</TableCell>
              <TableCell>{vehicle.entryTime.toLocaleString()}</TableCell>
              <TableCell>{vehicle.exitTime ? vehicle.exitTime.toLocaleString() : '-'}</TableCell>
              <TableCell>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => onVehicleSelect(vehicle)}
                >
                  View Image
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

