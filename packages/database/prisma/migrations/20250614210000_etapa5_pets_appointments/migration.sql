-- Add AppointmentStatus values (must commit before use in next migration)
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
