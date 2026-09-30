export interface OpenDayClass {
  id: string;
  startTime: Date;
  endTime: Date;
  title: string;
  capacity: number;
  totalCapacity?: number;
  registeredCount?: number;
  description: string;
}

export interface OpenDayDate {
  id: string;
  date: Date;
  classes: OpenDayClass[];
}

export interface RegistrationFormData {
  contactName: string;
  contactEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  selectedDateId: string;
  selectedClassIds: string[];
}
