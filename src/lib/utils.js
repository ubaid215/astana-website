import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const TIME_SLOTS = {
  1: [
    '08:00 AM - 08:30 AM',
    '08:30 AM - 09:00 AM',
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '12:30 PM - 01:00 PM',
    '01:00 PM - 01:30 PM',
    '01:30 PM - 02:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
    '03:30 PM - 04:00 PM',
  ],
  2: [
    '06:00 AM - 06:30 AM',
    '06:30 AM - 07:00 AM',
    '07:00 AM - 07:30 AM',
    '07:30 AM - 08:00 AM',
    '08:00 AM - 08:30 AM',
    '08:30 AM - 09:00 AM',
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '12:30 PM - 01:00 PM',
  ],
};

export const COW_QUALITY_PRICES = {
  Standard: 25000,
  Medium: 30000,
  Premium: 35000,
};

export const generateRandomTimeSlot = (day) => {
  const slots = TIME_SLOTS[day] || TIME_SLOTS[1];
  return slots[Math.floor(Math.random() * slots.length)];
};

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}