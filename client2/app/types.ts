export interface Vehicle {
  id: number
  licensePlate: string
  entryTime: Date
  exitTime: Date | null
  imageSrc: string
  aiPredictedLicensePlate: string
}

